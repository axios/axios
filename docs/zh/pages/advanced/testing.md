# 测试

测试使用 axios 发起 HTTP 请求的代码非常简单。推荐的方式是对 axios 本身进行 mock，让测试在不触及真实网络的情况下运行，从而完全控制代码收到的响应内容。

## 使用 Vitest 或 Jest 进行 Mock

Vitest 和 Jest 都支持通过 `vi.mock` / `jest.mock` 进行模块级 mock。你可以 mock 整个 axios 模块，并控制每个方法的返回值：

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

    // 让 axios.get 返回我们的假响应
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

## Mock AxiosError

要测试检查 `error.response` 的错误处理路径，可以直接创建一个 `AxiosError` 实例：

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

## 使用 axios-mock-adapter

[axios-mock-adapter](https://github.com/ctimmerm/axios-mock-adapter) 是一个在 axios 实例上安装自定义适配器的库，在适配器层面拦截请求。这意味着你的拦截器仍然会执行，因此更适合集成测试。

```bash
npm install --save-dev axios-mock-adapter
```

```js
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

const mock = new MockAdapter(axios);

// Mock GET 请求
mock.onGet("/api/users/1").reply(200, { id: 1, name: "Jay" });

// Mock POST 请求
mock.onPost("/api/users").reply(201, { id: 2, name: "New User" });

// Mock 网络错误
mock.onGet("/api/failing").networkError();

// Mock 超时
mock.onGet("/api/slow").timeout();
```

在每个测试之间重置 mock：

```js
afterEach(() => {
  mock.reset(); // 清除所有已注册的处理器
});
```

## 测试拦截器

要单独测试拦截器，在测试中创建一个全新的 axios 实例：

```js
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

describe("auth interceptor", () => {
  it("attaches a Bearer token to every request", async () => {
    const instance = axios.create();
    const mock = new MockAdapter(instance);

    // 添加你的拦截器
    instance.interceptors.request.use((config) => {
      config.headers.set("Authorization", "Bearer test-token");
      return config;
    });

    // 通过检查 mock 收到的内容来捕获请求配置
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

## 最佳实践

- 始终在模块级别进行 mock（或使用 `MockAdapter`）——避免在共享实例的单个方法上进行 mock，因为状态可能在测试之间泄漏。
- 优先使用 `mockResolvedValueOnce` / `mockRejectedValueOnce`，而不是 `mockResolvedValue`，以确保测试相互隔离，互不影响。
- 测试重试逻辑时，使用 `MockAdapter`，以便被测拦截器在每次重试时都能真正执行。
