'use strict';

import utils from '../utils.js';
import validator from '../helpers/validator.js';

export default function assertValidProgressInterval(config) {
  validator.assertOptions(
    { progressUpdateIntervalMs: utils.getSafeProp(config, 'progressUpdateIntervalMs') },
    {
      progressUpdateIntervalMs: (value) =>
        (Number.isFinite(value) && value >= 1 && value <= 2147483647) ||
        'a finite number between 1 and 2147483647',
    }
  );
}
