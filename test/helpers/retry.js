
export const retryNetwork = async (fn, retries = 3, delay = 1000) => {
  let attempt = 0, sleep;

  do {
    try {
      return await fn()
    } catch (err) {
      if (err.code === 'ERR_NETWORK' && attempt++ < retries) {
        sleep = attempt * attempt * delay;
        console.warn(`[ERR_NETWORK]: Attempt ${attempt}/${retries}${err.config ? ' [' + err.config.url + ']' : ''} sleep [${sleep}ms]`);
        await new Promise(resolve => setTimeout(resolve, sleep));
      } else {
        throw err;
      }
    }
  } while (true);
}
