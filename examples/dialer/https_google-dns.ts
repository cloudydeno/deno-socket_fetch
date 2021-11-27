#!/usr/bin/env -S deno run --allow-net

import { fetchUsing, TlsDialer } from "../../mod.ts";

const dialer = new TlsDialer({ hostname: "dns.google" });
const resp = await fetchUsing(dialer, "https://8.8.8.8/healthz");
// (in an actual application, consider using Client to allow connection reuse)

console.log(resp.headers);
console.log(await resp.text());
