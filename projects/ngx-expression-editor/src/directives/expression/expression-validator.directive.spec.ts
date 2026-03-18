import { ExpressionValidatorDirective } from './expression-validator.directive';
import { ExpressionEditorService } from '../../lib/expression-editor.service';
import { TestBed } from '@angular/core/testing';
import { EnvironmentInjector, runInInjectionContext } from '@angular/core';

describe('ExpressionValidatorDirective', () => {
  let directive: ExpressionValidatorDirective;
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
      return new ExpressionValidatorDirective();
    });
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });
});
