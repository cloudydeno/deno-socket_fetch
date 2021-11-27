import {
  iterateReader,
  writeAll,
} from "https://deno.land/std@0.115.1/streams/conversion.ts";

export async function performRequest(conn: Deno.Conn, url: URL, request: Request) {

  if (request.body) throw new Error(`TODO: Request#body`);
  if (request.cache) throw new Error(`TODO: Request#cache`);
  if (request.credentials) throw new Error(`TODO: Request#credentials`);
  if (request.integrity) throw new Error(`TODO: Request#integrity`);
  if (request.mode) throw new Error(`TODO: Request#mode`);
  if (request.destination) throw new Error(`TODO: Request#destination`);
  // if (request.redirect) throw new Error(`TODO: Request#redirect`);
  if (request.referrer) throw new Error(`TODO: Request#referrer`);
  if (request.referrerPolicy) throw new Error(`TODO: Request#referrerPolicy`);
  // if (request.signal) throw new Error(`TODO: Request#signal`);

  const reqHeaders = new Headers(request.headers);
  if (!reqHeaders.get("accept")) reqHeaders.set("accept", "*/*");
  if (!reqHeaders.get("host")) {
    if (url.protocol.endsWith("+unix:")) {
      reqHeaders.set("host", "uds.localhost");
    } else {
      reqHeaders.set("host", url.host);
    }
  }
  if (!reqHeaders.get("user-agent")) {
    reqHeaders.set("user-agent", `Deno/${Deno.version.deno} socket_fetch/0`);
  }
  if (request.destination) {
    reqHeaders.set("sec-fetch-dest", request.destination);
  }
  reqHeaders.set("connection", "close"); // TODO: connection reuse

  await writeAll(conn, new TextEncoder().encode(`${request.method} ${url.pathname} HTTP/1.1\r\n`));
  for (const header of reqHeaders) {
    await writeAll(conn, new TextEncoder().encode(`${header[0]}: ${header[1]}\r\n`));
  }
  await writeAll(conn, new TextEncoder().encode(`\r\n`));

  const headerLines = new Array<string>();
  let leftovers = new Array<Uint8Array>();
  let mode: "headers" | "body" | "chunks" = "headers";
  for await (const b of iterateReader(conn)) {
    // console.log('---', b.length);
    let remaining = b.subarray(0);
    while (mode === "headers" && remaining.includes(10)) {
      const idx = remaining.indexOf(10);
      const decoder = new TextDecoder();
      let text = "";
      for (const leftover of leftovers) {
        text += decoder.decode(leftover, { stream: true });
      }
      leftovers.length = 0;
      const line = remaining.subarray(0, idx);
      text += decoder.decode(line).replace(/\r$/, "");
      if (text == "") mode = "body";
      else headerLines.push(text);
      remaining = remaining.subarray(idx + 1);
    }
    if (remaining.length > 0) {
      leftovers.push(remaining.slice(0));
    }
  }
  if (headerLines.length == 0) throw new Error(`No HTTP response received`);

  // should really be a ReadableStream
  const bodySize = leftovers.reduce((a, b) => b.byteLength + a, 0);
  let body = new Uint8Array(bodySize);
  let pos = 0;
  for (const leftover of leftovers) {
    body.set(leftover, pos);
    pos += leftover.byteLength;
  }

  const statusLine = headerLines.shift()!.split(" ");
  const responseHeaders = new Headers();
  for (const line of headerLines) {
    const colon = line.indexOf(":");
    responseHeaders.append(line.slice(0, colon), line.slice(colon + 1).trim());
  }

  if (responseHeaders.get("transfer-encoding")?.includes("chunked")) {
    body = dechunk(body);
  }

  return new Response(body, {
    headers: responseHeaders,
    status: parseInt(statusLine[1]),
    statusText: statusLine.slice(2).join(" "),
  });
}

function dechunk(raw: Uint8Array) {
  const chunks = new Array<Uint8Array>();
  let inputPos = 0;
  while (inputPos < raw.length) {
    const nextNl = raw.indexOf(10, inputPos) + 1;
    if (nextNl <= 0) throw new Error(`BUG`);
    const headerSlice = raw.subarray(inputPos, nextNl);
    const header = new TextDecoder().decode(headerSlice).trimEnd().split(';')[0];
    const chunkSize = parseInt(header, 16);
    chunks.push(raw.subarray(nextNl, nextNl + chunkSize));
    inputPos = nextNl + chunkSize;
  }

  const bodySize = chunks.reduce((a, b) => b.byteLength + a, 0);
  const final = new Uint8Array(bodySize);
  let finalPos = 0;
  for (const chunk of chunks) {
    final.set(chunk, finalPos);
    finalPos += chunk.byteLength;
  }
  return final;
}
