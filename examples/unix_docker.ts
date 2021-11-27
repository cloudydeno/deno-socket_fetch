#!/usr/bin/env -S deno run --unstable --allow-read=/var/run/docker.sock --allow-write=/var/run/docker.sock

import { fetchUsing, UnixDialer } from '../mod.ts';

const dialer = new UnixDialer("/var/run/docker.sock");
const resp = await fetchUsing(dialer, 'http://localhost/v1.24/images/json');

console.log(resp.status);
console.log(resp.headers);
console.log(await resp.json());
