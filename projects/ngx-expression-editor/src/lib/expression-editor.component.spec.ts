import 'zone.js/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ExpressionEditorComponent } from './expression-editor.component';
import { ValidationResult } from './variable';
import { ENVIRONMENT_TOKEN } from './environment-token';

describe('ExpressionEditorComponent', () => {
  let component: ExpressionEditorComponent;
  let fixture: ComponentFixture<ExpressionEditorComponent>;
  const env = {
    production: true,
    appName: "Expression Editor",
    appTitle: "Expression Editor"
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ExpressionEditorComponent],
      providers: [
        { provide: ENVIRONMENT_TOKEN, useValue: env }
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpressionEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return empty aria message if there is no error in the validation result', () => {
    const validationResult: ValidationResult = {
      hasError: false,
      errorInItemVariables: false,
      errorInOutputExpression: false,
      errorInOutputCaseStatement: false,
      hasWarning: false,
      warningInItemVariables: false,
      warningInOutputExpression: false,
      warningInOutputCaseStatement: false
    }

    expect(component.composeAriaValidationErrorMessage(validationResult)).toEqual("");
  });

  it('should return an aria message if there is an error in the Item Variable section', () => {
    const validationResult: ValidationResult = {
      hasError: true,
      errorInItemVariables: true,
      errorInOutputExpression: false,
      errorInOutputCaseStatement: false,
      hasWarning: false,
      warningInItemVariables: false,
      warningInOutputExpression: false,
      warningInOutputCaseStatement: false
    }

    expect(component.composeAriaValidationErrorMessage(validationResult))
           .toEqual("The 'save' button is disabled due to one or more errors in the Item Variable section.");
  });

  it('should return an aria message if there is an error with the expression in the Output Expression section', () => {
    const validationResult: ValidationResult = {
      hasError: true,
      errorInItemVariables: false,
      errorInOutputExpression: true,
      errorInOutputCaseStatement: false,
      hasWarning: false,
      warningInItemVariables: false,
      warningInOutputExpression: false,
      warningInOutputCaseStatement: false
    }

    expect(component.composeAriaValidationErrorMessage(validationResult))
           .toEqual("The 'save' button is disabled due to one or more errors with the expression in the" +
           " Output Expression section.");
  });

  it('should return an aria message if there is one or more errors with the case statement in the Output Expression section', () => {
    const validationResult: ValidationResult = {
      hasError: true,
      errorInItemVariables: false,
      errorInOutputExpression: false,
      errorInOutputCaseStatement: true,
      hasWarning: false,
      warningInItemVariables: false,
      warningInOutputExpression: false,
      warningInOutputCaseStatement: false
    }

    expect(component.composeAriaValidationErrorMessage(validationResult))
           .toEqual("The 'save' button is disabled due to one or more errors with the case statement in the" +
           " Output Expression section.");
  });

  it('should return an aria message if there are errors in Item Variables and the Output Expression sections', () => {
    const validationResult: ValidationResult = {
      hasError: true,
      errorInItemVariables: true,
      errorInOutputExpression: true,
      errorInOutputCaseStatement: false,
      hasWarning: false,
      warningInItemVariables: false,
      warningInOutputExpression: false,
      warningInOutputCaseStatement: false
    }

    expect(component.composeAriaValidationErrorMessage(validationResult))
           .toEqual("The 'save' button is disabled due to errors in the Item Variable section, and" +
           " with the expression in the Output Expression section.");
  });
});
