import { AbstractControl, ValidatorFn } from '@angular/forms';
import { ValidationError, ValidationParam, FieldTypes, SectionTypes } from '../lib/variable';
import * as fhirpath from 'fhirpath';
import { EasyPathExpressionsPipe } from '../lib/easy-path-expressions.pipe';
import * as constants from "../lib/validation";

/**
 * Get the error message for the given type and field.
 * @param type - variable type (fhirpath, query, queryObservation, question, simple)
 * @param field - field type (expression or timeInterval)
 * @return required error message for the given type and field
 */
function getRequiredErrorMessage(type, field): string {
  if (type === "question")
    return constants.QUESTION_REQUIRED;
  else if (type === "query")
    return constants.FHIR_QUERY_REQUIRED;
  else if (type === "queryObservation") {
    if (field !== FieldTypes.TimeInterval)
      return constants.FHIR_QUERY_OBSERVATION_REQUIRED;
    else
      return constants.TIME_INTERVAL_REQUIRED;
  }
  else
    return constants.EXPRESSION_REQUIRED;
}

/**
 * Compose the Required error
 * @param type - variable type (fhirpath, query, queryObservation, question, simple)
 * @param field - field type (expression or timeInterval)
 * @returns Required error object
 */
function getRequiredErrorObject(type, field): ValidationError {
  const msg = getRequiredErrorMessage(type, field);
  if (type === "queryObservation" && field === FieldTypes.TimeInterval) {
    return {
      'timeIntervalRequiredError': true,
      'message': msg,
      'ariaMessage': msg
    }
  }

  return {
    'expressionRequiredError': true,
    'message': msg,
    'ariaMessage': msg
  }
}

/**
 * Compose the Invalid Expression error
 * @param invalidVariableName - true if the validation error is in the Output Expression
 *                              section and was caused by the variable name.
 * @returns Invalid expression error object
 */
function getInvalidExpressionErrorObject(invalidVariableName = false): ValidationError {
  return {
    'invalidExpressionError': true,
    'message': constants.INVALID_EXPRESSION,
    'ariaMessage': ( invalidVariableName ) ?
      constants.INVALID_EXPRESSION_OUTPUT : constants.INVALID_EXPRESSION
  }
}

/**
 * Replaces a placeholder in the given message with the specified new variable name.
 *
 * @param message - The original message containing the placeholder.
 * @param newVariableName - The new variable name to insert into the message.
 * @returns The updated message with the new variable name.
 */
function replaceVariableName(message: string, newVariableName: string): string {
  return message.replace(/launch context variable that/, `launch context variable '${newVariableName}' that`);
}

/**
 * Compose the Invalid Expression warning
 * @param variableName - variable name that was used in the expression but may not have been defined.
 * @returns Invalid expression error object
 */
function getExpressionWarningObject(variableName: string): ValidationError {
  return {
    'invalidExpressionWarning': true,
    'message': replaceVariableName(constants.INVALID_LAUNCH_CONTEXT, variableName),
    'ariaMessage': "Warning: " + replaceVariableName(constants.INVALID_LAUNCH_CONTEXT_OUTPUT, variableName)
  }
}
/**
 * Validates the expression for empty or invalid expression.
 * @param param - ValidationParam object that contains must contain at least the section and field
 *                information.
 * @return A validation function that returns an error object if the validation fails, or null otherwise.
 */
export function expressionValidator(param: ValidationParam): ValidatorFn {
  return (control:AbstractControl) : ValidationError | null => {
    if (!control.value && control.dirty) {
      return getRequiredErrorObject(param.type, param.field);
    } else if ((control.value && control.dirty) || (control.value && !control.dirty)) {
      if (param.type === "fhirpath") {
        try {
          // Use fhirpath.js to evaluate the expression.  If exception is thrown, then returns
          // the invalidExpressionError
          fhirpath.evaluate({}, control.value, JSON.parse(param.variableNames));

        } catch(e) {
          try {
            // Add a check to see if the expression contains a launch context variable that might
            // not have been defined. If that is the case, then return a warning.
            fhirpath.evaluate({}, control.value, JSON.parse(param.launchContext));

          } catch(e2) {
            return getInvalidExpressionErrorObject(true);
          }

          // Attempting to access an undefined environment variable: Patient
          const errorMessage = e.message;
          const match = errorMessage.match(/Attempting to access an undefined environment variable: (\w+)/);
          let variableName = '';

          if (match && match[1]) {
            variableName = match[1];
          }

          return getExpressionWarningObject(variableName);
        }
      } else if (param.type === "simple") {
        // Converts the array into string array
        const varStringArr = [];
        for (const v of param.variables) {
          varStringArr.push(v.toString());
        }

        // Perform the conversion from Easy Path Expression to FHIRPath Expression.
        // If the result is 'Not valid' or empty, then return an error.
        const jsToFhirPathPipe = new EasyPathExpressionsPipe();
        const fhirPath: string = jsToFhirPathPipe.transform(control.value, varStringArr);

        if (fhirPath === 'Not valid') {
            // If the failure occurs in the 'Output Expression' section but the
            // expression itself has not been changed, the validation failure
            // likely due to the variable name in the 'Item Variables' section.
            const invalidVariableName = (param.section === SectionTypes.OutputExpression && !control.dirty);
            return getInvalidExpressionErrorObject(invalidVariableName);

        } else if (fhirPath === '') {
          return getRequiredErrorObject(param.type, param.field);
        }
      }
    }

    return null;
  }
}