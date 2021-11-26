import type { Dialer } from "./dialers.ts";
import { performRequest } from './perform-request.ts';

export class ClientPool {
  constructor(
    public readonly dialer: Dialer,
  ) {}

  async fetch(input: string | Request | URL, opts?: RequestInit) {

    const request = new Request(input instanceof URL ? input.toString() : input, opts);
    const url = new URL(request.url);

    const conn = await this.dialer.dial(url);
    return await performRequest(conn, url, request);
  }

}
