export type { Dialer } from "./dialers.ts";
export {
  TcpDialer,
  TlsDialer,
  AutoDialer,
} from "./dialers.ts";

export { ClientPool } from "./client-pool.ts";

export { performRequest } from "./perform-request.ts";

//----

import { ClientPool } from "./client-pool.ts";
import { AutoDialer, Dialer } from "./dialers.ts";
import { performRequest } from "./perform-request.ts";

const defaultDialer = new AutoDialer();
const defaultPool = new ClientPool(defaultDialer);

/** Perform a fetch using a default, unconfigured dialer and socket pool */
export const fetch = defaultPool.fetch.bind(defaultPool);

/**
 * Perform a one-off fetch using the given dialer.
 * This is useful for testing and code samples, but cannot reuse connections.
 * Instantiate a `ClientPool` instance instead if you will be making multiple requests.
 */
export async function fetchUsing(dialer: Dialer, input: string | Request | URL, opts?: RequestInit) {
  const request = new Request(input instanceof URL ? input.toString() : input, opts);
  const url = new URL(request.url);

  const conn = await dialer.dial(url);
  return await performRequest(conn, url, request);
}
