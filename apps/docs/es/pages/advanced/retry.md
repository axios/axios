# Reintentos y recuperación de errores

Las solicitudes de red pueden fallar por razones transitorias — una falla momentánea del servidor, una breve interrupción de la red o una respuesta de límite de tasa. Implementar una estrategia de reintento en un interceptor te permite manejar estos fallos de forma transparente, sin ensuciar el código de tu aplicación.

## Reintento básico con un interceptor de respuesta

El enfoque más sencillo es capturar códigos de estado de error específicos y reenviar inmediatamente la solicitud original un número limitado de veces:

```js
import axios from "axios";

const api = axios.create({ baseURL: "https://api.example.com" });

const MAX_RETRIES = 3;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Only retry on network errors or 5xx server errors
    const shouldRetry =
      !error.response || (error.response.status >= 500 && error.response.status < 600);

    if (!shouldRetry) {
      return Promise.reject(error);
    }

    config._retryCount = config._retryCount ?? 0;

    if (config._retryCount >= MAX_RETRIES) {
      return Promise.reject(error);
    }

    config._retryCount += 1;
    return api(config);
  }
);
```

## Retroceso exponencial

Reintentar inmediatamente después de un fallo puede sobrecargar a un servidor que ya tiene dificultades. El retroceso exponencial espera progresivamente más tiempo entre cada intento:

```js
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    const shouldRetry =
      !error.response || (error.response.status >= 500 && error.response.status < 600);

    if (!shouldRetry) return Promise.reject(error);

    config._retryCount = config._retryCount ?? 0;

    if (config._retryCount >= 3) return Promise.reject(error);

    config._retryCount += 1;

    // Wait 200ms, 400ms, 800ms, ... before each retry
    const backoff = 100 * 2 ** config._retryCount;
    await delay(backoff);

    return api(config);
  }
);
```

## Reintento en 429 (límite de tasa) con Retry-After

Cuando el servidor responde con `429 Too Many Requests`, a menudo incluye un encabezado `Retry-After` que indica exactamente cuánto tiempo esperar:

```js
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    if (error.response?.status !== 429) return Promise.reject(error);

    config._retryCount = config._retryCount ?? 0;
    if (config._retryCount >= 3) return Promise.reject(error);

    config._retryCount += 1;

    const retryAfterHeader = error.response.headers["retry-after"];
    const waitMs = retryAfterHeader
      ? parseFloat(retryAfterHeader) * 1000  // header is in seconds
      : 1000;                                // default to 1 second

    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return api(config);
  }
);
```

## Desactivar reintentos por solicitud

Si algunas solicitudes nunca deben reintentarse (por ejemplo, mutaciones no idempotentes que no deseas duplicar), añade un indicador a la configuración de la solicitud:

```js
// Add this to your interceptor before the retry logic:
if (config._noRetry) return Promise.reject(error);

// Then opt out on specific calls:
await api.post("/payments/charge", body, { _noRetry: true });
```

## Combinar reintentos con cancelación

Usa un `AbortController` para cancelar una solicitud que está esperando un retardo de retroceso:

```js
const controller = new AbortController();

try {
  await api.get("/api/data", { signal: controller.signal });
} catch (error) {
  if (axios.isCancel(error)) {
    console.log("Request aborted by user");
  }
}

// Cancel the request (and any pending retry delay) from elsewhere:
controller.abort();
```
