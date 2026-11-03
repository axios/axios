'use strict';

/**
 * Calculate data maxRate
 * @param {Number} [samplesCount= 10]
 * @param {Number} [min= 1000]
 * @returns {Function}
 */
function speedometer(samplesCount, min) {
  // Keep the sampling window independent of system clock adjustments.
  const clock =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? () => performance.now()
      : Date.now;

  samplesCount = samplesCount || 10;
  const bytes = new Array(samplesCount);
  const timestamps = new Array(samplesCount);
  let head = 0;
  let tail = 0;
  let firstSampleTS;
  let lastSampleTS;

  min = min !== undefined ? min : 1000;

  return function push(chunkLength) {
    const now = clock();

    if (lastSampleTS !== undefined && now < lastSampleTS) {
      head = 0;
      tail = 0;
      firstSampleTS = undefined;
    }
    lastSampleTS = now;

    const startedAt = head === tail ? undefined : timestamps[tail];

    if (firstSampleTS === undefined) {
      firstSampleTS = now;
    }

    bytes[head] = chunkLength;
    timestamps[head] = now;

    let i = tail;
    let bytesCount = 0;

    while (i !== head) {
      bytesCount += bytes[i++];
      i = i % samplesCount;
    }

    head = (head + 1) % samplesCount;

    if (head === tail) {
      tail = (tail + 1) % samplesCount;
    }

    if (now - firstSampleTS < min) {
      return;
    }

    const passed = startedAt !== undefined && now - startedAt;

    return passed > 0 ? Math.round((bytesCount * 1000) / passed) : undefined;
  };
}

export default speedometer;
