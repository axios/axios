import type { AxiosInstance, AxiosResponse } from 'axios';
import { makeRequest } from './declarations/index.js';

interface User {
  id: number;
  name: string;
}

interface CustomResponse {
  user: User;
  fromCache: boolean;
}

declare const client: AxiosInstance;
declare function expectType<T>(value: T): void;

const request = makeRequest(client);
expectType<Promise<AxiosResponse<unknown>>>(request());

const defaultResponse = request<User>();
expectType<Promise<AxiosResponse<User>>>(defaultResponse);
// @ts-expect-error -- default responses preserve the requested data type
expectType<Promise<AxiosResponse<string>>>(defaultResponse);

const customResponse = request<User, CustomResponse>();
expectType<Promise<CustomResponse>>(customResponse);
// @ts-expect-error -- custom responses use R without an AxiosResponse wrapper
expectType<Promise<AxiosResponse<User>>>(customResponse);
