describe('Rule editor', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Angular Library', () => {
    describe('BMI calculation', () => {
      it('should display the editor', () => {
        cy.title().should('eq', 'Rule Editor');
        // Uneditable variables section should not show up
        cy.get('#uneditable-variables-section .variable-row').should('have.length', 0);
        // Variables section
        cy.get('lhc-variables > h2').should('contain', 'Item Variables');
        cy.get('#variables-section .variable-row').should('have.length', 2);
        // Final expression
        cy.get('#final-expression-section h2').should('contain', 'Output Expression');
      });

      it('should be possible to add a variable', () => {
        cy.get('#variables-section .variable-row').should('have.length', 2);
        cy.get('#add-variable').click();
        cy.get('#variables-section .variable-row').should('have.length', 3);
      });

      it('should be possible to remove a variable', () => {
        cy.get('#variables-section .variable-row').should('have.length', 2);
        cy.get('.remove-variable').last().click();
        cy.get('#variables-section .variable-row').should('have.length', 1);
      });

      it('should produce the correct FHIR Questionnaire', () => {
        cy.get('#export').click();
        cy.get('#output').contains('"expression": "%a/%b.power(2)"');
      });

      it('should be user stylable', () => {
        // User styled input fields have a light yellow background. Declared via an attribute
        cy.get('lhc-rule-editor input:not([type="checkbox"])').first()
          .should('have.attr', 'style', 'background-color: rgb(255, 255, 238);');
      });

      it('should be able to select autocomplete question', () => {
        cy.get('#question-1').clear().type('bmi');
        cy.get('span#completionOptions > ul > li').contains('39156-5').click();
        cy.get('#question-1').parent().next('.unit-select').children('select').should('not.exist');
        cy.get('#question-1').clear().type('height');
        cy.get('span#completionOptions > ul > li').contains('8302-2').click();
        cy.get('#question-1').parent().next('.unit-select').children('select').should('exist'); 
      });

      it('should be able to add variable(s) to default question', () => {
        cy.title().should('eq', 'Rule Editor');

        // By default, the selected item is BMI
        cy.get('#question').should('exist').should('be.visible').should('have.value', 'BMI (/39156-5)');

        // Variables section
        cy.get('lhc-variables > h2').should('contain', 'Item Variables');
        cy.get('#variables-section .variable-row').should('have.length', 2);

        // Output Expression section should be displayed
        cy.get('#final-expression-section h2').should('contain', 'Output Expression');

        // Add a new variable
        cy.get('#add-variable').click();
        cy.get('#variables-section .variable-row').should('have.length', 3);
        cy.get('div#row-2')
          .within(() => {
            cy.get('#variable-label-2').clear().type('39156_5_variable2');
            cy.get('#variable-type-2').should('have.value', 'question');
            cy.get('#question-2').clear().type('Clothing worn during measure');
          });
        cy.get('span#completionOptions > ul > li').contains('8352-7').click();

        // Save (Export) should output the questionnaire for the given Variable Type
        cy.get('#export').click();

        // Checking the output, it should have the new variable created under the BMI item extension
        cy.get('pre#output').invoke('text').then((jsonData) => {
            // Parse the JSON data
            const parsedData = JSON.parse(jsonData);

            expect(parsedData.item).to.exist;
            expect(parsedData.item).to.have.lengthOf(5);
            expect(parsedData.item[3].linkId).to.exist;
            expect(parsedData.item[3].linkId).to.have.string('/39156-5');
            expect(parsedData.item[3].extension).to.exist;
            expect(parsedData.item[3].extension).that.contains.name.match(/^39156_5_variable2/);
        });
      });

      it('should be able to select a different question in the questionnaire and add a variable', () => {
        cy.title().should('eq', 'Rule Editor');

        // By default, the selected item is BMI
        cy.get('#question').should('exist').should('be.visible').should('have.value', 'BMI (/39156-5)');

        // Select a different item in the quesitonnaire
        cy.get('#question').clear().type('Clothing worn during measure');
        cy.get('span#completionOptions > ul > li').contains('8352-7').click();
        cy.get('#question').should('have.value', 'Clothing worn during measure (/8352-7)');

        // Variables section
        cy.get('lhc-variables > h2').should('contain', 'Item Variables');
        cy.get('#variables-section .variable-row').should('have.length', 0);

        // Output Expression section should be displayed
        cy.get('#final-expression-section h2').should('contain', 'Output Expression');

        // Add a new variable
        cy.get('#add-variable').click();
        cy.get('#variables-section .variable-row').should('have.length', 1);
        cy.get('#variable-label-0').clear().type('8352_7_variable0');
        cy.get('#variable-type-0').select('Easy Path Expression');
        cy.get('#simple-expression-0').type('1 + 1');

        // Save (Export) should output the questionnaire for the given Variable Type
        cy.get('#export').click();

        // Checking the output, it should have the new variable created under the 
        // "Clothing worn during measure" item extension
        cy.get('pre#output').invoke('text').then((jsonData) => {
            // Parse the JSON data
            const parsedData = JSON.parse(jsonData);

            expect(parsedData.item).to.exist;
            expect(parsedData.item).to.have.lengthOf(5);
            expect(parsedData.item[1].linkId).to.exist;
            expect(parsedData.item[1].linkId).to.have.string('/8352-7');
            expect(parsedData.item[1].extension).to.exist;
            expect(parsedData.item[1].extension).that.contains.name.match(/^8352_7_variable0/);
        });
      });

      it('should be able to select and add a variable to root level', () => {
        cy.title().should('eq', 'Rule Editor');

        // By default, the selected item is BMI
        cy.get('#question').should('exist').should('be.visible').should('have.value', 'BMI (/39156-5)');

        // Select the Root level (no item selected)
        cy.get('#useRootLevel').check();

        // Variables section
        cy.get('lhc-variables > h2').should('contain', 'Item Variables');
        cy.get('#variables-section .variable-row').should('have.length', 0);

        // Output Expression section should be hidden
        cy.get('#final-expression-section').should('not.exist');

        // Add a new variable
        cy.get('#add-variable').click();
        cy.get('#variables-section .variable-row').should('have.length', 1);
        cy.get('#variable-label-0').clear().type('root_variable0');
        cy.get('#variable-type-0').select('Easy Path Expression');
        cy.get('#simple-expression-0').type('1 + 1');

        // Save (Export) should output the questionnaire for the given Variable Type
        cy.get('#export').click();
        
        // Checking the output, it should have the new variable created under the root extension
        cy.get('pre#output').invoke('text').then((jsonData) => {
            // Parse the JSON data
            const parsedData = JSON.parse(jsonData);

            expect(parsedData.extension).to.exist;
            expect(parsedData.extension).to.have.lengthOf(1);
            expect(parsedData.extension[0].valueExpression).to.exist;
            expect(parsedData.extension[0].valueExpression.name).to.exist;
            expect(parsedData.extension[0].valueExpression.name).to.have.string('root_variable0');
        });
      });
            
      it('should URL encoded the output for the x-fhir-output', () => {
        cy.get('#questionnaire-select').select('BMI Calculation (Easy Path expression)');
        
        // Add a variable
        cy.get('#add-variable').click();
        cy.get('#variables-section .variable-row').should('have.length', 3);
        
        // Select FHIR Query (Observation) as Variable Type
        cy.get('#variable-type-2').select('FHIR Query (Observation)');
        
        // Select Code 1
        cy.get('#autocomplete-2').type('Vit A Bld-mCnc');
        cy.contains('2922-3').click();

        // Confirm that the selection is displayed
        cy.get('div#row-2')
          .find('div.query-select > span.autocomp_selected > ul > li')
          .should('have.text', '×Vit A Bld-mCnc - 2922-3');

        // Select Code 2
        cy.get('#autocomplete-2').type('CV B blend Ab Ser-Imp');
        cy.contains('20996-5').click();

        // Confirm that the selection is displayed
        cy.get('div#row-2')
          .find('div.query-select > span.autocomp_selected > ul > li')
          .should('contain.text', '×CV B blend Ab Ser-Imp - 20996-5');

        // Check the x-fhir-output
        cy.get('lhc-query-observation>div.syntax-preview>pre.d-inline')
          .should('contain', 'Observation?code=http://loinc.org|2922-3,http://loinc.org|20996-5&date=gt{{today()-1 months}}&patient={{%patient.id}}&_sort=-date&_count=1');

        // Click Save
        cy.get('#export').click();

        // Export output should contain the URL Encoded of the x-fhir-output
        cy.get('pre#output')
          .should('contain', 'Observation?code=http%3A%2F%2Floinc.org%7C2922-3%2Chttp%3A%2F%2Floinc.org%7C20996-5&date=gt{{today()-1 months}}&patient={{%patient.id}}&_sort=-date&_count=1');
      });


      it('should be able to retain settings when check the Advance Interface checkbox', () => {
        cy.get('#questionnaire-select').select('BMI Calculation (Easy Path expression)');
     
        cy.title().should('eq', 'Rule Editor');

        // Variables section
        cy.get('lhc-variables > h2').should('contain', 'Item Variables');
        cy.get('#variables-section .variable-row').should('have.length', 2);

        cy.get('div#row-0')
          .within(() => {
            cy.get('#variable-type-0').should('have.value', 'question');
            cy.get('#question-0').should('have.value', "Weight (/29463-7)" );
            cy.get('div.unit-select>select').select('lbs');
          });

        cy.get('div#row-1')
          .within(() => {
            cy.get('#variable-type-1').should('have.value', 'question');
            cy.get('#question-1').should('have.value', "Body height (/8302-2)" );    
            cy.get('div.unit-select>select').select('cm');
          });

        // Add a variable
        cy.get('#add-variable').should('exist').should('be.visible').click();
        cy.get('#variables-section .variable-row').should('have.length', 3);
                
        cy.get('div#row-2')
          .within(() => {
            cy.get('#variable-type-2').select('FHIR Query (Observation)');
            cy.get('#autocomplete-2').type('Vit A Bld-mCnc');
          });

        cy.contains('2922-3').click();
        cy.get('div#row-2')
          .within(() => {
            cy.get('div.time-input').should('exist');
            cy.get('div.time-input > input').clear().type('3');
            cy.get('div.time-input > input').should('have.value', '3');

            cy.get('div.time-select > select').should('exist');
            cy.get('div.time-select > select > option').should('have.length', 4);
            cy.get('div.time-select > select').select('years');
          });

        // Check the Advanced Interface checkbox
        cy.get('input#advanced-interface').check();

        // Validate variables settings didn't get reset
        cy.get('div#row-0')
          .within(() => {
            cy.get('#variable-type-0').should('have.value', 'question');
            cy.get('#question-0').should('have.value', "Weight (/29463-7)" );
            // The unit however should get reset to default
            cy.get('div.unit-select > select').should('have.value', 'lbs');
          });

        cy.get('div#row-1')
          .within(() => {
            cy.get('#variable-type-1').should('have.value', 'question');
            cy.get('#question-1').should('have.value', "Body height (/8302-2)" );
            // The unit however should get reset to default
            cy.get('div.unit-select>select').should('have.value', 'cm');
          });

          cy.get('div#row-2')
          .within(() => {
            cy.get('select#variable-type-2').should('have.value', 'queryObservation');
            
            cy.get('div.time-input').should('exist');
            cy.get('div.time-input > input').should('have.value', '3');

            cy.get('div.time-select > select').should('exist');
            cy.get('div.time-select > select').should('have.value', 'years');
          });
      });

      it('should be able to retain setting when swapping questions and check the Advance Interface checkbox', () => {
        cy.get('#questionnaire-select').select('BMI Calculation (Easy Path expression)');
    
        cy.title().should('eq', 'Rule Editor');

        // Variables section
        cy.get('lhc-variables > h2').should('contain', 'Item Variables');
        cy.get('#variables-section .variable-row').should('have.length', 2);

        cy.get('div#row-0')
          .within(() => {
            cy.get('#variable-type-0').should('have.value', 'question');
            cy.get('#question-0').should('have.value', "Weight (/29463-7)" );
            cy.get('#question-0').clear().type('height');
          });
        cy.get('span#completionOptions > ul > li').contains('8302-2').click();

        cy.get('div#row-0')
          .within(() => {
            cy.get('#question-0').should('have.value', "Body height (/8302-2)" );
            cy.get('div.unit-select > select > option').should('have.length', 3);
            cy.get('div.unit-select > select').select('cm');
          });

        cy.get('div#row-1')
          .within(() => {
            cy.get('#variable-type-1').should('have.value', 'question');
            cy.get('#question-1').should('have.value', "Body height (/8302-2)" );
            cy.get('#question-1').clear().type("Weight");
          });
        cy.get('span#completionOptions > ul > li').contains('29463-7').click();
        cy.get('div#row-1')
          .within(() => {
            cy.get('#question-1').should('have.value', "Weight (/29463-7)" );
            cy.get('div.unit-select > select > option').should('have.length', 2);
            cy.get('div.unit-select>select').select('lbs');
          });

        // Check the Advanced Interface checkbox
        cy.get('input#advanced-interface').check();

        // Validate variables settings didn't get reset
        cy.get('div#row-0')
          .within(() => {
            cy.get('#variable-type-0').should('have.value', 'question');
            cy.get('#question-0').should('have.value', "Body height (/8302-2)" );
            // The unit however should get reset to default
            cy.get('div.unit-select>select').should('have.value', 'cm');
          });

        cy.get('div#row-1')
          .within(() => {
            cy.get('#variable-type-1').should('have.value', 'question');
            cy.get('#question-1').should('have.value', "Weight (/29463-7)" );
            // The unit however should get reset to default
            cy.get('div.unit-select>select').should('have.value', 'lbs');
          });
      });

      it('should be able to switch from Question variable type to FHIRPath Expression and back', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression)');

        cy.title().should('eq', 'Rule Editor');

        // Variables section
        cy.get('lhc-variables > h2').should('contain', 'Item Variables');
        cy.get('#variables-section .variable-row').should('have.length', 2);

        // Check the Advanced Interface checkbox
        cy.get('input#advanced-interface').check();

        // Add a variable
        cy.get('#add-variable').should('exist').should('be.visible').click();
        cy.get('#variables-section .variable-row').should('have.length', 3);

        cy.get('div#row-2')
          .within(() => {
            cy.get('#variable-type-2')
              .should('have.value', 'question');
            cy.get('#question-2').clear().type('height');
          });

        cy.get('#completionOptions').contains('8302-2').click();

        cy.get('div#row-2')
          .within(() => {
            cy.get('div.unit-select>select').select('cm');

            cy.get('div.fhirpath > pre').should('contain.text',
              "%resource.item.where(linkId='/8302-2').answer.value*2.54");

            // Switch to FHIRPath Expression variable type
            cy.get('#variable-type-2').select('expression');
            cy.get('#variable-expression-2').should('have.value',
              "%resource.item.where(linkId='/8302-2').answer.value*2.54");

            // Switch back to Question variable type
            cy.get('#variable-type-2').select('question');
            cy.get('#question-2').should('have.value', 'Body height (/8302-2)');
            cy.get('div.unit-select>select').should('have.value', 'cm');
            cy.get('div.fhirpath > pre').should('contain.text',
              "%resource.item.where(linkId='/8302-2').answer.value*2.54");

          });

      });
      
      it('should retain Question setting when the Advanced Interface checkbox is clicked', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression)');

        cy.title().should('eq', 'Rule Editor');

        // Variables section
        cy.get('lhc-variables > h2').should('contain', 'Item Variables');
        cy.get('#variables-section .variable-row').should('have.length', 2);

        // Add a variable
        cy.get('#add-variable').should('exist').should('be.visible').click();
        cy.get('#variables-section .variable-row').should('have.length', 3);

        cy.get('div#row-2')
          .within(() => {
            cy.get('#variable-type-2')
              .should('have.value', 'question');
            cy.get('#question-2').clear().type('height');
          });

        cy.get('#completionOptions').contains('8302-2').click();

        cy.get('div#row-2')
          .within(() => {
            cy.get('div.unit-select>select').select('cm');

            cy.get('div.fhirpath > pre').should('contain.text',
              "%resource.item.where(linkId='/8302-2').answer.value*2.54");
          });

          // Check the Advanced Interface checkbox
          cy.get('input#advanced-interface').check();

          // Validate that the settings still there
          cy.get('div#row-2')
          .within(() => {
            cy.get('div.unit-select>select').should('have.value', 'cm');

            cy.get('div.fhirpath > pre').should('contain.text',
              "%resource.item.where(linkId='/8302-2').answer.value*2.54");
          });
      });

      it('should be able to save FHIR Query resource other than Observation', () => {
        cy.get('#questionnaire-select').select('BMI Calculation (Easy Path expression)');
    
        cy.title().should('eq', 'Rule Editor');

        // Variables section
        cy.get('lhc-variables > h2').should('contain', 'Item Variables');
        cy.get('#variables-section .variable-row').should('have.length', 2);

        // Check the Advanced Interface checkbox
        cy.get('input#advanced-interface').check();

        cy.get('div#row-0')
          .within(() => {
            cy.get('#variable-type-0')
              .should('have.value', 'question')
              .select('queryObservation');
            cy.get('#autocomplete-0').type('Vit A Bld-mCnc');
          });

        cy.contains('2922-3').click();

        cy.get('div#row-0')
          .within(() => {
            cy.get('#variable-type-0')
              .should('have.value', 'queryObservation')
              .select('query');
            cy.get('#variable-expression-0')
              .should('exist')
              .should('contain.value', 
                'Observation?code=http://loinc.org|2922-3&date=gt{{today()-1 months}}');

            // Replace Observation resource with Patient resource
            cy.get('#variable-expression-0')
              .invoke('val')
              .then((currentValue: string) => {
                const modifiedValue = currentValue.replace('Observation', 'Patient');
                cy.get('#variable-expression-0')
                  .clear()
                  .type(`${modifiedValue}`, {parseSpecialCharSequences: false});
              });
          });

          // Export
          cy.get('button#export').should('exist').click();

          // Validate that the expression was updated correctly
          cy.get('pre#output')
            .should('contain', 'Patient?code=http%3A%2F%2Floinc.org%7C2922-3&date=gt{{today()-1 months}}');
      });

      it('should be able to parse and save FHIR Query', () => {
        cy.get('#questionnaire-select').select('BMI Calculation (Easy Path expression)');
    
        cy.title().should('eq', 'Rule Editor');

        // Variables section
        cy.get('lhc-variables > h2').should('contain', 'Item Variables');
        cy.get('#variables-section .variable-row').should('have.length', 2);

        // Check the Advanced Interface checkbox
        cy.get('input#advanced-interface').check();

        cy.get('div#row-0')
          .within(() => {
            cy.get('#variable-type-0')
              .should('have.value', 'question')
              .select('query');
            cy.get('#variable-expression-0')
              .should('exist')
              .clear()
              .type('Observation');
          });

        // Export
        cy.get('button#export').should('exist').click();
        // Validate that the expression was updated correctly
        cy.get('pre#output')
        .should('contain.text', '"expression": "Observation"');

        // Update FHIR Query with question mark but no parameters
        cy.get('#variable-expression-0')
        .clear()
        .type('Observation?');
        // Export
        cy.get('button#export').should('exist').click();
        // Validate that the expression was updated correctly
        cy.get('pre#output')
        .should('contain.text', '"expression": "Observation"');

        // Update FHIR Query with missing code value
        cy.get('#variable-expression-0')
        .clear()
        .type('Observation?code=');
        // Export
        cy.get('button#export').should('exist').click();
        // Validate that the expression was updated correctly
        cy.get('pre#output')
        .should('contain.text', '"expression": "Observation"');        

        // Update FHIR Query with code
        cy.get('#variable-expression-0')
        .clear()
        .type('Observation?code=http://loinc.org|2922-3');
        // Export
        cy.get('button#export').should('exist').click();
        // Validate that the expression was updated correctly
        cy.get('pre#output')
        .should('contain.text', '"expression": "Observation?code=http%3A%2F%2Floinc.org%7C2922-3"');  

        // Update FHIR Query with missing }} in parameter string.
        cy.get('#variable-expression-0')
        .clear()
        .type('Observation?code=http://loinc.org|2922-3&date=gt{{today()-1 months');
        // Export
        cy.get('button#export').should('exist').click();
        // Validate that the expression was updated correctly
        cy.get('pre#output')
        .should('contain.text', 
          '"expression": "Observation?code=http%3A%2F%2Floinc.org%7C2922-3&date=gt{{today()-1 months"');  

        // Update FHIR Query with multiple {{}} in parameter string.  URL encoded on string outside of {{}}
        cy.get('#variable-expression-0')
        .clear()
        .type('Observation?code=http://loinc.org|2922-3&date=gt{{today()-1 months}} and {{today()}}',
          {parseSpecialCharSequences: false});
        // Export
        cy.get('button#export').should('exist').click();
        // Validate that the expression was updated correctly
        cy.get('pre#output')
        .should('contain.text', 
          '"expression": "Observation?code=http%3A%2F%2Floinc.org%7C2922-3&date=gt{{today()-1 months}}%20and%20{{today()}}"');  
      });

      it('should be able reselect the Variable type correctly once the Advanced Interface checkbox is unchecked', () => {
        cy.get('#questionnaire-select').select('BMI Calculation (Easy Path expression)');
        cy.title().should('eq', 'Rule Editor');

        // Variables section
        cy.get('lhc-variables > h2').should('contain', 'Item Variables');
        cy.get('#variables-section .variable-row').should('have.length', 2);

        // Check the Advanced Interface checkbox
        cy.get('input#advanced-interface').check();

        cy.get('div#row-0')
          .within(() => {
            cy.get('#variable-type-0').should('have.value', 'question').select('query');
            cy.get('#variable-expression-0').should('exist').should('be.visible');
            cy.get('#variable-type-0').should('have.value', 'query').select('queryObservation');
            cy.get('#variable-expression-0').should('not.exist');
            cy.get('#autocomplete-0').should('exist').should('be.visible');
          });

        // Uncheck the Advanced Interface checkbox
        cy.get('input#advanced-interface').uncheck();

        cy.get('div#row-0')
          .within(() => {
            cy.get('#variable-type-0').should('have.value', 'queryObservation');
            cy.get('#variable-expression-0').should('not.exist');
            cy.get('#autocomplete-0').should('exist').should('be.visible');
          });
      });

      it('should be able to reset Question data item selection once Simple or queryObservation is filled in ', () => {
        cy.get('#questionnaire-select').select('BMI Calculation (Easy Path expression)');
        cy.title().should('eq', 'Rule Editor');

        // Variables section
        cy.get('lhc-variables > h2').should('contain', 'Item Variables');
        cy.get('#variables-section .variable-row').should('have.length', 2);

        // Check the Advanced Interface checkbox
        cy.get('input#advanced-interface').check();

        cy.get('div#row-0')
          .within(() => {
            cy.get('#variable-type-0').should('have.value', 'question');
            cy.get('#question-0')
              .should('exist')
              .should('be.visible')
              .should('have.value', 'Weight (/29463-7)');

            // Select FHIRPath Expression variable type
            cy.get('#variable-type-0').select('expression');
            cy.get('#variable-expression-0')
              .should('exist')
              .should('be.visible')
              .should('have.value', "%resource.item.where(linkId='/29463-7').answer.value");

            // Reselect Question variable type, it still should show Question as Weight 
            cy.get('#variable-type-0').select('question');
            cy.get('#question-0')
              .should('exist')
              .should('be.visible')
              .should('have.value', 'Weight (/29463-7)');

            // Select FHIR Query Expression variable type
            cy.get('#variable-type-0').select('query');
            cy.get('#variable-expression-0')
              .should('exist')
              .should('be.visible')
              .should('have.value', "%resource.item.where(linkId='/29463-7').answer.value");

            // Reselect Question variable type, it still should show Question as Weight 
            cy.get('#variable-type-0').select('question');
            cy.get('#question-0')
              .should('exist')
              .should('be.visible')
              .should('have.value', 'Weight (/29463-7)');   
              
            // Select FHIR Query Observation variable type
            cy.get('#variable-type-0').select('queryObservation');
            cy.get('#autocomplete-0').type('Vit A Bld-mCnc');
          });
        cy.get('#completionOptions').contains('2922-3').click();

        cy.get('div#row-0')
          .within(() => {
            // Reselect Question variable type, it should now be unselected 
            cy.get('#variable-type-0').select('question');
            cy.get('#question-0')
              .should('exist')
              .should('be.visible')
              .should('have.value', "");

            // Select question Weight again
            cy.get('#question-0').clear().type('weight');
          });

        cy.get('#completionOptions').contains('29463-7').click();

        cy.get('div#row-0')
          .within(() => {
            // Now select Easy Path Expression variable type
            cy.get('#variable-type-0').select('simple');
            cy.get('input.simple-expression')
              .should('exist')
              .should('be.visible')
              .type('1 + 1');

            // Reselect Question variable type, it should now be unselected 
            cy.get('#variable-type-0').select('question');
            cy.get('#question-0')
              .should('exist')
              .should('be.visible')
              .should('have.value', "");
          });
      });

      it('should be able to reset simple expression data is filled in other Variable types', () => {
        cy.get('#questionnaire-select').select('BMI Calculation (Easy Path expression)');
        cy.title().should('eq', 'Rule Editor');

        // Variables section
        cy.get('lhc-variables > h2').should('contain', 'Item Variables');
        cy.get('#variables-section .variable-row').should('have.length', 2);

        // Check the Advanced Interface checkbox
        cy.get('input#advanced-interface').check();

        cy.get('div#row-1')
          .within(() => {
            cy.get('#variable-type-1').should('have.value', 'question').select('simple');
            cy.get('input.simple-expression')
              .should('exist')
              .should('be.visible')
              .type('a + 1');
            cy.get('div.fhirpath > pre').should('contain.text', '%a + 1');

            // Select FHIRPath Expression variable type
            cy.get('#variable-type-1').select('expression');
            cy.get('#variable-expression-1')
              .should('exist')
              .should('be.visible')
              .should('have.value', "%a + 1");

            // No change in FHIRPath Expression, so switching back to Easy Path Expression should retain.
            cy.get('#variable-type-1').select('simple');
            cy.get('input.simple-expression')
              .should('exist')
              .should('be.visible')
              .should('have.value', 'a + 1');
            cy.get('div.fhirpath > pre').should('contain.text', '%a + 1');
            
            // Same with FHIR Query variable type
            cy.get('#variable-type-1').select('query');
            cy.get('#variable-expression-1')
              .should('exist')
              .should('be.visible')
              .should('have.value', "%a + 1");

            // No change in FHIR Query Expression, so switching back to Easy Path Expression should retain.
            cy.get('#variable-type-1').select('simple');
            cy.get('input.simple-expression')
              .should('exist')
              .should('be.visible')
              .should('have.value', 'a + 1');
            cy.get('div.fhirpath > pre').should('contain.text', '%a + 1');

            // Switching to FHIR Query Observation variable type should show empty data since the Simple
            // expression does not applied
            cy.get('#variable-type-1').select('queryObservation');
            cy.get('#autocomplete-1').should('exist').should('be.visible').should('have.value', '');

            // Likewise, switching to Question variable type also should have no question selected
            cy.get('#variable-type-1').select('question');
            cy.get('#question-1')
              .should('exist')
              .should('be.visible')
              .should('have.value', '');

            // However, if data is populated, then it should clear out the simple expression
            // Select question Weight again
            cy.get('#question-1').clear().type('weight');
          });

        cy.get('#completionOptions').contains('29463-7').click();

        cy.get('div#row-1')
          .within(() => {
            // Switch back to Easy Path Expression variable type.  The expression should get cleared out
            cy.get('#variable-type-1').select('simple');
            cy.get('input.simple-expression')
              .should('exist')
              .should('be.visible')
              .should('have.value', '');
          });
      });

      it('should be able to reset linkId that was used by Question variable type once data is filled in other Variable type', () => {
        cy.get('#questionnaire-select').select('BMI Calculation (Easy Path expression)');
        cy.title().should('eq', 'Rule Editor');

        // Variables section
        cy.get('lhc-variables > h2').should('contain', 'Item Variables');
        cy.get('#variables-section .variable-row').should('have.length', 2);

        // Check the Advanced Interface checkbox
        cy.get('input#advanced-interface').check();

        cy.get('div#row-1')
          .within(() => {
            cy.get('#variable-type-1').should('have.value', 'question');
            cy.get('#question-1')
              .should('exist')
              .should('be.visible')
              .should('have.value', 'Body height (/8302-2)');
            cy.get('div.fhirpath > pre')
              .should('contain.text', "%resource.item.where(linkId='/8302-2').answer.value");

            // Select FHIRPath Expression variable type
            cy.get('#variable-type-1').select('expression');
            cy.get('#variable-expression-1')
              .should('exist')
              .should('be.visible')
              .should('have.value', "%resource.item.where(linkId='/8302-2').answer.value*0.0254");

            // No change in FHIRPath Expression, so switching back to Question variable type should retain the value.
            cy.get('#variable-type-1').select('question');
            cy.get('#question-1')
              .should('exist')
              .should('be.visible')
              .should('have.value', 'Body height (/8302-2)');
            cy.get('div.fhirpath > pre')
              .should('contain.text', "%resource.item.where(linkId='/8302-2').answer.value");
            
            // Same with FHIR Query variable type
            cy.get('#variable-type-1').select('query');
            cy.get('#variable-expression-1')
              .should('exist')
              .should('be.visible')
              .should('have.value', "%resource.item.where(linkId='/8302-2').answer.value*0.0254");

            // No change in FHIR Query Expression, so switching back to Question Expression should retain the value.
            cy.get('#variable-type-1').select('question');
            cy.get('#question-1')
              .should('exist')
              .should('be.visible')
              .should('have.value', 'Body height (/8302-2)');
            cy.get('div.fhirpath > pre')
              .should('contain.text', "%resource.item.where(linkId='/8302-2').answer.value");

            // Switching to FHIR Query Observation variable type should show empty data since the Question
            // FHIRPath expression does not applied
            cy.get('#variable-type-1').select('queryObservation');
            cy.get('#autocomplete-1').should('exist').should('be.visible').should('have.value', '');

            // Likewise, switching to Easy Path Expression variable type also should empty data
            cy.get('#variable-type-1').select('simple');
            cy.get('input.simple-expression')
              .should('exist')
              .should('be.visible')
              .should('have.value', '');

            // However, if data is populated, then it should clear out the simple expression
            cy.get('input.simple-expression').clear().type('a + 1');
            cy.get('div.fhirpath > pre').should('contain.text', '%a + 1');

            // Switching to Question variable type should no longer have question selected.
            cy.get('#variable-type-1').select('question');
            cy.get('#question-1')
              .should('exist')
              .should('be.visible')
              .should('have.value', '');
          });
      });
      
      it('should display the output when the Save(export) button is clicked', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation');
        cy.get('#variable-type-0 option').should('have.length', 5);

        // Select FHIR Query (Observation) for Variable Type
        cy.get('#variable-type-0').select('FHIR Query (Observation)');
        cy.get('#autocomplete-0').type('weight');
        cy.contains('29463-7').click();

        // Confirm that the selection is displayed
        cy.get('div#row-0')
          .find('div.query-select > span.autocomp_selected > ul > li')
          .should('have.text', '×Weight - 29463-7');

        // Save (Export) should output the questionnaire for the given Variable Type
        cy.get('#export').click();
        cy.get('pre#output').should('contain.text', '(%a/(%b.power(2))).round(1)');
      });

      it('should get variable updates in the Output Expression section when adding/deleting variables', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression)');
        
        // Variables section
        cy.get('lhc-variables > h2').should('contain', 'Item Variables');
        cy.get('#variables-section .variable-row').should('have.length', 2);
        
        // Output expression 
        cy.get('#simple-expression-final').clear().type('a + b');
        cy.get('lhc-syntax-preview>div>div>pre').should('not.have.text', 'Not valid');
  
        // Add variable c
        cy.get('#add-variable').click();
        cy.get('#variables-section .variable-row').should('have.length', 3);
        cy.get('#question-2').clear().type('BMI (/39156-5)');
        cy.contains('39156-5').click();
  
        // Confirm that variable c is available for Output expression 
        cy.get('#simple-expression-final').clear().type('a + b + c');
        cy.get('lhc-syntax-preview>div>div>pre').should('not.have.text', 'Not valid');
  
        // Delete variable b
        cy.get('#remove-variable-1').click();
        cy.get('#variables-section .variable-row').should('have.length', 2);
  
        // Confirm that variable b is no longer available for Output expression
        cy.get('lhc-syntax-preview>div>div>pre').should('contain.text', 'Not valid');
  
        // Confirm that expression without variable b is valid
        cy.get('#simple-expression-final').clear().type('a + c');
        cy.get('lhc-syntax-preview>div>div>pre').should('not.have.text', 'Not valid');
  
      });
    });

    describe('PHQ9 score calculation', () => {
      beforeEach(() => {
        cy.get('#questionnaire-select').select('PHQ9 (no FHIRPath)');
      });

      it('should display the editor', () => {
        // Only the prompt for score calculation should show up
        cy.get('.rule-editor').contains('Would you like to calculate the sum of scores?');
      });

      it('should produce the calculation', () => {
        cy.get('#export-score').click();
        cy.get('#output').contains('"expression": "iif(%any_questions_answered, iif(%a.exists(), %a, 0) + iif(%b.exists(), %b, 0) + ' +
          'iif(%c.exists(), %c, 0) + iif(%d.exists(), %d, 0) + iif(%e.exists(), %e, 0) + iif(%f.exists(), %f, 0) + ' +
          'iif(%g.exists(), %g, 0) + iif(%h.exists(), %h, 0) + iif(%i.exists(), %i, 0), {})"'
        );
      });

      it('should be able to access uneditable variable and no duplicate', () => {
        cy.get('#questionnaire-select').select('PHQ9 (no FHIRPath)');
        cy.get('.rule-editor').contains('Would you like to calculate the sum of scores?');
        // Click no
        cy.get('#skip-export-score').click();

        // Variables section should be empty.
        cy.get('lhc-variables > h2').should('contain', 'Item Variables');
        cy.get('#variables-section .variable-row').should('have.length', 0);

        // Add a variable and select FHIR Query (Observation) variable type
        cy.get('#add-variable').click();
        cy.get('#variables-section .variable-row').should('have.length', 1);
        cy.get('#variable-type-0').select('FHIR Query (Observation)');
        cy.get('#autocomplete-0').type('weight');
        cy.contains('29463-7').click();

        // Confirm that the selection is displayed
        cy.get('div#row-0')
          .find('div.query-select > span.autocomp_selected > ul > li')
          .should('have.text', '×Weight - 29463-7');

        // Uneditable variables section should be empty
        cy.get('#uneditable-variables-section .variable-row').should('have.length', 0);

        // Click Save
        cy.get('#export').click();

        // Uneditable variables section should now have one item
        cy.get('#uneditable-variables-section .variable-row').should('have.length', 1);

        // Click Save again
        cy.get('#export').click();

        // Uneditable variables section should still only have one item
        cy.get('#uneditable-variables-section .variable-row').should('have.length', 1);

        // Enter the uneditable variable 'patient' to the Output Expression,
        // it should be valid.
        cy.get('input.simple-expression').clear().type('patient');
        cy.get('lhc-syntax-preview>div>div>pre').contains('%patient');
      });

    });

    describe('Query support', () => {
      it('should display the query editor', () => {
        // Check the demo questionnaire load
        cy.intercept('/query.json').as('query');
        cy.get('select#questionnaire-select').select('Query');
        cy.wait('@query');

        cy.get('#variable-type-2').contains('FHIR Query (Observation)');

        // Variables section
        cy.get('lhc-variables > h2').should('contain', 'Item Variables');
        cy.get('#variables-section .variable-row').should('have.length', 3);

        cy.get('#variable-type-2').should('contain.text', 'FHIR Query (Observation)');
        cy.get('lhc-query-observation').should('exist').should('be.visible');

        // Confirm that the selection is displayed
        cy.get('div#row-2')
          .within(() => {
            cy.get('div.query-select > span.autocomp_selected > ul > li').should('have.length', 2);
            cy.get('div.query-select > span.autocomp_selected > ul > li')
              .eq(0)
              .should('have.text', '×test');

            cy.get('div.query-select > span.autocomp_selected > ul > li')
              .eq(1)
              .should('have.text', '×Appetite sleep chg notes DI-PAD - 65972-2');

            cy.get('.time-input > .ng-untouched').should('have.value', '7');
            cy.get('.time-select > .ng-untouched').should('have.value', 'days');

            cy.get('lhc-query-observation>div.syntax-preview>pre.d-inline')
              .should('contain', 'Observation?code=test,http://loinc.org|65972-2&date=gt{{today()-7 days}}&patient={{%patient.id}}&_sort=-date&_count=1');

            // Add a new code
            cy.get('#autocomplete-2').type('weight');
          });

        cy.get('#completionOptions').contains('29463-7').click();

        cy.get('div#row-2')
          .within(() => {
            cy.contains('Weight - 29463-7');
            cy.contains('Observation?code=test,http://loinc.org|65972-2,http://loinc.org|29463-7&date=gt{{today()-7 days}}&patient={{%patient.id}}&_sort=-date&_count=1');

            // Remove first code
            cy.get(':nth-child(1) > button > span').click();
            cy.contains('Observation?code=http://loinc.org|65972-2,http://loinc.org|29463-7&date=gt{{today()-7 days}}&patient={{%patient.id}}&_sort=-date&_count=1');    
          });
      }); 
    });

    describe('Case statements', () => {
      it('should display the Easy Path case editor when importing questionnaire with Easy Path in final expression', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression with cases)');
        cy.get('#advanced-interface').should('not.be.checked');

        // Should have the case statement checkbox toggled
        cy.get('#case-statements').should('be.checked');
        cy.get('#output-expressions').should('not.be.checked');
        cy.get('#case-condition-0').should('have.value', 'bmi<18.5');
        cy.get('#case-output-0').should('have.value', 'underweight');
        cy.get('#case-condition-1').should('have.value', 'bmi<25');
        cy.get('#case-output-1').should('have.value', 'normal');
        cy.get('#case-condition-2').should('have.value', 'bmi<30');
        cy.get('#case-output-2').should('have.value', 'overweight');
        cy.get('.default').should('have.value', 'obese');

        cy.get('lhc-case-statements > lhc-syntax-preview').contains(
          `iif(%bmi<18.5,'underweight',iif(%bmi<25,'normal',iif(%bmi<30,'overweight','obese')))`);
      });

      it('should display the FHIRPath case editor when importing questionnaire with FHIRPath in final expression', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (with cases)');
        cy.get('#advanced-interface').should('be.checked');

        // Should have the case statement checkbox toggled
        cy.get('#case-statements').should('be.checked');
        cy.get('#output-expressions').should('be.checked');
        cy.get('#case-condition-0').should('have.value', '%bmi<18.5');
        cy.get('#case-output-0').should('have.value', `'underweight'`);
        cy.get('#case-condition-1').should('have.value', '%bmi<25');
        cy.get('#case-output-1').should('have.value', `'normal'`);
        cy.get('#case-condition-2').should('have.value', '%bmi<30');
        cy.get('#case-output-2').should('have.value', `'overweight'`);
        cy.get('.default').should('have.value', `'obese'`);

        cy.get('lhc-case-statements > lhc-syntax-preview').contains(
          `iif(%bmi<18.5,'underweight',iif(%bmi<25,'normal',iif(%bmi<30,'overweight','obese')))`);
      });

      it('should be able to add cases to a questionnaire that does not have them', () => {
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression)');

        cy.get('#add-variable').click();
        cy.get('#variable-label-2').type('{backspace}bmi');
        cy.get('#variable-type-2').select('Easy Path Expression');
        cy.get('#simple-expression-2').type('a/b^2');

        cy.get('#case-statements').should('not.be.checked');
        cy.get('#case-statements').check();
        cy.get('#output-expressions').should('be.checked');
        cy.get('#output-expressions').uncheck();

        // Preview should not show up initially
        cy.get('lhc-case-statements > lhc-syntax-preview').should('not.exist');

        // Add a conditions and outputs
        cy.get('#case-condition-0').type('bmi<18.5');
        cy.get('#case-output-0').type('underweight');
        cy.get('#add-case').click();
        cy.get('#case-condition-1').type('bmi<25');
        cy.get('#case-output-1').type('normal');
        cy.get('#add-case').click();
        cy.get('#case-condition-2').type('bmi<30');
        cy.get('#case-output-2').type('overweight');
        cy.get('.default').type('obese');
        // Add a default value

        // Check the output expression
        cy.get('lhc-case-statements > lhc-syntax-preview').contains(
          `iif(%bmi<18.5,'underweight',iif(%bmi<25,'normal',iif(%bmi<30,'overweight','obese')))`);
      });

      it('should reset case statements when switching between 2 case statements questionnaire', () => {
        cy.intercept('/bmicase.json').as('bmicase');
        cy.get('select#questionnaire-select').select('BMI Calculation (with cases)');
        cy.wait('@bmicase');

        cy.get('#advanced-interface').should('be.checked');

        // There should be 3 case statements
        cy.get('#cdk-drop-list-1 > div').should('have.length', 3);
        cy.get('#case-condition-0').should('have.value', '%bmi<18.5');
        cy.get('#case-output-0').should('have.value', "'underweight'");
        cy.get('#case-condition-1').should('have.value', '%bmi<25');
        cy.get('#case-output-1').should('have.value', "'normal'");
        cy.get('#case-condition-2').should('have.value', '%bmi<30');
        cy.get('#case-output-2').should('have.value', "'overweight'");
                
        // Change variable type to Easy Path Expression
        cy.get('#variable-type-final').should('exist').select('simple');

        // Dialog should get displayed
        cy.get('lhc-yes-no-dialog').should('exist')
          .should('be.visible')
          .within( ()=> {
            // Select 'Yes' to convert from 'FHIRPath Expression' to 'Easy Path Expression'
            cy.get('#yes').should('exist').click();
          });

        // There should still be 3 case statements. But the cases/expressions might be blank.
        cy.get('#cdk-drop-list-1 > div').should('have.length', 3);
        cy.get('#case-condition-0').should('be.empty');
        cy.get('#case-output-0').should('be.empty');
        cy.get('#case-condition-1').should('be.empty');
        cy.get('#case-output-1').should('be.empty');
        cy.get('#case-condition-2').should('be.empty');
        cy.get('#case-output-2').should('be.empty');
        
        // Switch questionnaire to 'BMI Calculation (Easy Path expression with cases)'
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression with cases)');

        // Case statement expressions and outputs should be populated
        cy.get('#cdk-drop-list-1 > div').should('have.length', 3);
        cy.get('#case-condition-0').should('have.value', 'bmi<18.5');
        cy.get('#case-output-0').should('have.value', "underweight");
        cy.get('#case-condition-1').should('have.value', 'bmi<25');
        cy.get('#case-output-1').should('have.value', "normal");
        cy.get('#case-condition-2').should('have.value', 'bmi<30');
        cy.get('#case-output-2').should('have.value', "overweight");
      });

      it('should reset case statements when switching between 2 case statements questionnaire 2', () => {
        cy.intercept('/bmicasesimple.json').as('bmicasesimple');
        cy.get('select#questionnaire-select').select('BMI Calculation (Easy Path expression with cases)');
        cy.wait('@bmicasesimple');

        // Check the 'Advanced interface' checkbox
        cy.get('#advanced-interface').should('not.be.checked');
        cy.get('#advanced-interface').click();

        // Case statement expressions and outputs should be populated
        cy.get('#cdk-drop-list-1 > div').should('have.length', 3);
        cy.get('#case-condition-0').should('have.value', 'bmi<18.5');
        cy.get('#case-output-0').should('have.value', "underweight");
        cy.get('#case-condition-1').should('have.value', 'bmi<25');
        cy.get('#case-output-1').should('have.value', "normal");
        cy.get('#case-condition-2').should('have.value', 'bmi<30');
        cy.get('#case-output-2').should('have.value', "overweight");

        // Clear the case output and type 'underweight1234'
        cy.get('#case-output-0').clear().type('underweight1234');

        // Switch questionnaire to 'BMI Calculation (with cases)'
        cy.get('select#questionnaire-select').select('BMI Calculation (with cases)');

        // There should be 3 case statements
        cy.get('#cdk-drop-list-1 > div').should('have.length', 3);
        cy.get('#case-condition-0').should('have.value', '%bmi<18.5');
        cy.get('#case-output-0').should('have.value', "'underweight'");
        cy.get('#case-condition-1').should('have.value', '%bmi<25');
        cy.get('#case-output-1').should('have.value', "'normal'");
        cy.get('#case-condition-2').should('have.value', '%bmi<30');
        cy.get('#case-output-2').should('have.value', "'overweight'");
      });

    });
  });
});
