# Pruebas

Probar código que realiza solicitudes HTTP con axios es sencillo. El enfoque recomendado es simular (mock) axios directamente, de modo que las pruebas se ejecuten sin acceder a la red real, dándote control total sobre las respuestas que recibe tu código.

## Simulación con Vitest o Jest

Tanto Vitest como Jest admiten la simulación de módulos con `vi.mock` / `jest.mock`. Puedes simular todo el módulo de axios y controlar lo que devuelve cada método:

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

## Simular un AxiosError

Para probar rutas de manejo de errores que inspeccionan `error.response`, crea una instancia de `AxiosError` directamente:

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

## Usando axios-mock-adapter

[axios-mock-adapter](https://github.com/ctimmerm/axios-mock-adapter) es una librería que instala un adaptador personalizado en tu instancia de axios, interceptando las solicitudes a nivel del adaptador. Esto significa que tus interceptores siguen ejecutándose, lo que la hace más adecuada para pruebas de integración.

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

Reinicia los mocks entre pruebas:

```js
afterEach(() => {
  mock.reset(); // clear all registered handlers
});
```

## Probar interceptores

Para probar interceptores de forma aislada, crea una nueva instancia de axios en tu prueba:

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

## Consejos

- Siempre simula a nivel de módulo (o usa `MockAdapter`) — evita simular métodos individuales en una instancia compartida, ya que el estado puede filtrarse entre pruebas.
- Usa `mockResolvedValueOnce` / `mockRejectedValueOnce` en lugar de `mockResolvedValue` para que las pruebas estén aisladas y no se afecten entre sí.
- Al probar lógica de reintento, usa `MockAdapter` para que el interceptor bajo prueba realmente se ejecute en cada intento.
