import type { Dialer } from "./dialers.ts";
import { performRequest } from './perform-request.ts';

export class Client {
  constructor(
    public readonly dialer: Dialer,
  ) {}
  originSockets = new Map<string,Set<Deno.Conn>>();
  activeSockets = new WeakSet<Deno.Conn>();

  async fetch(input: string | Request | URL, opts?: RequestInit) {

    const request = new Request(input instanceof URL ? input.toString() : input, opts);
    const url = new URL(request.url);

    const knownSocks = this.originSockets.get(url.origin) || new Set();
    this.originSockets.set(url.origin, knownSocks);

    for (const sock of knownSocks) {
      if (this.activeSockets.has(sock)) continue;

      this.activeSockets.add(sock);
      try {
        const resp = await performRequest(sock, url, request);
        if (resp.headers.get('connection')?.includes('close')) {
          // console.log('Tossing used multi-shot connection for', url.origin);
          knownSocks.delete(sock);
        }
        return resp;
      } catch (err) {
        if (err.message == 'No HTTP response received') {
          // console.log('Tossing dead existing socket for', url.origin);
          knownSocks.delete(sock);
        } else throw err;
      } finally {
        this.activeSockets.delete(sock);
      }
    }

    const conn = await this.dialer.dial(url);
    knownSocks.add(conn);
    this.activeSockets.add(conn);
    const resp = await performRequest(conn, url, request);
    this.activeSockets.delete(conn);
    if (resp.headers.get('connection')?.includes('close')) {
      // console.log('Tossing used single-shot connection for', url.origin);
      knownSocks.delete(conn);
    }
    return resp;
  }

}
