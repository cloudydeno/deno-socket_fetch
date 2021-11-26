import type { Dialer } from "./dialers.ts";

/**
 * Satisfies HTTP requests by creating a plaintext UNIX Stream socket.
 *
 * A socket location MUST be specified, and will be used for all connections.
 * Note that the URL given for the request will still be used for the Host header.
 *
 * UNIX sockets currently require --unstable to typecheck.
 * After this changes, UnixDialer will be moved into the main dialers file.
 */
export class UnixDialer implements Dialer {
  constructor(
    public readonly socketPath: string,
  ) {}

  async dial(): Promise<Deno.Conn> {
    return await Deno.connect({
      transport: "unix",
      path: this.socketPath,
    });
  }
}
