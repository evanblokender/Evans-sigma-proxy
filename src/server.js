const http = require("http");
const express = require("express");
const path = require("path");

let scramjetPath, baremuxPath, epoxyPath, libcurlPath;
try {
  // new CI build exports scramjetPath
  const sj = require("@mercuryworkshop/scramjet/path");
  scramjetPath = sj.scramjetPath || sj.publicPath;
  baremuxPath  = require("@mercuryworkshop/bare-mux/node").baremuxPath;
  epoxyPath    = require("@mercuryworkshop/epoxy-transport").epoxyPath;
  libcurlPath  = require("@mercuryworkshop/libcurl-transport").libcurlPath;
} catch (e) {
  console.error("Proxy dep load failed:", e.message);
  process.exit(1);
}

const { createServer: createWispServer } = require("wisp-server-node");
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
  if (req.url.startsWith("/wisp/")) createWispServer(req, socket, head);
  else socket.destroy();
});

server.listen(PORT, () => console.log(`🔥 Evan's Sigma Proxy on port ${PORT}`));
