import { autocompleteSearchAndExpand } from './utils';

describe(Cypress.env("appName"), () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Angular Library', () => {
    describe('BMI Variable Type', () => {
      it('should be able to display fhir query observation correctly with params in any order ', () => {
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

          // standard order
          cy.get('div#row-11').within(() => {
            cy.get('#variable-label-11').should('have.value', 'fhir_query_obs_2_weeks');
            cy.get('#variable-type-11').should('have.value', 'queryObservation');
            cy.get('lhc-query-observation').shadow().within(() => {
              cy.get('div.time-input>input').should('contain.value', '2');
              cy.get('div.time-select>select').should('contain.value', 'weeks');
              cy.get('div.syntax-preview > pre')
                .should('contain.text',
                        'Observation?code=http://loinc.org|2922-3&date=gt{{today()-2 weeks}}&patient={{%patient.id}}&_sort=-date&_count=1');
            });
          });

          // various orders 1
          cy.get('div#row-27').within(() => {
            cy.get('#variable-label-27').should('have.value', 'fhir_query_obs_params_order_1');
            cy.get('#variable-type-27').should('have.value', 'queryObservation');
            cy.get('lhc-query-observation').shadow().within(() => {
              cy.get('div.time-input>input').should('contain.value', '2');
              cy.get('div.time-select>select').should('contain.value', 'weeks');
              cy.get('div.syntax-preview > pre')
                .should('contain.text',
                        'Observation?date=gt{{today()-2 weeks}}&patient={{%patient.id}}&_sort=-date&_count=1&code=http://loinc.org|2922-3');
            });
          });

          // various orders 2
          cy.get('div#row-28').within(() => {
            cy.get('#variable-label-28').should('have.value', 'fhir_query_obs_params_order_2');
            cy.get('#variable-type-28').should('have.value', 'queryObservation');
            cy.get('lhc-query-observation').shadow().within(() => {
              cy.get('div.time-input>input').should('contain.value', '2');
              cy.get('div.time-select>select').should('contain.value', 'weeks');
              cy.get('div.syntax-preview > pre')
                .should('contain.text',
                        'Observation?patient={{%patient.id}}&_sort=-date&_count=1&code=http://loinc.org|2922-3&date=gt{{today()-2 weeks}}');
            });
          });

          // various orders 3
          cy.get('div#row-29').within(() => {
            cy.get('#variable-label-29').should('have.value', 'fhir_query_obs_params_order_3');
            cy.get('#variable-type-29').should('have.value', 'queryObservation');
            cy.get('lhc-query-observation').shadow().within(() => {
              cy.get('div.time-input>input').should('contain.value', '2');
              cy.get('div.time-select>select').should('contain.value', 'weeks');
              cy.get('div.syntax-preview > pre')
                .should('contain.text',
                        'Observation?_sort=-date&_count=1&code=http://loinc.org|2922-3&date=gt{{today()-2 weeks}}&patient={{%patient.id}}');
            });
          });

          // various orders 4
          cy.get('div#row-30').within(() => {
            cy.get('#variable-label-30').should('have.value', 'fhir_query_obs_params_order_4');
            cy.get('#variable-type-30').should('have.value', 'queryObservation');
            cy.get('lhc-query-observation').shadow().within(() => {
              cy.get('div.time-input>input').should('contain.value', '2');
              cy.get('div.time-select>select').should('contain.value', 'weeks');
              cy.get('div.syntax-preview > pre')
                .should('contain.text',
                        'Observation?_count=1&code=http://loinc.org|2922-3&date=gt{{today()-2 weeks}}&patient={{%patient.id}}&_sort=-date');
            });
          });
        });
      });

      it('should expand query observation results via link and Ctrl+Enter', () => {
        const initialRows = [
          ['Retinol Result 1', '10001-1'],
          ['Retinol Result 2', '10002-2'],
          ['Retinol Result 3', '10003-3'],
          ['Retinol Result 4', '10004-4'],
          ['Retinol Result 5', '10005-5'],
          ['Retinol Result 6', '10006-6'],
          ['Retinol Result 7', '10007-7']
        ];

        const expandedRows = [
          ...initialRows,
          ['Retinol Expanded 8', '10008-8'],
          ['Retinol Expanded 9', '10009-9'],
          ['Retinol Expanded 10', '10010-0'],
          ['Retinol Expanded 11', '10011-1'],
          ['Retinol Expanded 12', '10012-2']
        ];

        cy.intercept('GET', '**/api/loinc_items/v3/search*', (req) => {
          const isExpandedSearch = req.query.maxList !== undefined;
          const rows = isExpandedSearch ? expandedRows : initialRows;

          req.alias = isExpandedSearch ? 'loincExpanded' : 'loincAutocomp';
          req.reply([
            expandedRows.length,
            rows.map((row) => row[1]),
            null,
            rows
          ]);
        });

        cy.intercept('/bmivariabletype.json').as('bmivariable');
        cy.get('select#questionnaire-select').select('BMI Variable Type');
        cy.wait('@bmivariable');

        cy.get('button#openExpressionEditor').should('exist').click();

        autocompleteSearchAndExpand('link', 'queryObservation', '11', 'Retinol');

        cy.wait('@loincExpanded');

        cy.get('#completionOptions table tbody tr').contains('Retinol Expanded 12').should('be.visible');

        // Hide results by clicking outside, then repeat with Ctrl+Enter.
        cy.get('body').click(5, 5);
        cy.get('#lhc-tools-searchResults').should('have.attr', 'aria-hidden', 'true');

        autocompleteSearchAndExpand('ctrlEnter', 'queryObservation', '11', 'Retinol');

        cy.wait('@loincExpanded');
        cy.get('#completionOptions table tbody tr').contains('Retinol Expanded 12').should('be.visible');
      });
    });
  });
});