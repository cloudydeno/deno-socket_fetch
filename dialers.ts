/**
 * API to help satisfy HTTP requests by providing network connections.
 */
export interface Dialer {
  dial(target: URL): Promise<Deno.Conn>;
}

/**
 * Satisfies HTTP requests by creating a basic plaintext TCP connection.
 */
export class TcpDialer implements Dialer {
  async dial(target: URL): Promise<Deno.Conn> {
    return await dialTcp(target, "80");
  }
}

/**
 * Satisfies HTTPS requests by creating a TLS-encrypted TCP connection.
 * CA and servername options can be set on the constructor.
 *
 * Deno's TLS API became stabilized in Deno v1.16.
 */
export class TlsDialer implements Dialer {
  constructor(
    public readonly opts?: Deno.StartTlsOptions,
  ) {}

  async dial(target: URL): Promise<Deno.Conn> {
    const conn = await dialTcp(target, "443");
    const tlsConn = await Deno.startTls(conn, {
      hostname: target.hostname,
      ...this.opts,
    });
    return tlsConn;
  }
}

/**
 * Satisfies HTTP/HTTPS requests traditionally using the appropriate dialer.
 * If you need to configure a specific dialer, use it directly instead.
 *
 * To access UNIX servers,
 *   URL-encode the socket path into the host part of an `http+unix:` URL.
 * For example:
 *   http+unix://%2Fvar%2Frun%2Fdocker.sock/v1.24/containers/json
 * Note that this URL parsing may break in future versions of Deno.
 */
export class AutoDialer implements Dialer {
  private readonly tlsDialer = new TlsDialer();
  private readonly tcpDialer = new TcpDialer();

  dial(target: URL): Promise<Deno.Conn> {
    switch (target.protocol) {
      case 'http:': return this.tcpDialer.dial(target);
      case 'https:': return this.tlsDialer.dial(target);
      case 'http+unix:': {
        // Approximation of https://github.com/whatwg/url/issues/577#issuecomment-968496984 et al
        // Browsers handle these URLs differently, but this works as of Deno v1.16
        if (target.port) throw new Error(`UNIX Domain Socket URLs cannot have a port`);
        const sockPath = decodeURIComponent(target.hostname);
        return new UnixDialer(sockPath).dial();
      };
      default: throw new Error(`Protocol not implemented: ${JSON.stringify(target.protocol)}`);
    }
  }
}

/**
 * Satisfies HTTP requests by creating a plaintext UNIX Stream socket.
 *
 * A socket location MUST be specified, and will be used for all connections.
 * Note that the URL given for the request will still be used for the Host header.
 *
 * NOTE: UNIX domain sockets still require `--unstable` as of Deno v1.16!
 */
export class UnixDialer implements Dialer {
  constructor(
    public readonly socketPath: string,
  ) {
    if (!socketPath) throw new Error(`No UNIX socket path given to UnixDialer`);
  }

  async dial(): Promise<Deno.Conn> {
    return await Deno.connect({
      transport: "unix",
      path: this.socketPath,
    } as unknown as Deno.ConnectOptions);
  }
}


function dialTcp(target: URL, defaultPort: string) {
  const givenPort = target.port || defaultPort;
  const parsedPort = parseInt(givenPort);
  if (givenPort != parsedPort.toFixed(0)) {
    throw new Error(`Failed to parse an integer out of port ${JSON.stringify(givenPort)}`);
  }

  return Deno.connect({
    transport: "tcp",
    hostname: target.hostname,
    port: parsedPort,
  });
}
