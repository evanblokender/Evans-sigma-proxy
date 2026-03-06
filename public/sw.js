importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

// Load config once when the SW activates, not on every fetch
self.addEventListener("activate", (event) => {
  event.waitUntil(scramjet.loadConfig());
});

self.addEventListener("fetch", (event) => {
  if (scramjet.route(event)) {
    event.respondWith(scramjet.fetch(event));
  }
});
