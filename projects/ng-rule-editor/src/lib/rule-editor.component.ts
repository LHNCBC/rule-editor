import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';

import { RuleEditorService, SimpleStyle } from './rule-editor.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ValidationResult } from './variable';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'lhc-rule-editor',
  templateUrl: 'rule-editor.component.html',
  styleUrls: ['rule-editor.component.css']
})
export class RuleEditorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() advancedInterface = false;
  @Input() doNotAskToCalculateScore = false;
  @Input() fhirQuestionnaire = null;
  @Input() itemLinkId = null;
  @Input() submitButtonName = 'Submit';
  @Input() titleName = 'Rule Editor';
  @Input() userExpressionChoices = null;
  @Input() expressionLabel = 'Final Expression';
  @Input() expressionUri = '';
  @Input() lhcStyle: SimpleStyle = {};
  @Output() save = new EventEmitter<object>();
  @Output() cancel = new EventEmitter<object>();

  @ViewChild('exp') expRef;

  errorLoading = 'Could not detect a FHIR Questionnaire; please try a different file.';
  expressionSyntax: string;
  simpleExpression: string;
  finalExpression: string;
  finalExpressionExtension;
  linkIdContext: string;
  calculateSum: boolean;
  variables: string[];
  uneditableVariables: string[];
  caseStatements: boolean;
  disableInterfaceToggle = false;
  loadError = false;
  showCancelConfirmationDialog = false;
  selectItems: boolean;
  hideRuleEditor = false;
  validationError = false;
  validationErrorMessage;

  previousExpressionSyntax;
  previousFinalExpression;
  showConfirmDialog = false;

  dialogTitle = "Converting FHIRPath Expression to Easy Path Expression";
  dialogPrompt1 = "The Rule Editor does not support conversion from FHIRPath Expression " +
                  "to Easy Path Expression. Switching to the Easy Path Expression for the " +
                  "output expression would result in the expression becoming blank.";
  dialogPrompt2 = "Proceed?";

  matToolTip = "Save the Rule Editor";

  private calculateSumSubscription;
  private finalExpressionSubscription;
  private variablesSubscription;
  private uneditableVariablesSubscription;
  private disableAdvancedSubscription;
  private validationSubscription;
  private performValidationSubscription;

  constructor(private variableService: RuleEditorService, private liveAnnouncer: LiveAnnouncer, private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.calculateSumSubscription = this.variableService.scoreCalculationChange.subscribe((scoreCalculation) => {
      this.calculateSum = (scoreCalculation && !this.doNotAskToCalculateScore);
    });
    this.finalExpressionSubscription = this.variableService.finalExpressionChange.subscribe((finalExpression) => {
      this.finalExpression = finalExpression;
    });
    this.variablesSubscription = this.variableService.variablesChange.subscribe((variables) => {
      this.variables = this.variableService.getVariableNames();

      // Update the final expression to re-evaluate it against the new variable list.
      if (this.caseStatements) {
        const tmpExpressionSyntax = this.expressionSyntax;
        const tmpFinalExpression = this.finalExpression;

        if (this.expressionSyntax === "fhirpath") {
          this.finalExpression = '';
        }
        this.expressionSyntax = '';
    
        setTimeout(() => {
          this.expressionSyntax = tmpExpressionSyntax;

          if (this.expressionSyntax === "fhirpath") {
            this.finalExpression = (this.validationError) ? this.previousFinalExpression : tmpFinalExpression;
          }
        }, 10);
      } else {
        if (this.expressionSyntax === "fhirpath") {
          const tmpFinalExpression = this.finalExpression;
          this.updateFinalExpression("");
          
          setTimeout(() => {
            this.updateFinalExpression(tmpFinalExpression);
          }, 0);
        }
      }
    });
    this.uneditableVariablesSubscription = this.variableService.uneditableVariablesChange.subscribe((variables) => {
      this.variables = this.variableService.getVariableNames();
    });
    this.disableAdvancedSubscription = this.variableService.disableAdvancedChange.subscribe((disable) => {
      this.disableInterfaceToggle = disable;
    });
    this.validationSubscription = this.variableService.validationChange.subscribe((validation: ValidationResult) => {
      if (validation) {
        this.validationError = validation.hasError;
  
        this.validationErrorMessage = (this.validationError) ? this.composeAriaValidationErrorMessage(validation) : "";
      
        this.matToolTip = (this.validationErrorMessage) ? this.validationErrorMessage : "Save the Rule Editor";
      }
      //this.validationError = validation.hasError;
      //this.validationErrorMessage = (this.validationError) ? this.composeAriaValidationErrorMessage(validation) : "";
    });

    // performValidationSubscription is triggered when the 'Save' button is clicked, allowing each
    // subscribed component to validate the expression data.
    this.performValidationSubscription = this.variableService.performValidationChange.subscribe((validation) => {     
      // By setting the setValue to blank on simple expression that is null, empty, or undefined,
      // it would force the validation to occurs.
      if (this.expressionSyntax === "fhirpath" && this.finalExpression === "") {
        this.expRef.control.markAsTouched();
        this.expRef.control.markAsDirty();
        this.expRef.control.setValue("");
      }
    });
  }

  /**
   * Compose the string message to be used as the aria-label to explain why the 'Save' button is disabled.
   * @param validation - ValidationResult object which contains the validation results.
   * @return string to be used by the 'Save' button as the aria-label in the case of any validation error.
   */
  composeAriaValidationErrorMessage(validation: ValidationResult): string {
    if (!validation.hasError)
      return "";

    let message = "The 'save' button is disabled due to ";

    if (validation.errorInItemVariables) {
      message += (validation.errorInOutputCaseStatement ||
                   validation.errorInOutputExpression) ?
                   "errors" : "an error";
      message += " in the Item Variable section";
    }

    if (validation.errorInOutputExpression) {
      message += (validation.errorInItemVariables) ?
                               ", and " : "an error ";
      message += "with the expression in the Output Expression section.";
    } else if (validation.errorInOutputCaseStatement) {
      message += (validation.errorInItemVariables) ?
                               ", and " : "an error ";
      message += "with the case statement in the Output Expression section.";
    } else {
      message += ".";
    }

    return message;
  };

  /**
   * Angular lifecycle hook called before the component is destroyed
   */
  ngOnDestroy(): void {
    this.calculateSumSubscription.unsubscribe();
    this.finalExpressionSubscription.unsubscribe();
    this.variablesSubscription.unsubscribe();
    this.uneditableVariablesSubscription.unsubscribe();
    this.disableAdvancedSubscription.unsubscribe();

    this.validationSubscription.unsubscribe();
    this.performValidationSubscription.unsubscribe();
  }

  /**
   * There are scenarios when switching the questionnaire; some components may
   * not get updated or displayed properly as Angular is not detecting changes.
   * This function attempts to reset those variables so that the components will
   * get updated correctly.
   * @private
   */
  private resetVariablesOnQuestionnaireChange(): void {
    this.expressionSyntax = null;
    this.simpleExpression = null;
    this.finalExpression = null;
    this.linkIdContext = null;
    this.calculateSum = false;
    this.variables = [];
    this.uneditableVariables = [];
    this.caseStatements = false;

    this.variableService.resetValidationErrors();

    this.changeDetectorRef.detectChanges();
  }

  /**
   * Angular lifecycle hook called on input changes
   */
  ngOnChanges(): void {
    this.calculateSum = false;
    this.selectItems = false;
    this.hideRuleEditor = false;
    this.doNotAskToCalculateScore = false;
    this.resetVariablesOnQuestionnaireChange();
    this.reload();

  }

  /**
   * Re-import fhir and context and show the form
   */
  reload(): void {
    if (this.fhirQuestionnaire instanceof Object) {
      this.variableService.doNotAskToCalculateScore = this.doNotAskToCalculateScore;
      this.loadError = !this.variableService.import(this.expressionUri, this.fhirQuestionnaire, this.itemLinkId);
      if (this.loadError) {
        this.liveAnnouncer.announce(this.errorLoading);
      }
      this.disableInterfaceToggle = this.variableService.needsAdvancedInterface;
      this.advancedInterface = this.variableService.needsAdvancedInterface;
    }

    this.caseStatements = this.variableService.caseStatements;
    this.simpleExpression = this.variableService.simpleExpression;
    this.linkIdContext = this.variableService.linkIdContext;
    this.expressionSyntax = this.variableService.syntaxType;
    this.selectItems = false;

    if (this.linkIdContext) {
      this.doNotAskToCalculateScore = !this.variableService.shouldCalculateScoreForItem(this.fhirQuestionnaire, this.linkIdContext, this.expressionUri);
    } else {
      this.doNotAskToCalculateScore = true;
    }

    this.calculateSum = (this.variableService.scoreCalculation && !this.doNotAskToCalculateScore);
    this.finalExpressionExtension = this.variableService.finalExpressionExtension;
    this.finalExpression = this.variableService.finalExpression;
    this.variables = this.variableService.getVariableNames();
  }

  /**
   * Export FHIR Questionnaire and download as a file
   */
  export(): void {
    if (!this.validationError) {
      this.variableService.notifyValidationCheck();
      const finalExpression = this.finalExpressionExtension;
      if (finalExpression?.valueExpression)
        finalExpression.valueExpression.expression = this.finalExpression;
      this.save.emit(this.variableService.export(this.expressionUri, finalExpression));
    }
  }

  /**
   * Create a new instance of a FHIR questionnaire file by summing all ordinal
   * values
   */
  selectItemsForSumOfScores(): void {
    this.selectItems = true;
  }

  /**
   * Cancelling changes to the Rule Editor
   * 
   */
  cancelRuleEditorChanges(): void {
    this.showCancelConfirmationDialog = true;
  }

  /**
   * Confirm to cancel change
   */
  confirmCancel(): void {
    this.liveAnnouncer.announce("'yes' was selected. Changes were canceled.");

    setTimeout(() => {
      this.cancel.emit();
      this.showCancelConfirmationDialog = false;
    }, 500);
  }

  /**
   * Discard the cancel request
   */
  discardCancel(): void {
    this.liveAnnouncer.announce("'no' was selected. Changes were not canceled");

    setTimeout(() => {
      this.showCancelConfirmationDialog = false;
    }, 100);
  }

  /**
   * Create a new instance of a FHIR questionnaire file by summing all ordinal
   * values
   */
  addSumOfScores(): void {
    this.calculateSum = false;
    this.selectItems = false;
    this.hideRuleEditor = true;

    this.variableService.removeSumOfScores(this.fhirQuestionnaire, this.linkIdContext);
    this.save.emit(this.variableService.addSumOfScores());

    this.reload();
  }

  /**
   * Update the final expression
   */
  updateFinalExpression(expression): void {
    this.finalExpression = expression;
  }

  /**
   * Update the simple final expression
   */
  updateSimpleExpression(simple): void {
    this.simpleExpression = simple;
  }

  /**
   * Toggle the advanced interface based on the type
   */
  onTypeChange(event): void {
    if (this.expressionSyntax === 'fhirpath' && event.target.value === 'simple') {
      if (this.finalExpression !== '' && this.finalExpression !== this.previousFinalExpression) {
        this.previousExpressionSyntax = this.expressionSyntax;

        if (this.caseStatements)
          this.dialogPrompt1 = "The Rule Editor does not support conversion from FHIRPath Expression " +
          "to Easy Path Expression. Switching to Easy Path Expression for the case statement " +
          "would result in the expression becoming blank.";
        this.showConfirmDialog = true;
      } else {
        this.previousExpressionSyntax = event.target.value;
        this.expressionSyntax = event.target.value;
      }
      return;
    } else {
      this.expressionSyntax = event.target.value;
    }
    this.previousFinalExpression = this.finalExpression;

    if (event.target.value === 'fhirpath') {
      this.variableService.seeIfAdvancedInterfaceIsNeeded(true);
    } else {
      // Need to check all other variables and the final expression before we
      // allow the advanced interface to be removed
      this.variableService.seeIfAdvancedInterfaceIsNeeded();
    }

    if (this.variableService.needsAdvancedInterface) {
      this.advancedInterface = true;
      this.disableInterfaceToggle = true;
    } else {
      this.disableInterfaceToggle = false;
    }
  }

  /**
   * Proceed with changing from FHIRPath Expression to Easy Path Expression
   */
  convertFHIRPathToEasyPath(): void {
    if (this.previousFinalExpression &&
        this.previousFinalExpression !== this.finalExpression && 
        this.simpleExpression && 
        this.simpleExpression !== '') {
      this.simpleExpression = '';
    }
    this.showConfirmDialog = false;
    this.expressionSyntax = 'simple';

    this.variableService.seeIfAdvancedInterfaceIsNeeded();
  }

  /**
   * Cancel changing from FHIRPath Expression to Easy Path Expression
   */
  closeConvertDialog(): void {
    this.expressionSyntax = '';
    this.showConfirmDialog = false;

    setTimeout(() => {
      this.expressionSyntax = 'fhirpath';
    }, 10);
  }
}
