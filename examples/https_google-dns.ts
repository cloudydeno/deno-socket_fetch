#!/usr/bin/env -S deno run --allow-net

import { ClientPool, fetchUsing, TlsDialer } from '../mod.ts';

const dialer = new TlsDialer({ hostname: 'dns.google' });
const resp = await fetchUsing(dialer, 'https://8.8.8.8/healthz');

console.log(resp.headers);
console.log(await resp.text());
