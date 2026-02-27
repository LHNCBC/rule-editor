import * as constants from "../../projects/ngx-expression-editor/src/lib/validation";

describe(Cypress.env("appName"), () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Angular Library', () => {
    describe('Item Variables section', () => {
      it('should display error and disable "Save" button if expression is empty', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression)');

        // The demo has '(/39156-5) selected by default
        cy.get('#question').should('contain.value', '(/39156-5)');
        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();
        // The Expression Editor dialog should now appear
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Add 5 new items
          // Add variable of variable type "FHIRPath Expression"
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 3);
          cy.get('div#row-2').within(() => {
            cy.get('#variable-label-2').clear().type('c_fhirpath_exp');
            cy.get('#variable-type-2').should('have.value', 'question');
            cy.get('#variable-type-2').select('FHIRPath Expression');
          });

          // Add variable of variable type "FHIR Query"
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 4);
          cy.get('div#row-3').within(() => {
            cy.get('#variable-label-3').clear().type('d_fhir_query');
            cy.get('#variable-type-3').select('FHIR Query');
          });

          // Add variable of variable type "FHIR Query (Observation)"
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 5);
          cy.get('div#row-4').within(() => {
            cy.get('#variable-label-4').clear().type('e_fhir_obs');
            cy.get('#variable-type-4').select('FHIR Query (Observation)');

            cy.get('lhc-query-observation').shadow().within(() => {
              // Clear the Time Interval, this should result in the Time Interval
              // textbox highlighted in red.
              cy.get('div.time-input input').clear().should('have.class', 'field-error');
              // And the error message
              cy.get('#expression-error > p')
                .should('contain.text', constants.TIME_INTERVAL_REQUIRED);
            });
          });
          // The 'Save' button should be disabled
          cy.get('#export').should('have.class', 'disabled');
          cy.get('div#row-4').within(() => {
            cy.get('lhc-query-observation').shadow().within(() => {
              // Re-enter the time interval to fix the issue.
              cy.get('div.time-input input').type('1').should('not.have.class', 'field-error');
            });
          });
          // The 'Save' button should be enabled
          cy.get('#export').should('not.have.class', 'disabled');

          // Add variable of variable type "Question"
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 6);
          cy.get('div#row-5').within(() => {
            cy.get('#variable-label-5').clear().type('f_question');
            cy.get('#variable-type-5').should('have.value', 'question');
          });

          // Add variable of variable type "Easy Path Expression"
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 7);
          cy.get('div#row-6').within(() => {
            cy.get('#variable-label-6').clear().type('g_simple');
            cy.get('#variable-type-6').select('Easy Path Expression');
          });

          // Click 'Save', the validation should get triggered to validate each of the expressions
          cy.get('#export').click();

          // All newly added variables should failed
          cy.get('div#row-2').within(() => {
            cy.get('#variable-expression-2').should('have.class', 'field-error');
            cy.get('#expression-error > p').should('contain.text', constants.EXPRESSION_REQUIRED);
          });
          cy.get('div#row-3').within(() => {
            cy.get('#variable-expression-3').should('have.class', 'field-error');
            cy.get('#expression-error > p').should('contain.text', constants.FHIR_QUERY_REQUIRED);
          });
          cy.get('div#row-4').within(() => {
            cy.get('lhc-query-observation').shadow().within(() => {
              cy.get('#autocomplete-4').should('have.class', 'field-error');
              cy.get('#expression-error > p')
                .should('contain.text', constants.FHIR_QUERY_OBSERVATION_REQUIRED);
            });
          });
          cy.get('div#row-5').within(() => {
            cy.get('#question-5').should('have.class', 'field-error');
            cy.get('#expression-error > p').should('contain.text', constants.QUESTION_REQUIRED);
          });
          cy.get('div#row-6').within(() => {
            cy.get('#simple-expression-6').should('have.class', 'field-error');
            cy.get('#expression-error > p').should('contain.text', constants.EXPRESSION_REQUIRED);
          });

          // Enter expressions for each of the newly added variables
          cy.get('#variable-expression-2').type('%a');
          cy.get('#variable-expression-3').type('%a');
          cy.get('lhc-query-observation').shadow().find('#autocomplete-4').type('weight');
        });
        cy.get('span#completionOptions').contains('29463-7').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('div#row-4').within(() => {
            cy.get('lhc-query-observation').shadow().find('div.time-input input').type('1');
          });
          cy.get('#question-5').clear().type('height');
        });
        cy.get('span#completionOptions > ul > li').contains('8302-2').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#simple-expression-6').type('a');

          // There should be no errors
          cy.get('div#row-2').within(() => {
            cy.get('#variable-expression-2').should('not.have.class', 'field-error');
          });
          cy.get('div#row-3').within(() => {
            cy.get('#variable-expression-3').should('not.have.class', 'field-error');
          });
          cy.get('div#row-4').within(() => {
            cy.get('lhc-query-observation').shadow().find('#autocomplete-4').should('not.have.class', 'field-error');
          });
          cy.get('div#row-5').within(() => {
            cy.get('#question-5').should('not.have.class', 'field-error');
          });
          cy.get('div#row-6').within(() => {
            cy.get('#simple-expression-6').should('not.have.class', 'field-error');
          });

          // Click 'Save' again should no longer show any errors
          cy.get('#export').should('not.have.class', 'disabled').click();
        });

        cy.get('pre#output').invoke('text').then((jsonData) => {
          // Parse the JSON data
          const parsedData = JSON.parse(jsonData);

          expect(parsedData.item).to.exist;
          expect(parsedData.item).to.have.lengthOf(5);
          expect(parsedData.item[3].linkId).to.exist;
          expect(parsedData.item[3].linkId).to.have.string('/39156-5');
          expect(parsedData.item[3].extension).to.exist;
          expect(parsedData.item[3].extension).to.have.lengthOf(9);

          // validate FHIRPath Expression variable
          expect(parsedData.item[3].extension[3].valueExpression.name).to.equal('c_fhirpath_exp');
          expect(parsedData.item[3].extension[3].valueExpression.language).to.equal('text/fhirpath');
          expect(parsedData.item[3].extension[3].valueExpression.extension[0].valueString).to.equal('expression');

          // validate FHIR Query variable
          expect(parsedData.item[3].extension[4].valueExpression.name).to.equal('d_fhir_query');
          expect(parsedData.item[3].extension[4].valueExpression.language).to.equal('application/x-fhir-query');
          expect(parsedData.item[3].extension[4].valueExpression.extension[0].valueString).to.equal('query');

          // validate FHIR Query Observation variable
          expect(parsedData.item[3].extension[5].valueExpression.name).to.equal('e_fhir_obs');
          expect(parsedData.item[3].extension[5].valueExpression.language).to.equal('application/x-fhir-query');
          expect(parsedData.item[3].extension[5].valueExpression.extension[0].valueString).to.equal('queryObservation');

          // validate FHIR Query variable
          expect(parsedData.item[3].extension[6].valueExpression.name).to.equal('f_question');
          expect(parsedData.item[3].extension[6].valueExpression.language).to.equal('text/fhirpath');
          expect(parsedData.item[3].extension[6].valueExpression.extension[0].valueString).to.equal('question');

          // validate Easy Path Expression variable
          expect(parsedData.item[3].extension[7].valueExpression.name).to.equal('g_simple');
          expect(parsedData.item[3].extension[7].valueExpression.language).to.equal('text/fhirpath');
          expect(parsedData.item[3].extension[7].valueExpression.extension[0].valueString).to.equal('simple');
        });
      });

      it('should display error and disable "Save" button if clearing out the question autocomplete selection ', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression)');

        // The demo has '(/39156-5) selected by default
        cy.get('#question').should('contain.value', '(/39156-5)');
        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();
        // The Expression Editor dialog should now appear
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Should have two variables
          cy.get('#variables-section .variable-row').should('have.length', 2);

          cy.get('div#row-1').within(() => {
            // Clear out the selection for variable 'b' and the error should display.
            cy.get('#question-1').clear();

            // Need to click outside of the element.
            cy.get('#variable-label-1').click();

            // The error should show up.
            cy.get('#question-1').should('have.class', 'field-error');
            cy.get('#expression-error > p').should('contain.text', constants.QUESTION_REQUIRED);

          });
        });
      });

      it('should display error and disable "Save" button if expression is invalid', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression)');

        // The demo has '(/39156-5) selected by default
        cy.get('#question').should('contain.value', '(/39156-5)');
        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();
        // The Expression Editor dialog should now appear
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Add 2 new items
          // Add variable of variable type "FHIRPath Expression"
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 3);
          cy.get('div#row-2').within(() => {
            cy.get('#variable-label-2').clear().type('c_fhirpath_exp');
            cy.get('#variable-type-2').should('have.value', 'question');
            cy.get('#variable-type-2').select('FHIRPath Expression');
            // Enter invalid variable name
            cy.get('#variable-expression-2').clear().type("%zzz");
            cy.get('#variable-expression-2').should('have.class', 'field-error');
            cy.get('#expression-error > p').should('contain.text', constants.INVALID_EXPRESSION);
          });

          // Add variable of variable type "Easy Path Expression"
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 4);
          cy.get('div#row-3').within(() => {
            cy.get('#variable-label-3').clear().type('d_simple');
            cy.get('#variable-type-3').select('Easy Path Expression');
            // Enter invalid variable name
            cy.get('#simple-expression-3').type('zzz');
            cy.get('#simple-expression-3').should('have.class', 'field-error');
            cy.get('#expression-error > p').should('contain.text', constants.INVALID_EXPRESSION);
          });

          // The 'Save' button should be disabled
          cy.get('#export').should('have.class', 'disabled');

          // Fix the issue by typing in valid expressions
          cy.get('div#row-2').within(() => {
            cy.get('#variable-expression-2').clear().type("%resource.item.where(linkId='/8302-2').answer.vlaue*0.0254");
            cy.get('#variable-expression-2').should('not.have.class', 'field-error');
          });
          cy.get('div#row-3').within(() => {
            cy.get('#simple-expression-3').clear().type('a');
            cy.get('#simple-expression-3').should('not.have.class', 'field-error');
          });

          // The 'Save' button should be enabled
          cy.get('#export').should('not.have.class', 'disabled');
        });
      });

      it('should display blank when convert from invalid Easy Path Expression to FHIRPath Expression', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression)');

        // The demo has '(/39156-5) selected by default
        cy.get('#question').should('contain.value', '(/39156-5)');
        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();
        // The Expression Editor dialog should now appear
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Variables section
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.get('#variables-section .variable-row').should('have.length', 2);

          // Add variable c
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 3);

          // Select 'Easy Path Expression' variable type for the newly added variable
          cy.get('div#row-2').within(() => {
            cy.get('#variable-type-2').select('Easy Path Expression');
            // Enter invalid expression
            cy.get('#simple-expression-2').clear().type('asdf');

            cy.get('#simple-expression-2').should('have.class', 'field-error');
            cy.get('#expression-error > p').should('contain.text', 'Invalid expression.');

            // Converting the invalid expression variable to variable type to 'FHIRPath Expression'
            // should result in the empty FHIRPath expression
            cy.get('#variable-type-2').select('FHIRPath Expression');
            // The expression should be empty and should not have an error
            cy.get('#variable-expression-2')
              .should('have.value', '')
              .should('not.have.class', 'field-error');
            cy.get('#expression-error').should('not.exist');
          });
        });
      });

      it('should display the output expression correctly when variable label is empty', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression)');

        // The demo has '(/39156-5) selected by default
        cy.get('#question').should('contain.value', '(/39156-5)');
        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();
        // The Expression Editor dialog should now appear
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Variables section
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.get('#variables-section .variable-row').should('have.length', 2);

          // Add variable c
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 3);

          // Select 'Easy Path Expression' variable type for the newly added variable
          cy.get('div#row-2').within(() => {
            cy.get('#variable-type-2').select('Easy Path Expression');
            // Enter 'b' for expression
            cy.get('#simple-expression-2').clear().type('b');

            cy.get('#simple-expression-2').should('have.value', 'b');
            cy.get('lhc-syntax-preview pre').should('contain.text', '%b');

            // Delete the variable label 'c'
            cy.get('#variable-label-2').clear();
            // Need to click outside of the text input for the changes to update
            cy.get('#simple-expression-2').click();
          });

          // Output Expression section
          cy.get('#final-expression-section').within(() => {
            cy.get('#simple-expression-final').should('contain.value', 'a/b^2');
            cy.get('lhc-syntax-preview pre').should('not.contain.text', '%a/%b.power(2)%');
            cy.get('lhc-syntax-preview pre').should('contain.text', '%a/%b.power(2)');
          });

          // Set the output expression to 'a', it should convert to '%a' correctly
          cy.get('#final-expression-section').within(() => {
            cy.get('#simple-expression-final').clear().type('a');
            cy.get('lhc-syntax-preview pre').should('not.contain.text', '%a%');
            cy.get('lhc-syntax-preview pre').should('contain.text', '%a');
          });

          // Set the output expression to 'a + b', it should convert to '%a + %b' correctly
          cy.get('#final-expression-section').within(() => {
            cy.get('#simple-expression-final').clear().type('a + b');
            cy.get('lhc-syntax-preview pre').should('contain.text', '%a + %b');
          });
        });
      });
    });

    describe('Output Expression section', () => {
      it('should display error and disable "Save" button if failed Easy Path Expression validation', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression)');

        // The demo has '(/39156-5) selected by default
        cy.get('#question').should('contain.value', '(/39156-5)');
        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();
        // The Expression Editor dialog should now appear
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // The 'Output Expression' section should be visible
          cy.get('#final-expression-section').should('exist')
            .scrollIntoView().should('be.visible');

          // By default, the Output Expression Type is set to 'Easy Path Expression' and the expression has value
          cy.get('#simple-expression-final').should('have.value', 'a/b^2');

          // The 'Save' button should be enabled
          cy.get('#export').should('exist').should('not.have.class', 'disabled');

          // Clear the Output Expression to blank
          cy.get('#simple-expression-final').clear();
          // The Output Expression textbox should be highlighted in red
          // and the error message should displayed below the textbox
          cy.get('#simple-expression-final').should('have.class', 'field-error');
          cy.get('#final-expression-section #expression-error > p')
            .should('contain.text', constants.EXPRESSION_REQUIRED);

          // The 'Save' button should be disabled
          cy.get('#export').should('exist').should('have.class', 'disabled');

          // Type back the expression
          cy.get('#simple-expression-final').type('a/b^2');

          // The 'Save' button should be enabled
          cy.get('#export').should('exist').should('not.have.class', 'disabled');

          // Change the expression to reference invalid variable name 'ccc'
          cy.get('#simple-expression-final').clear().type('ccc/b^2');

          cy.get('#simple-expression-final').should('have.class', 'field-error');
          cy.get('#final-expression-section #expression-error > p')
            .should('contain.text', constants.INVALID_EXPRESSION);
          // The 'Save' button should be disabled
          cy.get('#export').should('exist').should('have.class', 'disabled');
        });
      });

      it('should display error and disable "Save" button if failed FHIRPath Expression validation', () => {
        cy.intercept('/bmi.json').as('bmi');
        cy.get('select#questionnaire-select').select('BMI Calculation');
        cy.wait('@bmi');

        // The demo has '(/39156-5) selected by default
        cy.get('#question').should('contain.value', '(/39156-5)');
        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();
        // The Expression Editor dialog should now appear
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // The 'Output Expression' section should be visible
          cy.get('#final-expression-section').should('exist')
            .scrollIntoView().should('be.visible');

          // By default, the Output Expression Type is set to 'FHIRPath Expression' and the expression has value
          cy.get('#output-expression-type').find('option:selected').should('have.text', 'FHIRPath Expression');
          cy.get('#final-expression').should('have.value', '(%a/(%b.power(2))).round(1)');

          // The 'Save' button should be enabled
          cy.get('#export').should('exist').should('not.have.class', 'disabled');

          // Clear the Output Expression to blank
          cy.get('#final-expression').clear();
          // The Output Expression textbox should be highlighted in red
          // and the error message should displayed below the textbox
          cy.get('#final-expression').should('have.class', 'field-error');
          cy.get('#final-expression-section #expression-error > p')
            .should('contain.text', constants.EXPRESSION_REQUIRED);

          // The 'Save' button should be disabled
          cy.get('#export').should('exist').should('have.class', 'disabled');

          // Type back the expression
          cy.get('#final-expression').type('(%a/(%b.power(2))).round(1)');

          // The 'Save' button should be enabled
          cy.get('#export').should('exist').should('not.have.class', 'disabled');

          // Change the expression to reference invalid variable name 'ccc'
          cy.get('#final-expression').clear().type('(%ccc/(%b.power(2))).round(1)');

          cy.get('#final-expression').should('have.class', 'field-error');
          cy.get('#final-expression-section #expression-error > p')
            .should('contain.text', constants.INVALID_EXPRESSION);
          // The 'Save' button should be disabled
          cy.get('#export').should('exist').should('have.class', 'disabled');
        });
      });

      it('should display error and disable "Save" button if failed FHIRPath Expression validation', () => {
        cy.get('select#questionnaire-select').select('Upload your own questionnaire');

        cy.get('#file-upload').attachFile('bmisimple.json');

        // Updating the linkId should update the Expression Editor instantly
        cy.get('#question').type('bmi');
        cy.get('span#completionOptions > ul > li').contains('39156-5').click();

        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();
        // The Expression Editor dialog should now appear
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');
        });

        // The 'Output Expression' should be default to 'Calculated Expression'
        cy.get('#expression-entry > select').should('have.value', '1');

        cy.get('lhc-expression-editor').shadow().within(() => {
          // The 'Output Expression' section should be visible
          cy.get('#final-expression-section').should('exist')
            .scrollIntoView().should('be.visible');

          // The 'Save' button should be enabled since the Output Expression is populate
          cy.get('#export').should('not.have.class', 'disabled');

          // Check the "Case Statements Helper" checkbox
          cy.get('#case-statements').check();

          // The case condition, case output, and default case should not display
          // errors initially. Only when the field is modified or the 'Save' button
          // is clicked.
          cy.get('#case-condition-0').should('not.have.class', 'field-error');
          cy.get('#case-output-0').should('not.have.class', 'field-error');
          cy.get('.default').should('not.have.class', 'field-error');
          // the 'Save' button should be enabled
          cy.get('#export').should('not.have.class', 'disabled');

          // Add more case statements
          cy.get('#add-case').click();
          cy.get('#add-case').click();
          // The new case statement should not show errors
          cy.get('#case-condition-1').should('not.have.class', 'field-error');
          cy.get('#case-output-1').should('not.have.class', 'field-error');
          cy.get('#case-condition-2').should('not.have.class', 'field-error');
          cy.get('#case-output-2').should('not.have.class', 'field-error');

          // Click the 'Save' button.  B/c the case statements above are empty.
          // The validation should disabled the 'Save' button and those case statements
          // should display errors.
          cy.get('#export').click();
          cy.get('#case-condition-0').should('have.class', 'field-error');
          cy.get('#case-output-0').should('have.class', 'field-error');
          cy.get('#case-condition-1').should('have.class', 'field-error');
          cy.get('#case-output-1').should('have.class', 'field-error');
          cy.get('#case-condition-2').should('have.class', 'field-error');
          cy.get('#case-output-2').should('have.class', 'field-error');
          cy.get('.default').should('have.class', 'field-error');
          cy.get('#export').should('have.class', 'disabled');

          // Enter condition and output to the first case statement
          cy.get('#case-condition-0').type('b<18.5');
          cy.get('#case-output-0').type("'underweight'");
          // The errror for the first case statement should no longer be there
          cy.get('#case-condition-0').should('not.have.class', 'field-error');
          cy.get('#case-output-0').should('not.have.class', 'field-error');
          // The 'Save' button should still be disabled as there are still errors
          cy.get('#export').should('have.class', 'disabled');

          // Enter conditions and outputs for the second and third case statements
          cy.get('#case-condition-1').type('b<25');
          cy.get('#case-output-1').type("'normal'");
          cy.get('#case-condition-2').type('b<30');
          cy.get('#case-output-2').type("'overweight'");
          // The errror for the second and third case statements should no longer be there
          cy.get('#case-condition-1').should('not.have.class', 'field-error');
          cy.get('#case-output-1').should('not.have.class', 'field-error');
          cy.get('#case-condition-2').should('not.have.class', 'field-error');
          cy.get('#case-output-2').should('not.have.class', 'field-error');
          // However, the 'Save' button should still be disabled as there is still error in the default case
          cy.get('#export').should('have.class', 'disabled');

          // Add a default value
          cy.get('.default').type("'obese'");
          // The error in the default case should no longer be there
          cy.get('.default').should('not.have.class', 'field-error');

          // The output expression is displayed
          cy.get('lhc-case-statements lhc-syntax-preview > div > div > pre').should('contain.text',
            `iif(%b<18.5,'underweight',iif(%b<25,'normal',iif(%b<30,'overweight','obese')))`);

          // The 'Save' button should be enabled
          cy.get('#export').should('not.have.class', 'disabled');
        });
      });

      it('should still display error and disable "Save" button when switching case from Easy Path Expression (with errors) to FHIRPath Expression', () => {
        cy.get('select#questionnaire-select').select('Upload your own questionnaire');

        cy.get('#file-upload').attachFile('bmisimple.json');

        // Updating the linkId should update the Expression Editor instantly
        cy.get('#question').type('bmi');
        cy.get('span#completionOptions > ul > li').contains('39156-5').click();

        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();
        // The Expression Editor dialog should now appear
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');
        });

        // The 'Output Expression' should be default to 'Calculated Expression'
        cy.get('#expression-entry > select').should('have.value', '1');

        cy.get('lhc-expression-editor').shadow().within(() => {
          // The 'Output Expression' section should be visible
          cy.get('#final-expression-section').should('exist')
            .scrollIntoView().should('be.visible');

          // Check the "Case Statements Helper" checkbox
          cy.get('#case-statements').check();

          // The variable type should default to Easy Path Expression
          cy.get('#output-expression-type').should('exist').should('have.value', 'simple');

          // Populate case statements
          cy.get('#case-condition-0').clear().type('a > 1');
          cy.get('#case-output-0').clear().type("'small'");
          cy.get('#add-case').click();
          cy.get('#case-condition-1').clear().type('a < 5');
          cy.get('#case-output-1').clear().type("'medium'");
          cy.get('.default').clear().type("'large'");

          // Case statements should not have errors.
          cy.get('#case-condition-0').should('not.have.class', 'field-error');
          cy.get('#case-output-0').should('not.have.class', 'field-error');
          cy.get('#case-condition-1').should('not.have.class', 'field-error');
          cy.get('#case-output-1').should('not.have.class', 'field-error');
          cy.get('.default').should('not.have.class', 'field-error');

          // The 'Save' button should be enabled since the Output Expression is populate
          cy.get('#export').should('not.have.class', 'disabled');

          // The preview should display the expression
          cy.get('lhc-syntax-preview pre').should('contain.text', "iif(%a > 1,'small',iif(%a < 5,'medium','large'))");

          // Empty first case output
          cy.get('#case-output-0').clear();
          // Empty second case condition
          cy.get('#case-condition-1').clear();
          // Empty the default output
          cy.get('.default').clear();

          // Those fields should now display errors.
          cy.get('#case-output-0').should('have.class', 'field-error');
          cy.get('#case-condition-1').should('have.class', 'field-error');
          cy.get('.default').should('have.class', 'field-error');

          // The 'Save' button should be disabled
          cy.get('#export').should('have.class', 'disabled');

          // The preview expression should be hidden
          cy.get('lhc-case-statements lhc-syntax-preview').should('not.exist');

          // Select FHIRPath Expression variable type
          cy.get('#output-expression-type').select('fhirpath');

          // The case statment should still display errors
          cy.get('#case-output-0').should('have.class', 'field-error');
          cy.get('#case-condition-1').should('have.class', 'field-error');
          cy.get('.default').should('have.class', 'field-error');

          // The preview expression should remain hidden
          cy.get('lhc-case-statements lhc-syntax-preview').should('not.exist');

          // The 'Save' button should remain disabled
          cy.get('#export').should('have.class', 'disabled');
        });
      });

      it('should validate for empty Output Expression when the "Save" button is clicked', () => {
        cy.intercept('/phq9.json').as('phq9');
        cy.get('select#questionnaire-select').select('PHQ9 (no FHIRPath)');
        cy.wait('@phq9');

        // The demo has '(/39156-5) selected by default
        cy.get('#question').should('contain.value', '(/39156-5)');
        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();

        cy.get('lhc-expression-editor').shadow().within(() => {
          // The prompt to calculate the total scoring item should displayed.
          cy.get('lhc-calculate-sum-prompt > lhc-base-dialog > #calculate-sum-base-dialog')
            .should('exist')
            .within(() => {
              cy.get('#calculate-sum-dialog-body')
                .should('contain.text', 'Would you like to select items for the sum of scores?');
              // Close the dialog
              cy.get('#skip-score-items-selection').click();
            });
        });
      });

      it('should display error in the Output Expression section if the dependent variable name is changed.', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression)');

        // The demo has '(/39156-5) selected by default
        cy.get('#question').should('contain.value', '(/39156-5)');
        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();
        // The Expression Editor dialog should now appear
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Should have two variables
          cy.get('#variables-section .variable-row').should('have.length', 2);

          cy.get('#variable-label-0').should('have.value', 'a');
          cy.get('#variable-label-1').should('have.value', 'b');

          // The variable type should default to Easy Path Expression
          cy.get('#output-expression-type').should('exist').should('have.value', 'simple');
          // The output expression should have value a/b^2
          cy.get('#simple-expression-final').should('have.value', 'a/b^2');

          // Rename variable 'b' to 'bb'
          cy.get('#variable-label-1').type('b{enter}').should('have.value', 'bb');

          // The output expression should show an error
          cy.get('#simple-expression-final').should('have.class', 'field-error');
          cy.get('#expression-error > p').should('contain.text', 'Invalid expression.');

          // Rename variable 'bb' back to 'b'
          cy.get('#variable-label-1').clear().type('b{enter}').should('have.value', 'b');

          // The output expression should no longer show an error
          cy.get('#simple-expression-final').should('not.have.class', 'field-error');
          cy.get('#expression-error > p').should('not.exist');

          // Select FHIRPath Expression variable type
          cy.get('#output-expression-type').select('fhirpath');
          // The output expression should have value %a/%b.power(2)
          cy.get('#final-expression').should('have.value', '%a/%b.power(2)');

          // Rename variable 'b' to 'bb'
          cy.get('#variable-label-1').type('b{enter}').should('have.value', 'bb');

          // The output expression should show an error
          cy.get('#final-expression').should('have.class', 'field-error');
          cy.get('#expression-error > p').should('contain.text', 'Invalid expression.');

          // Rename variable 'bb' back to 'b'
          cy.get('#variable-label-1').clear().type('b{enter}').should('have.value', 'b');

          // The output expression should no longer show an error
          cy.get('#final-expression').should('not.have.class', 'field-error');
          cy.get('#expression-error > p').should('not.exist');
        });
      });

      it('should display the Case Statement errors in the Output Expression section if the dependent variable name is changed.', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression)');

        // The demo has '(/39156-5) selected by default
        cy.get('#question').should('contain.value', '(/39156-5)');
        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();
        // The Expression Editor dialog should now appear
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Should have two variables
          cy.get('#variables-section .variable-row').should('have.length', 2);

          cy.get('#variable-label-0').should('have.value', 'a');
          cy.get('#variable-label-1').should('have.value', 'b');

          // The variable type should default to Easy Path Expression
          cy.get('#output-expression-type').should('exist').should('have.value', 'simple');

          // Check the "Case Statements Helper" checkbox
          cy.get('#case-statements').check();

          // The case condition, case output, and default case should not display
          // errors initially. Only when the field is modified or the 'Save' button
          // is clicked.
          cy.get('#case-condition-0').should('not.have.class', 'field-error');
          cy.get('#case-output-0').should('not.have.class', 'field-error');
          cy.get('.default').should('not.have.class', 'field-error');
          // the 'Save' button should be enabled
          cy.get('#export').should('not.have.class', 'disabled');

          // Enter data to the Case Statement
          cy.get('#case-condition-0').type('b < 5');
          cy.get('#case-output-0').type('b');
          cy.get('.default').type('b');

          // Rename variable 'b' to 'bb'
          cy.get('#variable-label-1').type('b{enter}').should('have.value', 'bb');

          // The Case Statement should fail.
          cy.get('#case-condition-0').should('have.class', 'field-error');
          cy.get('#case-condition-0-error').should('contain.text', 'The case condition is invalid.');
          cy.get('#case-output-0').should('have.class', 'field-error');
          cy.get('#case-output-0-error').should('contain.text', 'The case output is invalid.');
          cy.get('.default').should('have.class', 'field-error');
          cy.get('#default-case-error').should('contain.text', 'The default case is invalid.');

          // Rename variable 'bb' back to 'b'
          cy.get('#variable-label-1').clear().type('b{enter}').should('have.value', 'b');

          // The error messages should go away
          cy.get('#case-condition-0').should('not.have.class', 'field-error');
          cy.get('#case-output-0').should('not.have.class', 'field-error');
          cy.get('.default').should('not.have.class', 'field-error');

          // Select FHIRPath Expression variable type
          cy.get('#output-expression-type').select('fhirpath');

          // The Case Statement should be converted to FHIRPath
          cy.get('#case-condition-0').should('have.value', '%b < 5');
          cy.get('#case-output-0').should('have.value', '%b');
          cy.get('.default').should('have.value', '%b');

          // Rename variable 'b' to 'bb'
          cy.get('#variable-label-1').type('b{enter}').should('have.value', 'bb');

          // The Case Statement should fail.
          cy.get('#case-condition-0').should('have.class', 'field-error');
          cy.get('#case-condition-0-error').should('contain.text', 'The case condition is invalid.');
          cy.get('#case-output-0').should('have.class', 'field-error');
          cy.get('#case-output-0-error').should('contain.text', 'The case output is invalid.');
          cy.get('.default').should('have.class', 'field-error');
          cy.get('#default-case-error').should('contain.text', 'The default case is invalid.');

          // Rename variable 'bb' back to 'b'
          cy.get('#variable-label-1').clear().type('b{enter}').should('have.value', 'b');

          // The Case Statement error messages should go away
          cy.get('#case-condition-0').should('not.have.class', 'field-error');
          cy.get('#case-output-0').should('not.have.class', 'field-error');
          cy.get('.default').should('not.have.class', 'field-error');
        });
      });
    });
  });
});