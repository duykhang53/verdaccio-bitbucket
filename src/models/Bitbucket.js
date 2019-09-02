const axios = require('axios');

const API_URL = 'https://api.bitbucket.org';
const API_VERSION = '2.0';

function Bitbucket(username, password, logger) {
  this.apiUrl = `${API_URL}/${API_VERSION}`;
  this.username = username;
  this.password = password;
  this.logger = logger;
}

Bitbucket.prototype.getUser = function getUser() {
  const { username, apiUrl } = this;
  return axios({
    method: 'get',
    url: `${apiUrl}/users/${username}`,
  }).then(response => ({ teams: [response.data.nickname], role: '' }) );
};

Bitbucket.prototype.getTeams = function getTeams(role) {
  const { username, password, apiUrl } = this;
  const teams = [];
  this.logger.debug(`[bitbucket] getting teams for ${username}, url: ${`${apiUrl}/teams?role=${role}&pagelen=100`}, role: ${role}`);

  function callApi(url) {
    return axios({
      method: 'get',
      url,
      auth: { username, password },
    }).then((response) => {
      teams.push(...response.data.values.map(x => x.username));
      if (response.data.next) return callApi(response.data.next);
      return { role, teams };
    });
  }

  return callApi(`${apiUrl}/teams?role=${role}&pagelen=100`);
};


Bitbucket.prototype.getPrivileges = function getPrivileges() {
  return Promise.all([
    this.getTeams('member'),
    this.getTeams('contributor'),
    this.getTeams('admin'),
    this.getUser(),
  ]).then((values) => {
    const result = {};
    values.forEach(({ role, teams }) => {
      Object.assign(result, ...teams.map(t => ({ [t]: role })));
    });
    return { teams: result };
  });
};


module.exports = Bitbucket;
