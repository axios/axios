import BufferedStream from "../helpers/BufferedStream.js";
import utils from "../utils.js";

export default async (config, next) => {
  let {
    data,
    signal,
    bufferTimeout,
    bufferSize,
  } = config;

  const kind = utils.kindOf(data);

  const isStreamPayload = data && (kind === 'readablestream' || kind === 'request' || utils.isAsyncIterable(data));

  if (isStreamPayload) {
    return next({
      ...config,
      data: new BufferedStream(data, {
        signal,
        timeWindow: bufferTimeout,
        bytesThreshold: bufferSize
      })
    })
  }

  return next(config);
}
