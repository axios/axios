import axios = require('axios');

export const makeRequest = (client: axios.AxiosInstance) =>
  <T = unknown, R = axios.AxiosResponse<T>>() => client.request<T, R>({ url: '/' });
