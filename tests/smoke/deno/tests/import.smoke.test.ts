import { assertEquals } from '@std/assert';
import axios, { AxiosError, AxiosHeaders, CanceledError } from 'axios';

Deno.test('Deno importing: default export is callable', () => {
  assertEquals(typeof axios, 'function');
});

Deno.test('Deno importing: named exports are functions', () => {
  assertEquals(typeof AxiosError, 'function');
  assertEquals(typeof CanceledError, 'function');
  assertEquals(typeof AxiosHeaders, 'function');
});

Deno.test('Deno importing: named exports match axios properties', () => {
  assertEquals(axios.AxiosError, AxiosError);
  assertEquals(axios.CanceledError, CanceledError);
  assertEquals(axios.AxiosHeaders, AxiosHeaders);
});
