
const importI18n = require("./bc-marko-core/precompile/i18n-import.js");

(async() => {
  try {
    await importI18n(__dirname, {});
    console.info("precompile done.");
  } catch (error) {
    console.error(new Error(error && error.stack || error));
    process.exitCode = 1;
    throw error;
  }
})().catch((err) => {
  console.error(new Error(err && err.stack || err));
  process.exitCode = 1;
});
