#!/usr/bin/env -S deno run --unstable --allow-read=/var/run/docker.sock --allow-write=/var/run/docker.sock

import { fetch } from '../../mod.ts';

// Using a non-standard URL, similar to https://github.com/whatwg/url/issues/577
// A scrubbed header of `Host: uds.localhost` is sent instead of the socket path
const resp = await fetch('http+unix://%2Fvar%2Frun%2Fdocker.sock/v1.24/images/json');

console.log(resp.status);
console.log(resp.headers);
console.log(await resp.json());
