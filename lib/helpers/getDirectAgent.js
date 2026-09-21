import utils from '../utils.js';
import bind from './bind.js';

const directAgents = new WeakMap();

export default function getDirectAgent(configuredAgent, transport) {
  if (
    !process.allowedNodeEnvironmentFlags ||
    !process.allowedNodeEnvironmentFlags.has('--use-env-proxy')
  ) {
    return configuredAgent;
  }

  const agent = configuredAgent || transport.globalAgent;
  const options = agent && agent.options;
  if (
    !(agent instanceof transport.Agent) ||
    agent.protocol !== transport.globalAgent.protocol ||
    !options ||
    !utils.hasOwnProp(options, 'proxyEnv') ||
    typeof options.proxyEnv !== 'object' ||
    options.proxyEnv === null
  ) {
    return configuredAgent;
  }

  // Node snapshots proxyEnv when constructing the agent. Keep this check
  // conservative even when the caller later removes protocol-specific entries.
  let direct = directAgents.get(agent);
  if (!direct) {
    direct = new transport.Agent({ ...options, proxyEnv: undefined });
    if (agent.createConnection !== transport.Agent.prototype.createConnection) {
      direct.createConnection = bind(agent.createConnection, agent);
    }

    // Agent.destroy() does not emit an event. Keep the associated pool under
    // the configured agent's lifetime, including agents reused after destroy().
    const destroy = agent.destroy;
    agent.destroy = function destroyWithDirectAgent() {
      try {
        return destroy.apply(this, arguments);
      } finally {
        direct.destroy();
      }
    };
    directAgents.set(agent, direct);
  }
  return direct;
}
