'use strict';

export default function getProxyForUrl(url) {
    const parsedUrl = new URL(url);
    let proto = parsedUrl.protocol;
    let hostname = parsedUrl.hostname;
    let port = parsedUrl.port;

    if (!hostname || !proto) {
        return '';
    }

    proto = proto.split(':', 1)[0];

    if (!port) {
        port = (proto === 'http' ? 80 : (proto === 'https' ? 443 : 0));
    }

    if (!shouldProxy(hostname, port)) {
        return '';
    }

    let proxy =
        getEnv('npm_config_' + proto + '_proxy') ||
        getEnv(proto + '_proxy') ||
        getEnv('npm_config_proxy') ||
        getEnv('all_proxy');

    if (proxy && proxy.indexOf('://') === -1) {
        proxy = proto + '://' + proxy;
    }

    return proxy;
}

function shouldProxy(hostname, port) {
    const NO_PROXY = (getEnv('npm_config_no_proxy') || getEnv('no_proxy')).toLowerCase();

    if (!NO_PROXY) {
        return true;
    }

    if (NO_PROXY === '*') {
        return false;
    }

    const proxies = NO_PROXY.split(/[,\s]/);

    for (let i = 0; i < proxies.length; i++) {
        let proxy = proxies[i];
        if (!proxy) continue;

        const parts = proxy.split(':');
        const proxyHostname = parts[0];
        const proxyPort = parts[1];

        if (proxyPort && parseInt(proxyPort) !== parseInt(port)) {
            continue;
        }

        if (!/^[.*]/.test(proxyHostname)) {
            // No wildcards, so stop proxying if there is an exact match.
            if (hostname === proxyHostname) {
                return false;
            }
        } else {
            if (proxyHostname.charAt(0) === '*') {
                proxy = proxyHostname.slice(1);
            } else {
                proxy = proxyHostname;
            }
            if (hostname.endsWith(proxy)) {
                return false;
            }
        }
    }

    return true;
}

function getEnv(key) {
    return process.env[key.toLowerCase()] || process.env[key.toUpperCase()] || '';
}
