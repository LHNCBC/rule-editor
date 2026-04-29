import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';

import { ExpressionEditorService, SimpleStyle, DisplaySectionControl } from './expression-editor.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ValidationResult } from './variable';
import { ENVIRONMENT_TOKEN } from './environment-token';

import { BaseDialogComponent } from './dialogs/base-dialog/base-dialog.component';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { CaseStatementsComponent } from './case-statements/case-statements.component';
import { VariablesComponent } from './variables/variables.component';
import { UneditableVariablesComponent } from './uneditable-variables/uneditable-variables.component';
import { SelectScoringItemsComponent } from './select-scoring-items/select-scoring-items.component';
import { CalculateSumPromptComponent } from './calculate-sum-prompt/calculate-sum-prompt.component';
import { SyntaxConverterComponent } from './syntax-converter/syntax-converter.component';
import { CancelChangesConfirmationDialogComponent } from './dialogs/cancel-changes-confirmation-dialog/cancel-changes-confirmation-dialog.component';
import { HelpsComponent } from './helps/helps.component';
import { FhirpathEasypathConversionConfirmationDialogComponent } from './dialogs/fhirpath-easypath-conversion-confirmation-dialog/fhirpath-easypath-conversion-confirmation-dialog.component';
import { ExpressionValidatorDirective } from '../directives/expression/expression-validator.directive';

interface AppEnvironment {
  appName?: string;
}

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'lhc-expression-editor',
  templateUrl: 'expression-editor.component.html',
  styleUrls: ['expression-editor.component.css'],
  imports: [ BaseDialogComponent, CommonModule, CalculateSumPromptComponent,
             CancelChangesConfirmationDialogComponent, CaseStatementsComponent,
             ExpressionValidatorDirective,
             FhirpathEasypathConversionConfirmationDialogComponent,
             FormsModule, HelpsComponent, MatTooltipModule,
             SelectScoringItemsComponent, SyntaxConverterComponent,
             UneditableVariablesComponent, VariablesComponent
  ],
  encapsulation: ViewEncapsulation.ShadowDom,
  providers: []
})
export class ExpressionEditorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() advancedInterface = true;
  @Input() doNotAskToCalculateScore = false;
  @Input() fhirQuestionnaire = null;
  @Input() itemLinkId = null;
  @Input() submitButtonName = 'Submit';
  @Input() titleName = 'Expression Editor';
  @Input() userExpressionChoices = null;
  @Input() expressionLabel = 'Final Expression';
  @Input() expressionUri = '';
  @Input() lhcStyle: SimpleStyle = {};
  @Input() display: DisplaySectionControl = {};
  @Output() save = new EventEmitter<object>();
  @Output() cancel = new EventEmitter<object>();

  @ViewChild('exp') expRef;

  appName = '';
  noErrorMessage = "There are no more errors on the page.";
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
  hideExpressionEditor = false;
  validationError = false;
  validationErrorMessage;

  previousExpressionSyntax;
  previousFinalExpression;
  showConfirmDialog = false;

  dialogTitle = "Converting FHIRPath Expression to Easy Path Expression";
  dialogPrompt1 = `The ${this.appName} does not support conversion from FHIRPath Expression ` +
                  `to Easy Path Expression. Switching to the Easy Path Expression for the ` +
                  `output expression would result in the expression becoming blank.`;
  dialogPrompt2 = "Proceed?";

  matToolTip = `Save the ${this.appName}`;
  openExpressionEditorLabel;
  openExpressionEditorTooltip;

  expressionType;

  // Flag to track if export is pending after validation
  isExportPending = false;

  private calculateSumSubscription;
  private finalExpressionSubscription;
  private variablesSubscription;
  private uneditableVariablesSubscription;
  private disableAdvancedSubscription;
  private validationSubscription;
  private performValidationSubscription;
  private helpSubscription;

  // Default Lhc styles. Any updates will be applied on top of these defaults.
  defaultLhcStyle = {
    "h1": {},
    "h2": {},
    "previewArea": {},
    "buttonPrimary": { "backgroundColor": "rgb(13, 110, 253)", "color": "white" },
    "buttonSecondary": { "backgroundColor": "rgb(240, 240, 240)", "color": 'black' },
    "buttonTertiary": { "backgroundColor": "darkgreen", "color": "white" },
    "buttonDanger": {},
    "input": { "backgroundColor": "#ffe", "color": "black" },
    "select": { "backgroundColor": "#ffe", "color": "black" },
    "description": {},
    "variableHeader": {
      "backgroundColor": "white",
      "fontSize": "14px",
      "color": "black",
    },
    "variableRow": {
      "backgroundColor": "white",
      "fontSize": "14px",
      "color": "black",
    },
    "body": {
      "fontSize": "14px",
      "color": "black",
      "backgroundColor": "white",
      "fontFamily": "Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif"
    },
    "titleBar": {
      "padding": "10px 20px 10px 20px",
      "height": "20px",
      "backgroundColor": "#326295",
      "color": "white",
      "verticalAlign": "middle"
    }
  };

  private environment = inject<AppEnvironment>(ENVIRONMENT_TOKEN, { optional: true }) as AppEnvironment | null;

  private variableService = inject(ExpressionEditorService);
  private liveAnnouncer = inject(LiveAnnouncer);
  private changeDetectorRef = inject(ChangeDetectorRef);

  /**
   * Updates the 'defaultStyles' JSON object by merging it with the 'customStyles' JSON object.
   * @param customStylesJson - A JSON object containing custom CSS properties and values that
   *                          override or extend the default styles.
   * @param defaultStylesJson - A JSON object representing the default CSS properties and values,
   *                            which will be updated by the custom styles.
   */
  applyCustomStyles(customStylesJson: any, defaultStylesJson: any): void {
    Object.assign(defaultStylesJson, customStylesJson);
  }

  /**
   * Angular lifecycle hook called when the component is initialized
   */
  ngOnInit(): void {
    if (this.environment?.appName) {
      ExpressionEditorService.APP_NAME = this.environment.appName;
    }
    this.appName = ExpressionEditorService.APP_NAME;

    if (this.lhcStyle || Object.keys(this.lhcStyle).length > 0) {
      this.applyCustomStyles(this.lhcStyle, this.defaultLhcStyle);
    }

    this.dialogPrompt1 = `The ${this.appName} does not support conversion from FHIRPath Expression ` +
      `to Easy Path Expression. Switching to the Easy Path Expression for the ` +
      `output expression would result in the expression becoming blank.`;
    this.matToolTip = `Save the ${this.appName}`;

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
      if (validation && validation.hasError) {
        this.validationError = validation.hasError;
        this.validationErrorMessage = (this.validationError) ? this.composeAriaValidationErrorMessage(validation) : "";
        this.matToolTip = (this.validationErrorMessage) ? this.validationErrorMessage : `Save the ${this.appName}`;

        this.isExportPending = false;
      } else {
        // The validationError represents the current status while the validation.hasError flag
        // represents the new status. If the status changes from 'true' to 'false', indicating
        // that all errors have been resolved, the lifeAnnouncer will announce that all issues
        // have been resolved.
        if (this.validationError) {
          this.validationError = validation.hasError;
          this.liveAnnouncer.announce(this.noErrorMessage);
        }
        // If export was requested and validation passes, proceed to export
        if (this.isExportPending) {
          this.export();
        }
      }
    });

    // performValidationSubscription is triggered when the 'Save' button is clicked, allowing each
    // subscribed component to validate the expression data.
    this.performValidationSubscription = this.variableService.performValidationChange.subscribe((validation) => {
      // The output expression textarea exists only in FHIRPath mode.
      // In Easy Path mode, validation is handled by child components.
      const expressionControl = this.expRef?.control;
      // This branch only validates the final output textarea in FHIRPath mode.
      if (!expressionControl || this.expressionSyntax !== "fhirpath" || !this.display.outputExpressionSection) {
        return;
      }

      expressionControl.markAsTouched();
      expressionControl.markAsDirty();
      expressionControl.setValue(this.finalExpression ?? "");
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
                  "errors" : "one or more errors";
      message += " in the Item Variable section";
    }

    if (validation.errorInOutputExpression) {
      message += (validation.errorInItemVariables) ?
                  ", and" : "one or more errors";
      message += " with the expression in the Output Expression section.";
    } else if (validation.errorInOutputCaseStatement) {
      message += (validation.errorInItemVariables) ?
                  ", and" : "one or more errors";
      message += " with the case statement in the Output Expression section.";
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

    this.variableService.resetVariables();
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
    this.hideExpressionEditor = false;
    this.doNotAskToCalculateScore = false;

    this.display = {
      titleSection: this.display?.titleSection ?? true,
      uneditableVariablesSection: 'uneditableVariablesSection' in this.display ? this.display.uneditableVariablesSection : true,
      uneditableVariablesSectionExpanded: 'uneditableVariablesSectionExpanded' in this.display ? this.display.uneditableVariablesSectionExpanded : true,
      itemVariablesSection: 'itemVariablesSection' in this.display ? this.display.itemVariablesSection : true,
      itemVariablesSectionExpanded: 'itemVariablesSectionExpanded' in this.display ? this.display.itemVariablesSectionExpanded : true,
      outputExpressionSection: 'outputExpressionSection' in this.display ? this.display.outputExpressionSection : true
    };

    this.resetVariablesOnQuestionnaireChange();
    this.expressionType = this.variableService.getExpressionType(this.expressionUri);
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
   * Pre-export function: triggers validation and sets export pending flag
   */
  preExport(): void {
    if (this.display.itemVariablesSection && this.variables.length > 0) {
      this.isExportPending = true;
      // Trigger validation
      this.variableService.notifyValidationCheck();
    } else {
      this.export();
    }
  }

  /**
   * Export FHIR Questionnaire and download as a file
   */
  export(): void {
    this.liveAnnouncer.announce("Export Questionnaire data.");
    this.isExportPending = false;

    setTimeout(() => {
      if (!this.validationError) {
        const finalExpression = this.finalExpressionExtension;
        if (finalExpression?.valueExpression) {
          finalExpression.valueExpression.expression = this.finalExpression;
        }

        const exportResult = this.variableService.export(this.expressionUri, finalExpression, (this.expressionSyntax === 'simple') ? this.simpleExpression : "");
        if (exportResult) {
          this.save.emit(exportResult);
          this.calculateSum = false;
          this.selectItems = false;
          this.hideExpressionEditor = true;
        }
      }
    }, 100);
  }

  /**
   * Create a new instance of a FHIR questionnaire file by summing all ordinal
   * values
   */
  selectItemsForSumOfScores(): void {
    this.selectItems = true;
  }

  /**
   * Cancelling changes to the Expression Editor
   *
   */
  cancelExpressionEditorChanges(): void {
    this.liveAnnouncer.announce(`Cancel changes to the ${this.appName}`);
    setTimeout(() => {
      this.showCancelConfirmationDialog = true;
    }, 100);
  }

  /**
   * Close the dialog. This function is called when the close dialog
   * button or the overlay is clicked on the Expression Editor, Calculate
   * Sum Prompt, Scoring Items Selection, or Helps dialogs. Each
   * results in a different beahvior.
   */
  closeDialog(): void {
    this.liveAnnouncer.announce("Closing dialog");
    setTimeout(() => {
      if (this.calculateSum && !this.loadError) {
        if (!this.selectItems) {
          this.confirmCancel(false);
        } else {
          // Calculate Sum or Scoring Items Selection dialog.
          this.variableService.toggleScoreCalculation();
        }
      } else {
        this.showCancelConfirmationDialog = true;
      }
    }, 100);
  }

  /**
   * Confirm to cancel change
   */
  confirmCancel(showExpressionEditor: boolean): void {
    this.liveAnnouncer.announce("Changes were canceled.");

    setTimeout(() => {
      this.showCancelConfirmationDialog = false;
      this.hideExpressionEditor = !showExpressionEditor;

      // This is what hide the ExpressionEditor and return back to the
      // demo.  By disabling this, now, you can only cancel once.
      this.cancel.emit();
    }, 0);
  }

  /**
   * Close 'Calculate Sum of Scores' or 'Scoring Items Selection' dialogs
   */
  closeScoreingDialog(): void {
    this.liveAnnouncer.announce("Changes were canceled.");

    this.hideExpressionEditor = true;

    setTimeout(() => {
      this.cancel.emit();
      this.showCancelConfirmationDialog = false;
    }, 0);
  }

  /**
   * Discard the cancel request
   */
  discardCancel(): void {
    this.liveAnnouncer.announce("Changes were not canceled");

    setTimeout(() => {
      this.showCancelConfirmationDialog = false;
    }, 0);
  }

  /**
   * Create a new instance of a FHIR questionnaire file by summing all ordinal
   * values
   * @param reviewFHIRPath - true if the 'Review FHIRPath' button is clicked. Selected items will be
   *                         reviewed in the Expression Editor. false if the 'Done' (export scoring data)
   *                         button is clicked. The selected items will be exported.
   */
  addSumOfScores(reviewFHIRPath: boolean): void {
    this.calculateSum = false;
    this.selectItems = false;
    this.hideExpressionEditor = !reviewFHIRPath;

    this.variableService.removeSumOfScores(this.fhirQuestionnaire, this.linkIdContext);

    if (reviewFHIRPath) {
      this.fhirQuestionnaire = this.variableService.addSumOfScores()
      this.reload();
    } else {
      // Export selected scoring items
      this.save.emit(this.variableService.addSumOfScores());
    }
    this.variableService.toggleScoreCalculation();
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
          this.dialogPrompt1 = `The ${this.appName} does not support conversion from FHIRPath Expression ` +
            `to Easy Path Expression. Switching to Easy Path Expression for the case statement ` +
            `would result in the expression becoming blank.`;
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
    }, 0);
  }
}
