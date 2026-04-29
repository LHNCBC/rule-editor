import { autocompleteSearchAndExpand } from './utils';

describe('Expression editor', () => {
  beforeEach(() => {
    cy.visit('/');

    // The demo has 'BMI (/39156-5) selected by default
    cy.get('#question').should('have.value', 'BMI (/39156-5)');

    // The 'Open Expression Editor' button should not be disabled
    cy.get('#openExpressionEditor')
      .should('exist')
      .should('not.have.class', 'disabled')
      .click();

    // The Expression Editor dialog should now appear
    cy.get('lhc-expression-editor').shadow().within(() => {
      cy.get('#expression-editor-base-dialog').should('exist');

      cy.title().should('eq', 'Expression Editor');

      // Variables section
      cy.get('lhc-variables > h2').should('contain', 'Item Variables');
      cy.get('#variables-section .variable-row').should('have.length', 2);

      cy.get('div#row-1').within(() => {
        cy.get('#variable-type-1').should('have.value', 'question');
        cy.get('#question-1').should('have.value', "Body height (/8302-2)" );
        // The unit should be 'm'
        cy.get('div.unit-select > select').should('have.value', 'm');

        cy.get('div.fhirpath > pre')
          .should('contain.text',
            "%resource.item.where(linkId='/8302-2').answer.value*0.0254");
      });
    });
  });

  describe('Angular Library', () => {
    describe('Question variable type', () => {

      it('should update the FHIRPath expression and its associated factor when the unit changes', () => {
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          cy.get('div#row-1').within(() => {
            // Change the unit to 'Keep form units ([in_i])'
            cy.get('div.unit-select > select').select([]);
            // The FHIRPath expression should get updated
            cy.get('div.fhirpath > pre')
              .should('contain.text',
                "%resource.item.where(linkId='/8302-2').answer.value");
          });

          cy.get('div#row-0').within(() => {
              cy.get('#variable-type-0').should('have.value', 'question');
              cy.get('#question-0').should('have.value', "Weight (/29463-7)" );
              // The unit should be 'kg'
              cy.get('div.unit-select > select').should('have.value', '');
              cy.get('div.fhirpath > pre')
                .should('contain.text',
                  "%resource.item.where(linkId='/29463-7').answer.value");

              // Change the unit to 'Convert to lbs.'
              cy.get('div.unit-select > select').select('lbs');
              // The FHIRPath expression should get updated
              cy.get('div.fhirpath > pre')
                .should('contain.text',
                  "%resource.item.where(linkId='/29463-7').answer.value*2.20462");

              // Clear the unit which default to kg
              cy.get('div.unit-select > select').select([]);
              // The FHIRPath expression should get updated
              cy.get('div.fhirpath > pre')
                .should('contain.text',
                  "%resource.item.where(linkId='/29463-7').answer.value");
          });
        });
      });

      it('should update both the FHIRPath expression and its associated factor when the question changes 1', () => {
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          cy.get('div#row-1').within(() => {
            // Select question 'Clothing worn during measure'
            cy.get('#question-1').clear().type('Clothing worn during measure');
          });
        });
        cy.get('span#completionOptions > ul > li').contains('8352-7').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('div#row-1').within(() => {
            cy.get('#question-1').should('have.value', "Clothing worn during measure (/8352-7)" );
            cy.get('div.fhirpath > pre')
              .should('contain.text',
                "%resource.item.where(linkId='/8352-7').answer.value");
          });
        });
      });

      it('should update both the FHIRPath expression and its associated factor when the question changes 2', () => {
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          cy.get('div#row-1').within(() => {
            // Select question 'Weight'
            cy.get('#question-1').clear().type('Weight');
          });
        });
        cy.get('span#completionOptions > ul > li').contains('29463-7').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('div#row-1').within(() => {
            cy.get('#question-1').should('have.value', "Weight (/29463-7)" );
            cy.get('div.fhirpath > pre')
              .should('contain.text',
                "%resource.item.where(linkId='/29463-7').answer.value");
          });
        });
      });

      it('should update both the FHIRPath expression and its associated factor when both there are changes to the question and/or unit', () => {
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          cy.get('div#row-1').within(() => {
            // Select question 'Weight'
            cy.get('#question-1').clear().type('Weight');
          });
        });
        cy.get('span#completionOptions > ul > li').contains('29463-7').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('div#row-1').within(() => {
            cy.get('#question-1').should('have.value', "Weight (/29463-7)" );

            // Change the unit to 'Convert to lbs.'
            cy.get('div.unit-select > select').select('lbs');
            // The FHIRPath expression should get updated
            cy.get('div.fhirpath > pre')
              .should('contain.text',
                "%resource.item.where(linkId='/29463-7').answer.value*2.20462");

            // Select question 'BMI'
            cy.get('#question-1').clear().type('BMI');
          });
        });
        cy.get('span#completionOptions > ul > li').contains('39156-5').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('div#row-1').within(() => {
            cy.get('#question-1').should('have.value', "BMI (/39156-5)" );
            cy.get('div.fhirpath > pre')
              .should('contain.text',
                "%resource.item.where(linkId='/39156-5').answer.value");
          });
        });
      });
    });
  });
});

describe('Expression editor - question autocomplete expansion', () => {
  it('should expand question autocomplete via "See more items" and Ctrl+Enter without closing dialogs', () => {
    cy.visit('/');

    cy.window().then((win) => {
      cy.spy(win.console, 'error').as('consoleError');
    });

    cy.get('select#questionnaire-select').select('Upload your own questionnaire');
    cy.get('#file-upload').attachFile('bmi_many_questions.json');

    // Use item-level expression editor so question context is available.
    cy.get('#root-level').should('be.checked').uncheck();
    cy.get('#question').clear().type('BMI');
    cy.get('span#completionOptions > ul > li').contains('39156-5').click();

    cy.get('button#openExpressionEditor').should('exist').click();

    cy.get('lhc-expression-editor').shadow().within(() => {
      cy.get('#expression-editor-base-dialog').should('exist');

      cy.get('#variables-section .variable-row').its('length').then((count) => {
        cy.get('#add-variable').click();
        cy.get('#variables-section .variable-row').should('have.length', count + 1);
        cy.get('#variables-section .variable-row').last().invoke('attr', 'id').as('newRowId');
      });
    });

    cy.get('@newRowId').then((rowIdRaw) => {
      const rowId = String(rowIdRaw);
      const rowIndex = rowId.replace('row-', '');
      cy.wrap(rowIndex).as('newRowIndex');

      cy.get('lhc-expression-editor').shadow().within(() => {
        cy.get(`div#${rowId}`).within(() => {
          cy.get(`#variable-type-${rowIndex}`).select('Question');
          cy.get(`#question-${rowIndex}`).should('exist').clear().type('Body');
        });
      });
    });

    cy.get('@newRowIndex').then((rowIndexRaw) => {
      autocompleteSearchAndExpand('link', 'question', String(rowIndexRaw), 'Body');
    });

    // Hide search results by clicking outside of the autocomplete results box.
    cy.get('body').click(5, 5);
    cy.get('#lhc-tools-searchResults').should('have.attr', 'aria-hidden', 'true');

    // Repeat the same search and expand with Ctrl+Enter instead of the link.
    cy.get('@newRowIndex').then((rowIndexRaw) => {
      autocompleteSearchAndExpand('ctrlEnter', 'question', String(rowIndexRaw), 'Body');
    });

    cy.get('@consoleError').should((consoleErrorSpy) => {
      const autocompNullError = "Cannot read properties of null (reading 'autocomp')";
      const hasAutocompNullError = consoleErrorSpy
        .getCalls()
        .some((call) => call.args.some((arg) => String(arg).includes(autocompNullError)));

      expect(hasAutocompNullError, 'autocomp null console error should not occur').to.eq(false);
    });
  });
});