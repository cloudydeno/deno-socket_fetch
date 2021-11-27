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
    return await dialTcp(target, '80');
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
    const conn = await dialTcp(target, '443');
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
 */
export class AutoDialer implements Dialer {
  private readonly tlsDialer = new TlsDialer();
  private readonly tcpDialer = new TcpDialer();

  dial(target: URL): Promise<Deno.Conn> {
    switch (target.protocol) {
      case 'http:': return this.tcpDialer.dial(target);
      case 'https:': return this.tlsDialer.dial(target);
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
  ) {}

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
