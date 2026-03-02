import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild,
         ViewChildren, QueryList, AfterViewInit, OnDestroy, inject} from '@angular/core';
import { ExpressionEditorService, SimpleStyle } from '../expression-editor.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CASE_REGEX, CaseStatement, ValidationError, Variable, FieldTypes, SectionTypes, CaseStatementValidationResult } from '../variable';
import { EasyPathExpressionsPipe } from '../easy-path-expressions.pipe';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { FormsModule, NgModel } from '@angular/forms';
import * as fhirpath from 'fhirpath';
import * as constants from "../validation";
import { SyntaxPreviewComponent } from '../syntax-preview/syntax-preview.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lhc-case-statements',
  templateUrl: './case-statements.component.html',
  styleUrls: ['../expression-editor.component.css', './case-statements.component.css'],
  imports: [CommonModule, DragDropModule, FormsModule, SyntaxPreviewComponent]
})
export class CaseStatementsComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() lhcStyle: SimpleStyle = {};
  @Input() syntax: string;
  @Input() simpleExpression: string;
  @Input() expression: string;

  @Output() expressionChange = new EventEmitter<string>();
  @Output() simpleChange = new EventEmitter<string>();

  @ViewChildren('caseConditionRef') caseConditionRefs: QueryList<NgModel>;
  @ViewChildren('caseOutputRef') caseOutputRefs: QueryList<NgModel>;
  @ViewChild('caseDefaultRef') caseDefaultRef: NgModel;

  STRING_REGEX = /^'(.*)'$/;
  static EMPTY_IIF = "iif(,,)";

  pipe = new EasyPathExpressionsPipe();
  outputExpressions = true;
  defaultCase: string;
  simpleDefaultCase: string;
  cases: CaseStatement[] = [{ condition: '', simpleCondition: '', output: '', simpleOutput: '' }];

  output = '';
  hidePreview = false;

  hasError = false;
  hasWarning = false;
  defaultCaseError = '';
  defaultCaseWarning = '';
  performValidationSubscription;

  caseAriaErrorMessages = [];
  caseAriaErrorMessage = '';

  caseAriaWarningMessages = [];
  caseAriaWarningMessage = '';

  simpleCaseObject;

  private expressionEditorService = inject(ExpressionEditorService);
  private liveAnnouncer = inject(LiveAnnouncer);
  private changeDetectorRef = inject(ChangeDetectorRef);

  /**
   * Angular lifecycle hook for initialization
   */
  ngOnInit(): void {
    if (this.syntax === 'fhirpath' && this.expression !== undefined) {
      this.parseIif(this.expression, 0);
    } else if (this.syntax === 'simple' && this.simpleExpression !== undefined) {
      this.parseSimpleCases();
    }

    this.output = this.getIif(0);

    // performValidationSubscription is triggered when the 'Save' button is clicked, allowing each
    // subscribed component to validate the expression data.
    this.performValidationSubscription = this.expressionEditorService.performValidationChange.subscribe((validation) => {
      this.caseConditionRefs.forEach((cc) => {
        if (!cc.control.value || cc.control.value === "") {
          cc.control.markAsTouched();
          cc.control.markAsDirty();
        }
      });
      this.caseOutputRefs.forEach((co) => {
        if (!co.control.value || co.control.value === "") {
          co.control.markAsTouched();
          co.control.markAsDirty();
        }
      });

      if (!this.caseDefaultRef.control.value || this.caseDefaultRef.control.value === "") {
        this.caseDefaultRef.control.markAsTouched();
        this.caseDefaultRef.control.markAsDirty();
      }
      this.onChange();
    });
  }

  /**
   * Angular lifecycle hook called before the component is destroyed
   */
  ngOnDestroy(): void {
    this.performValidationSubscription.unsubscribe();
  }

  /**
   * Perform check on any Case statement errors
   */
  ngAfterViewInit() {
    this.changeDetectorRef.detectChanges();
    this.updateCaseStatementsErrors();
  }

  /**
   * Parses the Easy Path expression and populates the case editor. Toggles "use
   * expressions" off if output is only strings.
   */
  parseSimpleCases(): void {
    this.parseIif(this.simpleExpression, 0);

    // If all output values are strings toggle off "use expressions"
    const outputString = this.cases.find(e => (!this.isString(e.simpleOutput)));
    const defaultIsString = this.isString(this.simpleDefaultCase);

    if (outputString === undefined && defaultIsString) {
      this.outputExpressions = false;
      // Remove quotes from output strings and default case
      this.cases.forEach(e => {
        e.simpleOutput = this.removeQuotes(e.simpleOutput);
      });
      this.simpleDefaultCase = this.removeQuotes(this.simpleDefaultCase);
    } else if (outputString && !defaultIsString) {
      // If the simple expression for the case statment is empty, set the output expressions checkbox to check
      if (this.simpleExpression === CaseStatementsComponent.EMPTY_IIF) {
        this.outputExpressions = true;
      }
    }
  }

  /**
   * Checks if the expression is a string
   */
  isString(expression: string): boolean {
    return this.STRING_REGEX.test(expression);
  }

  /**
   * Removes surrounding quotes
   */
  removeQuotes(expression: string): string {
    return expression.match(this.STRING_REGEX)[1];
  }

  /**
   * Angular lifecycle hook for changes
   */
  ngOnChanges(changes): void {
    if (changes.syntax && this.syntax === 'simple') {
      if (changes.syntax.firstChange === false) {
        // If the simpleCaseObject is available, then restore the case statement from the simpleCaseObject
        if (changes.syntax.previousValue === 'fhirpath') {
          if (this.simpleCaseObject) {
            this.cases = [...this.simpleCaseObject.cases];
            this.simpleDefaultCase = this.simpleCaseObject.defaultCase;
            this.outputExpressions = this.simpleCaseObject.outputExpressions;
          } else {
            // In the case the simpleCaseObject is not available (no Easy Path version for the Case Statements)
            // Reset the cases to empty
            const len = this.cases.length;
            this.cases = [];
            for (let i = 0; i < len; i++) {
              this.cases.push({condition: undefined, simpleCondition: undefined, output: undefined, simpleOutput: undefined});
            }
            this.defaultCase = '';
            this.outputExpressions = false;
            this.expression = '';
            this.defaultCaseWarning = '';
          }
        }
      }

      this.parseSimpleCases();
      this.onChange(false);
    } else if (changes.syntax && this.syntax === 'fhirpath' && changes.syntax.firstChange === false) {
      // Store the simple cases to the simpleCaseObject
      if (!('previousValue' in changes.syntax)) {
        this.simpleCaseObject = null;
      } else if (changes.syntax.previousValue === 'simple') {
        this.simpleCaseObject = {
          cases: [...this.cases],
          defaultCase: this.simpleDefaultCase,
          outputExpressions: this.outputExpressions
        }
      }
      this.outputExpressions = true;
      this.parseIif(this.expression, 0);
      this.onChange(false);
    }
  }

  /**
   * Called when adding a new case
   */
  onAdd(): void {
    this.cases.push({ condition: '', simpleCondition: '', output: '', simpleOutput: '' });
    this.onChange();
    // TODO select next input box that was added
  }

  /**
   * Remove the case at an index
   * @param i - index to remove
   */
  onRemove(i): void {
    this.cases.splice(i, 1);
    this.onChange();
  }

  /**
   * Angular lifecycle hook for changes
   */
  onChange(shouldResetSimple = true): void {
    // Clear the stored simpleCaseObject if there is changes to the fhirpath expression
    if (this.syntax === "fhirpath" && shouldResetSimple && this.simpleCaseObject) {
      // Aside from clearing the simpleCaseObject, we also need to clear out the simpleDefaultCase.
      this.simpleDefaultCase = undefined;
      this.simpleCaseObject = null;
    }
    this.hasError = false;
    this.hasWarning = false;
    this.output = this.getIif(0);
    this.expressionChange.emit(this.output);

    if (this.syntax === "simple") {
      this.simpleExpression = this.getSimpleIif(0);
    }
    this.simpleChange.emit(this.simpleExpression);

    this.changeDetectorRef.detectChanges();
    this.updateCaseStatementsErrors();
  }

  /**
   * Compose the error result object based on the results: 'Not Valid', 'Required' or null
   * @param key - Section of the case statement: 'condition', 'output', or 'default case'
   * @param result - 'Not Valid' or 'Required'
   * @return ValidationError object or null if there is no error
   */
  composeErrorResultObject(key: string, result: string): ValidationError {
    let errorObj = null;
    if (result === ExpressionEditorService.EXP_NOT_VALID_ERR_MSG) {
      const notValidAriaMessage = (key !== 'default case') ?
        `One of the ${key}s in the Output Expression section is no longer valid.` :
        `The ${key} in the Output Expression section is no longer valid.`;

      errorObj = {
        "invalidCaseStatementError": true,
        "message": `The ${key} is invalid.`,
        "ariaMessage": notValidAriaMessage
      };
    } else if (result === ExpressionEditorService.EXP_REQUIRED_ERR_MSG) {
      errorObj = {
        "invalidCaseStatementError": true,
        "message": `The ${key} is required.`,
        "ariaMessage": `The ${key} is required.`
      };
    } else if (result === ExpressionEditorService.EXP_LAUNCH_CONTEXT_ERR_MSG) {
      errorObj = {
        "invalidCaseStatementWarning": true,
        "message": `The ${key} may contain launch context variable that have not been defined.`,
        "ariaMessage": `The ${key} may contain launch context variable that have not been defined.`
      };
    }

    return errorObj;
  };

  /**
   * Set error or null (no error) for the given element.
   * @param element - the case element
   * @param index - case statement index
   * @param type - case element type: 'condition' or 'output'
   * @return CaseStatementValidationResult - object containing hasError and hasWarning keys.
   */
  setElementError(element: any, index: number, type: string): CaseStatementValidationResult {
    let hasError = false;
    let hasWarning = false;
    let result = null;
    if (type in this.cases[index].error) {
      hasError = true;
      result = this.composeErrorResultObject('case ' + type, this.cases[index].error[type]);

      this.caseAriaErrorMessages.push(result.ariaMessage);
    } else if (type in this.cases[index].warning) {
      hasWarning = true;
      result = this.composeErrorResultObject('case ' + type, this.cases[index].warning[type]);

      this.caseAriaWarningMessages.push(result.ariaMessage);
    }
    setTimeout(() => {
      if (hasWarning) {
        if (this.syntax === 'simple') {
          element.control.setErrors(result);
        } else {
          element.control.setErrors({ warning: result });
        }
      } else {
        element.control.setErrors(result);
      }
    }, 0);
    return { hasError: hasError, hasWarning: hasWarning };
  }

  /**
   * Loop through case statement elements of the given type and check for validation errors.
   * @param caseElements - QueryList of elements to check for validation errors
   * @param type - case element type: 'condition' or 'output'
   * @return CaseStatementValidationResult - object containing hasError and hasWarning keys.
   */
  checkAndUpdateCaseErrors(caseElements: any, type: string): CaseStatementValidationResult {
    let result = { hasError: false, hasWarning: false };
    // Use the output to check if there is an error.  This is being used when the Easy Path Expression
    // case statements contain errors and switching to FHIRPath Expression should retain the errors.
    const caseTokens = this.output.split(',');

    caseElements.forEach((c, index) => {
      const caseError = this.cases[index]['error'];
      // Determine the index for the caseTokens.
      const tokenIndex = (2 * index) + (type === "condition" ? 0 : 1);

      if ((c.dirty && c.control.value === "") ||
        (c.control.value) ||
        (caseError && caseError?.[type] && caseError[type] !== ExpressionEditorService.EXP_REQUIRED_ERR_MSG) ||
        (caseError[type] === ExpressionEditorService.EXP_REQUIRED_ERR_MSG && caseTokens[tokenIndex].indexOf(ExpressionEditorService.EXP_REQUIRED_ERR_MSG) > -1)) {

        result = this.setElementError(c, index, type);
      }
    });

    return result;
  };

  /**
   * Create the ARIA error message to inform screen reader users of errors in the
   * Case Statements under the Output Expression section.
   */
  composeAriaErrorMessage(): void {
    if (this.caseAriaErrorMessages.length > 1) {
      this.caseAriaErrorMessage = constants.INVALID_CASES_EXPRESSION;
    } else if (this.caseAriaErrorMessages.length === 1) {
      this.caseAriaErrorMessage = this.caseAriaErrorMessages[0];
    } else if (this.caseAriaWarningMessages.length > 1) {
      this.caseAriaErrorMessage = constants.INVALID_CASES_EXPRESSION;
    } else if (this.caseAriaWarningMessages.length === 1) {
      this.caseAriaErrorMessage = this.caseAriaWarningMessages[0];
    }
  }

  /**
   * Check for validation errors on the default case
   * @return true if the default case contains error.
   */
  checkAndUpdateDefaultCaseError(): CaseStatementValidationResult {
    let result = null;
    let hasError = false;
    let hasWarning = false;
    // Use the output to check if there is an error.
    const outputTokens = this.output.split(',');

    if ((this.caseDefaultRef.dirty) || (this.caseDefaultRef.control.value) || (this.defaultCaseError && this.defaultCaseError !== ExpressionEditorService.EXP_REQUIRED_ERR_MSG) ||
        (this.defaultCaseError === ExpressionEditorService.EXP_REQUIRED_ERR_MSG && outputTokens[outputTokens.length - 1].indexOf(ExpressionEditorService.EXP_REQUIRED_ERR_MSG) > -1)) {
      result = this.composeErrorResultObject('default case', this.defaultCaseError);
    }

    if (result && ('ariaMessage' in result)) {
      hasError = true;
      this.caseAriaErrorMessages.push(result.ariaMessage);
    }

    if (!result && this.defaultCaseWarning) {
      result = this.composeErrorResultObject('default case', this.defaultCaseWarning);

      if (result && ('ariaMessage' in result)) {
        hasWarning = true;
        this.caseAriaWarningMessages.push(result.ariaMessage);
      }
    }

    setTimeout(() => {
      if (hasError) {
        this.caseDefaultRef.control.setErrors(result);
      } else {
        if (this.syntax === 'simple') {
          this.caseDefaultRef.control.setErrors(result);
        } else {
          this.caseDefaultRef.control.setErrors({ warning: result });
        }
      }
    }, 0);

    return { hasError: hasError, hasWarning: hasWarning };
  };

  /**
   * Based on the validation result on the Case Statements, updates error status
   * for each of the elements in the Case Statements (case conditions, case outputs,
   * and default case) and notify the Expression Editor component on the status.
   */
  updateCaseStatementsErrors(): void {
    const param = {
      "section": SectionTypes.OutputExpression,
      "field": FieldTypes.Case
    };
    this.caseAriaErrorMessages = [];
    this.caseAriaErrorMessage = '';

    this.caseAriaWarningMessages = [];
    this.caseAriaWarningMessage = '';

    this.hasError = false;
    this.hasWarning = false;

    const hasConditionResults = this.checkAndUpdateCaseErrors(this.caseConditionRefs, 'condition');
    const hasOutputResults = this.checkAndUpdateCaseErrors(this.caseOutputRefs, 'output');
    const hasDefaultCaseResult = this.checkAndUpdateDefaultCaseError();


    let result = null;
    if (hasConditionResults.hasError || hasOutputResults.hasError || hasDefaultCaseResult.hasError) {
      this.hasError = true;
      result = {
        "CaseStatementError": true,
        "message": "Case Statement error",
        "ariaMessage": "Case Statement error"
      }
    } else if (hasConditionResults.hasWarning || hasOutputResults.hasWarning || hasDefaultCaseResult.hasWarning) {
      this.hasWarning = true;
      result = {
        "CaseStatementWarning": true,
        "message": "Case Statement warning",
        "ariaMessage": "Case Statement warning"
      }
    }

    this.composeAriaErrorMessage();

    this.expressionEditorService.notifyValidationResult(param, result);
    // Added this to solve karma test issues with view has already been updated.
    this.changeDetectorRef.detectChanges();
  };

  /**
   * Create the ARIA error message to inform screen reader users of errors in the
   * Case Statements under the Output Expression section.
   */
  composeAriaWarningMessage(): void {
    if (this.caseAriaWarningMessages.length > 1)
      this.caseAriaWarningMessage = constants.INVALID_CASES_EXPRESSION;
    else if (this.caseAriaWarningMessages.length === 1) {
      this.caseAriaWarningMessage = this.caseAriaWarningMessages[0];
    }
  }

  /**
   * Parse iif expression at specified level. Top level is 0
   * @param expression - expression to parse
   * @param level - depth or level of expression nesting
   */
  parseIif(expression: string, level: number): boolean {
    // If expressions don't start with iif( and end with ) they cannot be parsed
    const matches = expression.match(CASE_REGEX);

    if (matches !== null) {
      const iifContents = matches[1];
      let commaMatches = 0;
      let nestingLevel = 0;
      let comma1 = -1;
      let comma2 = -1;

      // Check where the ',' is relative to depth as indicated by parenthesis
      for (let i = 0; i < iifContents.length; i++) {
        switch (iifContents[i]) {
          case '(':
            nestingLevel++;
            break;
          case ')':
            nestingLevel--;
            break;
          case ',':
            if (nestingLevel === 0) {
              commaMatches++;
              if (comma1 === -1) {
                comma1 = i;
              } else if (comma2 === -1) {
                comma2 = i;
              }
            }
            break;
        }
      }

      if (commaMatches === 2 && nestingLevel === 0) {
        // Clear out any existing cases if we have a match for iif
        if (level === 0) {
          this.cases = [];
        }
        const condition = iifContents.substring(0, comma1).trim();
        const trueCase = iifContents.substring(comma1 + 1, comma2).trim();
        const falseCase = iifContents.substring(comma2 + 1, iifContents.length).trim();

        if (this.syntax === 'simple') {
          const variableNames = this.expressionEditorService.variables.map(e => e.label);

          this.cases.push({
            simpleCondition: condition,
            simpleOutput: trueCase,
            condition: this.pipe.transform(condition, variableNames),
            output: this.pipe.transform(trueCase, variableNames)
          });
        } else {
          this.cases.push({
            condition,
            output: trueCase
          });
        }

        const parseResult = this.parseIif(falseCase, level + 1);
        if (parseResult === false && this.syntax !== 'simple') {
          this.defaultCase = falseCase;
        } else if (parseResult === false && this.syntax === 'simple') {
          this.simpleDefaultCase = falseCase;
        }

        return true;
      }
    }

    return false;
  }

  /**
   * Check results from calling transformIfSimple() on ctransformIfSimplease statement condition, output, and default case
   * and set the error if any. If the result from the transformation is blank, then the error is now set
   * to 'Required'.
   * @param level - case statement index row
   * @param condition - transformation result for the case statement condition
   * @param output - transformation result for the case statement output
   * @param defaultCase - transformation result for the case statement default case
   */
  setCaseStatementsErrors(level: number, condition: string, output: string, defaultCase: string): void {
    this.cases[level].error = {};
    this.cases[level].warning = {};

    if (condition === ExpressionEditorService.EXP_NOT_VALID_ERR_MSG) {
      this.cases[level].error['condition'] = condition;
    } else if (condition === ExpressionEditorService.EXP_LAUNCH_CONTEXT_ERR_MSG) {
      this.cases[level].warning['condition'] = condition;
    } else if (condition === '' || condition === ExpressionEditorService.EXP_REQUIRED_ERR_MSG) {
      this.cases[level].error['condition'] = ExpressionEditorService.EXP_REQUIRED_ERR_MSG;
    }

    if (output === ExpressionEditorService.EXP_NOT_VALID_ERR_MSG) {
      this.cases[level].error['output'] = output;
    } else if (output === ExpressionEditorService.EXP_LAUNCH_CONTEXT_ERR_MSG) {
      this.cases[level].warning['output'] = output;
    } else if (output === '' || output === "''" || output === ExpressionEditorService.EXP_REQUIRED_ERR_MSG) {
      this.cases[level].error['output'] = ExpressionEditorService.EXP_REQUIRED_ERR_MSG;
    }

    if (defaultCase === ExpressionEditorService.EXP_NOT_VALID_ERR_MSG) {
      this.defaultCaseError = defaultCase;
      this.defaultCaseWarning = '';
    } else if (defaultCase === ExpressionEditorService.EXP_LAUNCH_CONTEXT_ERR_MSG) {
      this.defaultCaseWarning = defaultCase;
      this.defaultCaseError = '';
    } else if ( defaultCase === ExpressionEditorService.EXP_REQUIRED_ERR_MSG) {
      this.defaultCaseError = ExpressionEditorService.EXP_REQUIRED_ERR_MSG;
    } else {
      this.defaultCaseError = '';
      this.defaultCaseWarning = '';
    }
  }

  /**
   * Get an iif expression given a nesting level
   * @param level - nesting level
   */
  getIif(level: number): string {
    const isSimple = this.syntax === 'simple';
    // Added check for when the simpleOutput and simpleCondition are empty.
    let condition = this.transformIfSimple(
                      "condition",
                      isSimple ? this.cases[level].simpleCondition : this.cases[level].condition,
                      false,
                      (this.cases[level].simpleCondition === '' && this.cases[level].simpleCondition === this.cases[level].condition),
                      this.caseConditionRefs?.get(level));

    let output = this.transformIfSimple(
                   "output",
                   isSimple ? this.cases[level].simpleOutput : this.cases[level].output,
                   true,
                   (this.cases[level].simpleOutput === '' && this.cases[level].simpleOutput === this.cases[level].output),
                   this.caseOutputRefs?.get(level));

    let defaultCase = this.transformIfSimple(
                        "default",
                        isSimple ? this.simpleDefaultCase : this.defaultCase,
                        true,
                        (this.simpleDefaultCase === '' && this.simpleDefaultCase === this.defaultCase),
                        this.caseDefaultRef);

    this.setCaseStatementsErrors(level, condition, output, defaultCase);

    if (level === 0) {
      const previousValue = this.hidePreview;
      this.hidePreview = condition === '' || output === '' || defaultCase === '';

      if (!this.hidePreview && previousValue !== this.hidePreview) {
        this.liveAnnouncer.announce('A FHIRPath conversion preview has appeared below.');
      }
    }

    if (!isSimple) {
      if (condition === ExpressionEditorService.EXP_LAUNCH_CONTEXT_ERR_MSG) {
        condition = this.cases[level].condition;
      }
      if (output === ExpressionEditorService.EXP_LAUNCH_CONTEXT_ERR_MSG) {
        output = this.cases[level].output;
      }
      if (defaultCase === ExpressionEditorService.EXP_LAUNCH_CONTEXT_ERR_MSG) {
        defaultCase = this.defaultCase;
      }
    }

    if (level === this.cases.length - 1) {
      return `iif(${condition},${output},${defaultCase})`;
    } else {
      return `iif(${condition},${output},${this.getIif(level + 1)})`;
    }
  }

  /**
   * Get an Easy Path iif expression given a nesting level
   * @param level - nesting level
   */
  getSimpleIif(level: number): string {
    const isSimple = this.syntax === 'simple';

    const condition = this.cases[level].simpleCondition ?? '';
    const output = this.cases[level].simpleOutput ?? '';
    const defaultCase = this.simpleDefaultCase ?? '';

    if (level === this.cases.length - 1) {
      return `iif(${condition},${output},${defaultCase})`;
    } else {
      return `iif(${condition},${output},${this.getSimpleIif(level + 1)})`;
    }
  }

  /**
   * Transform the expression parameter if the syntax type is Easy Path,
   * otherwise return the expression. Additionally if this is an output column
   * and output expressions are off surround with quotes.
   * @param caseType - case statement type to be transformed (condition, output, default)
   * @param expression - Easy Path or FHIRPath expression
   * @param isOutput - True if processing the Case output or default case.
   * @param isBothExpressionsEmpty - True if both the FHIRPath expression and Easy Path expression are empty, otherwise false.
   * @param ref - ngModel reference to a specific input field.
   * @return FHIRPath Expression
   */
  transformIfSimple(caseType: string, expression: string, isOutput: boolean, isBothExpressionsEmpty: boolean, ref: NgModel): string {
    if (expression === undefined) {
      return '';
    }

    let processedExpression = expression;

    // In the case that the case statement is empty and the field has not been touched or modified, just return ""
    if (isBothExpressionsEmpty && (!ref || ref?.control?.pristine && ref?.control?.status === "VALID")) {
      return "";
    }

    if (isOutput && !this.outputExpressions) {
      processedExpression = `'${processedExpression}'`;  // TODO should we escape the expression?
    }

    if (this.syntax === 'simple' && !(isOutput && !this.outputExpressions)) {
      if ((caseType !== "default" && ref && ref?.control?.pristine && ref?.control?.untouched && expression === "" && ref?.control.status === "INVALID") ||
          (caseType === "default" && ref && ref?.control?.dirty && ref?.control?.touched && !isBothExpressionsEmpty && expression === "") ||
          (caseType === "default" && ref && ref?.control?.pristine && ref?.control?.untouched && !isBothExpressionsEmpty && expression === "" && ref?.control.status === "INVALID") ||
          (ref && ref?.control?.dirty && ref?.control?.touched && expression === "")) {

        return ExpressionEditorService.EXP_REQUIRED_ERR_MSG;
      }

      return this.pipe.transform(processedExpression, this.expressionEditorService.variables.map(e => e.label));
    } else {
      // Calling fhirpath.evaluate only on Case condition.
      if (this.outputExpressions) {
        if (!processedExpression) {
          if (ref && ref?.control?.dirty) {
            return ExpressionEditorService.EXP_REQUIRED_ERR_MSG;
          }
          return '';
        }
        try {
          const variableNames = this.expressionEditorService.getContextVariableNamesForExpressionValidation();
          const result = fhirpath.evaluate({}, processedExpression, variableNames);

          return processedExpression;
        } catch (e) {
          try {
            const launchContext = this.expressionEditorService.getCommonLaunchContext();
            const result = fhirpath.evaluate({}, processedExpression, launchContext);
          } catch (e2) {
            return ExpressionEditorService.EXP_NOT_VALID_ERR_MSG;
          }

          // Attempting to access an undefined environment variable: Patient
          const errorMessage = e.message;
          const match = errorMessage.match(/Attempting to access an undefined environment variable: (\w+)/);
          let variableName = '';

          if (match && match[1]) {
            variableName = match[1];
          }

          return ExpressionEditorService.EXP_LAUNCH_CONTEXT_ERR_MSG;
        }
      } else {
        if (!processedExpression && ref && ref?.control?.dirty) {
          return ExpressionEditorService.EXP_REQUIRED_ERR_MSG;
        }
        return processedExpression;
      }
    }
  }

  /**
   * Drag and drop rearrange of variable order
   * @param event - drag and drop event
   */
  drop(event: CdkDragDrop<Variable[]>): void {
    moveItemInArray(this.cases, event.previousIndex, event.currentIndex);
    this.onChange();
  }
}
