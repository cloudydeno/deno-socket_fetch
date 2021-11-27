#!/usr/bin/env -S deno run --allow-net

import { fetchUsing, TlsDialer } from '../../mod.ts';

// TODO: use /x/kubernetes_client to load a KubeConfig
const k8sToken = await Deno.readTextFile('/run/secrets/kubernetes.io/serviceaccount/token');
const k8sCert = await Deno.readTextFile('/run/secrets/kubernetes.io/serviceaccount/ca.crt');
const nodeName = Deno.args[0];
const nodeIp = Deno.args[1];

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
