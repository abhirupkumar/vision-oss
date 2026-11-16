/// <reference types="cypress" />
/* global JQuery */

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to select DOM element by data-test attribute.
     * @example cy.getDataTest('greeting')
     */
    getDataTest(value: string): Chainable<JQuery<HTMLElement>>;
    /**
     * Custom command to logout through UI.
     * @example cy.logout()
     */
    logout(): Chainable<JQuery<HTMLElement>>;
    /**
     * Custom command to login user into the app.
     * @example cy.login('admin', 'password)
     */
    login(username: string, password: string): Chainable<JQuery<HTMLElement>>;
    /**
     * Custom command to create a project
     * @example cy.addProject('test', 'test.com')
     */
    addProject(name: string, domain: string): Chainable<JQuery<HTMLElement>>;
    /**
     * Custom command to delete a project
     * @example cy.deleteProject('02d89813-7a72-41e1-87f0-8d668f85008b')
     */
    deleteProject(projectId: string): Chainable<JQuery<HTMLElement>>;
    /**
     * Custom command to create a project
     * @example cy.deleteProject('02d89813-7a72-41e1-87f0-8d668f85008b')
     */
    /**
     * Custom command to create a user
     * @example cy.addUser('cypress', 'password', 'User')
     */
    addUser(username: string, password: string, role: string): Chainable<JQuery<HTMLElement>>;
    /**
     * Custom command to delete a user
     * @example cy.deleteUser('02d89813-7a72-41e1-87f0-8d668f85008b')
     */
    deleteUser(userId: string): Chainable<JQuery<HTMLElement>>;
    /**
     * Custom command to create a team
     * @example cy.addTeam('cypressTeam')
     */
    addTeam(name: string): Chainable<JQuery<HTMLElement>>;
    /**
     * Custom command to create a project
     * @example cy.deleteTeam('02d89813-7a72-41e1-87f0-8d668f85008b')
     */
    deleteTeam(teamId: string): Chainable<JQuery<HTMLElement>>;
  }
}
