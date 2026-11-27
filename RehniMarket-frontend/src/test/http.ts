// Adaptador HTTP falso para el cliente `api`: las pruebas recorren servicios, interceptores y
// manejo de errores reales; solo se sustituye la red.
import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import { api } from "@/api/Client";

export interface RecordedRequest {
  method: string;
  url: string;
  params: Record<string, string | string[]>;
  body: unknown;
  headers: Record<string, unknown>;
}

export interface HttpReply {
  __reply: true;
  status: number;
  data: unknown;
}

type Handler = unknown | ((req: RecordedRequest) => unknown);

export function reply(status: number, data: unknown = {}): HttpReply {
  return { __reply: true, status, data };
}

/** Error de dominio con el formato `{ detail: { code, message } }` del backend. */
export function apiError(status: number, code: string, message: string, extra = {}) {
  return reply(status, { detail: { code, message, ...extra } });
}

function isReply(value: unknown): value is HttpReply {
  return typeof value === "object" && value !== null && "__reply" in value;
}

function collectParams(params: unknown): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  if (!params) return out;
  const add = (key: string, value: string) => {
    const prev = out[key];
    if (prev === undefined) out[key] = value;
    else out[key] = Array.isArray(prev) ? [...prev, value] : [prev, value];
  };
  if (params instanceof URLSearchParams) {
    params.forEach((value, key) => add(key, value));
    return out;
  }
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value !== undefined && value !== null) add(key, String(value));
  }
  return out;
}

function parseBody(data: unknown): unknown {
  if (typeof data !== "string") return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

function routeMatches(pattern: string, path: string): boolean {
  const a = pattern.split("/");
  const b = path.split("/");
  if (a.length !== b.length) return false;
  return a.every((seg, i) => seg.startsWith(":") || seg === b[i]);
}

/**
 * Instala rutas `"MÉTODO /ruta"` (admite `:param`). El valor es la respuesta, una función
 * que la calcula o `reply(status, data)` para errores. Lo no declarado responde 404.
 */
export function mockApi(routes: Record<string, Handler> = {}) {
  const requests: RecordedRequest[] = [];

  const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    const method = (config.method ?? "get").toUpperCase();
    // El refresh usa `${VITE_API_URL}/auth/refresh` (absoluta, o "undefined/..." sin .env en CI).
    const rawUrl = (config.url ?? "")
      .replace(/^[a-z]+:\/\/[^/]+/i, "")
      .replace(/^undefined/, "");
    const [path, query] = rawUrl.split("?");
    const params = collectParams(config.params);
    if (query) Object.assign(params, collectParams(new URLSearchParams(query)));

    const req: RecordedRequest = {
      method,
      url: path,
      params,
      body: parseBody(config.data),
      headers: AxiosHeaders.from(config.headers).toJSON(),
    };
    requests.push(req);

    const key = Object.keys(routes).find((candidate) => {
      const [m, p] = candidate.split(" ");
      return m === method && routeMatches(p, path);
    });

    let result: unknown = key === undefined ? reply(404, { detail: { message: `Sin ruta: ${method} ${path}` } }) : routes[key];
    if (typeof result === "function") result = await (result as (r: RecordedRequest) => unknown)(req);

    const status = isReply(result) ? result.status : 200;
    const data = isReply(result) ? result.data : result;
    const response: AxiosResponse = {
      data,
      status,
      statusText: String(status),
      headers: {},
      config,
    };

    if (status >= 400) {
      throw new AxiosError(`HTTP ${status}`, String(status), config, null, response);
    }
    return response;
  };

  api.defaults.adapter = adapter;
  axios.defaults.adapter = adapter;

  return {
    requests,
    /** Peticiones que coinciden con `"MÉTODO /ruta"`. */
    calls: (route: string) => {
      const [m, p] = route.split(" ");
      return requests.filter((r) => r.method === m && routeMatches(p, r.url));
    },
  };
}

/** Lee un FormData como objeto plano (los archivos quedan como `File`). */
export function formDataToObject(body: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  (body as FormData).forEach((value, key) => {
    if (key in out) {
      const prev = out[key];
      out[key] = Array.isArray(prev) ? [...prev, value] : [prev, value];
    } else {
      out[key] = value;
    }
  });
  return out;
}

export function makeFile(name: string, type: string, size = 1024): File {
  const file = new File([new Uint8Array(Math.min(size, 16))], name, { type });
  if (size > 16) Object.defineProperty(file, "size", { value: size });
  return file;
}
