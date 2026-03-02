import { afterEach } from 'vitest';
import { stopAllTrackedHTTPServers } from './server.js';

afterEach(async () => {
  await stopAllTrackedHTTPServers();
});
