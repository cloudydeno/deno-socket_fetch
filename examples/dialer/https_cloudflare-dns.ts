#!/usr/bin/env -S deno run --allow-net

import { fetchUsing, TlsDialer } from '../../mod.ts';

const dialer = new TlsDialer({ hostname: 'one.one.one.one' });
const resp = await fetchUsing(dialer, 'https://1.1.1.1/healthz');
// (in an actual application, consider using Client to allow connection reuse)

console.log(resp.headers);
console.log(await resp.text());
