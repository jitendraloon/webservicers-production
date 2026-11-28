/**
 * cPanel / Phusion Passenger Alternative Entrypoint
 * Bridges requests directly to server.js regardless of whether
 * cPanel "Application startup file" is set to "app.js" or "server.js".
 */
module.exports = require("./server.js");
