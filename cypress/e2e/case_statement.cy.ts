describe(Cypress.env("appName"), () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Angular Library', () => {
    describe('BMI calculation', () => {
      it('should cycle through empty case statment correctly from Easy Path Expression to FHIRPath Expression and back', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression)');

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
          cy.get('#variables-section .variable-row').should('have.length', 2);

          // The 'Output Expression' section should be visible
          cy.get('#final-expression-section').should('exist')
            .scrollIntoView().should('be.visible');

          // Check the "Case Statements Helper" checkbox
          cy.get('#case-statements').check();

          // The variable type should default to Easy Path Expression
          cy.get('#output-expression-type').should('exist').should('have.value', 'simple');

          cy.get('#case-condition-0').should('not.have.class', 'field-error');
          cy.get('#case-output-0').should('not.have.class', 'field-error');
          cy.get('.default').should('not.have.class', 'field-error');

          for (let i = 0; i < 2; i++) {
            // Select FHIRPath Expression variable type
            cy.get('#output-expression-type').select('fhirpath');

            cy.get('#case-condition-0').should('not.have.class', 'field-error');
            cy.get('#case-output-0').should('not.have.class', 'field-error');
            cy.get('.default').should('not.have.class', 'field-error');

            // Select Easy Path Expression variable type
            cy.get('#output-expression-type').select('simple');

            cy.get('#case-condition-0').should('not.have.class', 'field-error');
            cy.get('#case-output-0').should('not.have.class', 'field-error');
            cy.get('.default').should('not.have.class', 'field-error');
          }
        });
      });

      it('should cycle through case statement correctly from Easy Path Expression to FHIRPath Expression and back', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression)');

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
          cy.get('#variables-section .variable-row').should('have.length', 2);

          // The 'Output Expression' section should be visible
          cy.get('#final-expression-section').should('exist')
            .scrollIntoView().should('be.visible');

          // Check the "Case Statements Helper" checkbox
          cy.get('#case-statements').check();

          // The variable type should default to Easy Path Expression
          cy.get('#output-expression-type').should('exist').should('have.value', 'simple');

          // Use expressions checkbox should be checked
          cy.get('#output-expressions').should('be.checked')

          cy.get('#case-condition-0').should('not.have.class', 'field-error');
          cy.get('#case-output-0').should('not.have.class', 'field-error');
          cy.get('.default').should('not.have.class', 'field-error');

          // Populate case statements
          cy.get('#case-condition-0').clear().type('a > 1');
          cy.get('#case-output-0').clear().type("a");
          cy.get('#add-case').click();
          cy.get('#case-condition-1').clear().type('a < 5');
          cy.get('#case-output-1').clear().type("b");
          cy.get('.default').clear().type("'large'");

          for (let i = 0; i < 2; i++) {
            // Select FHIRPath Expression variable type
            cy.get('#output-expression-type').select('fhirpath');

            cy.get('#case-condition-0').should('not.have.class', 'field-error');
            cy.get('#case-output-0').should('not.have.class', 'field-error');
            cy.get('#case-condition-1').should('not.have.class', 'field-error');
            cy.get('#case-output-1').should('not.have.class', 'field-error');
            cy.get('.default').should('not.have.class', 'field-error');

            // The Case Statement should be converted to FHIRPath
            cy.get('#case-condition-0').should('have.value', '%a > 1');
            cy.get('#case-output-0').should('have.value', '%a');
            cy.get('#case-condition-1').should('have.value', '%a < 5');
            cy.get('#case-output-1').should('have.value', '%b');
            cy.get('.default').should('have.value', "'large'");

            // Select Easy Path Expression variable type
            cy.get('#output-expression-type').select('simple');

            cy.get('#case-condition-0').should('not.have.class', 'field-error');
            cy.get('#case-output-0').should('not.have.class', 'field-error');
            cy.get('#case-condition-1').should('not.have.class', 'field-error');
            cy.get('#case-output-1').should('not.have.class', 'field-error');
            cy.get('.default').should('not.have.class', 'field-error');

            // The Case Statement should be converted to FHIRPath
            cy.get('#case-condition-0').should('have.value', 'a > 1');
            cy.get('#case-output-0').should('have.value', 'a');
            cy.get('#case-condition-1').should('have.value', 'a < 5');
            cy.get('#case-output-1').should('have.value', 'b');
            cy.get('.default').should('have.value', "'large'");
          }
        });
      });

      it('should cycle through case statement correctly from Easy Path Expression to FHIRPath Expression and back with changes in FHIRPath', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression)');

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
          cy.get('#variables-section .variable-row').should('have.length', 2);

          // The 'Output Expression' section should be visible
          cy.get('#final-expression-section').should('exist')
            .scrollIntoView().should('be.visible');

          // Check the "Case Statements Helper" checkbox
          cy.get('#case-statements').check();

          // The variable type should default to Easy Path Expression
          cy.get('#output-expression-type').should('exist').should('have.value', 'simple');

          // Use expressions checkbox should be checked
          cy.get('#output-expressions').should('be.checked')

          cy.get('#case-condition-0').should('not.have.class', 'field-error');
          cy.get('#case-output-0').should('not.have.class', 'field-error');
          cy.get('.default').should('not.have.class', 'field-error');

          // Populate case statements
          cy.get('#case-condition-0').clear().type('a > 1');
          cy.get('#case-output-0').clear().type("a");
          cy.get('#add-case').click();
          cy.get('#case-condition-1').clear().type('a < 5');
          cy.get('#case-output-1').clear().type("b");
          cy.get('.default').clear().type("'large'");

          // Select FHIRPath Expression variable type
          cy.get('#output-expression-type').select('fhirpath');

          cy.get('#case-condition-0').should('not.have.class', 'field-error');
          cy.get('#case-output-0').should('not.have.class', 'field-error');
          cy.get('#case-condition-1').should('not.have.class', 'field-error');
          cy.get('#case-output-1').should('not.have.class', 'field-error');
          cy.get('.default').should('not.have.class', 'field-error');

          // The Case Statement should be converted to FHIRPath
          cy.get('#case-condition-0').should('have.value', '%a > 1');
          cy.get('#case-output-0').should('have.value', '%a');
          cy.get('#case-condition-1').should('have.value', '%a < 5');
          cy.get('#case-output-1').should('have.value', '%b');
          cy.get('.default').should('have.value', "'large'");

          // Update condition 1
          cy.get('#case-condition-1').clear().type('%a < 7');

          // Select Easy Path Expression variable type
          cy.get('#output-expression-type').select('simple');

          // Dialog should get displayed
          cy.get('lhc-fhirpath-easypath-conversion-confirmation-dialog #expression-conversion-base-dialog')
            .should('exist')
            .scrollIntoView()
            .should('be.visible')
            .within( ()=> {
              // Select 'Yes' to convert from 'FHIRPath Expression' to 'Easy Path Expression'
              cy.get('#yes-button').should('exist').click();
            });

          // The dialog should now disappeared
          cy.get('lhc-fhirpath-easypath-conversion-confirmation-dialog #expression-conversion-base-dialog')
            .should('not.exist');

          for (let i = 0; i < 2; i++) {
            // the Case Statement now should be empty but no erors
            cy.get('#case-condition-0').should('have.value', '');
            cy.get('#case-condition-0').should('not.have.class', 'field-error');
            cy.get('#case-output-0').should('have.value', '');
            cy.get('#case-output-0').should('not.have.class', 'field-error');
            cy.get('#case-condition-1').should('have.value', '');
            cy.get('#case-condition-1').should('not.have.class', 'field-error');
            cy.get('#case-output-1').should('have.value', '');
            cy.get('#case-output-1').should('not.have.class', 'field-error');
            cy.get('.default').should('have.value', '');
            cy.get('.default').should('not.have.class', 'field-error');

            // Select Easy Path Expression variable type
            cy.get('#output-expression-type').select('simple');

            // the Case Statement now should be empty but no erors
            cy.get('#case-condition-0').should('have.value', '');
            cy.get('#case-condition-0').should('not.have.class', 'field-error');
            cy.get('#case-output-0').should('have.value', '');
            cy.get('#case-output-0').should('not.have.class', 'field-error');
            cy.get('#case-condition-1').should('have.value', '');
            cy.get('#case-condition-1').should('not.have.class', 'field-error');
            cy.get('#case-output-1').should('have.value', '');
            cy.get('#case-output-1').should('not.have.class', 'field-error');
            cy.get('.default').should('have.value', '');
            cy.get('.default').should('not.have.class', 'field-error');

            // Select Easy Path Expression variable type
            cy.get('#output-expression-type').select('fhirpath');
          }
        });
      });

      it('should cycle through case statment with "Required" error correctly from Easy Path Expression to FHIRPath Expression and back', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression)');

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
          cy.get('#variables-section .variable-row').should('have.length', 2);

          // The 'Output Expression' section should be visible
          cy.get('#final-expression-section').should('exist')
            .scrollIntoView().should('be.visible');

          // Check the "Case Statements Helper" checkbox
          cy.get('#case-statements').check();

          // The variable type should default to Easy Path Expression
          cy.get('#output-expression-type').should('exist').should('have.value', 'simple');

          // Use expressions checkbox should be checked
          cy.get('#output-expressions').should('be.checked')

          cy.get('#case-condition-0').should('not.have.class', 'field-error');
          cy.get('#case-output-0').should('not.have.class', 'field-error');
          cy.get('.default').should('not.have.class', 'field-error');

          // Populate case statements
          cy.get('#case-condition-0').clear().type('a > 1');
          cy.get('#case-output-0').clear().type("a");
          cy.get('#add-case').click();
          cy.get('#case-condition-1').clear().type('a < 5');
          cy.get('#case-output-1').clear().type("b");
          cy.get('.default').clear().type("'large'");

          cy.get('#case-condition-0').should('not.have.class', 'field-error');
          cy.get('#case-output-0').should('not.have.class', 'field-error');
          cy.get('#case-condition-1').should('not.have.class', 'field-error');
          cy.get('#case-output-1').should('not.have.class', 'field-error');
          cy.get('.default').should('not.have.class', 'field-error');

          // Clear some fo the fields
          cy.get('#case-output-0').clear();
          cy.get('#case-condition-1').clear();
          cy.get('.default').clear();

          for (let i = 0; i < 2; i++) {
            cy.get('#case-condition-0').should('not.have.class', 'field-error');
            cy.get('#case-output-0').should('have.class', 'field-error');
            cy.get('#case-output-0-error').should('contain.text', 'The case output is required.');
            cy.get('#case-condition-1').should('have.class', 'field-error');
            cy.get('#case-condition-1-error').should('contain.text', 'The case condition is required.');
            cy.get('#case-output-1').should('not.have.class', 'field-error');
            cy.get('.default').should('have.class', 'field-error');
            cy.get('#default-case-error').should('contain.text', 'The default case is required.');

            // Select FHIRPath Expression variable type
            cy.get('#output-expression-type').select('fhirpath');

            cy.get('#case-condition-0').should('not.have.class', 'field-error');
            cy.get('#case-output-0').should('have.class', 'field-error');
            cy.get('#case-output-0').should('have.value', 'Required');
            cy.get('#case-output-0-error').should('contain.text', 'The case output is required.');
            cy.get('#case-condition-1').should('have.class', 'field-error');
            cy.get('#case-condition-1').should('have.value', 'Required');
            cy.get('#case-condition-1-error').should('contain.text', 'The case condition is required.');
            cy.get('#case-output-1').should('not.have.class', 'field-error');
            cy.get('.default').should('have.class', 'field-error');
            cy.get('.default').should('have.value', 'Required');
            cy.get('#default-case-error').should('contain.text', 'The default case is required.');

            // Select Easy Path Expression variable type
            cy.get('#output-expression-type').select('simple');

          }
        });
      });

      it('should cycle through case statment with "Not valid" error correctly from Easy Path Expression to FHIRPath Expression and back', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression)');

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
          cy.get('#variables-section .variable-row').should('have.length', 2);

          // The 'Output Expression' section should be visible
          cy.get('#final-expression-section').should('exist')
            .scrollIntoView().should('be.visible');

          // Check the "Case Statements Helper" checkbox
          cy.get('#case-statements').check();

          // The variable type should default to Easy Path Expression
          cy.get('#output-expression-type').should('exist').should('have.value', 'simple');

          // Use expressions checkbox should be checked
          cy.get('#output-expressions').should('be.checked')

          cy.get('#case-condition-0').should('not.have.class', 'field-error');
          cy.get('#case-output-0').should('not.have.class', 'field-error');
          cy.get('.default').should('not.have.class', 'field-error');

          // Populate case statements
          cy.get('#case-condition-0').clear().type('a > 1');
          cy.get('#case-output-0').clear().type("a");
          cy.get('#add-case').click();
          cy.get('#case-condition-1').clear().type('a < 5');
          cy.get('#case-output-1').clear().type("b");
          cy.get('.default').clear().type("'large'");

          cy.get('#case-condition-0').should('not.have.class', 'field-error');
          cy.get('#case-output-0').should('not.have.class', 'field-error');
          cy.get('#case-condition-1').should('not.have.class', 'field-error');
          cy.get('#case-output-1').should('not.have.class', 'field-error');
          cy.get('.default').should('not.have.class', 'field-error');

          // Clear some fo the fields
          cy.get('#case-output-0').clear().type('bogus');
          cy.get('#case-condition-1').clear().type('bogus');
          cy.get('.default').clear().type('bogus');

          for (let i = 0; i < 2; i++) {
            cy.get('#case-condition-0').should('not.have.class', 'field-error');
            cy.get('#case-output-0').should('have.class', 'field-error');
            cy.get('#case-output-0').should('have.value', 'bogus');
            cy.get('#case-output-0-error').should('contain.text', 'The case output is invalid.');
            cy.get('#case-condition-1').should('have.class', 'field-error');
            cy.get('#case-condition-1').should('have.value', 'bogus');
            cy.get('#case-condition-1-error').should('contain.text', 'The case condition is invalid.');
            cy.get('#case-output-1').should('not.have.class', 'field-error');
            cy.get('.default').should('have.class', 'field-error');
            cy.get('.default').should('have.value', 'bogus');
            cy.get('#default-case-error').should('contain.text', 'The default case is invalid.');

            // Select FHIRPath Expression variable type
            cy.get('#output-expression-type').select('fhirpath');

            cy.get('#case-condition-0').should('not.have.class', 'field-error');
            cy.get('#case-output-0').should('have.class', 'field-error');
            cy.get('#case-output-0').should('have.value', 'Not valid');
            cy.get('#case-output-0-error').should('contain.text', 'The case output is invalid.');
            cy.get('#case-condition-1').should('have.class', 'field-error');
            cy.get('#case-condition-1').should('have.value', 'Not valid');
            cy.get('#case-condition-1-error').should('contain.text', 'The case condition is invalid.');
            cy.get('#case-output-1').should('not.have.class', 'field-error');
            cy.get('.default').should('have.class', 'field-error');
            cy.get('.default').should('have.value', 'Not valid');
            cy.get('#default-case-error').should('contain.text', 'The default case is invalid.');

            // Select Easy Path Expression variable type
            cy.get('#output-expression-type').select('simple');

          }
        });
      });

      it('should export simple syntax extension for Easy Path Expression and "use expressions" unchecked', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression with cases)');

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
          cy.get('#variables-section .variable-row').should('have.length', 3);

          // The 'Output Expression' section should be visible
          cy.get('#final-expression-section').should('exist')
            .scrollIntoView().should('be.visible');

          // The "Case Statements Helper" checkbox should be checked
          cy.get('#case-statements').should('exist').should('be.checked');

          // The variable type should default to Easy Path Expression
          cy.get('#output-expression-type').should('exist').should('have.value', 'simple');

          // The 'use expressions' checkbox should be unchecked
          cy.get('#output-expressions').should('not.be.checked');

          // The case statements should not have errors
          cy.get('#case-condition-0').should('have.value', 'bmi<18.5');
          cy.get('#case-condition-0').should('not.have.class', 'field-error');
          cy.get('#case-output-0').should('have.value', 'underweight');
          cy.get('#case-output-0').should('not.have.class', 'field-error');
          cy.get('#case-condition-1').should('have.value', 'bmi<25');
          cy.get('#case-condition-1').should('not.have.class', 'field-error');
          cy.get('#case-output-1').should('have.value', 'normal');
          cy.get('#case-output-1').should('not.have.class', 'field-error');
          cy.get('#case-condition-2').should('have.value', 'bmi<30');
          cy.get('#case-condition-2').should('not.have.class', 'field-error');
          cy.get('#case-output-2').should('have.value', 'overweight');
          cy.get('#case-output-2').should('not.have.class', 'field-error');
          cy.get('.default').should('have.value', 'obese');
          cy.get('.default').should('not.have.class', 'field-error');

          // The preview should display the expression
          cy.get('lhc-syntax-preview pre').should('contain.text', "iif(%bmi<18.5,'underweight',iif(%bmi<25,'normal',iif(%bmi<30,'overweight','obese')))");

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
          expect(parsedData.item[3].extension[4]).to.deep.equal(
            {
              "url": "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression",
              "valueExpression": {
                "language": "text/fhirpath",
                "expression": "iif(%bmi<18.5,'underweight',iif(%bmi<25,'normal',iif(%bmi<30,'overweight','obese')))",
                "extension": [
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax",
                    "valueString": "iif(bmi<18.5,underweight,iif(bmi<25,normal,iif(bmi<30,overweight,obese)))"
                  }
                ]
              }
            }
          );
        });
      });

      it('should export simple syntax extension for Easy Path Expression and "use expressions" checked', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression with cases)');

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
          cy.get('#variables-section .variable-row').should('have.length', 3);

          // The 'Output Expression' section should be visible
          cy.get('#final-expression-section').should('exist')
            .scrollIntoView().should('be.visible');

          // The "Case Statements Helper" checkbox should be checked
          cy.get('#case-statements').should('exist').should('be.checked');

          // The variable type should default to Easy Path Expression
          cy.get('#output-expression-type').should('exist').should('have.value', 'simple');

          // The 'use expressions' checkbox should be unchecked
          cy.get('#output-expressions').should('not.be.checked');

          // The case statements should not have errors
          cy.get('#case-condition-0').should('have.value', 'bmi<18.5');
          cy.get('#case-condition-0').should('not.have.class', 'field-error');
          cy.get('#case-output-0').should('have.value', 'underweight');
          cy.get('#case-output-0').should('not.have.class', 'field-error');
          cy.get('#case-condition-1').should('have.value', 'bmi<25');
          cy.get('#case-condition-1').should('not.have.class', 'field-error');
          cy.get('#case-output-1').should('have.value', 'normal');
          cy.get('#case-output-1').should('not.have.class', 'field-error');
          cy.get('#case-condition-2').should('have.value', 'bmi<30');
          cy.get('#case-condition-2').should('not.have.class', 'field-error');
          cy.get('#case-output-2').should('have.value', 'overweight');
          cy.get('#case-output-2').should('not.have.class', 'field-error');
          cy.get('.default').should('have.value', 'obese');
          cy.get('.default').should('not.have.class', 'field-error');

          // Check the 'use expressions' checkbox
          cy.get('#output-expressions').check();

          // The case statements should not have errors
          cy.get('#case-condition-0').should('have.value', 'bmi<18.5');
          cy.get('#case-condition-0').should('not.have.class', 'field-error');
          cy.get('#case-output-0').clear().type("'underweight'");
          cy.get('#case-output-0').should('not.have.class', 'field-error');
          cy.get('#case-condition-1').should('have.value', 'bmi<25');
          cy.get('#case-condition-1').should('not.have.class', 'field-error');
          cy.get('#case-output-1').clear().type("'normal'");
          cy.get('#case-output-1').should('not.have.class', 'field-error');
          cy.get('#case-condition-2').should('have.value', 'bmi<30');
          cy.get('#case-condition-2').should('not.have.class', 'field-error');
          cy.get('#case-output-2').clear().type("'overweight'");
          cy.get('#case-output-2').should('not.have.class', 'field-error');
          cy.get('.default').clear().type("'obese'");
          cy.get('.default').should('not.have.class', 'field-error');

          // The preview should display the expression
          cy.get('lhc-syntax-preview pre').should('contain.text', "iif(%bmi<18.5,'underweight',iif(%bmi<25,'normal',iif(%bmi<30,'overweight','obese')))");

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
          expect(parsedData.item[3].extension[4]).to.deep.equal(
            {
              "url": "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression",
              "valueExpression": {
                "language": "text/fhirpath",
                "expression": "iif(%bmi<18.5,'underweight',iif(%bmi<25,'normal',iif(%bmi<30,'overweight','obese')))",
                "extension": [
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax",
                    "valueString": "iif(bmi<18.5,'underweight',iif(bmi<25,'normal',iif(bmi<30,'overweight','obese')))"
                  }
                ]
              }
            }
          );
        });
      });
    });
  });
});