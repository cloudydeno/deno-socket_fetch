#!/usr/bin/env -S deno run --allow-net

import { TlsDialer, fetchUsing } from '../mod.ts';

const k8sToken = await Deno.readTextFile('/run/secrets/kubernetes.io/serviceaccount/token');
const k8sCert = await Deno.readTextFile('/run/secrets/kubernetes.io/serviceaccount/ca.crt');
const nodeName = `node-1`;
const nodeIp = `100.101.102.103`;

const dialer = new TlsDialer({
  hostname: nodeName,
  caCerts: [k8sCert],
});

const resp = await fetchUsing(dialer, `https://${nodeIp}:10250/stats/summary`, {
  headers: {
    authorization: `bearer ${k8sToken}`,
  },
});

console.log(resp.headers);
console.log(await resp.json());
