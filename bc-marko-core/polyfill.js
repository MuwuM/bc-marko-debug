/* global window */
if (typeof window !== "undefined") {
  /* eslint-disable global-require */

  require("./core-js-build.js");
  require("regenerator-runtime/runtime");
  require("whatwg-fetch");
  require("custom-event-polyfill");

  /* eslint-enable global-require */
}
