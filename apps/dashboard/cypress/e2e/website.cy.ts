describe('Project tests', () => {
  Cypress.session.clearAllSavedSessions();

  beforeEach(() => {
    cy.login(Cypress.env('umami_user'), Cypress.env('umami_password'));
  });

  it('Add a project', () => {
    // add project
    cy.visit('/settings/projects');
    cy.getDataTest('button-project-add').click();
    cy.contains(/Add project/i).should('be.visible');
    cy.getDataTest('input-name').find('input').as('inputEmail').click();
    cy.getDataTest('input-name').find('input').type('Add test', { delay: 0 });
    cy.getDataTest('input-domain').find('input').click();
    cy.getDataTest('input-domain').find('input').type('addtest.com', { delay: 0 });
    cy.getDataTest('button-submit').click();
    cy.get('td[label="Name"]').should('contain.text', 'Add test');
    cy.get('td[label="Domain"]').should('contain.text', 'addtest.com');

    // clean-up data
    cy.getDataTest('link-button-edit').first().click();
    cy.contains(/Details/i).should('be.visible');
    cy.getDataTest('text-field-projectId')
      .find('input')
      .then($input => {
        const projectId = $input[0].value;
        cy.deleteProject(projectId);
      });
    cy.visit('/settings/projects');
    cy.contains(/Add test/i).should('not.exist');
  });

  it('Edit a project', () => {
    // prep data
    cy.addProject('Update test', 'updatetest.com');
    cy.visit('/settings/projects');

    // edit project
    cy.getDataTest('link-button-edit').first().click();
    cy.contains(/Details/i).should('be.visible');
    cy.getDataTest('input-name').find('input').click();
    cy.getDataTest('input-name').find('input').clear();
    cy.getDataTest('input-name').find('input').type('Updated project', { delay: 0 });
    cy.getDataTest('input-domain').find('input').click();
    cy.getDataTest('input-domain').find('input').clear();
    cy.getDataTest('input-domain').find('input').type('updatedproject.com', { delay: 0 });
    cy.getDataTest('button-submit').click({ force: true });
    cy.getDataTest('input-name').find('input').should('have.value', 'Updated project');
    cy.getDataTest('input-domain').find('input').should('have.value', 'updatedproject.com');

    // verify tracking script
    cy.get('div')
      .contains(/Tracking code/i)
      .click();
    cy.get('textarea').should('contain.text', Cypress.config().baseUrl + '/script.js');

    // clean-up data
    cy.get('div')
      .contains(/Details/i)
      .click();
    cy.contains(/Details/i).should('be.visible');
    cy.getDataTest('text-field-projectId')
      .find('input')
      .then($input => {
        const projectId = $input[0].value;
        cy.deleteProject(projectId);
      });
    cy.visit('/settings/projects');
    cy.contains(/Add test/i).should('not.exist');
  });

  it('Delete a project', () => {
    // prep data
    cy.addProject('Delete test', 'deletetest.com');
    cy.visit('/settings/projects');

    // delete project
    cy.getDataTest('link-button-edit').first().click();
    cy.contains(/Data/i).should('be.visible');
    cy.get('div').contains(/Data/i).click();
    cy.contains(/All project data will be deleted./i).should('be.visible');
    cy.getDataTest('button-delete').click();
    cy.contains(/Type DELETE in the box below to confirm./i).should('be.visible');
    cy.get('input[name="confirm"').type('DELETE');
    cy.get('button[type="submit"]').click();
    cy.contains(/Delete test/i).should('not.exist');
  });
});
