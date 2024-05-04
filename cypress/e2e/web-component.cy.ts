describe('Rule Editor Web Component', () => {
  beforeEach(() => {
    cy.visit('/web-component.html');
  });

  describe('score calculation', () => {
    it('should ask the user if they want to calculate the sum of scores.', () => {
      cy.get('.score-modal').should('contain.text', 'Would you like to calculate the sum of scores?');
    });

    it('should show the Rule Editor interface if the user clicks no.', () => {
      cy.get('#skip-score-items-selection').click();

      cy.get('h1').should('contain.text', 'Test Rule Editor');
      cy.get('#export').should('contain.text', 'Test Submit');
    });

    it('should produce the calculation', () => {
      cy.get('#score-items-selection').click();
      cy.get('#selectAll').should('exist').click();
      cy.get('#export-score').click();
      cy.get('#output').should('contain.text', 
        '"expression": "iif(%any_questions_answered, iif(%a.exists(), %a, 0) + iif(%b.exists(), %b, 0) + ' +
        'iif(%c.exists(), %c, 0) + iif(%d.exists(), %d, 0) + iif(%e.exists(), %e, 0) + iif(%f.exists(), %f, 0) + ' +
        'iif(%g.exists(), %g, 0) + iif(%h.exists(), %h, 0) + iif(%i.exists(), %i, 0), {})"');
    });
  });
});