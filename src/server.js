import { createServer } from "http";
import { createRequire } from "module";
import fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve static asset paths from installed packages
const scramjetPath = require.resolve("@mercuryworkshop/scramjet").replace(/\/[^/]+$/, "/");
// bare-mux node subpath
let baremuxPath;
try {
  baremuxPath = require.resolve("@mercuryworkshop/bare-mux/node").replace(/\/[^/]+$/, "/");
} catch {
  baremuxPath = require.resolve("@mercuryworkshop/bare-mux").replace(/\/[^/]+$/, "/");
}
const libcurlPath = require.resolve("@mercuryworkshop/libcurl-transport").replace(/\/[^/]+$/, "/");

// Wisp server
const { server: wisp } = await import("@mercuryworkshop/wisp-js/server");

const PORT = process.env.PORT || 8080;

const app = fastify({ logger: false });

// Serve proxy library assets
await app.register(fastifyStatic, { root: scramjetPath,  prefix: "/scram/",   decorateReply: false });
await app.register(fastifyStatic, { root: baremuxPath,   prefix: "/baremux/", decorateReply: false });
await app.register(fastifyStatic, { root: libcurlPath,   prefix: "/libcurl/", decorateReply: false });
// Serve public folder (SPA)
await app.register(fastifyStatic, { root: join(__dirname, "../public"), prefix: "/", decorateReply: false });

// SPA fallback
app.setNotFoundHandler((req, reply) => {
  reply.sendFile("index.html");
});

// Start HTTP server, hand off WebSocket upgrades to Wisp
const server = createServer(app.server ? app.server : undefined);

app.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
  if (err) { console.error(err); process.exit(1); }
  console.log(`🔥 Evan's Sigma Proxy on port ${PORT}`);
});

// Hook Wisp onto the underlying Node HTTP server after fastify starts
app.server.on("upgrade", (req, socket, head) => {
  if (req.url.startsWith("/wisp/")) {
    wisp.routeRequest(req, socket, head);
  } else {
    socket.destroy();
  }
});
