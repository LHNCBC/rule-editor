import * as constants from "../../projects/ngx-expression-editor/src/lib/validation";

describe(Cypress.env("appName"), () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Angular Library', () => {
    describe('BMI Calculation', () => {
      it('should be able to add custom extension, variable type, to each variable during the export', () => {
        cy.intercept('/bmi.json').as('bmi');
        cy.get('select#questionnaire-select').select('BMI Calculation');
        cy.wait('@bmi');

        // The demo has 'BMI (/39156-5) selected by default
        cy.get('#question').should('have.value', 'BMI (/39156-5)');
        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();
        // The Expression Editor dialog should now appear
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Variables section
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.get('#variables-section .variable-row').should('have.length', 2);

          // Add variable of variable type "FHIRPath Expression"
          cy.get('#add-variable').should('exist').click();
          cy.get('#variables-section .variable-row').should('have.length', 3);
          cy.get('div#row-2').within(() => {
            cy.get('#variable-label-2').clear().type('c_fhirpath_exp');
            cy.get('#variable-type-2').select('FHIRPath Expression');
            cy.get('#variable-expression-2').clear().type("%resource.item.where(linkId='/8302-2').answer.value");
          });

          // Add variable of variable type "FHIR Query"
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 4);
          cy.get('div#row-3').within(() => {
            cy.get('#variable-label-3').clear().type('d_fhir_query');
            cy.get('#variable-type-3').select('FHIR Query');
            cy.get('#variable-expression-3').clear().type("%resource.item.where(linkId='/8352-7').answer.value");
          });

          // Add variable of variable type "FHIR Query (Observation)"
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 5);
          cy.get('div#row-4').within(() => {
            cy.get('#variable-label-4').clear().type('e_fhir_obs');
            cy.get('#variable-type-4').select('FHIR Query (Observation)');
            cy.get('lhc-query-observation').shadow().find('#autocomplete-4').type('weight');
          });
        });
        cy.get('span#completionOptions').contains('29463-7').click();

        cy.get('lhc-expression-editor').shadow().within(() => {
          // Add variable of variable type "Question"
          cy.get('#add-variable').click({force: true});
          cy.get('#variables-section .variable-row').should('have.length', 6);
          cy.get('div#row-5').within(() => {
            cy.get('#variable-label-5').clear().type('f_question');
            cy.get('#variable-type-5').should('have.value', 'question');
            cy.get('#question-5')
              .should('exist')
              .should('be.visible')
              .type('weight');
          });
        });

        cy.get('span#completionOptions').contains('29463-7').click();

        cy.get('lhc-expression-editor').shadow().within(() => {
          // Add variable of variable type "Easy Path Expression"
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 7);
          cy.get('div#row-6').within(() => {
            cy.get('#variable-label-6').clear().type('g_simple');
            cy.get('#variable-type-6').select('Easy Path Expression');
            cy.get('#simple-expression-6').type('1 + 1');
          });

          // Click Save
          cy.get('#export').click();
        });
        // Checking the output, it should have the new variables
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

      it('should be able to save FHIR Query Observation as language x-fhir-query', () => {
        cy.intercept('/bmi.json').as('bmi');
        cy.get('select#questionnaire-select').select('BMI Calculation');
        cy.wait('@bmi');

        // The demo has 'BMI (/39156-5) selected by default
        cy.get('#question').should('have.value', 'BMI (/39156-5)');
        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();
        // The Expression Editor dialog should now appear
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Variables section
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.get('#variables-section .variable-row').should('have.length', 2);

          // Add variable of variable type "FHIR Query (Observation)""
          cy.get('#add-variable').should('exist').scrollIntoView().click();
          cy.get('#variables-section .variable-row').should('have.length', 3);
          cy.get('div#row-2').within(() => {
            cy.get('#variable-type-2').select('FHIR Query (Observation)');
            cy.get('lhc-query-observation').shadow().find('#autocomplete-2').type('weight');
          });
        });
        cy.get('span#completionOptions').contains('29463-7').click();

        cy.get('lhc-expression-editor').shadow().within(() => {
          // Click Save
          cy.get('#export').click();
        });

        // Checking the output, it should have the new variables
        cy.get('pre#output').invoke('text').then((jsonData) => {
          // Parse the JSON data
          const parsedData = JSON.parse(jsonData);

          expect(parsedData.item).to.exist;
          expect(parsedData.item).to.have.lengthOf(5);
          expect(parsedData.item[3].linkId).to.exist;
          expect(parsedData.item[3].linkId).to.have.string('/39156-5');
          expect(parsedData.item[3].extension).to.exist;
          expect(parsedData.item[3].extension).to.have.lengthOf(5);

          // validate FHIRPath Expression variable C
          // It should have language = application/x-fhir-query
          expect(parsedData.item[3].extension[3].valueExpression.name).to.equal('c');
          expect(parsedData.item[3].extension[3].valueExpression.language).to.equal('application/x-fhir-query');
          expect(parsedData.item[3].extension[3].valueExpression.extension[0].valueString).to.equal('queryObservation');
        });
      });
    });

    describe('BMI Variable Type', () => {
      // This test illustrates that when the variable type (valueString) is not defined,
      // the variable may not be converted to the correct data type for display.  Specifically,
      // on the variables of type "FHIRPath Expression" and "FHIR Query (Observation)" in this
      // test.
      it('should be able to show that some variable types are not displayed correctly without the custom extension', () => {

        cy.intercept('/bmivariabletype.json').as('bmivariable');
        cy.get('select#questionnaire-select').select('BMI Variable Type');
        cy.wait('@bmivariable');

        // The demo has 'BMI (/39156-5) selected by default
        cy.get('#question').should('have.value', 'BMI (/39156-5)');
        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();
        // The Expression Editor dialog should now appear
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          cy.title().should('eq', Cypress.env("appName"));

          // Variables section
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.get('#variables-section .variable-row').should('have.length', 31);

          // Variable type "FHIRPath Expression" is displayed incorrectly as "Question"
          cy.get('div#row-15').within(() => {
            cy.get('#variable-label-15').should('have.value', 'fhirpath_exp_var_type_not_defined');
            cy.get('#variable-type-15').should('have.value', 'question');
          });

          // Variable type "FHIRPath Expression" is displayed correctly
          cy.get('div#row-16').within(() => {
            cy.get('#variable-label-16').should('have.value', 'fhirpath_exp_var_type_not_defined2');
            cy.get('#variable-type-16').should('have.value', 'expression');
          });

          // Variable type "FHIR Query" is displayed correctly
          cy.get('div#row-17').within(() => {
            cy.get('#variable-label-17').should('have.value', 'fhir_query_var_type_not_defined');
            cy.get('#variable-type-17').should('have.value', 'query');
          });

          // Variable type "FHIR Query" is incorrectly displayed as "FHIR Query (Observation)"
          // due to the expression.
          cy.get('div#row-18').within(() => {
            cy.get('#variable-label-18').should('have.value', 'fhir_query_var_type_not_defined2');
            cy.get('#variable-type-18').should('have.value', 'queryObservation');
          });

          // Variable type "FHIR Query (Observation)" is incorrectly displayed as "FHIRPath Expression"
          cy.get('div#row-19').within(() => {
            cy.get('#variable-label-19').should('have.value', 'fhir_query_obs_var_type_not_defined');
            cy.get('#variable-type-19').should('have.value', 'expression');

            // The FHIRPath expression is now being validated using fhirpath.js. So this will
            // result in the "Invalid expression." error.
            cy.get('#variable-expression-19').should('have.class', 'field-error');
            cy.get('#expression-error').should('contain.text', constants.INVALID_EXPRESSION);
          });

          // Variable type "Question" is displayed correctly
          cy.get('div#row-20').within(() => {
            cy.get('#variable-label-20').should('have.value', 'question_var_type_not_defined');
            cy.get('#variable-type-20').should('have.value', 'question');
          });

          // Variable type "Easy Path Expression" is displayed correctly
          cy.get('div#row-21').within(() => {
            cy.get('#variable-label-21').should('have.value', 'easy_path_exp_var_type_not_defined');
            cy.get('#variable-type-21').should('have.value', 'simple');
          });
        });
      });

      it('should be able to show that variable types are displayed correctly with the custom extension', () => {
        cy.intercept('/bmivariabletype.json').as('bmivariable');
        cy.get('select#questionnaire-select').select('BMI Variable Type');
        cy.wait('@bmivariable');

        // The demo has 'BMI (/39156-5) selected by default
        cy.get('#question').should('have.value', 'BMI (/39156-5)');
        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();
        // The Expression Editor dialog should now appear
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          cy.title().should('eq', Cypress.env("appName"));

          // Should display correct variable type - variable type "FHIRPath Expression"
          cy.get('div#row-6').within(() => {
            cy.get('#variable-label-6').should('have.value', 'fhirpath_exp');
            cy.get('#variable-type-6').should('have.value', 'expression');
          });

          // Should display correct variable type - variable type "FHIRPath Expression"
          cy.get('div#row-7').within(() => {
            cy.get('#variable-label-7').should('have.value', 'fhirpath_exp2');
            cy.get('#variable-type-7').should('have.value', 'expression');
          });

          // Should display correct variable type - variable type "FHIR Query"
          cy.get('div#row-8').within(() => {
            cy.get('#variable-label-8').should('have.value', 'fhir_query');
            cy.get('#variable-type-8').should('have.value', 'query');
          });

          // Should display correct variable type - variable type "FHIR Query"
          cy.get('div#row-9').within(() => {
            cy.get('#variable-label-9').should('have.value', 'fhir_query2');
            cy.get('#variable-type-9').should('have.value', 'query');
          });

          // Should display correct variable type - variable type "FHIR Query (Observation)"
          // Time unit should also display correctly.
          cy.get('div#row-10').within(() => {
            cy.get('#variable-label-10').should('have.value', 'fhir_query_obs_1_day');
            cy.get('#variable-type-10').should('have.value', 'queryObservation');
            cy.get('lhc-query-observation').shadow().within(() => {
              cy.get('div.time-input>input').should('contain.value', '1');
              cy.get('div.time-select>select').should('contain.value', 'days');
            });
          });

          // Should display correct variable type - variable type "FHIR Query (Observation)"
          // Time unit should also display correctly.
          cy.get('div#row-11').within(() => {
            cy.get('#variable-label-11').should('have.value', 'fhir_query_obs_2_weeks');
            cy.get('#variable-type-11').should('have.value', 'queryObservation');
            cy.get('lhc-query-observation').shadow().within(() => {
              cy.get('div.time-input>input').should('contain.value', '2');
              cy.get('div.time-select>select').should('contain.value', 'weeks');
            });
          });

          // Should display correct variable type - variable type "FHIR Query (Observation)"
          // Time unit should also display correctly.
          cy.get('div#row-12').within(() => {
            cy.get('#variable-label-12').should('have.value', 'fhir_query_obs_3_months');
            cy.get('#variable-type-12').should('have.value', 'queryObservation');
            cy.get('lhc-query-observation').shadow().within(() => {
              cy.get('div.time-input>input').should('contain.value', '3');
              cy.get('div.time-select>select').should('contain.value', 'months');
            });
          });

          // Should display correct variable type - variable type "FHIR Query (Observation)"
          // Time unit should also display correctly.
          cy.get('div#row-13').within(() => {
            cy.get('#variable-label-13').should('have.value', 'fhir_query_obs_4_years');
            cy.get('#variable-type-13').should('have.value', 'queryObservation');
            cy.get('lhc-query-observation').shadow().within(() => {
              cy.get('div.time-input>input').should('contain.value', '4');
              cy.get('div.time-select>select').should('contain.value', 'years');
            });
          });

          // Add variable of variable type "Easy Path Expression"
          cy.get('div#row-14').within(() => {
            cy.get('#variable-label-14').should('have.value', 'easy_path_exp');
            cy.get('#variable-type-14').should('have.value', 'simple');
          });
        });
      });

      it('should display "Question" with correct unit', () => {
        cy.intercept('/bmivariabletype.json').as('bmivariable');
        cy.get('select#questionnaire-select').select('BMI Variable Type');
        cy.wait('@bmivariable');

        // The demo has 'BMI (/39156-5) selected by default
        cy.get('#question').should('have.value', 'BMI (/39156-5)');
        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();
        // The Expression Editor dialog should now appear
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          cy.title().should('eq', Cypress.env("appName"));

          // Question - weight default to kg
          cy.get('div#row-0').within(() => {
            cy.get('#variable-label-0').should('have.value', 'question_weight_kg');
            cy.get('#variable-type-0').should('have.value', 'question');
            cy.get('#question-0').should('have.value', 'Weight (/29463-7)');
            // default value is ''
            cy.get('div.unit-select > select').should('have.value', '');
            cy.get('lhc-syntax-preview pre').should('contain.text',
              "%resource.item.where(linkId='/29463-7').answer.value"
            );
          });

          // Question - weight in lbs
          cy.get('div#row-1').within(() => {
            cy.get('#variable-label-1').should('have.value', 'question_weight_lbs');
            cy.get('#variable-type-1').should('have.value', 'question');
            cy.get('#question-1').should('have.value', 'Weight (/29463-7)');
            cy.get('div.unit-select > select').should('have.value', 'lbs');
            cy.get('lhc-syntax-preview pre').should('contain.text',
              "%resource.item.where(linkId='/29463-7').answer.value*2.20462"
            );
          });

          // Question - height default to in
          cy.get('div#row-2').within(() => {
            cy.get('#variable-label-2').should('have.value', 'question_height_in');
            cy.get('#variable-type-2').should('have.value', 'question');
            cy.get('#question-2').should('have.value', 'Body height (/8302-2)');
            // default value is ''
            cy.get('div.unit-select > select').should('have.value', '');
            cy.get('lhc-syntax-preview pre').should('contain.text',
              "%resource.item.where(linkId='/8302-2').answer.value"
            );
          });

          // Question - height in cm
          cy.get('div#row-3').within(() => {
            cy.get('#variable-label-3').should('have.value', 'question_height_cm');
            cy.get('#variable-type-3').should('have.value', 'question');
            cy.get('#question-3').should('have.value', 'Body height (/8302-2)');
            cy.get('div.unit-select > select').should('have.value', 'cm');
            cy.get('lhc-syntax-preview pre').should('contain.text',
              "%resource.item.where(linkId='/8302-2').answer.value*2.54"
            );
          });

          // Question - height in m
          cy.get('div#row-4').within(() => {
            cy.get('#variable-label-4').should('have.value', 'question_height_m');
            cy.get('#variable-type-4').should('have.value', 'question');
            cy.get('#question-4').should('have.value', 'Body height (/8302-2)');
            cy.get('div.unit-select > select').should('have.value', 'm');
            cy.get('lhc-syntax-preview pre').should('contain.text',
              "%resource.item.where(linkId='/8302-2').answer.value*0.0254"
            );
          });
        });
      });

      it('should display the correct "Question" variable type when the expression is empty', () => {
        cy.intercept('/bmivariabletype.json').as('bmivariable');
        cy.get('select#questionnaire-select').select('BMI Variable Type');
        cy.wait('@bmivariable');

        // The demo has 'BMI (/39156-5) selected by default
        cy.get('#question').should('have.value', 'BMI (/39156-5)');
        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();
        // The Expression Editor dialog should now appear
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          cy.title().should('eq', Cypress.env("appName"));

          cy.get('div#row-23').within(() => {
            cy.get('#variable-label-23').should('have.value', 'question_empty_expression');
            cy.get('#variable-type-23').should('have.value', 'question');
            cy.get('#question-23').should('be.empty');
          });
        });
      });

      it('should display invalid "Question" variable type as "FHIRPath Expression"', () => {
        cy.intercept('/bmivariabletype.json').as('bmivariable');
        cy.get('select#questionnaire-select').select('BMI Variable Type');
        cy.wait('@bmivariable');

        // The demo has 'BMI (/39156-5) selected by default
        cy.get('#question').should('have.value', 'BMI (/39156-5)');
        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();
        // The Expression Editor dialog should now appear
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          cy.title().should('eq', Cypress.env("appName"));

          // The configuration said this should be type 'Question'.  However, the factor
          // 9999 does not matched with any pre-defined factors and therefore, is not a valid
          // question. The item is displayed as 'FHIRPath Expression' instead.
          cy.get('div#row-5').within(() => {
            cy.get('#variable-label-5').should('have.value', 'question_invalid_factor');
            cy.get('#variable-type-5').should('have.value', 'expression');
            cy.get('#variable-expression-5').should('have.value',
              "%resource.item.where(linkId='/8302-2').answer.value*9999");
          });

          cy.get('div#row-24').within(() => {
            cy.get('#variable-label-24').should('have.value', 'not_question_type_expression');
            cy.get('#variable-type-24').should('have.value', 'expression');
            cy.get('#variable-expression-24').should('have.value',
              "Observation.component.where(code.memberOf(%'vs-observation-vitalsignresult'))");
          });

          cy.get('div#row-25').within(() => {
            cy.get('#variable-label-25').should('have.value', 'question_empty_expression_and_no_extension');
            cy.get('#variable-type-25').should('have.value', 'expression');
            cy.get('#variable-expression-25').should('be.empty');
          });

          cy.get('div#row-26').within(() => {
            cy.get('#variable-label-26').should('have.value', 'not_question_type_expression_and_no_extension');
            cy.get('#variable-type-26').should('have.value', 'expression');
            cy.get('#variable-expression-26').should('have.value',
              "Observation.component.where(code.memberOf(%'vs-observation-vitalsignresult'))");
          });
        });
      });

      it('should be able to update custom extension and export correctly', () => {
        cy.intercept('/bmivariabletype.json').as('bmivariable');
        cy.get('select#questionnaire-select').select('BMI Variable Type');
        cy.wait('@bmivariable');

        // The demo has 'BMI (/39156-5) selected by default
        cy.get('#question').should('have.value', 'BMI (/39156-5)');
        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();
        // The Expression Editor dialog should now appear
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          cy.title().should('eq', Cypress.env("appName"));

          // Updated "FHIRPath Expression" variable type to "FHIR Query"
          cy.get('div#row-6').within(() => {
            cy.get('#variable-label-6').should('have.value', 'fhirpath_exp');
            cy.get('#variable-type-6').should('have.value', 'expression');
            cy.get('#variable-type-6').select('FHIR Query');
          });

          // Updated "FHIR Query" variable type to "FHIR Query (Observation)"
          cy.get('div#row-8').within(() => {
            cy.get('#variable-label-8').should('have.value', 'fhir_query');
            cy.get('#variable-type-8').should('have.value', 'query');
            cy.get('#variable-type-8').select('FHIR Query (Observation)');
          });

          // Updated "FHIR Query Observation" variable type to "Question"
          cy.get('div#row-10').within(() => {
            cy.get('#variable-label-10').should('have.value', 'fhir_query_obs_1_day');
            cy.get('#variable-type-10').should('have.value', 'queryObservation');
            cy.get('#variable-type-10').select('Question');
          });

          // Updated "Question" variable type to "Easy Path Expression"
          cy.get('div#row-0').within(() => {
            cy.get('#variable-label-0').should('have.value', 'question_weight_kg');
            cy.get('#variable-type-0').should('have.value', 'question');
            cy.get('#variable-type-0').select('Easy Path Expression');
          });

          // Updated "Easy Path Expression" variable type to "FHIRPath Expression"
          cy.get('div#row-14').within(() => {
            cy.get('#variable-label-14').should('have.value', 'easy_path_exp');
            cy.get('#variable-type-14').should('have.value', 'simple');
            cy.get('#variable-type-14').select('FHIRPath Expression');
          });

          // There is an error in the Output Expression
          cy.get('#simple-expression-final').should('have.class', 'field-error');
          cy.get('#final-expression-section #expression-error > p').should('contain.text', constants.INVALID_EXPRESSION);

          // As a result, the Save button is disabled
          cy.get('#export').should('have.class', 'disabled');

          // Fix the expression in the Output Expression section
          cy.get('#simple-expression-final').clear().type('1 + 1');

          // The Output Expression should no longer have error
          cy.get('#simple-expression-final').should('not.have.class', 'field-error');
          cy.get('#final-expression-section lhc-syntax-preview > div > div > pre').should('contain.text', '1 + 1');
          // However, the 'Save' button should still be disabled due to an error with fhir_query_obs_var_not_defined
          cy.get('#export').should('have.class', 'disabled');

          // Fix the expression error for the fhir_query_obs_var_not_defined on row 19
          cy.get('#variable-expression-19').clear()
            .type("%resource.item.where(linkId='/8306-6').answer.value*0.0254")
            .should('not.have.class', 'field-error');
          // The 'Save' button should now be enabled
          cy.get('#export').should('not.have.class', 'disabled');

          // Click Save
          cy.get('#export').click();

          // Clicking the 'Save' button should yield 5 errors:
          // question_weight_kg (row 0),
          // fhir_query (row 8),
          // fhir_query_obs_1_day (row 10),
          // question_empty_expression (row 23) and
          // question_empty_expression_and_no_extension (row 25)
          // should throw "Expression is required." b/c they are empty.
          cy.get('div#row-0').within(() => {
            cy.get('#simple-expression-0').should('have.class', 'field-error');
            cy.get('#expression-error > p').should('contain.text', constants.EXPRESSION_REQUIRED);
          });
          cy.get('div#row-8').within(() => {
            cy.get('lhc-query-observation').shadow().within(() => {
              cy.get('#autocomplete-8').should('have.class', 'field-error');
              cy.get('#expression-error > p').should('contain.text', constants.FHIR_QUERY_OBSERVATION_REQUIRED);
            });
          });
          cy.get('div#row-10').within(() => {
            cy.get('#question-10').should('have.class', 'field-error');
            cy.get('#expression-error > p').should('contain.text', constants.QUESTION_REQUIRED);
          });
          cy.get('div#row-23').within(() => {
            cy.get('#question-23').should('have.class', 'field-error');
            cy.get('#expression-error > p').should('contain.text', constants.QUESTION_REQUIRED);
          });
          cy.get('div#row-25').within(() => {
            cy.get('#variable-expression-25').should('have.class', 'field-error');
            cy.get('#expression-error > p').should('contain.text', constants.EXPRESSION_REQUIRED);
          });

          // Fix the errors by entering data
          cy.get('#simple-expression-0').type('1');
          cy.get('lhc-query-observation').shadow().find('#autocomplete-8').type('weight');
        });
        cy.get('span#completionOptions').contains('29463-7').click();

        cy.get('lhc-expression-editor').shadow().find('#question-10').clear().type('height');

        cy.get('span#completionOptions > ul > li').contains('8302-2').click();

        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#variable-expression-19').clear().type("Observation.component.where(code.memberOf(%'vs-observation-vitalsignresult'))");
          cy.get('#question-23').clear().type('Clothing worn during measure');
        });

        cy.get('span#completionOptions > ul > li').contains('8352-7').click();

        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#variable-expression-25').type('1');

          // The errors should no longer be there.  And the 'Save' button should be enabled.
          cy.get('div#row-0').within(() => {
            cy.get('#simple-expression-0').should('not.have.class', 'field-error');
          });
          cy.get('div#row-8').within(() => {
            cy.get('lhc-query-observation').shadow().find('#autocomplete-8').should('not.have.class', 'field-error');
          });
          cy.get('div#row-10').within(() => {
            cy.get('#question-10').should('not.have.class', 'field-error');
          });
          cy.get('div#row-19').within(() => {
            cy.get('#variable-expression-19').should('not.have.class', 'field-error');
          });
          cy.get('div#row-23').within(() => {
            cy.get('#question-23').should('not.have.class', 'field-error');
          });
          cy.get('div#row-25').within(() => {
            cy.get('#variable-expression-25').should('not.have.class', 'field-error');
          });
          cy.get('#export').should('not.have.class', 'disabled');

          // Click 'Save' again
          cy.get('#export').click();
        });

        // Checking the output, it should have the new variable created under the BMI item extension
        cy.get('pre#output').invoke('text').then((jsonData) => {
          // Parse the JSON data
          const parsedData = JSON.parse(jsonData);

          expect(parsedData.item).to.exist;
          expect(parsedData.item).to.have.lengthOf(6);
          expect(parsedData.item[4].linkId).to.exist;
          expect(parsedData.item[4].linkId).to.have.string('/39156-5');
          expect(parsedData.item[4].extension).to.exist;
          expect(parsedData.item[4].extension).to.have.lengthOf(33);

          // validate that the valueString is updated to 'query'
          expect(parsedData.item[4].extension[7].valueExpression.name).to.equal('fhirpath_exp');
          expect(parsedData.item[4].extension[7].valueExpression.language).to.equal('application/x-fhir-query');
          expect(parsedData.item[4].extension[7].valueExpression.extension[0].valueString).to.equal('query');

          // validate that the valueString is updated to 'queryObservation'
          expect(parsedData.item[4].extension[9].valueExpression.name).to.equal('fhir_query');
          expect(parsedData.item[4].extension[9].valueExpression.language).to.equal('application/x-fhir-query');
          expect(parsedData.item[4].extension[9].valueExpression.extension[0].valueString).to.equal('queryObservation');

          // validate that the valueString is updated to 'question'
          expect(parsedData.item[4].extension[11].valueExpression.name).to.equal('fhir_query_obs_1_day');
          expect(parsedData.item[4].extension[11].valueExpression.language).to.equal('text/fhirpath');
          expect(parsedData.item[4].extension[11].valueExpression.extension[0].valueString).to.equal('question');

          // validate that the valueString is updated to 'simple'
          expect(parsedData.item[4].extension[0].valueExpression.name).to.equal('question_weight_kg');
          expect(parsedData.item[4].extension[0].valueExpression.language).to.equal('text/fhirpath');
          expect(parsedData.item[4].extension[0].valueExpression.extension[0].valueString).to.equal('simple');

          // validate that the valueString is updated to 'expression'
          expect(parsedData.item[4].extension[15].valueExpression.name).to.equal('easy_path_exp');
          expect(parsedData.item[4].extension[15].valueExpression.language).to.equal('text/fhirpath');
          expect(parsedData.item[4].extension[15].valueExpression.extension[0].valueString).to.equal('expression');
        });
      });

      it('should display non-convertible unit with Unit label', () => {
        cy.intercept('/bmivariabletype.json').as('bmivariable');
        cy.get('select#questionnaire-select').select('BMI Variable Type');
        cy.wait('@bmivariable');

        // The demo has 'BMI (/39156-5) selected by default
        cy.get('#question').should('have.value', 'BMI (/39156-5)');
        // Click the button to edit the expression
        cy.get('button#openExpressionEditor').should('exist').click();
        // The Expression Editor dialog should now appear
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          cy.title().should('eq', Cypress.env("appName"));

          cy.get('div#row-22').within(() => {
            cy.get('#variable-label-22').should('have.value', 'question_invalid_unit_var_type_not_defined');
            cy.get('#variable-type-22').should('have.value', 'question');

            // Question should be "Custom Unit (/8306-6)"
            cy.get('#question-22').should('have.value', "Custom Unit (/8306-6)" );

            // Unit should display as "Unit: sss"
            cy.get('div.unit-select .detail').should('have.text', 'Unit: sss');

            // FHIRPath Expression should include factor if the unit is non-convertible.
            cy.get('lhc-syntax-preview pre').should('contain.text',
              "%resource.item.where(linkId='/8306-6').answer.value*0.0254"
            );
          });
        });
      });
    });
  });
});