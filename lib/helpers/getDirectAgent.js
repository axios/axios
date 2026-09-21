'use strict';

var utils = require('../utils');
var bind = require('./bind');
var directAgents = new WeakMap();
var agentControls = [
  'keepAlive', 'keepAliveMsecs', 'maxSockets', 'maxFreeSockets',
  'maxTotalSockets', 'scheduling', 'maxCachedSessions',
  'agentKeepAliveTimeoutBuffer', 'defaultPort'
];

module.exports = function getDirectAgent(configuredAgent, transport) {
  if (!process.allowedNodeEnvironmentFlags ||
    !process.allowedNodeEnvironmentFlags.has('--use-env-proxy')) {
    return configuredAgent;
  }

  var agent = configuredAgent || transport.globalAgent;
  var options = agent && agent.options;
  if (!(agent instanceof transport.Agent) ||
    agent.protocol !== transport.globalAgent.protocol ||
    !options || !utils.hasOwnProperty(options, 'proxyEnv') ||
    typeof options.proxyEnv !== 'object' || options.proxyEnv === null) {
    return configuredAgent;
  }

  // Node snapshots proxyEnv when constructing the agent, so removing entries
  // from its options later does not necessarily turn native proxying off.
  var direct = directAgents.get(agent);
  var directOptions = Object.assign(Object.create(null), options, { proxyEnv: undefined });
  if (!direct) {
    direct = new transport.Agent(directOptions);
    if (agent.createConnection !== transport.Agent.prototype.createConnection) {
      direct.createConnection = bind(agent.createConnection, agent);
    }

    // The configured agent remains the application's cleanup handle for both
    // pools, including when requests are made after destroy().
    var destroy = agent.destroy;
    agent.destroy = function destroyWithDirectAgent() {
      try {
        return destroy.apply(this, arguments);
      } finally {
        direct.destroy();
      }
    };
    directAgents.set(agent, direct);
  } else {
    direct.options = directOptions;
  }

  // Public pool controls can change after construction or between requests.
  // Keep the cached pool in step with the application-owned agent.
  agentControls.forEach(function(key) {
    if (utils.hasOwnProperty(agent, key)) {
      direct[key] = agent[key];
    }
  });
  return direct;
};
