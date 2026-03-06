const http = require("http");
const express = require("express");
const path = require("path");
const { server: wisp } = require("@mercuryworkshop/wisp-js/server");

function getPath(pkg, ...keys) {
  const m = require(pkg);
  for (const k of keys) if (typeof m[k] === "string") return m[k];
  if (typeof m === "string") return m;
  if (m.default) for (const k of keys) if (typeof m.default[k] === "string") return m.default[k];
  return require.resolve(pkg).replace(/[/\\][^/\\]+$/, "");
}

let scramjetPath, baremuxPath, epoxyPath, libcurlPath;
try {
  scramjetPath = getPath("@mercuryworkshop/scramjet/path", "scramjetPath", "publicPath");
  baremuxPath  = getPath("@mercuryworkshop/bare-mux/node", "baremuxPath", "publicPath");
  epoxyPath    = getPath("@mercuryworkshop/epoxy-transport", "epoxyPath", "publicPath");
  libcurlPath  = getPath("@mercuryworkshop/libcurl-transport", "libcurlPath", "publicPath");
  console.log("Paths OK:", { scramjetPath, baremuxPath, epoxyPath, libcurlPath });
} catch (e) {
  console.error("Proxy dep load failed:", e.message);
  process.exit(1);
}

const PORT = process.env.PORT || 8080;
const app = express();

app.use("/scram/",   express.static(scramjetPath));
app.use("/baremux/", express.static(baremuxPath));
app.use("/epoxy/",   express.static(epoxyPath));
app.use("/libcurl/", express.static(libcurlPath));
app.use(express.static(path.join(__dirname, "../public")));
app.get("*", (_, res) => res.sendFile(path.join(__dirname, "../public/index.html")));

const server = http.createServer(app);

server.on("upgrade", (req, socket, head) => {
  if (req.url.startsWith("/wisp/")) {
    wisp.routeRequest(req, socket, head);
  } else {
    socket.destroy();
  }
});

server.listen(PORT, () => console.log(`🔥 Evan's Sigma Proxy on port ${PORT}`));
