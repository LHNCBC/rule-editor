export type ExpansionMethod = 'link' | 'ctrlEnter';
export type AutocompleteComponentType = 'question' | 'queryObservation';

/**
 * Runs an autocomplete search and expands results using either the
 * "See more items" link or Ctrl+Enter.
 *
 * Supports both question and query-observation autocomplete widgets.
 *
 * @param method - Expansion method (`link` click or `ctrlEnter` key combo).
 * @param component - Autocomplete component type to target.
 * @param rowIndex - Variable row index used to build input selectors.
 * @param searchText - Text to type into the target autocomplete input.
 * @param minExpandedResults - Minimum result count threshold after expansion.
 */
export const autocompleteSearchAndExpand = (
  method: ExpansionMethod,
  component: AutocompleteComponentType,
  rowIndex: string,
  searchText: string,
  minExpandedResults = 7
): void => {
  const moreResultsActionSelector = '#lhc-tools-moreResults [data-lhc-more-results-action="true"]';

  const inputSelector = component === 'question'
    ? `#question-${rowIndex}`
    : `#autocomplete-${rowIndex}`;

  const expandedResultsSelector = component === 'question'
    ? '#completionOptions > ul > li'
    : '#completionOptions table tbody tr';

  const typeInTargetInput = (text: string) => {
    cy.get('lhc-expression-editor').shadow().within(() => {
      cy.get(`div#row-${rowIndex}`).within(() => {
        if (component === 'queryObservation') {
          cy.get('lhc-query-observation').shadow().find(inputSelector).clear().type(text);
        } else {
          cy.get(inputSelector).clear().type(text);
        }
      });
    });
  };

  const pressCtrlEnterInTargetInput = () => {
    cy.get('lhc-expression-editor').shadow().within(() => {
      cy.get(`div#row-${rowIndex}`).within(() => {
        if (component === 'queryObservation') {
          cy.get('lhc-query-observation').shadow().find(inputSelector).type('{ctrl+enter}');
        } else {
          cy.get(inputSelector).type('{ctrl+enter}');
        }
      });
    });
  };

  typeInTargetInput(searchText);

  cy.get(moreResultsActionSelector).should('be.visible');

  if (method === 'link') {
    cy.get(moreResultsActionSelector).click();
  } else {
    pressCtrlEnterInTargetInput();
  }

  cy.get(expandedResultsSelector).its('length').should('be.gt', minExpandedResults);
  cy.get('lhc-expression-editor').shadow().within(() => {
    cy.get('#expression-editor-base-dialog').should('exist');
    cy.get('#cancel-changes-base-dialog').should('not.exist');
  });
};
