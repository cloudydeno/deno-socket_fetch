#!/usr/bin/env -S deno run --unstable --allow-read=/var/run/docker.sock --allow-write=/var/run/docker.sock

import { fetchUsing, UnixDialer } from "../../mod.ts";

// Set up a UNIX domain socket dialer manually
const dialer = new UnixDialer("/var/run/docker.sock");

// Request a standard-looking URL from the socket
const resp = await fetchUsing(dialer, "http://localhost/v1.24/images/json");
// (in an actual application, consider using Client to allow connection reuse)

console.log(resp.status);
console.log(resp.headers);
console.log(await resp.json());
