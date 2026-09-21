'use strict';

var AxiosError = require('../core/AxiosError');
var utils = require('../utils');
var directAgents = new WeakMap();

module.exports = function getDirectAgent(configuredAgent, transport) {
  var agent = configuredAgent || transport.globalAgent;
  var options = agent && agent.options;
  if (!options || !utils.hasOwnProperty(options, 'proxyEnv') ||
    typeof options.proxyEnv !== 'object' || options.proxyEnv === null) {
    return configuredAgent;
  }
  if (agent.constructor !== transport.Agent) {
    throw new AxiosError('proxy: false requires a custom agent without proxyEnv', AxiosError.ERR_BAD_OPTION_VALUE);
  }
  var direct = directAgents.get(agent);
  if (!direct) {
    direct = new transport.Agent(Object.assign({}, options, { proxyEnv: undefined }));
    if (utils.hasOwnProperty(agent, 'createConnection')) {
      direct.createConnection = agent.createConnection;
    }
    directAgents.set(agent, direct);
  }
  return direct;
};
