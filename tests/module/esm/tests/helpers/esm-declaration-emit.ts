import type { AxiosInstance, AxiosResponse } from 'axios';

export const makeRequest = (client: AxiosInstance) =>
  <T = unknown, R = AxiosResponse<T>>() => client.request<T, R>({ url: '/' });
