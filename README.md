![Deno CI](https://github.com/cloudydeno/deno-socket_fetch/workflows/CI/badge.svg?branch=main)

# `/x/socket_fetch`

## What?

A remake of some `fetch()` functionality in pure TypeScript,
with a set of pluggable `Dialer` implementations to customize
how network connections are established.

Support for:
* `http:` over TCP
* `https:` over TCP + TLS (with custom server name)
* `http+unix:` over stream-type Unix Domain Sockets (UDS)

Note that this module can & should be deprecated
once Deno's HTTP builtins provide comparable networking functionality.

## Why?

Deno's `fetch()` APIs are relatively limited for a server-side runtime.
Numerous advanced network features have been lacking:

* HTTP over UNIX domain sockets: https://github.com/denoland/deno/issues/8821
* HTTPS/TLS to IP addresses: https://github.com/denoland/deno/issues/7660
  * Workaround: Passing a custom TLS servername to `fetch()`, also missing!
* ~~HTTPS with TLS client auth: https://github.com/denoland/deno/pull/11721~~
  * Added in Deno v1.14 :)
* HTTP with weird server behaviors that fail Deno's sanity checks

Unfortunately, HTTP over UNIX domain sockets and HTTPS to IP addresses are both
really useful in modern/containerized cloud architecture.
For example, the Docker Engine listens **only** at `/var/run/docker.sock` by default,
and Google Kubernetes Engine HTTPS APIs are **only** externally reachable via IP address.

In order to support connecting to these endpoints from various modules,
I've opted to leverage Deno's TCP primitives directly in a new module.

## When?

Consider this library if you:

* Need to send basic HTTP requests to a daemon that listens on a Unix socket
  * Docker Engine, `tailscaled`, Podman, `snapd`, etc
* Need to communicate with an HTTPS endpoint that doesn't have a proper DNS name
  * Google Kubernetes Engine API, Kubernetes nodes/pods, IoT devices on your LAN
  * You just need to provide any DNS name that **is** on the server's certificate
* Need to use a service which has a different DNS name and TLS name
  * I have no examples of this, and I hope you don't either.

## Implemented features

* Protocols:
  * [x] `http:`
  * [x] `https:`
  * [x] `http+unix:`
* Requests:
  * [x] Headers
  * [ ] Buffered bodies
  * [ ] Streaming bodies
* Responses:
  * [x] Headers
  * [x] Buffered bodies
  * [ ] Streaming bodies

### Remaining work

* Rewrite with `/std/io/buffer.ts` (added in Deno v1.8.3)
* Enable/test connection reuse
* Figure out TLS client certificates (missing in `Deno.startTls()`)
* Implement error handling

## What about `WebSocket`?
In addition to the `fetch()` limitations listed above,
Deno's `WebSocket` API is even further behind:

* `WebSocket` doesn't accept `Deno.HttpClient`: https://github.com/denoland/deno/issues/11846
  * Would enable custom Certificate Authorities
  * Would enable TLS client certificate auth
  * Should enable WebSocket over UNIX domain sockets, once `fetch()` has it
* ~~`WebSocket` doesn't allow custom HTTP request headers: https://github.com/denoland/deno/issues/11847~~

A [similar reimplementation effort already exists](https://deno.land/x/custom_socket/)
for `WebSocket` and so far it addresses custom request headers.
