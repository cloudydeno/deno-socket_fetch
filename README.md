# `/x/socket_fetch`

## What?

A remake of some `fetch()` functionality in pure TypeScript,
with a set of pluggable `Dialer` implementations to customize
how network connections are established.

Support for:
* `http:` over TCP
* `https:` over TCP + TLS
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

Unfortunately, HTTP over UNIX domain sockets and HTTPS to IP addresses are both
really useful in modern/containerized cloud architecture.
For example, the Docker Engine listens **only** at `/var/run/docker.sock` by default,
and Google Kubernetes Engine HTTPS APIs are **only** externally reachable via IP address.

In order to support connecting to these endpoints from various modules,
I've opted to leverage Deno's TCP primitives directly in a new module.

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

* Rewriting with `/std/io/buffer.ts`, added in Deno v1.8.3
* Enable/test connection reuse
* Error handling

## What about `WebSocket`?
In addition to the `fetch()` limitations listed above,
Deno's `WebSocket` API is even further behind:

* `WebSocket` doesn't accept `Deno.HttpClient`: https://github.com/denoland/deno/issues/11846
  * Would enable custom Certificate Authorities
  * Would enable TLS client certificate auth
  * Should enable WebSocket over UNIX domain sockets, once `fetch()` has it
* `WebSocket` doesn't allow custom HTTP request headers: https://github.com/denoland/deno/issues/11847

A [similar reimplementation effort already exists](https://deno.land/x/custom_socket/)
for `WebSocket` and so far it addresses custom request headers.
