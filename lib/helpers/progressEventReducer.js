import speedometer from './speedometer.js';
import throttle from './throttle.js';
import utils from '../utils.js';

const isProgressEvent = (e) => e && utils.isNumber(e.loaded);

export const progressEventReducer = (listener, isDownloadStream, freq = 3) => {
  let bytesNotified = 0;
  const _speedometer = speedometer(50, 250);

  const [throttled, flush] = throttle((e) => {
    if (!isProgressEvent(e)) {
      return;
    }
    const rawLoaded = e.loaded;
    const total = e.lengthComputable ? e.total : undefined;
    const loaded = Math.max(0, total != null ? Math.min(rawLoaded, total) : rawLoaded);
    const progressBytes = Math.max(0, loaded - bytesNotified);
    const rate = _speedometer(progressBytes);

    bytesNotified = Math.max(bytesNotified, loaded);

    const data = {
      loaded,
      total,
      progress: total ? loaded / total : undefined,
      bytes: progressBytes,
      rate: rate ? rate : undefined,
      estimated: rate && total ? (total - loaded) / rate : undefined,
      event: e,
      lengthComputable: total != null,
      [isDownloadStream ? 'download' : 'upload']: true,
    };

    listener(data);
  }, freq);

  // non-progress flush args (stream errors, abort reasons) replay the last pending event
  return [throttled, (e) => (isProgressEvent(e) ? flush(e) : flush())];
};

export const progressEventDecorator = (total, throttled) => {
  const lengthComputable = total != null;

  return [
    (loaded) =>
      throttled[0]({
        lengthComputable,
        total,
        loaded,
      }),
    throttled[1],
  ];
};

export const asyncDecorator =
  (fn, scheduler = utils.asap) =>
  (...args) =>
    scheduler(() => fn(...args));
