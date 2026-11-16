import { uuid } from '../../src/lib/crypto';

describe('Project API tests', () => {
  Cypress.session.clearAllSavedSessions();

  let projectId;
  let teamId;

  before(() => {
    cy.login(Cypress.env('umami_user'), Cypress.env('umami_password'));
    cy.fixture('teams').then(data => {
      const teamCreate = data.teamCreate;
      cy.request({
        method: 'POST',
        url: '/api/teams',
        headers: {
          'Content-Type': 'application/json',
          Authorization: Cypress.env('authorization'),
        },
        body: teamCreate,
      }).then(response => {
        teamId = response.body[0].id;
        expect(response.status).to.eq(200);
        expect(response.body[0]).to.have.property('name', 'cypress');
        expect(response.body[1]).to.have.property('role', 'team-owner');
      });
    });
  });

  it('Creates a project for user.', () => {
    cy.fixture('projects').then(data => {
      const projectCreate = data.projectCreate;
      cy.request({
        method: 'POST',
        url: '/api/projects',
        headers: {
          'Content-Type': 'application/json',
          Authorization: Cypress.env('authorization'),
        },
        body: projectCreate,
      }).then(response => {
        projectId = response.body.id;
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('name', 'Cypress Project');
        expect(response.body).to.have.property('domain', 'cypress.com');
      });
    });
  });

  it('Creates a project for team.', () => {
    cy.request({
      method: 'POST',
      url: '/api/projects',
      headers: {
        'Content-Type': 'application/json',
        Authorization: Cypress.env('authorization'),
      },
      body: {
        name: 'Team Project',
        domain: 'teamproject.com',
        teamId: teamId,
      },
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('name', 'Team Project');
      expect(response.body).to.have.property('domain', 'teamproject.com');
    });
  });

  it('Creates a project with a fixed ID.', () => {
    cy.fixture('projects').then(data => {
      const projectCreate = data.projectCreate;
      const fixedId = uuid();
      cy.request({
        method: 'POST',
        url: '/api/projects',
        headers: {
          'Content-Type': 'application/json',
          Authorization: Cypress.env('authorization'),
        },
        body: { ...projectCreate, id: fixedId },
      }).then(response => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('id', fixedId);
        expect(response.body).to.have.property('name', 'Cypress Project');
        expect(response.body).to.have.property('domain', 'cypress.com');

        // cleanup
        cy.request({
          method: 'DELETE',
          url: `/api/projects/${fixedId}`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: Cypress.env('authorization'),
          },
        });
      });
    });
  });

  it('Returns all tracked projects.', () => {
    cy.request({
      method: 'GET',
      url: '/api/projects',
      headers: {
        'Content-Type': 'application/json',
        Authorization: Cypress.env('authorization'),
      },
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body.data[0]).to.have.property('id');
      expect(response.body.data[0]).to.have.property('name');
      expect(response.body.data[0]).to.have.property('domain');
    });
  });

  it('Gets a project by ID.', () => {
    cy.request({
      method: 'GET',
      url: `/api/projects/${projectId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: Cypress.env('authorization'),
      },
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('name', 'Cypress Project');
      expect(response.body).to.have.property('domain', 'cypress.com');
    });
  });

  it('Updates a project.', () => {
    cy.fixture('projects').then(data => {
      const projectUpdate = data.projectUpdate;
      cy.request({
        method: 'POST',
        url: `/api/projects/${projectId}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: Cypress.env('authorization'),
        },
        body: projectUpdate,
      }).then(response => {
        projectId = response.body.id;
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('name', 'Cypress Project Updated');
        expect(response.body).to.have.property('domain', 'cypressupdated.com');
      });
    });
  });

  it('Updates a project with only shareId.', () => {
    cy.request({
      method: 'POST',
      url: `/api/projects/${projectId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: Cypress.env('authorization'),
      },
      body: { shareId: 'ABCDEF' },
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('shareId', 'ABCDEF');
    });
  });

  it('Resets a project by removing all data related to the project.', () => {
    cy.request({
      method: 'POST',
      url: `/api/projects/${projectId}/reset`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: Cypress.env('authorization'),
      },
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('ok', true);
    });
  });

  it('Deletes a project.', () => {
    cy.request({
      method: 'DELETE',
      url: `/api/projects/${projectId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: Cypress.env('authorization'),
      },
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('ok', true);
    });
  });

  after(() => {
    cy.deleteTeam(teamId);
  });
});
