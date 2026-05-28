import axios = require('axios');

declare const thrown: unknown;

if (axios.isCancel<{ ok: true }>(thrown)) {
  const canceled: InstanceType<typeof axios.CanceledError> = thrown;
  const data: { ok: true } | undefined = thrown.response?.data;

  console.log(canceled.message, data);
}
