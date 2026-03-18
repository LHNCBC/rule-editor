import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import copy from 'fast-copy';

import { CASE_REGEX, Question, SectionTypes, UneditableVariable, ValidationParam, ValidationResult, Variable } from './variable';
import { UNIT_CONVERSION } from './units';
import { moveItemInArray } from '@angular/cdk/drag-drop';

export interface SimpleStyle {
  h1?: object;
  h2?: object;
  previewArea?: object;
  variableHeader?: object;
  variableRow?: object;
  buttonPrimary?: object;
  buttonSecondary?: object;
  buttonTertiary?: object;
  buttonDanger?: object;
  input?: object;
  select?: object;
  description?: object;
  body?: Record<string, string | undefined>;
  titleBar?: Record<string, string | undefined>;
}

export interface DisplaySectionControl {
  titleSection?: boolean,
  uneditableVariablesSection?: boolean;
  uneditableVariablesSectionExpanded?: boolean;
  itemVariablesSection?: boolean;
  itemVariablesSectionExpanded?: boolean;
  outputExpressionSection?: boolean;
}

export enum DialogTypes {
  Confirmation = "confirmation",
  Help = "help"
};

export enum DialogSize {
  Small = "30%",
  Medium = "50%",
  Large = "80%"
}

export interface DialogStyle {
  dialogTitleBar?: object;
  dialogContentDiv?: object;
  dialogHeaderDiv?: object;
  dialogBodyDiv?: object;
  dialogFooterDiv?: object;
  buttonPrimary?: object;
  buttonSecondary?: object;
}

interface WhereConditionExpression {
  itemQuery: string;
  answerOptionQuery: string;
}

interface Scoring {
  foundLinkId: boolean;
  // array of scoring items
  scoreItems: any[];
}

class ItemVariableError {
  name: boolean;
  expression: { type: string, status: boolean };
  timeInterval?: boolean;

  constructor(name: boolean, expression: boolean, timeInterval = false) {
    this.name = name;
    this.expression = { type: "error", status: expression };
    this.timeInterval = timeInterval;
  }
};

class Stack<T> {
  private items: T[];

  constructor() {
    this.items = [];
  }

  push(element: T): void {
    this.items.push(element);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  contains(element: T): boolean {
    return this.items.indexOf(element) > -1;
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
};

@Injectable({
  providedIn: 'root'
})
export class ExpressionEditorService {
  static SCORE_VARIABLE_EXTENSION = 'http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-score-variable';
  static SCORE_EXPRESSION_EXTENSION = 'http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-score-expression';
  static SCORE_EXPRESSION_EXTENSION_LINKIDS = 'http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-score-expression-linkids';
  static SIMPLE_SYNTAX_EXTENSION = 'http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax';
  static VARIABLE_TYPE = 'http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type';
  static FHIR_QUERY_OBS_FIELDS = ['code', 'date', 'patient', '_sort', '_count'];
  static APP_NAME = "Expression Editor";

  static ENVIRONMENT_VARIABLES = ['resource', 'rootResource', 'sct', 'loinc', 'vs-', 'ext-', 'context', 'questionnaire', 'qitem'];
  static COMMON_LAUNCH_CONTEXT_VARIABLES = ['patient', 'encounter', 'practitioner', 'organization', 'user', 'relatedPerson'];

  static EXP_REQUIRED_ERR_MSG = "Required";
  static EXP_NOT_VALID_ERR_MSG = "Not valid";
  static EXP_LAUNCH_CONTEXT_ERR_MSG = "Launch context";

  syntaxType = 'fhirpath';
  linkIdContext: string;
  uneditableVariablesChange: Subject<UneditableVariable[]> =
    new Subject<UneditableVariable[]>();
  variablesChange: Subject<Variable[]> = new Subject<Variable[]>();
  questionsChange: Subject<Question[]> = new Subject<Question[]>();
  scoreCalculationChange: Subject<boolean> = new Subject<boolean>();
  finalExpressionChange: Subject<string> = new Subject<string>();
  disableAdvancedChange: Subject<boolean> = new Subject<boolean>();
  validationChange: Subject<object> = new Subject<object>();
  performValidationChange: Subject<boolean> = new Subject<boolean>();

  uneditableVariables: UneditableVariable[];
  variables: Variable[];
  questions: Question[];
  finalExpression: string;
  finalExpressionExtension;
  simpleExpression: string;
  caseStatements: boolean;
  needsAdvancedInterface = false;
  doNotAskToCalculateScore = false;

  itemLinkIdsForCalculation: string[];

  private LANGUAGE_FHIRPATH = 'text/fhirpath';
  private LANGUAGE_FHIR_QUERY = 'application/x-fhir-query';
  private QUESTION_REGEX = /^%resource\.item\.where\(linkId='(.*)'\)\.answer\.value(?:\*(\d*\.?\d*))?$/;
  private QUERY_REGEX = /^Observation\?code=(.+)&date=gt{{today\(\)-(\d+)\s+(\S+)}}&patient={{%patient.id}}&_sort=-date&_count=1$/;

  private QUERY_DATE_REGEX = /gt{{today\(\)-(\d+)\s+(\S+)}}/;

  private VARIABLE_EXTENSION = 'http://hl7.org/fhir/StructureDefinition/variable';
  private INITIAL_EXPRESSION_URI = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-initialExpression';
  private CALCULATED_EXPRESSION_URI = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression';
  private LAUNCH_CONTEXT_URI = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-launchContext';

  private ANSWER_EXPRESSION_URI = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-answerExpression";
  private ENABLEWHEN_EXPRESSION_URI = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression";

  private linkIdToQuestion = {};
  private fhir;
  scoreCalculation = false;

  private itemVariablesErrors: ItemVariableError[] = [];
  private outputExpressionError = false;
  private caseStatementError = false;
  private outputExpressionWarning = false;
  private caseStatementWarning = false;

  dialogStack = new Stack();

  constructor() {
    this.variables = [];
    this.uneditableVariables = [];
  }

  /**
   * Reset variables and uneditable variables
   */
  resetVariables(): void {
    this.variables = [];
    this.uneditableVariables = [];
  }

  /**
   * Extract all variable names from the variable extensions of a list of items.
   * @returns - An array of variable names.
   */
  getVariableNamesFromItems(): string[] {
    const variableNames: string[] = [];
    if (Array.isArray(this.fhir.item) && this.fhir.item.length > 0) {
      this.fhir.item.forEach(item => {
        if (Array.isArray(item.extension) && item.extension.length > 0) {
          item.extension.forEach(extension => {
            if (extension.url === this.VARIABLE_EXTENSION) {
              variableNames.push(extension?.valueExpression?.name);
            }
          });
        }
      });
    }
    return variableNames;
  }

  /**
   * Create a new variable
   */
  addVariable(): void {
    let variableNamesFromItems = [];
    if (!this.linkIdContext && (this.fhir?.item?.length ?? 0) > 0) {
      variableNamesFromItems = this.getVariableNamesFromItems();
    }
    // Get all the existing variable names
    const existingNames = this.variables.map((e) => e.label)
      .concat(this.uneditableVariables.map((e) => e.name)).concat(variableNamesFromItems);

    // This was added to handle the scenario where Questionnaire-level variables are being edited and no items are available.
    // In that case, the default is set to 'simple' instead.
    const defaultType = Array.isArray(this.questions) && this.questions.length > 0 ? 'question' : 'simple';
    this.variables.push({
      label: this.getNewLabelName(existingNames),
      type: defaultType,
      expression: ''
    });
    this.variablesChange.next(this.variables);

    this.itemVariablesErrors.push(new ItemVariableError(false, false, false));
  }

  /**
   * Remove a variable
   * @param i - index of variable to remove
   */
  remove(i: number): void {
    this.variables.splice(i, 1);
    this.variablesChange.next(this.variables);

    this.itemVariablesErrors.splice(i, 1);
    this.validationChange.next(this.getValidationResult());
  }

  /**
   * Trigger an update (used when changing variable names to update the preview)
   */
  update(): void {
    this.variablesChange.next(this.variables);
  }

  /**
   * Checks the advanced interface status and allows toggle if no expressions or
   * queries are present
   * @param toggleOn - Set the advanced interface on (without having to run checks)
   */
  seeIfAdvancedInterfaceIsNeeded(toggleOn?: boolean): void {
    if (toggleOn) {
      this.needsAdvancedInterface = true;
    } else {
      let needsAdvanced = false;
      // Check variables
      if (this.variables.find((e) => e.type === 'expression' || e.type === 'query') !== undefined) {
        needsAdvanced = true;
      }

      // Check final expression
      if (this.syntaxType === 'fhirpath') {
        needsAdvanced = true;
      }

      this.needsAdvancedInterface = needsAdvanced;
    }

    this.disableAdvancedChange.next(this.needsAdvancedInterface);
  }

  /**
   * Get the list of uneditable variables based on the FHIR Questionnaire:
   * Launch context + variables outside not on the current item scope
   * @param questionnaire - FHIR Questionnaire
   * @param linkIdContext - Context to use for final expression
   * @param launchContextOnly - Only show the launch context related extensions (default: false)
   */
  getUneditableVariables(questionnaire, linkIdContext, launchContextOnly = false): UneditableVariable[] {
    const uneditableVariables = [];

    if (Array.isArray(questionnaire.extension)) {
      const variables = questionnaire.extension.reduce((accumulator, extension) => {
        if (extension.url === this.LAUNCH_CONTEXT_URI && extension.extension) {
          accumulator.push({
            name: extension.extension.find((e) => e.url === 'name').valueId,
            type: extension.extension.filter((e) => e.url === 'type')?.map((e) => e.valueCode).join('|'),
            description: extension.extension.find((e) => e.url === 'description')?.valueString
          });
        } else if (this.isVariable(extension) && !launchContextOnly) {
          accumulator.push({
            name: extension.valueExpression.name,
            type: 'Variable',
            description: extension.valueExpression.expression,  // Might want to show simplified form
          });
        }
        return accumulator;
      }, []);
      uneditableVariables.push(...variables);
    }

    // Get the variables on item ancestors where linkId matches
    if (questionnaire.item instanceof Array && !launchContextOnly) {
      const ancestors = this.getAncestors(questionnaire.item, linkIdContext, []);

      if (ancestors instanceof Array) {
        ancestors.forEach(currentItem => {
          if (currentItem.extension instanceof Array) {
            currentItem.extension.forEach((extension) => {
              if (this.isVariable(extension)) {
                uneditableVariables.push({
                  name: extension.valueExpression.name,
                  type: 'Item variable',
                  description: extension.valueExpression.expression,  // Might want to show simplified form
                });
              }
            });
          }
        });
      }
    }

    return uneditableVariables;
  }

  /**
   * Find the ancestors of an item given the linkId and return those items.
   * @param items - Items array
   * @param itemLinkId - The item for which to determine ancestors
   * @param ancestors - Array of ancestor items. Empty array for root level
   * @return
   */
  getAncestors(items, itemLinkId, ancestors): any[] {
    for (const currentItem of items) {
      if (currentItem.linkId === itemLinkId) {
        return ancestors;
      }

      if (currentItem.item instanceof Array) {
        const tmp = this.getAncestors(currentItem.item, itemLinkId, ancestors.concat(currentItem));

        if (tmp !== null) {
          return tmp;
        }
      }
    }

    return null;
  }

  /**
   * Returns true if extension is a variable with FHIRPath or FHIR Query as the
   * language
   * @param extension - FHIR extension
   * @return true if extension is a variable
   * @private
   */
  private isVariable(extension): boolean {
    return extension.url === this.VARIABLE_EXTENSION && extension.valueExpression &&
      (extension.valueExpression.language === this.LANGUAGE_FHIRPATH ||
        extension.valueExpression.language === this.LANGUAGE_FHIR_QUERY);
  }

  /**
   * Get and remove the variables from the FHIR object
   * @param items - Question array
   * @param linkIdContext - Context to use for extracting variables
   * @return Array of variables
   */
  extractVariablesFromItems(items, linkIdContext): Variable[] {
    // Look at the item fhirpath related extensions to populate the editable variables

    const item = items.find((e) => e.linkId === linkIdContext && e.extension);
    if (item) {
      return this.extractVariablesFromExtensions(item);
    } else {
      if (items.item && items.item.length) {
        for (const searchItem of items.item) {
          if (searchItem.item) {
            const ret = this.extractVariablesFromItems(searchItem.item, linkIdContext);
            if (ret.length) {
              return ret;
            }
          }
        }
      }

      return [];
    }
  }

  /**
   * Returns custom extension variable type for the given item extension
   * @param extension - FHIR extension
   * @return variable type defined in valueString or null
   * @private
   */
  private getVariableTypeFromExtension(extension): string {
    if (extension?.valueExpression?.extension) {
      const variableType = extension.valueExpression.extension.find(e => e.url === ExpressionEditorService.VARIABLE_TYPE);

      if (variableType?.valueString)
        return variableType.valueString;
    }

    return null;
  };

  /**
   * Returns expression language based on the variableType if available;
   * otherwise, returns from the extension valueExpression language
   * @param extension - FHIR extension
   * @param variableType - Custom extension variable type
   * @return expression language ('text/fhirpath' or 'application/x-fhir-query')
   * @private
   */
  private getExtensionLanguage(extension, variableType) {
    if (variableType !== null) {
      return (variableType.indexOf('query') > -1) ? this.LANGUAGE_FHIR_QUERY : this.LANGUAGE_FHIRPATH;
    }
    return extension.valueExpression.language;
  }

  /**
   * Get and remove the variables from an item or FHIR questionnaire
   * @param item - FHIR Questionnaire or item
   * @return Array of variables
   * @private
   */
  private extractVariablesFromExtensions(item): Variable[] {
    const variables = [];
    const nonVariableExtensions = [];

    // Add an index to each extension which we will then use to get the
    // variables back in the correct order. __$index will be removed on save
    item.extension = item.extension.map((e, i) => ({ ...e, __$index: i }));

    item.extension.forEach((extension) => {
      if (extension.url === this.VARIABLE_EXTENSION && extension.valueExpression) {

        const extensionVariableType = this.getVariableTypeFromExtension(extension);
        const extensionLanguage = this.getExtensionLanguage(extension, extensionVariableType);

        switch (extensionLanguage) {
          case this.LANGUAGE_FHIRPATH:
          {
            const fhirPathVarToAdd = this.processVariable(
              extension.valueExpression.name,
              extension.valueExpression.expression,
              extension.__$index,
              extension.valueExpression.extension,
              extensionVariableType);
            if (fhirPathVarToAdd.type === 'expression') {
              this.needsAdvancedInterface = true;
            }
            variables.push(fhirPathVarToAdd);
            break;
          }
          case this.LANGUAGE_FHIR_QUERY:
          {
            const queryVarToAdd = this.processQueryVariable(
              extension.valueExpression.name,
              extension.valueExpression.expression,
              extension.__$index,
              extensionVariableType);
            if (queryVarToAdd.type === 'query') {
              this.needsAdvancedInterface = true;
            }
            variables.push(queryVarToAdd);
            break;
          }
        }
      } else {
        nonVariableExtensions.push(extension);
      }
    });

    // Remove the variables so they can be re-added on export
    item.extension = nonVariableExtensions;

    return variables;
  }

  /**
   * Get and remove the variables from the FHIR object
   * @param fhir - FHIR Questionnaire
   */
  extractTopLevelVariables(fhir): Variable[] {
    if (fhir.extension instanceof Array) {
      return this.extractVariablesFromExtensions(fhir);
    } else {
      return [];
    }
  }

  /**
   * Check if the current item has an ordinalValue extension on the answer
   * @param item - Question item or linkId
   */
  itemHasScore(item): boolean {
    if (typeof item === 'string') {
      item = this.linkIdToQuestion[item];
    }
    return ((item?.answerOption) || []).some((answerOption) => {
      return ((answerOption?.extension) || []).some((extension) => {
        return (extension.url === 'http://hl7.org/fhir/StructureDefinition/ordinalValue' ||
                extension.url === 'http://hl7.org/fhir/StructureDefinition/itemWeight');
      });
    });
  }

  /**
   * Get the number of ordinalValue on the answers of the questions on the
   * Questionnaire
   * @param item - FHIR Questionnaire or item
   * @param linkIdContext - linkId to exclude from calculation
   * @return number of score questions on the questionnaire
   */
  getScoreQuestionCount(item, linkIdContext): number {
    let scoreQuestions = 0;

    if (item.item) {
      item.item.forEach((currentItem) => {
        if (!currentItem.repeats && this.itemHasScore(currentItem)) {
          scoreQuestions++;
        }

        if (currentItem.item instanceof Array) {
          const nestedScoreQuestionCount = this.getScoreQuestionCount(currentItem, linkIdContext);

          scoreQuestions += nestedScoreQuestionCount;
        }
      });
    }
    return scoreQuestions;
  }

  /**
   * Import a FHIR Questionnaire to populate questions
   * @param expressionUri - URI of expression extension on linkIdContext question
   *  to extract and modify
   * @param questionnaire - FHIR Questionnaire
   * @param linkIdContext - Context to use for final expression
   * @return true if load was successful
   */
  import(expressionUri: string, questionnaire, linkIdContext): boolean {
    this.linkIdContext = linkIdContext;
    this.fhir = copy(questionnaire);
    const loadSuccess = this.fhir.resourceType === 'Questionnaire';

    // this.linkIdContext is not set at the questionnaire level.
    if (loadSuccess && ((this.fhir.item && this.fhir.item.length) || !this.linkIdContext)) {
      if (!this.doNotAskToCalculateScore && this.linkIdContext) {
        // If there is at least one score question we will ask the user if they
        // want to calculate the score
        const scoreMinQuestions = 1;
        this.scoreCalculation = this.getScoreQuestionCount(this.fhir, linkIdContext) >= scoreMinQuestions;
        this.scoreCalculationChange.next(this.scoreCalculation);
      } else {
        this.scoreCalculation = false;
      }

      this.linkIdToQuestion = {};
      this.needsAdvancedInterface = true;
      this.caseStatements = false;
      this.processItem(this.fhir.item);

      if (linkIdContext) {
        this.uneditableVariables = this.getUneditableVariables(this.fhir, linkIdContext);
        this.variables = this.extractVariablesFromItems(this.fhir.item, linkIdContext);
      } else {
        this.uneditableVariables = this.getUneditableVariables(this.fhir, linkIdContext, true);
        this.variables = this.extractTopLevelVariables(this.fhir);

        // Since we don't have a target item the output expression does not make sense so hide it.
        expressionUri = '';
      }

      this.variables.forEach((variable) => {
        if (variable.type === "expression" || variable.type === "query" || variable.type === "queryObservation") {
          variable.expression = this.decodeQueryURIExpression(variable.expression);
        }

        this.itemVariablesErrors.push(new ItemVariableError(false, false, false));
      });

      this.uneditableVariablesChange.next(this.uneditableVariables);
      this.variablesChange.next(this.variables);

      this.questions = [];

      // tslint:disable-next-line:forin
      for (const key in this.linkIdToQuestion) {
        if (!Object.prototype.hasOwnProperty.call(this.linkIdToQuestion, key)) {
          return;
        }
        const e = this.linkIdToQuestion[key];
        // TODO decimal vs choice
        const MAX_Q_LEN = 60;  // Maximum question length before truncating.

        const text = e.text;

        if (e.text) {
          this.questions.push({
            linkId: e.linkId,
            text: text.length > MAX_Q_LEN ? text.substring(0, MAX_Q_LEN) + '...' : text,
            unit: this.getQuestionUnits(e.linkId)
          });
        }
      }
      this.questionsChange.next(this.questions);

      if (expressionUri) {
        const expression = this.extractExpression(expressionUri, this.fhir.item, linkIdContext);

        if (expression !== null) {
          // @ts-ignore
          this.finalExpression = expression.valueExpression.expression;
          this.finalExpressionExtension = expression;

          this.caseStatements = this.finalExpression.match(CASE_REGEX) !== null;

          const simpleSyntax = this.extractSimpleSyntax(expression);

          if (simpleSyntax === null && this.finalExpression !== '') {
            this.syntaxType = 'fhirpath';
            this.needsAdvancedInterface = true;
            this.simpleExpression = '';
          } else {
            this.syntaxType = 'simple';
            this.simpleExpression = simpleSyntax;
          }
        } else {
          // Reset input to be a blank fhirpath expression if there is nothing on
          // the form
          this.syntaxType = 'fhirpath';
          this.simpleExpression = '';
          this.finalExpression = '';
          this.finalExpressionExtension = {
            url: expressionUri,
            valueExpression: {
              language: 'text/fhirpath',
              expression: this.finalExpression
            }
          };
        }

        this.finalExpressionChange.next(this.finalExpression);
      }
    }

    return loadSuccess;
  }

  /**
   * Process nested FHIR Questionnaire items
   * @param items - Current level of item nesting
   * @private
   */
  private processItem(items): void {
    if (Array.isArray(items) && items.length > 0) {
      items.forEach((e) => {
        this.linkIdToQuestion[e.linkId] = e;
        if (e.item) {
          this.processItem(e.item);
        }
      });
    }
  }

  /**
   * Check whether the questionnaire has either questions or items.
   * @returns - 'true' if either 'questions' or 'items' has content, otherwise false.
   */
  hasQuestionsOrItems(): boolean {
    return ((this.questions?.length ?? 0) > 0 || (this.fhir.item?.length ?? 0) > 0);
  }

  /**
   * Get and remove the simple syntax if available. If not return null
   * @param expression
   */
  extractSimpleSyntax(expression): string | null {
    if (expression.valueExpression && expression.valueExpression.extension) {
      const customExtension = expression.valueExpression.extension.find((e) => {
        return e.url === ExpressionEditorService.SIMPLE_SYNTAX_EXTENSION;
      });

      if (customExtension !== undefined) {
        return customExtension.valueString;  // TODO move to code
      }
    }

    return null;
  }

  /**
   * Get and remove the final expression
   * @param expressionUri - Expression extension URL
   * @param items - FHIR questionnaire item array
   * @param linkId - linkId of question where to extract expression
   */
  extractExpression(expressionUri, items, linkId): object | null {
    for (const item of items) {
      if (item.linkId === linkId && item.extension) {
        const extensionIndex = item.extension.findIndex((e) => {
          return e.url === expressionUri && e.valueExpression.language === this.LANGUAGE_FHIRPATH &&
            e.valueExpression.expression;
        });
        if (extensionIndex !== -1) {
          const finalExpression = item.extension[extensionIndex];
          item.extension.splice(extensionIndex, 1);

          return finalExpression;
        }
      } else if (item.item) {
        const expression = this.extractExpression(expressionUri, item.item, linkId);
        if (expression !== null)
          return expression;
      }
    }

    return null;
  }

  /**
   * Process a FHIRPath expression into a more user friendly format if possible.
   * If the format of the FHIRPath matches a format we can display with a
   * question dropdown, etc show that. If not show the FHIRPath expression.
   * @param name - Name to assign variable
   * @param expression - Expression to process
   * @param index - Original order in extension list
   * @param extensions - Any additional extensions (for simple fhirpath etc)
   * @return Variable type which can be used by the Expression Editor to show a
   * question, expression etc
   * @private
   */
  private processVariable(name, expression, index?: number, extensions?, variableType?: string): Variable {
    const matches = (typeof expression === 'string') ? expression.match(this.QUESTION_REGEX) : null;

    const simpleExtension = extensions && extensions.find(e => e.url === ExpressionEditorService.SIMPLE_SYNTAX_EXTENSION);

    if ((variableType === 'question' && (matches !== null || expression === '')) ||
      (!variableType && matches !== null)) {

      let linkId: string;
      let factor: string;

      if (matches) {
        linkId = matches[1];
        factor = matches[2];
      }

      const variable: Variable = {
        __$index: index,
        label: name,
        type: 'question',
        linkId,
        expression
      };

      if (factor) {
        // We might be able to do unit conversion
        const sourceUnits = this.getQuestionUnits(linkId);

        if (Object.prototype.hasOwnProperty.call(UNIT_CONVERSION, sourceUnits)) {
          const conversions = UNIT_CONVERSION[sourceUnits];
          const conversion = conversions.find((e) => {
            return e.factor.toString() === factor;
          });

          if (conversion && conversion.unit)
            variable.unit = conversion.unit;
          else {
            return {
              __$index: index,
              label: name,
              type: 'expression',
              expression
            };
          }
        }
      }
      return variable;
    } else if (simpleExtension !== undefined) {
      return {
        __$index: index,
        label: name,
        type: 'simple',
        expression,
        simple: simpleExtension.valueString
      };
    } else {
      return {
        __$index: index,
        label: name,
        type: 'expression',
        expression
      };
    }
  }

  /**
   * Retrieves Query Observation from the expression.
   * @param name - Name to assign variable
   * @param expression - Expression to process
   * @param index - Original order in extension list
   * @return Returns a Query Observation or null
   */
  getQueryObservationFromExpression(name, expression, index?: number): Variable {
    const queryObservation = this.processQueryVariable(name, expression, index);
    return (queryObservation.type === "queryObservation") ? queryObservation : null;
  }

  /**
   * Process a x-fhir-query expression into a more user friendly format if
   * possible. Show a code autocomplete field if possible if not show the
   * expression editing field.
   * @param name - Name to assign variable
   * @param expression - Expression to process
   * @param index - Original order in extension list
   * @return Variable type which can be used by the Expression Editor to show a
   * question, expression etc
   * @private
   */
  private processQueryVariable(name, expression, index?: number, variableType?: string): Variable {
    const matches = this.getFHIRQueryObservationMatches(expression);
    if ((variableType === "queryObservation" || !variableType) &&
        matches.length > 0) {
      const codes = matches[1].split(',');
      const timeInterval = parseInt(matches[2], 10);
      const timeIntervalUnits = matches[3];

      return {
        __$index: index,
        label: name,
        type: 'queryObservation',
        codes,
        timeInterval,
        timeIntervalUnit: timeIntervalUnits,
        expression
      };
    } else {
      return {
        __$index: index,
        label: name,
        type: 'query',
        expression
      };
    }
  }

  // TODO check behavior of repeating linkId
  /**
   * Get question units for the question
   * @param linkId - Question linkId
   * @private
   */
  private getQuestionUnits(linkId): string {
    const QUESTIONNAIRE_UNIT = 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit';
    const question = this.linkIdToQuestion[linkId];

    if (question.extension) {
      const extension = question.extension.find((e) => {
        return e.url === QUESTIONNAIRE_UNIT &&
          e.valueCoding.system && e.valueCoding.system === 'http://unitsofmeasure.org';
      });

      if (extension && extension.valueCoding.code) {
        return extension.valueCoding.code;
      }
    }

    return null;
  }

  /**
   * Generate a label name like A, B, C, ... AA, AB which is not already used
   * @param existingNames {string[]} - Array of names already used by existing variables
   * @private
   */
  private getNewLabelName(existingNames: string[]): string {
    // All letters which can be used for a simple variable name
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

    // First pass is with a single character variable name. Other passes are with two
    const firstLetterAlphabet = [''].concat(alphabet);
    for (const firstLetter of firstLetterAlphabet) {
      for (const secondLetter of alphabet) {
        const potentialName = firstLetter + secondLetter;

        const count = existingNames.filter((e) => e === potentialName);

        if (count.length === 0) {
          return potentialName;
        }
      }
    }

    // Don't return a suggested name if we exhausted all combinations
    return '';
  }

  /**
   * Toggle the Score Calculation
   */
  toggleScoreCalculation(): void {
    this.scoreCalculation = !this.scoreCalculation;
    this.scoreCalculationChange.next(this.scoreCalculation);
  }

  /**
   * Add variables and finalExpression and return the new FHIR Questionnaire
   * @param url Extension URL to use for the expression
   * @param finalExpression - output expression in FHIRPath format
   * @param simpleExpression - when available, the output expression in Easy Path format will be embedded
   *                           as a 'simple-syntax' extension within the output expression.
   */
  export(url: string, finalExpression, simpleExpression = ''): object {
    // Check to see if there are any errors from the validation
    const validationResult = this.getValidationResult();
    if (validationResult.hasError)
      return;

    // Copy the fhir object, so we can export more than once
    // (if we add our data the second export will have duplicates)
    const fhir = copy(this.fhir);

    const variablesToAdd = this.variables.map((e) => {
      const variable = {
        __$index: e.__$index,
        url: this.VARIABLE_EXTENSION,
        valueExpression: {
          name: e.label,
          language: (e.type.indexOf('query') > -1) ? this.LANGUAGE_FHIR_QUERY : this.LANGUAGE_FHIRPATH,
          expression: (e.type === 'expression' || e.type === 'query' || e.type === 'queryObservation') ?
            this.encodeQueryURIExpression(e.expression) : e.expression,
          extension: [{
            "url": "http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type",
            "valueString": e.type
          }]
        }
      };

      if (e.type === 'simple') {
        // @ts-ignore
        variable.valueExpression.extension.push({
          url: ExpressionEditorService.SIMPLE_SYNTAX_EXTENSION,
          valueString: e.simple
        });
      }

      return variable;
    });

    // Split the variables into two buckets: Variables present when
    // Questionnaire was imported and variables added by the user using the Rule
    // Editor. Add variables present initially among the existing extensions.
    // Add the remaining variables at the end
    const variablesPresentInitially = [];
    const variablesAdded = [];

    variablesToAdd.forEach(e => {
      if (e.__$index === undefined) {
        variablesAdded.push(e);
      } else {
        variablesPresentInitially.push(e);
      }
    });
    if (this.syntaxType === 'simple' || simpleExpression) {
      if (finalExpression && Object.prototype.hasOwnProperty.call(finalExpression, 'valueExpression') && finalExpression.valueExpression) {
        if (simpleExpression) {
          if (!finalExpression.valueExpression.extension) {
            finalExpression.valueExpression.extension = [];
          }
          this.findOrAddExtension(finalExpression.valueExpression.extension, ExpressionEditorService.SIMPLE_SYNTAX_EXTENSION, 'String', simpleExpression);
        } else {
          // remove Simple Syntax extension
          if ('extension' in finalExpression.valueExpression) {
            const idx = finalExpression.valueExpression.extension.findIndex(ext => ext.url === ExpressionEditorService.SIMPLE_SYNTAX_EXTENSION);
            if (idx !== -1) {
              finalExpression.valueExpression.extension.splice(idx, 1);
              if (finalExpression.valueExpression.extension.length === 0) {
                delete finalExpression.valueExpression.extension;
              }
            }
          }
        }
      }
    }

    if (this.linkIdContext !== undefined && this.linkIdContext !== null && this.linkIdContext !== '') {
      // Treat the final expression as an added variable since it needs to go after the variables added
      this.insertExtensions(fhir, fhir.item, this.linkIdContext, variablesPresentInitially, variablesAdded.concat(finalExpression));
    } else {
      this.insertExtensions(fhir, fhir.item, this.linkIdContext, variablesPresentInitially, variablesAdded);
    }

    // If there are any query observation extensions check to make sure there is
    // a patient launch context. If there is not add one.
    const hasQueryObservations = this.variables.find((e) => {
      return e.type === 'queryObservation';
    });

    if (hasQueryObservations !== undefined) {
      let patientLaunchContext;

      if (fhir?.extension) {
        patientLaunchContext = fhir.extension.find((extension) => {
          if (extension.url === this.LAUNCH_CONTEXT_URI &&
            Array.isArray(extension.extension)) {
            const patientName = extension.extension.find((subExtension) => {
              return subExtension.url === 'name' && subExtension.valueId === 'patient';
            });

            if (patientName !== undefined) {
              return true;
            }
          }

          return false;
        });
      }

      if (patientLaunchContext === undefined) {
        // Add launchContext
        if (!Array.isArray(fhir.extension)) {
          fhir.extension = [];
        }

        const name = 'patient';
        const type = 'Patient';
        const description = 'For filling in patient information as the subject for the form';

        fhir.extension.push({
          url: this.LAUNCH_CONTEXT_URI,
          extension: [
            { url: 'name', valueId: name },
            { url: 'type', valueCode: type },
            { url: 'description', valueString: description }
          ]
        });

        // Check to see if the uneditable variable already exists. Add to
        // uneditableVariables if not.
        const exists = (u) => u.name === name && u.type === type;
        if (!this.uneditableVariables.some(exists)) {
          this.uneditableVariables.push({
            name,
            type,
            description
          });

          this.uneditableVariablesChange.next(this.uneditableVariables);
        }
      }
    }

    return fhir;
  }

  /**
   * Given an extension array, find an extension based on the URI and update the
   * value for the type. If one does not exist add it to the extension list
   * @param extension - Extension array
   * @param uri - URI to search for
   * @param type - Type of value
   * @param value - Value
   * @private
   */
  private findOrAddExtension(extension, uri, type, value): void {
    if (extension instanceof Array) {
      const index = extension.findIndex((e) => e.url === uri);
      const extensionToAdd = {
        url: uri,
        ['value' + type]: value
      };

      if (index === -1) {
        extension.push(extensionToAdd);
      } else {
        extension[index] = extensionToAdd;
      }
    }
  }

  /**
   * Takes FHIR questionnaire definition and a linkId and returns the FHIR
   * Questionnaire with a calculated expression at the given linkId which sums up
   * all the ordinal values in the questionnaire
   * @param questionnaire - FHIR Questionnaire
   * @param linkId - Question linkId
   */
  addTotalScoreRule(questionnaire, linkId): object {
    this.fhir = questionnaire;
    this.linkIdContext = linkId;
    return this.addSumOfScores();
  }

  /**
   * Get a list of item ids based on the logic for `addSumOfScores()`
   * @param items - Questionnaire items
   * @param linkId - link id of the total score item
   * @return Array of score item link ids
   */
  getScoreItemIds(items, linkId: string): string[] {
    let scoreItemIds = [];

    for (const item of items) {
      // Repeating items are currently not supported
      if (item.repeats) {
        continue;
      }

      if (item.linkId === linkId) {
        // Do not consider items at or below the linkId context required
        break;
      } else if (this.hasExpressionEditorExtension(item)) {
        // If the current item is already a score calculation or this is
        // repeating we should not consider it or any items above
        scoreItemIds = [];
      } else if (this.itemHasScore(item)) {
        scoreItemIds.push(item.linkId);
      }

      // Work with nested items
      if (item.item) {
        scoreItemIds = scoreItemIds.concat(
          this.getScoreItemIds(item.item, linkId));
      }
    }
    return scoreItemIds;
  }

  /**
   * Build up the item where condition expressions to be used in the scoring expression. One noticable
   * difference between items not in a group and items in a group is the generated expression.
   * In the case of items in a group, the where condition starts from the top node item and
   * works its way down the tree to the destination node.
   * An alternative approach is to use "repeat(item).where(linkId = 'xxx')" syntax. However, it may
   * lead to a potential performance impact when searching through a large number of items.
   * @param items - Questionnaire items
   * @param linkId - link id of the total score item
   * @return Array of WhereConditionExpression object(s) which consist of
   *         - itemQuery - query to select the item
   *         - answerOptionQuery - query to select a sub-item answer from the answer of the main item.
   */
  composeItemsWhereConditionExpressions(items, linkId: string): WhereConditionExpression[] {
    const expressions = [];
    for (const item of items) {
      if (item.linkId === linkId) {
        // Do not consider items at or below the linkId context required
        break;
      } else if (this.itemHasScore(item)) {
        if (this.itemLinkIdsForCalculation && this.itemLinkIdsForCalculation.length > 0 &&
          this.itemLinkIdsForCalculation.includes(item.linkId)) {

          const expression = {
            "itemQuery": ".item.where(linkId = '" + item.linkId + "')",
            "answerOptionQuery": ".item.where(linkId = '" + item.linkId + "')"
          }
          expressions.push(expression);
        }
      }

      if (item.item) {
        const childExpressions = this.composeItemsWhereConditionExpressions(item.item, linkId);
        if (childExpressions.length > 0) {
          childExpressions.forEach((childExpression) => {
            const typeChoice = (item.type !== "group") ? ".answer" : "";
            const expression = {
              "itemQuery": ".item.where(linkId = '" + item.linkId + "')" + childExpression.itemQuery,
              "answerOptionQuery": ".item.where(linkId = '" + item.linkId + "')" + typeChoice + childExpression.answerOptionQuery
            }
            expressions.push(expression);
          });
        }
      }
      // Repeating items are currently not supported
      if (item.repeats) {
        continue;
      }
    }

    return expressions;
  }

  /**
   * Construct scoring expressions for variables to be used in the scoring calculation. The
   * scoring expression is used to retrieve the "score" (valueDecimal) for the given item.
   * @param items - Questionnaire items
   * @param linkId - link id of the total score item
   * @return Array of scoring expressions
   */
  composeScoringItemsExpressions(items, linkId: string): string[] {
    // Retrieve itmes where expressions
    const itemExpressions = this.composeItemsWhereConditionExpressions(items, linkId);
    const scoreExpressions = itemExpressions.map((e) => {
      return `%questionnaire${e.itemQuery}.answerOption` +
        `.where(valueCoding.code=%resource${e.answerOptionQuery}.answer.valueCoding.code).extension` +
        `.where(url='http://hl7.org/fhir/StructureDefinition/ordinalValue').valueDecimal`;
    });

    return scoreExpressions;
  }

  /**
   * Given the current FHIR questionnaire definition and a linkId return a new FHIR
   * Questionnaire with a calculated expression at the given linkId which sums up
   * all the ordinal values in the questionnaire:
   *  * Assume scored items are above (in question order) the total score item.
   *  * If a preceding item is also a total score item, don’t consider any earlier items.
   */
  addSumOfScores(): any {
    const fhir = this.fhir;
    const linkIdContext = this.linkIdContext;

    const variableNames = [];
    const scoreExpressions = this.composeScoringItemsExpressions(fhir.item, linkIdContext);

    // Get as many short suggested variable names as we have score questions
    scoreExpressions.forEach(() => {
      variableNames.push(this.getNewLabelName(variableNames));
    });

    const scoreQuestions = scoreExpressions.map((e, i) => {
      return {
        url: this.VARIABLE_EXTENSION,
        valueExpression: {
          name: variableNames[i],
          language: this.LANGUAGE_FHIRPATH,
          expression: e,
          extension: [{
            url: ExpressionEditorService.SCORE_VARIABLE_EXTENSION,
            valueBoolean: true
          }]
        }
      };
    });

    const anyQuestionAnswered = {
      url: this.VARIABLE_EXTENSION,
      valueExpression: {
        name: 'any_questions_answered',
        language: this.LANGUAGE_FHIRPATH,
        expression: variableNames.map((e) => `%${e}.exists()`).join(' or '),
        extension: [{
          url: ExpressionEditorService.SCORE_VARIABLE_EXTENSION,
          valueBoolean: true
        }]
      }
    };

    const sumString = variableNames.map((e) => `iif(%${e}.exists(), %${e}, 0)`).join(' + ');
    const totalCalculation = {
      url: this.CALCULATED_EXPRESSION_URI,
      valueExpression: {
        description: 'Total score calculation',
        language: this.LANGUAGE_FHIRPATH,
        expression: `iif(%any_questions_answered, ${sumString}, {})`,
        extension: [{
          url: ExpressionEditorService.SCORE_EXPRESSION_EXTENSION_LINKIDS,
          valueString: JSON.stringify(this.itemLinkIdsForCalculation)
        }]
      }
    };

    scoreQuestions.push(anyQuestionAnswered);
    // @ts-ignore
    scoreQuestions.push(totalCalculation);

    this.insertExtensions(fhir, fhir.item, linkIdContext, [], scoreQuestions);

    return fhir;
  }

  /**
   * Returns extension that contain a score expression
   * @param extension - array of valueExpression extensions
   * @return score expression extension
   */
  private getScoreExpressionExtension(extension): any {
    return extension.find((e) =>
      e.url === ExpressionEditorService.SCORE_EXPRESSION_EXTENSION_LINKIDS);
  }

  /**
   * Get selected item link ids for scoring calculation
   * @param items - Questionnaire item array
   * @param linkId - link id of the total score item
   * @return Array of selected items link ids or empty array
   */
  private getSelectedLinkIdsForScoring(items, linkId): any {
    let resultLinkIds = [];
    if (linkId === undefined || linkId === null || linkId === '') {
      return resultLinkIds;
    } else {
      // loop through each items to look for matching linkId item.
      for (const item of items) {
        if (item.linkId === linkId) {
          if (item.extension) {
            for (const extension of item.extension) {
              if (extension.valueExpression && extension.valueExpression.extension &&
                extension.valueExpression.extension.length > 0) {
                const tmp = this.getScoreExpressionExtension(extension.valueExpression.extension);
                if (tmp?.valueString !== undefined) {
                  resultLinkIds = JSON.parse(tmp.valueString);
                  break;
                }
              }
            };
          }
        // if item contains sub-items
        } else if (item.item) {
          const ext = this.getSelectedLinkIdsForScoring(item.item, linkId);
          if (Array.isArray(ext) && ext.length > 0) {
            resultLinkIds = ext;
            break;
          }
        }
      };

      return resultLinkIds;
    }
  }

  /**
   * Returns linkIds of selected items for scoring calculation
   * @param items - Questionnaire items
   * @param linkId - link id of the total score item
   * @return Array of selected items link ids or empty array
   */
  getSelectedScoringLinkIds(items, linkId: string = this.linkIdContext): any {
    return this.getSelectedLinkIdsForScoring(items, linkId);
  }

  /**
   * Checks if the referenced Questionnaire item is a score calculation added by
   * the Expression Editor
   * @param questionnaire - FHIR Questionnaire
   * @param linkId - Questionnaire item Link ID to check, if not provided check
   * all items on the questionnaire
   * @return True if the question at link id is a score calculation created by
   * the Expression Editor, false otherwise
   */
  isScoreCalculation(questionnaire, linkId?): boolean {
    const checkForScore = (item) => {
      if (linkId === undefined || linkId === item.linkId) {
        const isScore = this.hasExpressionEditorExtension(item);
        if (isScore) {
          return true;
        }
      }

      if (item.item) {
        const subItemHasScore = item.item.find((subItem) => checkForScore(subItem));
        if (subItemHasScore) {
          return true;
        }
      }

      return false;
    };

    return !!questionnaire.item.find((item) => checkForScore(item));
  }

  /**
   * Validate if the current item has a custom Expression Editor score extension
   * (indicating it was previously modified by the Expression Editor)
   * @param item
   * @return Returns true if the current item has a custom Expression Editor score extension
   * @private
   */
  private hasExpressionEditorExtension(item): boolean {
    if (item.extension) {
      return item.extension.find((extension) => !!this.isExpressionEditorExtension(extension));
    } else {
      return false;
    }
  }

  /**
   * Updates a FHIR questionnaire score calculation on the item identified by
   * the link id
   * @param questionnaire - FHIR Questionnaire
   * @param linkId - Questionnaire item Link ID to update
   * @return Questionnaire with updated calculation
   */
  updateScoreCalculation(questionnaire, linkId): object {
    this.removeSumOfScores(questionnaire, linkId);
    return this.addTotalScoreRule(questionnaire, linkId);
  }

  /**
   * Removes score calculations added by the Expression Editor on the entire
   * questionnaire or on a specific item
   * @param questionnaire - FHIR Questionnaire
   * @param linkId - Questionnaire item Link ID where to remove score. If empty
   * try to remove scores from all items.
   * @return Questionnaire without the score calculation variable and expression
   */
  removeSumOfScores(questionnaire, linkId?): any {
    this.fhir = questionnaire;

    const removeItemScoreVariables = (item) => {
      if (linkId === undefined || linkId === item.linkId) {
        item.extension = item.extension.filter((extension) => !this.isExpressionEditorExtension(extension));
      }

      if (item.item) {
        item.item.forEach((subItem) => removeItemScoreVariables(subItem));
      }
    };

    this.fhir.item.forEach(removeItemScoreVariables);

    return this.fhir;
  }

  /**
   * Validate if the extension has an extension for calculating score
   * @param extension - FHIR Extension object
   * @return True if the extension has an extension for calculating score false otherwise
   * @private
   */
  private isExpressionEditorExtension(extension): boolean {
    if (extension.valueExpression && extension.valueExpression.extension &&
      extension.valueExpression.extension.length) {
      return !!extension.valueExpression.extension.find(e => e &&
        (e.url === ExpressionEditorService.SCORE_VARIABLE_EXTENSION ||
          e.url === ExpressionEditorService.SCORE_EXPRESSION_EXTENSION ||
          e.url === ExpressionEditorService.SCORE_EXPRESSION_EXTENSION_LINKIDS));
    } else {
      return false;
    }
  }

  private insertExtensions(fhir, items, linkId, variablesPresentInitially, variablesAdded): void {
    if (linkId === undefined || linkId === null || linkId === '') {
      addOrInsertExtensions(fhir);
    } else {
      for (const item of items) {
        if (item.linkId === linkId) {
          addOrInsertExtensions(item);

          break;
        } else if (item.item) {
          this.insertExtensions(fhir, item.item, linkId, variablesPresentInitially, variablesAdded);
        }
      }
    }

    function addOrInsertExtensions(item): void {
      if (item.extension) {
        // Introduce variables present before
        item.extension = item.extension.concat(variablesPresentInitially);
        // Sort by index
        item.extension.sort((a, b) => a.__$index - b.__$index);
        // Add variables added by the user
        item.extension = item.extension.concat(variablesAdded);
      } else {
        item.extension = variablesPresentInitially.concat(variablesAdded);
      }

      // Remove __$index
      item.extension = item.extension.map(({ __$index, ...other }) => other);
    }
  }

  /**
   * Update the expression for a question due to changes in the question or unit
   * @param linkId - Question linkId
   * @param itemHasScore - Answer has an ordinalValue extension
   * @param convertible - Units can be converted
   * @param unit - Base units
   * @param toUnit - Destination units
   * @param expression - question expression
   * @return expression based on matching criteria
   */
  updateValueOrScoreExpression(linkId: string, itemHasScore: boolean, convertible: boolean, unit: string,
                               toUnit: string, expression: string): string {
    if (itemHasScore) {
      return `%questionnaire.item.where(linkId = '${linkId}').answerOption` +
        `.where(valueCoding.code=%resource.item.where(linkId = '${linkId}').answer.valueCoding.code).extension` +
        `.where(url='http://hl7.org/fhir/StructureDefinition/ordinalValue').valueDecimal`;
    } else if (convertible && unit && toUnit) {
      const factor = UNIT_CONVERSION[unit].find((e) => e.unit === toUnit).factor;
      return `%resource.item.where(linkId='${linkId}').answer.value*${factor}`;
    } else {
      const matches = expression.match(this.QUESTION_REGEX);
      if (!convertible && matches && matches[2] && matches[1] === linkId)
        return `%resource.item.where(linkId='${linkId}').answer.value*${matches[2]}`;

      return `%resource.item.where(linkId='${linkId}').answer.value`;
    }
  }

  /**
   * Obtain a list of items containing answers with the ordinal value (score/itemWeight)
   * extension that can be used for scoring calculation
   * @param items - Questionnaire item array
   * @param linkId - link id of the total score item
   * @param level - item hierarchy level
   * @return Scoring object which consist of
   *         - foundLinkId : a flag to indicate whether the given linkId has been found
   *         - scoreItems : array of scoring items
   */
  getScoreItems(items, linkId: string = this.linkIdContext, level = 0): Scoring {
    const sItems = copy(items);
    let foundLinkId = false;
    let scoreItems = [];

    for (const item of sItems) {
      // Repeating items are currently not supported
      if (item.repeats) {
        continue;
      }

      if (item.linkId === linkId) {
        // Do not consider items at or below the linkId context required
        foundLinkId = true;
        break;
      } else if (this.hasExpressionEditorExtension(item)) {
        // If the current item is already a score calculation or this is
        // repeating we should not consider it or any items above
        scoreItems = [];
      }

      // Work with nested items
      if (item.item) {
        const childScoreItem = this.getScoreItems(item.item, linkId, level + 1);

        foundLinkId = childScoreItem.foundLinkId;
        const childScoreItems = childScoreItem.scoreItems;

        if (childScoreItems && childScoreItems.length > 0) {
          const childHasScore = childScoreItems.length > 0;
          item.item = childScoreItems;

          let parentHasScore = false;

          if (item.type === 'choice' && this.itemHasScore(item)) {
            parentHasScore = true;
            item['hasScore'] = true;
          }

          if (parentHasScore || childHasScore)
            scoreItems.push(item);

        } else {
          item.item = [];
          if (this.itemHasScore(item)) {
            item['hasScore'] = true;
            scoreItems.push(item);
          }
        }

        if (foundLinkId)
          break;
      } else if (this.itemHasScore(item)) {
        item['hasScore'] = true;
        scoreItems.push(item);
      }
    }

    return { foundLinkId, scoreItems };
  }

  /**
   * Set selected item link ids for Scoring Calculation
   * @param linkIds - array of selected scoring item link ids
   */
  setItemLinkIdsForTotalCalculation(linkIds: string[]): void {
    this.itemLinkIdsForCalculation = linkIds;
  }

  /**
   * Determine whether the expression uri is a calculated expression
   * @param expressionUri - URI of expression extension on linkIdContext question
   *  to extract and modify
   * @return true if the expression is a calculated expression
   */
  isCalculatedExpression(expressionUri: string): boolean {
    return (expressionUri === this.CALCULATED_EXPRESSION_URI);
  }

  /**
   * Determine whether the expression uri is an answer expression
   * @param expressionUri - URI of expression extension on linkIdContext question
   *  to extract and modify
   * @return true if the expression is an answer expression
   */
  isAnswerExpression(expressionUri: string): boolean {
    return (expressionUri === this.ANSWER_EXPRESSION_URI);
  }

  /**
   * Extracts the type keyword (such as 'enableWhen', 'initial', 'calculated', or 'answer')
   * from a FHIR extension URI that ends with 'sdc-questionnaire-<Type>Expression'.
   * Returns the extracted type as a string, or null if the input does not match the expected pattern.
   * Useful for dynamically identifying the kind of expression extension based on its URI.
   * @param expressionUri - The FHIR extension URI string
   * @returns The extracted type keyword or null
   */
  getExpressionType(expressionUri: string): string | null {
    if (typeof expressionUri !== 'string') return null;
    // Match any prefix ending with sdc-questionnaire-<Type>Expression
    const match = expressionUri.match(/sdc-questionnaire-([a-zA-Z]+)Expression$/);
    return match ? match[1] : null;
  }

  /**
   * Determine if the given item has a calculated expression that is not extended with
   * our custom total score extension.
   * @param item - FHIR Item
   * @return true if the calculated expression is found and does not contain the new
   * scoring extension
   */
  hasStandardCalculatedExpressionForItem = (item) => {
    const scoreExtension = item.extension.find((extension) => extension.url === this.CALCULATED_EXPRESSION_URI);
    if (scoreExtension && scoreExtension.valueExpression) {
      const newScoringExtension = (scoreExtension.valueExpression.extension &&
        scoreExtension.valueExpression.extension.some((ext) =>
          ext.url === ExpressionEditorService.SCORE_EXPRESSION_EXTENSION_LINKIDS
        )
      );
      return !newScoringExtension;
    }

    return false;
  };

  /**
   * Find an item from the Questionnaire items array by the linkId
   * @param items - Questionnaire item array
   * @param linkIdContext - link id of the selected item
   * @return the item if found; otherwise, undefined
   */
  findItemById(items, linkIdContext: string): any {
    let result = undefined;

    for (const item of items) {
      if (linkIdContext === undefined || linkIdContext === item.linkId) {
        result = item;
        break;
      }
      if (item.item) {
        const subItem = this.findItemById(item.item, linkIdContext);
        if (subItem) {
          result = subItem;
          break;
        }
      }

    }
    return result;
  };

  /**
   * Determine if the selected question has a calculated expression that does not have
   * our custom extension.
   * @param questionnaire - FHIR Questionnaire
   * @param linkIdContext - link id of the selected item
   * @return true if the calculated expression does not contain the new scoring extension.
   * The prompt for calculating the sum of scores will not be displayed as a result.
   */
  hasStandardCalculatedExpression(questionnaire, linkIdContext: string): boolean {
    const item = this.findItemById(questionnaire.item, linkIdContext);
    const res = (item) ? this.hasStandardCalculatedExpressionForItem(item) : false;
    return res;
  }

  /**
   * Determine if the selected item contains scoring items
   * @param items - Questionnaire item array
   * @param linkIdContext - link id of the selected item
   * @return true if has scoring items
   */
  hasCalculatedScoringItems(items, linkIdContext: string): boolean {
    const scoreItemResult = this.getScoreItems(items, linkIdContext);
    return (scoreItemResult.scoreItems.length > 0);
  }

  /**
   * Determine whether the scoring calculation should be prompted/calculated for the selected item.
   * - The selected item expressionUri must be of type calculatedExpression.
   * - The selected item must have scoring items for the calculation. The scoring items are determined
   *   from items prior to the selected item.  So if the first question is selected, then it will not
   *   get a prompt for score calculation.
   * - The selected item must not contain the standard implementation of the pre-selected scoring items
   *   (missing the new scoring extension).
   * @param questionnaire - FHIR Questionnaire
   * @param linkIdContext - link id of the selected item
   * @param expressionUri - Expression to process
   * @return true if the scoring calculation prompt should not be displayed
   */
  shouldCalculateScoreForItem(questionnaire, linkIdContext: string, expressionUri: string): boolean {
    // Should only calculate if the Output Expression is calculatedExpression
    const hasCalculatedOutputExpression = this.isCalculatedExpression(expressionUri);

    let shouldCalculateScore = false;

    if (hasCalculatedOutputExpression &&
      this.hasCalculatedScoringItems(questionnaire.item, linkIdContext) &&
      !this.hasStandardCalculatedExpression(questionnaire, linkIdContext))
      shouldCalculateScore = true;

    this.doNotAskToCalculateScore = !shouldCalculateScore;
    return shouldCalculateScore;
  }

  /**
   * Performs URL decode.  Returns input str as is if URL decode failed.
   * @param str - input url string
   * @private
   */
  private getDecodeURI(str) {
    try {
      return decodeURIComponent(str);
    } catch (e) {
      return str;
    }
  }

  /**
   * Decode the Query URL expression.  This supports the query that was saved
   * prior to this change (without URL encoded, just the %2C) and the new
   * URL encoded string
   * @param expression - Encoded expression
   * @return Decoded URL expression string
   */
  decodeQueryURIExpression(expression: string): string {
    const decodedParams: string[] = [];
    const resourceArr = (typeof expression === 'string') ? expression.split("?") : [];
    let queryString = resourceArr.length > 0 ? resourceArr[0] : '';

    if (resourceArr.length > 1) {
      const queryParams = resourceArr[1].split('&');

      queryParams.forEach((queryParam) => {
        const param = queryParam.split('=');
        const paramKey = this.getDecodeURI(param[0]);
        const paramVal = this.getDecodeURI(param[1]);

        decodedParams.push(`${paramKey}=${paramVal}`);
      });
      queryString += '?' + decodedParams.join('&');
    }
    return queryString;
  }

  /**
   * Checks if all specified keys are present in the given object.
   * @param obj - The object to check for keys
   * @param keys - An array of keys to check for
   * @returns True if all keys are present in the object, otherwise false
   */
  hasAllProperties(obj: any, keys: string[]): boolean {
    for (const key of keys) {
      if (!(key in obj)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Decode the Query URL expression for FHIR Query Qbservation.
   * @param expression - FHIR query expression
   * @returns Returns an object if all specified keys are present, otherwise null
   */
  decodeFHIRQueryObservationURIExpression(expression: string): Record<string, string> | null {
    const decodedParams: Record<string, string> = {};
    const resourceArr = expression.split("?");
    const queryString = resourceArr[0];

    if (queryString !== "Observation")
      return null;

    if (resourceArr.length > 1) {
      const queryParams = resourceArr[1].split('&');
      queryParams.forEach((queryParam) => {
        const param = queryParam.split('=');
        const paramKey = this.getDecodeURI(param[0]);
        const paramVal = this.getDecodeURI(param[1]);

        if (paramVal)
          decodedParams[paramKey] = paramVal;
      });
    }
    return (this.hasAllProperties(decodedParams, ExpressionEditorService.FHIR_QUERY_OBS_FIELDS)) ? decodedParams : null;
  };

  /**
   * Parse FHIR Query expression with parameters in any order.
   * @param expression - FHIR query expression
   * @returns array result that contains the expression, codes,
   * time interval, and time interval unit, or an empty array.
   * If not all the required keys are present, the
   * decodeFHIRQueryObservationURIExpression function returns null,
   * resulting in an empty array being returned.
   */
  getFHIRQueryObservationMatches(expression: string): string[] {
    const obs = [];
    const decodedParams = this.decodeFHIRQueryObservationURIExpression(expression);

    if (!decodedParams)
      return obs;

    const dateMatches = decodedParams['date'].match(this.QUERY_DATE_REGEX);

    if (dateMatches && dateMatches.length === 3) {
      const timeInterval = dateMatches[1];
      const timeIntervalUnits = dateMatches[2];
      obs.push(expression);
      obs.push(decodedParams['code']);
      obs.push(timeInterval);
      obs.push(timeIntervalUnits);
    }

    return obs;
  }

  /**
   * Validate the paramValue has valid double braces syntax.
   * @param paramValue - URL param value
   * @return True if no opening and closingdouble braces found
   *         True if matching opening and closing double braces found
   *         False if an opening or closing double braces is not found
   *         False if a closing double brace occurs before an opening double brace
   *         False if double braces are found to be nested within each other
   */
  isValidDoubleBracesSyntax(paramValue: string): boolean {
    const not_done = true;
    let indexLoc = 0;
    while (not_done) {
      const openDblBracesIdx = paramValue.indexOf("{{", indexLoc);
      const closeDblBracesIdx = paramValue.indexOf("}}", indexLoc);

      if (openDblBracesIdx === -1 && closeDblBracesIdx === -1)
        return true;
      else if (openDblBracesIdx === -1 || closeDblBracesIdx === -1)
        return false;
      else {
        if (closeDblBracesIdx < openDblBracesIdx)
          return false;

        const nextOpenDblBracesIdx = paramValue.indexOf("{{", openDblBracesIdx + 2);
        if (nextOpenDblBracesIdx === -1)
          return true;
        else if (nextOpenDblBracesIdx < closeDblBracesIdx)
          return false;

        indexLoc = closeDblBracesIdx + 2;
      }
    }
  };


  /**
   * Perform URL encode while ignoring the {{}} and the content inside.
   * @param paramValue - URL param value
   * @return URL-encoded paramValue if paramValue contains no opening and closing double braces
   *         URL-encoded paramValue if paramValue contains the correct order and number of
   *           opening and closing double braces.  URL encode only the portions of the string
   *           that are not enclosed in dobule braces
   *         Non URL-encoded paramValue if the string starts with an opening double brace and
   *           ends with a closing double brace
   *         Non URL-encoded paramValue if the count number of opening double braces does not
   *           match the count number of the closing double braces
   *         Non URL-encoded paramValue if the result from the isValidDoubleBracesSyntax
   *           function is "false"
   */
  encodeParamValue(paramValue: string): string {
    if (!paramValue)
      return "";
    const openDblBracesCount = (paramValue.match(/{{/g) || []).length;
    const closeDblBracesCount = (paramValue.match(/}}/g) || []).length;

    if (openDblBracesCount === 0 && closeDblBracesCount === 0) {
      return encodeURIComponent(paramValue);
    } else if (openDblBracesCount === 1 && closeDblBracesCount === 1 &&
      paramValue.startsWith("{{") && paramValue.endsWith("}}")) {
      return paramValue;
    } else if (openDblBracesCount !== closeDblBracesCount) {
      // if the number of open and close are not equal, we are just going to return as is
      return paramValue;
    } else if (!this.isValidDoubleBracesSyntax(paramValue)) {
      return paramValue;
    } else {
      let tmpStr = '';
      let indexLoc = 0;
      for (let i = 0; i < openDblBracesCount; i++) {
        const openDblBracesIdx = paramValue.indexOf("{{", indexLoc);
        const closeDblBracesIdx = paramValue.indexOf("}}", openDblBracesIdx);

        if (openDblBracesIdx > indexLoc)
          tmpStr += encodeURIComponent(paramValue.substring(indexLoc, openDblBracesIdx));
        tmpStr += paramValue.substring(openDblBracesIdx, closeDblBracesIdx + 2);

        indexLoc = closeDblBracesIdx + 2;
      }

      if (indexLoc < paramValue.length)
        tmpStr += encodeURIComponent(paramValue.substring(indexLoc));
      return tmpStr;
    }
  };

  /**
   * Encode the Query URL expression.  If the input does not match
   * with QUERY_REGEX, then return as is.
   * @param expression - url expression
   * @return Encoded URL expression string
   */
  encodeQueryURIExpression(expression: string): string {
    const encodedParams: string[] = [];
    const resourceArr = expression.split("?");
    let queryString = resourceArr[0];
    if (resourceArr.length > 1 && resourceArr[1] !== "") {
      const queryParams = resourceArr[1].split('&');

      queryParams.forEach((queryParam) => {
        const param = queryParam.split('=');
        if (param.length > 1 && param[1] !== "") {
          const encodedKey = encodeURIComponent(param[0]);
          const encodedValue = this.encodeParamValue(param[1]);

          encodedParams.push(`${encodedKey}=${encodedValue}`);
        }
      });
      if (encodedParams.length > 0)
        queryString += '?' + encodedParams.join('&');

    }
    return queryString;
  };

  /**
   * Get uneditable and editable variable names
   */
  getVariableNames(): string[] {
    return this.uneditableVariables.map(e => e.name).concat(
      this.variables.map(e => e.label));
  };

  /**
   * Generate a validation result to notify subscribers. If the result.hasError is false, the 'Save' button
   * is enabled; othewise, the 'Save' button is disabled.
   * @param param - contains the section, field information along with any other optional fields
   * @param result - result of the validation.  Null if there is no error or object containing the
   *                 validation error, error message, and aria error message.
   */
  notifyValidationResult(param: ValidationParam, result: any): void {
    if (param.section === SectionTypes.ItemVariables) {
      // In the Item Variables Section, there are 2 fields: name and expression
      if (this.itemVariablesErrors.length > 0) {
        const tmpItemVariableError = { ...this.itemVariablesErrors[param.index] };

        if (param.field === "expression") {
          tmpItemVariableError[param.field] = {
            type: (result && Object.prototype.hasOwnProperty.call(result, 'invalidExpressionWarning')) ? "warning" : "error",
            status: (result) ? true : false
          };
        } else {
          tmpItemVariableError[param.field] = (result) ? true : false;
        }
        this.itemVariablesErrors[param.index] = tmpItemVariableError;
      }

    } else if (param.section === SectionTypes.OutputExpression) {
      if (param.field === "expression") {
        this.outputExpressionError = (result && !Object.prototype.hasOwnProperty.call(result, 'invalidExpressionWarning')) ? true : false;
        this.outputExpressionWarning = (result && Object.prototype.hasOwnProperty.call(result, 'invalidExpressionWarning')) ? true : false;
        this.caseStatementError = false;
        this.caseStatementWarning = false;
      } else if (param.field === "case") {
        this.outputExpressionError = false;
        this.outputExpressionWarning = false;
        this.caseStatementError = (result && Object.prototype.hasOwnProperty.call(result, 'CaseStatementError')) ? result.CaseStatementError : false;
        this.caseStatementWarning = (result && Object.prototype.hasOwnProperty.call(result, 'CaseStatementWarning')) ? result.CaseStatementWarning : false;
      }
    }

    setTimeout(() => {
      this.validationChange.next(this.getValidationResult());
    }, 100);
  };

  /**
   * Notifies all subscribed components to perform validation check.
   */
  notifyValidationCheck(): void {
    this.performValidationChange.next(true);
  }

  /**
   * Check for validation errors in both the 'Item Variables' and the 'Output Expression' sections. The
   * validation errors include blank fields and invalid reference expressions.
   * @return true if any error occurs in either the 'Item Variables' section or the 'Output Expression' section
   */
  hasValidationErrors(): boolean {
    return (
      this.itemVariablesErrors.some(
        item => (item.name === true || (item.expression.type === "error" && item.expression.status === true) || item.timeInterval === true)) ||
      this.outputExpressionError ||
      this.caseStatementError
    );
  };

  /**
   * Check for validation warnings in both the 'Item Variables' and the 'Output Expression' sections. The
   * validation warnings include expressions that may contain launch context variables that may not have
   * been defined.
   * @return true if any warning occurs in either the 'Item Variables' section or the 'Output Expression' section
   */
  hasValidationWarning(): boolean {
    return (
      this.itemVariablesErrors.some(
        item => (item.expression.type === "warning" && item.expression.status === true)) ||
      this.outputExpressionWarning ||
      this.caseStatementWarning
    );
  };

  /**
   * Get the validation result based on the validation in both the 'Item Variables' and the 'Output Expression'
   * sections.
   * @return ValidationResult object containing result from the validation
   */
  getValidationResult(): ValidationResult {
    return {
      "hasError": this.hasValidationErrors(),
      "errorInItemVariables": this.itemVariablesErrors.some(
        item => (item?.name === true || (item?.expression.type === "error" && item?.expression.status === true) || item?.timeInterval === true)),
      "errorInOutputExpression": this.outputExpressionError,
      "errorInOutputCaseStatement": this.caseStatementError,
      "hasWarning": this.hasValidationWarning(),
      "warningInItemVariables": this.itemVariablesErrors.some(
        item => (item?.expression.type === "warning" && item?.expression.status === true)),
      "warningInOutputExpression": this.outputExpressionWarning,
      "warningInOutputCaseStatement": this.caseStatementWarning
    };
  };

  /**
   * Reset the validation errors. This function gets called when the questionnaire, question,
   * or output expression changes.
   */
  resetValidationErrors(): void {
    this.itemVariablesErrors = [];
    this.outputExpressionError = false;

    this.caseStatementError = false;

    this.outputExpressionWarning = false;
    this.caseStatementWarning = false;
  };

  /**
   * Handles the validation error list for variables when a variable is being moved.
   * @param previousIndex - current index
   * @param currentIndex- new index
   */
  moveItemInVariableItemsErrors(previousIndex: number, currentIndex: number): void {
    moveItemInArray(this.itemVariablesErrors, previousIndex, currentIndex);
  };

  /**
   * Get uneditable variable names
   * @return Array of uneditable variable names
   */
  getCurrentContextUneditableVariableNames(): string[] {
    return this.uneditableVariables.map(e => e.name)
  }

  /**
   * Get editable variable names
   * @return Array of variable names
   */
  getCurrentContextVariableNames(): string[] {
    return this.variables.map(e => e.label)
  }

  /**
   * Reference: https://build.fhir.org/ig/HL7/sdc/expressions.html#extract-extensions
   * Compose the object that contains context variable names and environment variable names
   * as keys used by fhirpath.js to validate the expression.
   * @return object with context variable names and environment variable names as keys
   */
  getContextVariableNamesForExpressionValidation(): any {
    const names = this.getVariableNames();

    const contextVariables = names.reduce((acc, key) => {
      acc[key] = 1;
      return acc;
    }, {});

    ExpressionEditorService.ENVIRONMENT_VARIABLES.forEach(envVar => {
      contextVariables[envVar] = 1;
    });

    return contextVariables;
  }



  /**
   * Get common launch context variables.
   * @return An object with common launch context variable names as keys.
   */
  getCommonLaunchContext(): any {
    const contextVariables = {};

    ExpressionEditorService.COMMON_LAUNCH_CONTEXT_VARIABLES.forEach(contextVar => {
      contextVariables[contextVar] = 1;
    });

    return contextVariables;
  }
}
