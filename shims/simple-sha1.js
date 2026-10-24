// parse-torrent hashes the info dict through simple-sha1.
// That package's browser build probes Web Crypto and then a blob worker.
// Plain HTTP does not provide Web Crypto, and script-src 'self' blocks the worker.
// Rusha's sync digest is the same SHA-1.
const Rusha = require("rusha");

const rusha = new Rusha();

function sha1sync(buf) {
  return rusha.digest(buf);
}

function sha1(buf, cb) {
  queueMicrotask(function () {
    cb(sha1sync(buf));
  });
}

module.exports = sha1;
module.exports.sync = sha1sync;
