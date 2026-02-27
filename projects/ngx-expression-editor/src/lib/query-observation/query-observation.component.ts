import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation, inject } from '@angular/core';
import { ExpressionEditorService, SimpleStyle } from '../expression-editor.service';
import Def from 'autocomplete-lhc';
import { HttpClient } from '@angular/common/http';

import { FormsModule, NgModel } from '@angular/forms';
import { ExpressionValidatorDirective } from '../../directives/expression/expression-validator.directive';

@Component({
  selector: 'lhc-query-observation',
  templateUrl: './query-observation.component.html',
  styleUrls: ['../../../../../node_modules/autocomplete-lhc/source/auto_completion.css', './query-observation.component.css'],
  imports: [FormsModule, ExpressionValidatorDirective],
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class QueryObservationComponent implements OnInit, AfterViewInit, OnDestroy {
  queryUrl = 'https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search?df=text,LOINC_NUM';

  @Input() variable;
  @Input() index;
  @Input() lhcStyle: SimpleStyle = {};
  @ViewChild('autoComplete') autoCompleteElement;
  @ViewChild('qobs') codeRef: NgModel;
  @ViewChild('timeintv') timeIntervalRef: NgModel;
  @ViewChild(ExpressionValidatorDirective) expressionValidator: ExpressionValidatorDirective;

  performValidationSubscription;
  hasError = false;

  autoComplete;
  codes: string[];
  timeInterval: number;
  timeIntervalUnit: string;
  expression: string;

  private http = inject(HttpClient);
  private expressionEditorService = inject(ExpressionEditorService);

  /**
   * Angular lifecycle hook called when the component is initialized
   */
  ngOnInit(): void {
    if (this.variable !== undefined) {
      if (this.variable.codes === undefined) {
        const queryObservation = this.expressionEditorService
          .getQueryObservationFromExpression(this.variable.label, this.variable.expression, this.index);
        if (queryObservation)
          this.variable = queryObservation;
      }

      if (this.variable.codes !== undefined) {
        this.codes = this.variable.codes;
        this.timeInterval = this.variable.timeInterval || 1;
        this.timeIntervalUnit = this.variable.timeIntervalUnit || 'months';
        this.expression = this.variable.expression;
      } else {
        this.codes = [];
        this.timeInterval = 1;
        this.timeIntervalUnit = 'months';
        this.expression = '';
      }
    } else {
      this.codes = [];
    }

    // performValidationSubscription is triggered when the 'Save' button is clicked, allowing each
    // subscribed component to validate the expression data.
    this.performValidationSubscription = this.expressionEditorService.performValidationChange.subscribe((validation) => {
        this.onChange();
    });
  }

  /**
   * After the autocomplete is ready to be interacted with fetch the name for
   * any codes already in the query search.
   */
  ngAfterViewInit(): void {
    this.autoComplete = new Def.Autocompleter.Search(
      this.autoCompleteElement.nativeElement, this.queryUrl,
      {
        tableFormat: true,
        valueCols: [0, 1],
        colHeaders: ['Text', 'LOINC Number'],
        maxSelect: '*'
      });

    this.codes.forEach((code) => {
      const matches = code.match(/http:\/\/loinc.org\|(.+)/);

      if (matches !== null) {
        const loincCode = matches[1];
        // LOINC Code
        this.http.get(`${this.queryUrl}&terms=${loincCode}`)
          .subscribe((data) => {
            const namePosition = 3;
            const name = [data[namePosition][0][0], loincCode].join(' - ');
            this.autoComplete.storeSelectedItem(name, loincCode);
            this.autoComplete.addToSelectedArea(name);
          });
      } else {
        // Non-loinc code
        this.autoComplete.storeSelectedItem(code, undefined);
        this.autoComplete.addToSelectedArea(code);
      }

    });

    Def.Autocompleter.Event.observeListSelections(`autocomplete-${this.index}`, () => {
      const selectedItemData = this.autoComplete.getSelectedItemData();

      // If there is no code then this is not a loinc code and we need to get
      // the value from the array above
      this.codes = this.autoComplete.getSelectedCodes().map((code, index) => {
        return (code === undefined) ? selectedItemData[index].text : `http://loinc.org|${code}`;
      });
      this.onChange();
    });
  }

  /**
   * Angular lifecycle hook
   */
  ngOnDestroy(): void {
    if (this.autoComplete !== undefined) {
      this.autoComplete.destroy();
    }

    this.performValidationSubscription.unsubscribe();
  }

  /**
   * On changes update the expression and preview
   * @param expressionChange - true if there is a change in the expression input
   */
  onChange(expressionChange: boolean = true): void {
    delete this.variable.simple;
    delete this.variable.linkId;

    // Separate with URL encoded version of the comma: ','
    const codes = this.codes.join(',');
    this.expression =
      `Observation?code=${codes}&` +
      `date=gt{{today()-${this.timeInterval} ${this.timeIntervalUnit}}}&` +
      `patient={{%patient.id}}&_sort=-date&_count=1`;
    this.variable.expression = this.expression;

    // Due to the change to the expression, calling this to trigger the attribute directive validation.
    if (expressionChange)
      this.triggerExpressionValidation();
  };


  /**
   * Trigger the invocation of the attribute directive validation. The ngModel is not providing
   * two-way binding for the question and the query-observation components; therefore, this
   * function is requried to trigger the validation.
   */
  triggerExpressionValidation():void {
    if (this.codeRef) {
      this.codeRef.control.markAsTouched();
      this.codeRef.control.markAsDirty();
      this.codeRef.control.setValue((this.codes.length > 0) ? this.expression : "" );

      const result = this.expressionValidator.validate(this.codeRef.control);

      this.codeRef.control.setErrors(result);
    }
  }
}
