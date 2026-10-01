# Testing

Testing code that makes HTTP requests with axios is straightforward. The recommended approach is to mock axios itself so that your tests run without hitting a real network, giving you full control over what responses your code receives.

## Mocking with Vitest or Jest

Both Vitest and Jest support module mocking with `vi.mock` / `jest.mock`. You can mock the entire axios module and control what each method returns:

```js
// user-service.js
import axios from "axios";

export async function getUser(id) {
  const { data } = await axios.get(`/api/users/${id}`);
  return data;
}
```

```js
// user-service.test.js
import { describe, it, expect, vi } from "vitest";
import axios from "axios";
import { getUser } from "./user-service";

vi.mock("axios");

describe("getUser", () => {
  it("returns user data on success", async () => {
    const mockUser = { id: 1, name: "Jay" };

    // Make axios.get resolve with our fake response
    axios.get.mockResolvedValueOnce({ data: mockUser });

    const result = await getUser(1);

    expect(result).toEqual(mockUser);
    expect(axios.get).toHaveBeenCalledWith("/api/users/1");
  });

  it("throws when the request fails", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    await expect(getUser(1)).rejects.toThrow("Network error");
  });
});
```

## Mocking an AxiosError

To test error-handling paths that inspect `error.response`, create an `AxiosError` instance directly:

```js
import axios, { AxiosError } from "axios";
import { vi } from "vitest";

const mockError = new AxiosError(
  "Not Found",
  "ERR_BAD_REQUEST",
  {},       // config
  {},       // request
  {         // response
    status: 404,
    statusText: "Not Found",
    data: { message: "User not found" },
    headers: {},
    config: {},
  }
);

axios.get.mockRejectedValueOnce(mockError);
```

## Using axios-mock-adapter

[axios-mock-adapter](https://github.com/ctimmerm/axios-mock-adapter) is a library that installs a custom adapter on your axios instance, intercepting requests at the adapter level. This means your interceptors still run, making it better for integration tests.

```bash
npm install --save-dev axios-mock-adapter
```

```js
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

const mock = new MockAdapter(axios);

// Mock a GET request
mock.onGet("/api/users/1").reply(200, { id: 1, name: "Jay" });

// Mock a POST request
mock.onPost("/api/users").reply(201, { id: 2, name: "New User" });

// Mock a network error
mock.onGet("/api/failing").networkError();

// Mock a timeout
mock.onGet("/api/slow").timeout();
```

Reset mocks between tests:

```js
afterEach(() => {
  mock.reset(); // clear all registered handlers
});
```

## Testing interceptors

To test interceptors in isolation, create a fresh axios instance in your test:

```js
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

describe("auth interceptor", () => {
  it("attaches a Bearer token to every request", async () => {
    const instance = axios.create();
    const mock = new MockAdapter(instance);

    // Add your interceptor
    instance.interceptors.request.use((config) => {
      config.headers.set("Authorization", "Bearer test-token");
      return config;
    });

    // Capture the request config by inspecting what mock received
    let capturedConfig;
    mock.onGet("/api/data").reply((config) => {
      capturedConfig = config;
      return [200, {}];
    });

    await instance.get("/api/data");

    expect(capturedConfig.headers["Authorization"]).toBe("Bearer test-token");
  });
});
```

## Tips

- Always mock at the module level (or use `MockAdapter`) — avoid mocking individual methods on a shared instance, as state can leak between tests.
- Use `mockResolvedValueOnce` / `mockRejectedValueOnce` in preference to `mockResolvedValue` so that tests are isolated and don't affect one another.
- When testing retry logic, use `MockAdapter` so that the interceptor under test actually runs on each attempt.
