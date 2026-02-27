import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { Question, Variable } from '../variable';
import { ExpressionEditorService, SimpleStyle } from '../expression-editor.service';
import { Unit, UNIT_CONVERSION } from '../units';
import Def from 'autocomplete-lhc';
import { FormsModule, NgModel } from '@angular/forms';

import { ExpressionValidatorDirective } from '../../directives/expression/expression-validator.directive';
import { SyntaxPreviewComponent } from '../syntax-preview/syntax-preview.component';

@Component({
  selector: 'lhc-question',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.css'],
  imports: [ FormsModule, ExpressionValidatorDirective, SyntaxPreviewComponent ]
})
export class QuestionComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() variable: Variable;
  @Input() lhcStyle: SimpleStyle = {};
  @Input() index: number;

  @ViewChild('autoComplete') autoCompleteElement;
  @ViewChild('question') questionRef: NgModel;
  @ViewChild(ExpressionValidatorDirective) expressionValidator: ExpressionValidatorDirective;

  performValidationSubscription;

  autoComplete;
  linkId = '';
  questions: Question[] = [];
  itemHasScore = false;
  isNonConvertibleUnit = false;
  toUnit: string;
  unit: string;
  conversionOptions: Unit[];
  expression: string;

  private variableService = inject(ExpressionEditorService);

  /**
   * Angular lifecycle hook called when the component is initialized
   */
  ngOnInit(): void {
    this.linkId = this.variable.linkId ? this.variable.linkId : '';
    this.toUnit = this.variable.unit ? this.variable.unit : '';
    this.expression = this.variable.linkId ? this.variable.expression : '';

    if (this.variableService.questions)
      this.questions = this.variableService.questions;

    this.onChange(false);

    this.variableService.questionsChange.subscribe((questions) => {
      this.questions = questions;
    });

    // performValidationSubscription is triggered when the 'Save' button is clicked, allowing each
    // subscribed component to validate the expression data.
    this.performValidationSubscription = this.variableService.performValidationChange.subscribe((validation) => {
      this.onChange(true);
    });
  }

  /**
   * Get the Question Field Item
   * @param itemText - Question Text
   * @param itemCode - Question Code
   */
  getQuestionFieldItem(itemText, itemCode): string {
    return itemText + ' (' + itemCode + ')';
  }

  /**
   * Reset the Variable properties.
   */
  resetVariableProperties(): void {
    this.linkId = '';
    this.expression = '';
    this.toUnit = '';
    this.unit = '';

    this.variable.linkId = '';
    this.variable.expression = '';
    this.variable.unit = '';
    this.conversionOptions = this.getConversionOptions(this.unit);
    this.isNonConvertibleUnit = this.unit && !this.conversionOptions;
  }

  /**
   * After the autocompleter is ready to be interacted with fetch the name for
   * any codes already in the query search.
   */
  ngAfterViewInit(): void {
    const keys = this.questions.map(e => this.getQuestionFieldItem(e.text, e.linkId));
    const vals = this.questions.map(v => v.linkId);

    let question;
    if (this.linkId)
      question = this.getQuestion(this.linkId);

    const opts = {
      tableFormat: false,
      codes: vals
    }

    this.autoComplete = new Def.Autocompleter.Prefetch(
      this.autoCompleteElement.nativeElement, keys, opts);

    if (question && this.linkId)
      this.autoComplete.setFieldToListValue(this.getQuestionFieldItem(question.text, this.linkId));

      Def.Autocompleter.Event.observeListSelections(`question-${this.index}`, (res) => {
        if (res.item_code)
          this.linkId = res.item_code;
        else
          this.resetVariableProperties();
        this.onChange(true);

      });
  }

  /**
   * Angular lifecycle hook
   */
  ngOnDestroy(): void {
    if (this.autoComplete !== undefined) {
      // This is required to clear all the tracking observers
      this.autoComplete.clearStoredSelection();
      this.autoComplete.destroy();
    }

    this.performValidationSubscription.unsubscribe();
  }

  /**
   * Get the question based on linkId
   * @param linkId - FHIR linkId
   */
  getQuestion(linkId): Question {
    return this.questions.find((q) => {
      return q.linkId === linkId;
    });
  }

  /**
   * Get the list of units we can convert to based on the starting unit
   * @param unit - Starting unit
   */
  getConversionOptions(unit: string): Unit[] {
    return UNIT_CONVERSION[unit];
  }

  /**
   * Called when the questionnaire question or unit is changed
   * @param isQuestion - The change was for a question
   */
  onChange(isQuestion): void {
    if (isQuestion) {
      // Reset the conversion options when the question changes
      this.toUnit = (this.variable.unit) ? this.variable.unit : '';
    }

    // If we already have a question selected (as opposed to the select... prompt)
    if (this.linkId) {
      if (this.variable.linkId !== this.linkId) {
        this.toUnit = '';
      }

      delete this.variable.simple;

      const question = this.getQuestion(this.linkId);
      this.unit = question?.unit;
      this.conversionOptions = this.getConversionOptions(this.unit);
      this.isNonConvertibleUnit = this.unit && !this.conversionOptions;

      // Check if this is a score
      if (!this.conversionOptions && !this.isNonConvertibleUnit) {
        this.itemHasScore = this.variableService.itemHasScore(this.linkId);
      } else {
        this.itemHasScore = false;
      }

      this.variable.expression = this.variableService.updateValueOrScoreExpression(
        this.linkId, this.itemHasScore, !this.isNonConvertibleUnit, this.unit, this.toUnit, this.expression);

      this.expression = this.variable.expression;

      if (this.variable.linkId != this.linkId)
        this.variable.linkId = this.linkId;
      this.variable.unit = this.toUnit;
    }

    // Due to the change to the expression, calling this to trigger the attribute directive validation.
    this.triggerExpressionValidation();
  }

  /**
   * Trigger the invocation of the attribute directive validation. The ngModel is not providing
   * two-way binding for the question and the query-observation components; therefore, this
   * function is requried to trigger the validation.
   */
  triggerExpressionValidation():void {
    if (this.questionRef) {
      this.questionRef.control.markAsTouched();
      this.questionRef.control.markAsDirty();
      this.questionRef.control.setValue((this.linkId) ? this.expression : "");

      const result = this.expressionValidator.validate(this.questionRef.control);
      this.questionRef.control.setErrors(result);
    }
  }
}
