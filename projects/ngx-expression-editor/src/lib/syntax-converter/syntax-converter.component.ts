import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, ViewChild, inject } from '@angular/core';
import { EasyPathExpressionsPipe } from '../easy-path-expressions.pipe';
import { ExpressionEditorService, SimpleStyle } from '../expression-editor.service';
import { FormsModule, NgModel } from '@angular/forms';
import { ExpressionValidatorDirective } from '../../directives/expression/expression-validator.directive';
import { SyntaxPreviewComponent } from '../syntax-preview/syntax-preview.component';

@Component({
  selector: 'lhc-syntax-converter',
  templateUrl: './syntax-converter.component.html',
  styleUrls: ['../expression-editor.component.css', './syntax-converter.component.css'],
  imports: [FormsModule, ExpressionValidatorDirective, SyntaxPreviewComponent]
})
export class SyntaxConverterComponent implements OnInit, OnChanges, OnDestroy {
  @Input() simple: string;
  @Input() variables;
  @Input() index;
  @Input() lhcStyle: SimpleStyle = {};
  @Input() variableName: string;

  @Input() validateInput = false;
  @Input() multipleLines = false;

  @Output() simpleChange = new EventEmitter<string>();
  @Output() expressionChange = new EventEmitter<string>();

  @ViewChild('inputRef') inputRef!: NgModel;

  performValidationSubscription;
  fhirPathExpression: string;
  jsToFhirPathPipe = new EasyPathExpressionsPipe();

  hasError = false;

  private expressionEditorService = inject(ExpressionEditorService);

  /**
   * Angular lifecycle hook called when the component is initialized
   */
  ngOnInit(): void {
    // performValidationSubscription is triggered when the 'Save' button is clicked, allowing each
    // subscribed component to validate the expression data.
    this.performValidationSubscription = this.expressionEditorService.performValidationChange.subscribe((validation) => {
      if (this.inputRef) {
        this.inputRef.control.markAsTouched();
        this.inputRef.control.markAsDirty();
        this.inputRef.control.setValue(this.simple);
      }

      this.onExpressionChange(this.simple);
    });
  }

  /**
   * Angular lifecycle hook called before the component is destroyed
   */
  ngOnDestroy(): void {
    this.performValidationSubscription.unsubscribe();
  }

  /**
   * Angular lifecycle hook called on input changes
   */
  ngOnChanges(changes): void {
    // This function is getting called repeatedly even if there is no changes. Adding the if block
    // to discard some of the events.
    // The changes.simple fires when there is a change to the Easy Path Expression expression.
    // The changes.variables fires when a variable is deleted.
    if (changes.simple || (changes.variables &&
        JSON.stringify(changes.variables.previousValue) !== JSON.stringify(changes.variables.currentValue))) {
      this.onExpressionChange(this.simple);

      if (this.inputRef) {
        setTimeout(() => {
          if (changes.simple) {
            this.inputRef.control.markAsTouched();
            this.inputRef.control.markAsDirty();
          }
          this.inputRef.control.setValue(this.simple);
        }, 0);
      }
    }
  }

  /**
   * Performs conversion from Easy Path Expression to FHIRPath Expression when there is a change
   * on tge expression.
   * @param simple
   */
  onExpressionChange(simple): void {
    const fhirPath: string = (simple) ? this.jsToFhirPathPipe.transform(simple, this.variables) : "";
    this.fhirPathExpression = fhirPath;
    this.hasError = false;
    if (fhirPath === 'Not valid' || (fhirPath === "" && simple !== undefined && this.inputRef?.dirty))
      this.hasError = true;

    this.simpleChange.emit(simple);
    this.expressionChange.emit(fhirPath);

  }
}
