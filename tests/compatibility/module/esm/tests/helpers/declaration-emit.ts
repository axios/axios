import type { AxiosInstance, AxiosResponse } from 'axios';

export const makeRequest = function (client: AxiosInstance) {
  return <T = unknown, R = AxiosResponse<T>>() =>
    client.request<T, R>({ url: '/' });
};
