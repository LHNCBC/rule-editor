import { Component, Input, OnChanges, OnDestroy, OnInit, ViewChildren, QueryList, inject } from '@angular/core';
import { Variable, AllVariableType, SimpleVariableType } from '../variable';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ExpressionEditorService, SimpleStyle } from '../expression-editor.service';
import copy from 'fast-copy';
import { FormsModule, NgModel } from '@angular/forms';
import { HelpsComponent } from '../helps/helps.component';
import { CommonModule } from '@angular/common';
import { QuestionComponent } from '../question/question.component';
import { FhirpathEasypathConversionConfirmationDialogComponent } from '../dialogs/fhirpath-easypath-conversion-confirmation-dialog/fhirpath-easypath-conversion-confirmation-dialog.component';
import { QueryObservationComponent } from '../query-observation/query-observation.component';
import { SyntaxConverterComponent } from '../syntax-converter/syntax-converter.component';
import { VariableNameValidatorDirective } from '../../directives/variable-name/variable-name-validator.directive';
import { ExpressionValidatorDirective } from '../../directives/expression/expression-validator.directive';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'lhc-variables',
  templateUrl: './variables.component.html',
  styleUrls: ['./variables.component.css', '../styles/section.css'],
  imports: [CommonModule, DragDropModule, ExpressionValidatorDirective,
             FormsModule, FhirpathEasypathConversionConfirmationDialogComponent,
             HelpsComponent, MatTooltipModule, QueryObservationComponent,
             QuestionComponent, SyntaxConverterComponent,
             VariableNameValidatorDirective]
})
export class VariablesComponent implements OnInit, OnChanges, OnDestroy {
  @Input() lhcStyle: SimpleStyle = {};
  @Input() advancedInterface: boolean;

  /**
   * Indicates if the variables are form-level or item-level.
   * Possible values: 'form' | 'item'
   */
  @Input() variableLevel: 'form' | 'item' = 'item';

  @Input() isSectionExpanded = true;

  /**
   * Identifies if this section is for variables or output expression.
   * Possible values: 'variable' | 'output_expression'
   */
  @Input() sectionType: 'variable' | 'output_expression' = 'variable';

  @ViewChildren('exp') expressionRefs: QueryList<NgModel>;

  appName = ExpressionEditorService.APP_NAME;

  variableType: any = SimpleVariableType;
  variableSubscription;
  performValidationSubscription;
  variables: Variable[];

  previousVariable;
  currentVariable;
  currentVariableIdx: number;
  showConfirmDialog = false;

  dialogTitle = "Converting FHIRPath Expression to Easy Path Expression";
  dialogPrompt1 = `The ${this.appName} does not support conversion from FHIRPath Expression ` +
                  `to Easy Path Expression. Switching to the Easy Path Expression may ` +
                  `result in field not getting populated.`;
  dialogPrompt2 = "Proceed?";

  private expressionEditorService = inject(ExpressionEditorService);

  /**
   * Returns the variable title based on the variable level.
   */
  get variableTitle(): string {
    return `${this.variableLevel.charAt(0).toUpperCase()}${this.variableLevel.slice(1)} Variables`;
  }

  /**
   * Returns a message when the variable list is empty, based on the variable level.
   */
  get emptyVariableListMessage(): string {
    return `There are currently no variables for this ${this.variableLevel}.`;
  }

  /**
   * Angular lifecycle hook called when the component is initialized
   */
  ngOnInit(): void {
    this.variables = this.expressionEditorService.variables;
    this.variableSubscription = this.expressionEditorService.variablesChange.subscribe((variables) => {
      this.variables = variables;

      // Remove 'question' from this.variableType where there are no items/questions.
      if (!this.expressionEditorService.hasQuestionsOrItems()) {
        this.variableType = { ...AllVariableType };
        delete this.variableType.question;
      } else {
        if (!('question' in this.variableType)) {
          this.variableType = AllVariableType;
        }
      }
    });

    // performValidationSubscription is triggered when the 'Save' button is clicked, allowing each
    // subscribed component to validate the expression data.
    this.performValidationSubscription = this.expressionEditorService.performValidationChange.subscribe(() => {
      this.expressionRefs.forEach((e) => {
        e.control.markAsTouched();
        e.control.markAsDirty();

        if (!e.control.value || e.control.value === "") {
          e.control.setValue("");
        } else {
          e.control.setValue(e.control.value);
        }
      });
    });
  }

  /**
   * Angular lifecycle hook called when bound property changes
   */
  ngOnChanges(changes): void {
    if (changes.advancedInterface) {
      this.variableType = this.advancedInterface ? AllVariableType : SimpleVariableType;
      if (this.variables) {
        // Make a copy of the existing variables
        const previousVariables = JSON.parse(JSON.stringify(this.variables));

        this.variables.forEach((variable) => {
          variable.type = '';
        });

        // Not sure of a better way of setting the previous values than this
        setTimeout(() => {
          previousVariables.forEach((variable, index) => {
            // For variable types not 'queryObservation', we only update the type.
            // Otherwise need to obtain time duration from the expression
            this.variables[index].type = variable.type;
            if (variable.type === 'queryObservation') {
              const queryObservation = this.expressionEditorService
                .getQueryObservationFromExpression(variable.label, variable.expression, index);
              if (queryObservation)
                this.variables[index] = queryObservation;
            }
          });
        }, 0);
      }
    }
  }

  /**
   * Angular lifecycle hook called before the component is destroyed
   */
  ngOnDestroy(): void {
    this.variableSubscription.unsubscribe();

    this.performValidationSubscription.unsubscribe();
  }

  /**
   * Called when adding a new variable
   */
  onAdd(): void {
    this.expressionEditorService.addVariable();
  }

  /**
   * Remove a variable at an index
   * @param i - index to remove
   */
  onRemove(i: number): void {
    this.expressionEditorService.remove(i);
  }

  /**
   * Drag and drop rearrange of variable order
   * @param event - drag and drop event
   */
  drop(event: CdkDragDrop<Variable[]>): void {
    moveItemInArray(this.variables, event.previousIndex, event.currentIndex);

    this.expressionEditorService.moveItemInVariableItemsErrors(event.previousIndex, event.currentIndex);
  }

  /**
   * Update the preview when the variable name changes
   */
  onNameChange(): void {
    this.expressionEditorService.update();
  }

  /**
   * Proceed with changing from FHIRPath Expression to Easy Path Expression
   */
  convertFHIRPathToEasyPath(): void {
    this.showConfirmDialog = false;
    this.variables[this.currentVariableIdx].type = 'simple';
    this.expressionEditorService.seeIfAdvancedInterfaceIsNeeded();
  }

  /**
   * Cancel changing from FHIRPath Expression to Easy Path Expression
   */
  closeConvertDialog(): void {
    this.showConfirmDialog = false;
    this.variables[this.currentVariableIdx] = this.currentVariable;
  }


  /**
   * Toggle the advanced interface based on the type
   * @param event - Variable Type change event
   * @param i - Index of the currently edited variable type
   */
  onTypeChange(event, i: number): void {
    const previousValue = this.variables[i].type;
    if (previousValue === 'expression' && event.target.value === 'simple') {
      this.currentVariableIdx = i;

      this.currentVariable = copy(this.variables[i]);

      if (this.currentVariable?.expression && !this.currentVariable?.simple) {
        this.dialogPrompt1 = `The ${this.appName} does not support conversion from FHIRPath Expression ` +
          `to Easy Path Expression. Switching to Easy Path Expression for variable '${this.currentVariable.label}' ` +
          `would result in the expression becoming blank.`;
        this.showConfirmDialog = true;
      } else {
        this.variables[this.currentVariableIdx].type = 'simple';
        this.expressionEditorService.seeIfAdvancedInterfaceIsNeeded();
      }

    } else {
      this.variables[i].type = event.target.value;

      this.currentVariable = copy(this.variables[i]);

      if (event.target.value === 'query' || event.target.value === 'expression') {
        this.expressionEditorService.seeIfAdvancedInterfaceIsNeeded(true);
      } else {
        // Need to check all other variables and the final expression before we
        // allow the advanced interface to be removed
        this.expressionEditorService.seeIfAdvancedInterfaceIsNeeded();
      }
    }
  }

  /**
   * Clear out the simple expression when the FHIRPath expression changes.
   * And delete out the linkId
   * @param event - Expression change event
   * @param i - Index of the currently edited expression
   */
  onExpressionChange(event, i: number): void {
    this.variables[i].simple = '';
    delete this.variables[i].linkId;
  }

  /**
   * Get the labels of available variables at the current index
   * @param i - Index of the currently edited variable
   */
  getAvailableVariables(i: number): string[] {
    const uneditableVariables = this.expressionEditorService.uneditableVariables.map((e) => e.name);
    // Only return variables up to but not including index
    const editableVariables = this.variables.map((e) => e.label).slice(0, i);

    return uneditableVariables.concat(editableVariables);
  }

  /**
   * Update the expression for variable at the given index.
   * @param i - index
   * @param expression - new expression to use
   */
  updateExpression(i: number, expression): void {
    if (this.variables[i].expression !== expression) {
      this.variables[i].expression = (expression !== 'Not valid') ? expression : "";
    }
  }

  /**
   * Update the Easy Path for variable at the given index.
   * @param i - index
   * @param easyPath - new expression to use
   */
  updateSimpleExpression(i: number, easyPath): void {
    if (this.variables[i].simple !== easyPath && easyPath !== "") {
      this.variables[i].simple = easyPath;
      delete this.variables[i].linkId;
    }
  }

  /**
   * Toggles the expanded state of the component.
   */
  toggle() {
    this.isSectionExpanded = !this.isSectionExpanded;
  }
}
