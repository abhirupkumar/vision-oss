/// <reference types="cypress" />
import { uuid } from '../../src/lib/crypto';

Cypress.Commands.add('getDataTest', (value: string) => {
  return cy.get(`[data-test=${value}]`);
});

Cypress.Commands.add('logout', () => {
  cy.getDataTest('button-profile').click();
  cy.getDataTest('item-logout').click();
  cy.url().should('eq', Cypress.config().baseUrl + '/login');
});

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.request({
      method: 'POST',
      url: '/auth/login',
      body: {
        email,
        password,
      },
    })
      .then(response => {
        Cypress.env('authorization', `bearer ${response.body.token}`);
        window.localStorage.setItem('vision.auth', JSON.stringify(response.body.token));
      })
      .its('status')
      .should('eq', 200);
  });
});

Cypress.Commands.add('addProject', (name: string, domain: string) => {
  cy.request({
    method: 'POST',
    url: '/api/projects',
    headers: {
      'Content-Type': 'application/json',
      Authorization: Cypress.env('authorization'),
    },
    body: {
      id: uuid(),
      createdBy: '41e2b680-648e-4b09-bcd7-3e2b10c06264',
      name: name,
      domain: domain,
    },
  }).then(response => {
    expect(response.status).to.eq(200);
  });
});

Cypress.Commands.add('deleteProject', (projectId: string) => {
  cy.request({
    method: 'DELETE',
    url: `/api/projects/${projectId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: Cypress.env('authorization'),
    },
  }).then(response => {
    expect(response.status).to.eq(200);
  });
});

Cypress.Commands.add('addUser', (email: string, password: string, role: string) => {
  cy.request({
    method: 'POST',
    url: '/api/users',
    headers: {
      'Content-Type': 'application/json',
      Authorization: Cypress.env('authorization'),
    },
    body: {
      email: email,
      password: password,
      role: role,
    },
  }).then(response => {
    expect(response.status).to.eq(200);
  });
});

Cypress.Commands.add('deleteUser', (userId: string) => {
  cy.request({
    method: 'DELETE',
    url: `/api/users/${userId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: Cypress.env('authorization'),
    },
  }).then(response => {
    expect(response.status).to.eq(200);
  });
});

Cypress.Commands.add('addTeam', (name: string) => {
  cy.request({
    method: 'POST',
    url: '/api/teams',
    headers: {
      'Content-Type': 'application/json',
      Authorization: Cypress.env('authorization'),
    },
    body: {
      name: name,
    },
  }).then(response => {
    expect(response.status).to.eq(200);
  });
});

Cypress.Commands.add('deleteTeam', (teamId: string) => {
  cy.request({
    method: 'DELETE',
    url: `/api/teams/${teamId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: Cypress.env('authorization'),
    },
  }).then(response => {
    expect(response.status).to.eq(200);
  });
});
