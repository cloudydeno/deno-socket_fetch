#!/usr/bin/env -S deno run --allow-env=KUBECONFIG,HOME --allow-read --allow-net

/*
 * This more in-depth example demonstrates encrypted communication with a GKE control plane.
 * GKE clusters do not have an Internet-addressable DNS name in their TLS certificate,
 * so the `hostname` option of `TlsDialer` is used to replace the handshake servername
 * with "kubernetes.default.svc". This makes Deno's underlying rustls implementation happy.
 *
 * This usage will be superseded whenever there is a resolution for:
 *   "Fetching https://1.1.1.1 or any other bare IP address fails with 'invalid dnsname'"
 *   @ https://github.com/denoland/deno/issues/7660
 */
import { fetchUsing, TlsDialer } from "../../mod.ts";

// Load the user's KubeConfig file
import { KubeConfig } from "https://deno.land/x/kubernetes_client@v0.3.0/lib/kubeconfig.ts";
const kubeConfig = await KubeConfig.getDefaultConfig();
const kubeContext = kubeConfig.fetchContext();

// GKE doesn't give client certificates by default, so we can ignore them for this example
if (false
  || kubeContext.user["client-certificate-data"]
  || kubeContext.user["client-certificate"]
  || kubeContext.user["client-key-data"]
  || kubeContext.user["client-key"]
) throw new Error(`TODO: client auth not yet available with Deno.startTls()`);

// Load the TLS authority for the cluster
// TODO: This sort of file loading needs to be handled by /x/kubernetes_client, to fix relative paths
let serverCert = atob(kubeContext.cluster["certificate-authority-data"] ?? "");
if (!serverCert && kubeContext.cluster["certificate-authority"]) {
  serverCert = await Deno.readTextFile(kubeContext.cluster["certificate-authority"]);
}

// Build an auth header for the user, if any
const headers = new Headers();
const authHeader = await kubeContext.getAuthHeader();
if (authHeader) {
  headers.set("authorization", authHeader);
}

// Configure our connection to the control plane
const dialer = new TlsDialer({
  hostname: "kubernetes.default.svc",
  caCerts: serverCert ? [serverCert] : [],
});

// Issue a readonly request
const url = new URL("/api", kubeContext.cluster.server);
const resp = await fetchUsing(dialer, url, { headers });
console.log(resp.headers);
console.log(await resp.json());
