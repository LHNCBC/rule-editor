import { TestBed } from '@angular/core/testing';
import { VariableNameValidatorDirective } from './variable-name-validator.directive';
import { ExpressionEditorService } from '../../lib/expression-editor.service';
import { EnvironmentInjector, runInInjectionContext } from '@angular/core';

describe('VariableNameValidatorDirective', () => {
  let directive: VariableNameValidatorDirective;
  let mockExpressionEditorService: jasmine.SpyObj<ExpressionEditorService>;

  beforeEach(() => {
    mockExpressionEditorService = jasmine.createSpyObj('ExpressionEditorService', [
      'notifyValidationResult'
    ]);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ExpressionEditorService,
          useValue: mockExpressionEditorService
        }
      ]
    });

    directive = runInInjectionContext(TestBed.inject(EnvironmentInjector), () => {
      return new VariableNameValidatorDirective();
    });
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });
});
