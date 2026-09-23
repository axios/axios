'use strict';

var utils = require('../utils');
var AxiosError = require('../core/AxiosError');
var bind = require('./bind');
var directAgents = new WeakMap();
var directHooks = ['createConnection', 'getName'];
var nativePoolHooks = [
  'addRequest', 'createSocket', 'removeSocket', 'keepSocketAlive', 'reuseSocket',
  '_getSession', '_cacheSession', '_evictSession'
];
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
    agent.protocol !== transport.globalAgent.protocol) {
    return configuredAgent;
  }

  // Node snapshots proxyEnv at construction. Once adapted, retain the direct
  // pool even if callers remove or replace the source's public proxy options.
  var direct = directAgents.get(agent);
  if (!direct && (!options || !utils.hasOwnProperty(options, 'proxyEnv') ||
    typeof options.proxyEnv !== 'object' || options.proxyEnv === null)) {
    return configuredAgent;
  }

  // Pool lifecycle hooks mutate their receiver's queues and socket state.
  // Binding them to the source pool or copying them without subclass state
  // cannot preserve their behavior on an independently managed direct pool.
  for (var i = 0; i < nativePoolHooks.length; i++) {
    var hook = nativePoolHooks[i];
    if (utils.isFunction(transport.Agent.prototype[hook]) && agent[hook] !== transport.Agent.prototype[hook]) {
      throw new AxiosError(
        'proxy: false cannot adapt an agent overriding ' + hook + '; use an agent constructed without proxyEnv',
        AxiosError.ERR_BAD_OPTION_VALUE
      );
    }
  }

  var directOptions = Object.assign(Object.create(null), options, { proxyEnv: undefined });
  if (!direct) {
    direct = new transport.Agent(directOptions);
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

  // These hooks supply connections and pool keys without owning the direct
  // pool's queues. Preserve the source receiver, including subclass state.
  directHooks.forEach(function(key) {
    direct[key] = agent[key] === transport.Agent.prototype[key]
      ? transport.Agent.prototype[key] : bind(agent[key], agent);
  });

  // Public pool controls can change after construction or between requests.
  // Keep the cached pool in step with the application-owned agent.
  agentControls.forEach(function(key) {
    if (utils.hasOwnProperty(agent, key)) {
      direct[key] = agent[key];
    }
  });
  return direct;
};
