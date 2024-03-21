import platform from '../platform/index.js';

const parseOrigin = (origin) => {
  const parsed = /^(?:([|\w]+):\/?\/?)?([^:/\s]+)(?::([\d|]+))?/.exec(origin);
  if (!parsed) {
    throw new TypeError(`Can't parse origin '${origin}'`);
  }
  return [parsed[1], parsed[2].split('.'), parsed[3]]
}

const matchList = (value, list) => !list || (value && list.split('|').indexOf(value) >= 0);

const matchOrigin = (target, origin) => {
  const [
    targetProtocol = 'http',
    targetDomains,
    targetPort = targetProtocol === 'http' ? '80' : '443'
  ] = parseOrigin(new URL(target, platform.origin));

  const [originProtocol, originDomains, originPort] = parseOrigin(origin);

  if (!matchList(targetProtocol, originProtocol) || !matchList(targetPort, originPort)) {
    return false;
  }

  let n = originDomains.length;
  let m = targetDomains.length;

  while (n--) {
    let originDomain = originDomains[n];
    let targetDomain = m && targetDomains[--m];

    if (originDomain === '**') {
      if (n) {
        throw Error(`** can only appear at the beginning`);
      }
      return true;
    } else if ((!n && m) || originDomain !== '*' && !matchList(targetDomain, originDomain)) {
      return false;
    }
  }

  return true;
}

export default matchOrigin;
