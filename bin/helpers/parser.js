export const matchAll = (text, regexp, cb) => {
  let match;
  while((match = regexp.exec(text))) {
    cb(match);
  }
}

export const parseSection = (body, name, cb) => {
  matchAll(body, new RegExp(`^(#+)\\s+${name}?(.*?)^\\1\\s+\\w+`, 'gims'), cb);
}

export const parseVersion = (rawVersion) => /^v?(\d+).(\d+).(\d+)/.exec(rawVersion);
