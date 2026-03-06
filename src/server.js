const http = require("http");
const express = require("express");
const path = require("path");
const { server: wisp } = require("@mercuryworkshop/wisp-js/server");

let scramjetPath, baremuxPath, epoxyPath, libcurlPath;
try {
  const sj = require("@mercuryworkshop/scramjet/path");
  // The package may export a plain string OR an object with publicPath
  scramjetPath = typeof sj === "string" ? sj : (sj.publicPath || sj.scramjetPath || sj);
  const baremux  = require("@mercuryworkshop/bare-mux/node");
  baremuxPath  = baremux.baremuxPath || baremux.default?.baremuxPath || baremux;
  const epoxy  = require("@mercuryworkshop/epoxy-transport");
  epoxyPath    = epoxy.epoxyPath || epoxy.default?.epoxyPath || epoxy;
  const libcurl  = require("@mercuryworkshop/libcurl-transport");
  libcurlPath  = libcurl.libcurlPath || libcurl.default?.libcurlPath || libcurl;
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
