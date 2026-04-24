# Tests

Tester du code qui effectue des requêtes HTTP avec axios est simple. L'approche recommandée consiste à simuler (mocker) axios lui-même afin que vos tests s'exécutent sans toucher un vrai réseau, vous donnant un contrôle total sur les réponses que reçoit votre code.

## Simulation avec Vitest ou Jest

Vitest et Jest supportent tous deux la simulation de modules avec `vi.mock` / `jest.mock`. Vous pouvez simuler l'ensemble du module axios et contrôler ce que chaque méthode retourne :

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

    // Faire en sorte que axios.get se résolve avec notre fausse réponse
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

## Simuler une AxiosError

Pour tester les chemins de gestion d'erreurs qui inspectent `error.response`, créez directement une instance d'`AxiosError` :

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

## Utiliser axios-mock-adapter

[axios-mock-adapter](https://github.com/ctimmerm/axios-mock-adapter) est une bibliothèque qui installe un adaptateur personnalisé sur votre instance axios, interceptant les requêtes au niveau de l'adaptateur. Cela signifie que vos intercepteurs continuent de s'exécuter, ce qui la rend plus adaptée aux tests d'intégration.

```bash
npm install --save-dev axios-mock-adapter
```

```js
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

const mock = new MockAdapter(axios);

// Simuler une requête GET
mock.onGet("/api/users/1").reply(200, { id: 1, name: "Jay" });

// Simuler une requête POST
mock.onPost("/api/users").reply(201, { id: 2, name: "New User" });

// Simuler une erreur réseau
mock.onGet("/api/failing").networkError();

// Simuler un délai d'attente dépassé
mock.onGet("/api/slow").timeout();
```

Réinitialisez les simulations entre les tests :

```js
afterEach(() => {
  mock.reset(); // effacer tous les gestionnaires enregistrés
});
```

## Tester les intercepteurs

Pour tester les intercepteurs de manière isolée, créez une nouvelle instance axios dans votre test :

```js
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

describe("auth interceptor", () => {
  it("attaches a Bearer token to every request", async () => {
    const instance = axios.create();
    const mock = new MockAdapter(instance);

    // Ajoutez votre intercepteur
    instance.interceptors.request.use((config) => {
      config.headers.set("Authorization", "Bearer test-token");
      return config;
    });

    // Capturez la configuration de la requête en inspectant ce que mock a reçu
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

## Conseils

- Simulez toujours au niveau du module (ou utilisez `MockAdapter`) — évitez de simuler des méthodes individuelles sur une instance partagée, car l'état peut fuiter entre les tests.
- Préférez `mockResolvedValueOnce` / `mockRejectedValueOnce` à `mockResolvedValue` pour que les tests soient isolés et ne s'affectent pas mutuellement.
- Pour tester la logique de nouvelle tentative, utilisez `MockAdapter` afin que l'intercepteur testé s'exécute réellement à chaque tentative.
