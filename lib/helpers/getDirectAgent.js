import AxiosError from '../core/AxiosError.js';
import utils from '../utils.js';

const directAgents = new WeakMap();

export default function getDirectAgent(configuredAgent, transport) {
  const agent = configuredAgent || transport.globalAgent;
  const options = agent && agent.options;
  if (
    !options ||
    !utils.hasOwnProp(options, 'proxyEnv') ||
    typeof options.proxyEnv !== 'object' ||
    options.proxyEnv === null
  ) {
    return configuredAgent;
  }
  if (agent.constructor !== transport.Agent) {
    throw new AxiosError(
      'proxy: false requires a custom agent without proxyEnv',
      AxiosError.ERR_BAD_OPTION_VALUE
    );
  }
  let direct = directAgents.get(agent);
  if (!direct) {
    direct = new transport.Agent({ ...options, proxyEnv: undefined });
    if (utils.hasOwnProp(agent, 'createConnection')) {
      direct.createConnection = agent.createConnection;
    }
    directAgents.set(agent, direct);
  }
  return direct;
}
