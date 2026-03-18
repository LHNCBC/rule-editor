
import { Directive, Input, inject } from '@angular/core';
import {
  AbstractControl,
  Validator,
  ValidationErrors,
  NG_VALIDATORS
} from '@angular/forms';

import { ExpressionEditorService } from '../../lib/expression-editor.service';
import { variableNameValidator } from '../../validators/variableNameValidator';
import { ValidationParam } from '../../lib/variable';

@Directive({
  selector: '[lhcVariableNameValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: VariableNameValidatorDirective,
      multi: true
    }
  ]
})
export class VariableNameValidatorDirective implements Validator {

  @Input() lhcVariableNameValidatorParams!: ValidationParam;

  private expressionEditorService = inject(ExpressionEditorService);

  validate(control: AbstractControl): ValidationErrors | null {
    const result = variableNameValidator(
      this.expressionEditorService,
      this.lhcVariableNameValidatorParams
    )(control);

    this.expressionEditorService.notifyValidationResult(
      this.lhcVariableNameValidatorParams,
      result
    );

    return result;
  }
}
