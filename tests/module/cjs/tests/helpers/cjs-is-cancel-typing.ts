import axios = require('axios');

declare const thrown: unknown;

interface RequestData {
  submitted: true;
}

interface RequestParams {
  query: string;
}

if (axios.isCancel<{ ok: true }, RequestData, RequestParams>(thrown)) {
  const canceled: InstanceType<
    typeof axios.CanceledError<{ ok: true }, RequestData, RequestParams>
  > = thrown;
  const data: { ok: true } | undefined = thrown.response?.data;
  const requestData: RequestData | undefined = thrown.config?.data;
  const params: RequestParams | undefined = thrown.config?.params;
  // @ts-expect-error -- The generic response data must not be widened to any.
  const wrongData: { ok: false } | undefined = thrown.response?.data;
  // @ts-expect-error -- The generic request data must not be widened to any.
  const wrongRequestData: { submitted: false } | undefined = thrown.config?.data;
  // @ts-expect-error -- The generic request params must not be widened to any.
  const wrongParams: { query: number } | undefined = thrown.config?.params;

  console.log(
    canceled.message,
    data,
    requestData,
    params,
    wrongData,
    wrongRequestData,
    wrongParams
  );
}
