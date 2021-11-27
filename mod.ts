export type { Dialer } from "./dialers.ts";
export {
  TcpDialer,
  TlsDialer,
  AutoDialer,
  UnixDialer,
} from "./dialers.ts";

export { Client } from "./client.ts";

export { performRequest } from "./perform-request.ts";

//----

import { Client } from "./client.ts";
import { AutoDialer, Dialer } from "./dialers.ts";
import { performRequest } from "./perform-request.ts";

const defaultDialer = new AutoDialer();
const defaultPool = new Client(defaultDialer);

/** Perform a fetch using a default, unconfigured dialer and socket pool */
export const fetch = defaultPool.fetch.bind(defaultPool);

/**
 * Perform a one-off fetch using the given dialer.
 * This is useful for testing and code samples, but cannot reuse connections.
 * Instantiate a `Client` instance instead if you will be making multiple requests.
 */
export async function fetchUsing(dialer: Dialer, input: string | Request | URL, opts?: RequestInit) {
  const request = new Request(input instanceof URL ? input.toString() : input, opts);
  const url = new URL(request.url);

  const conn = await dialer.dial(url);
  try {
    return await performRequest(conn, url, request);
  } finally {
    conn.close();
  }
}
