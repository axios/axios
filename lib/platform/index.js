import platform from './node/index.js';
import * as common from './common/index.js';

export default {
  ...common,
  ...platform,
};
