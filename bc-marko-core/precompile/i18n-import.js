const fs = require("fs-extra");
const path = require("path");
const fg = require("fast-glob");


const preloadI18n = require("../i18n-preload.js");

module.exports = async(rootDir, classMap) => {

  await preloadI18n.load();

  const componentsFiles = await fg([
    "components/**/*.js",
    "components/**/*.marko"
  ], {cwd: rootDir});

  const spaceClass = classMap && classMap["bc-class-enforce-space"] || "bc-class-enforce-space";

  for (const file of componentsFiles) {
    const baseName = path.basename(file);
    const flatPath = path.resolve(rootDir, "components", baseName);
    if (path.resolve(file) !== flatPath) {
      await fs.move(file, flatPath);
    }
    if (baseName.endsWith(".marko")) {
      const initialContent = `${await fs.readFile(flatPath)}`;
      let content = initialContent;
      if (content.match(/[^.]i18n\(/) && !content.includes("$ const i18n = require(\"../components/i18n-auto.js\")(out);")) {
        content = `$ const i18n = require("../components/i18n-auto.js")(out);\n${content}`;
      }
      if (content.match(/\$\{space\}/)) {
        content = content.replace(/\$\{space\}/g, `<pre class="${spaceClass}" marko-preserve-whitespace> </pre>`) ;
      }
      if (content !== initialContent) {
        await fs.outputFile(flatPath, content) ;
      }
    }
  }
  const pagesFiles = await fg(["pages/**/*.marko"], {cwd: rootDir});

  for (const file of pagesFiles) {
    const baseName = path.resolve(file);
    if (baseName.endsWith(".marko")) {
      const initialContent = `${await fs.readFile(baseName)}`;
      let content = initialContent;
      if (content.match(/[^.]i18n\(/) && !content.includes("$ const i18n = require(\"../components/i18n-auto.js\")(out);")) {
        content = `$ const i18n = require("../components/i18n-auto.js")(out);\n${content}`;
      }
      if (content.match(/\$\{space\}/)) {
        content = content.replace(/\$\{space\}/g, `<pre class="${spaceClass}" marko-preserve-whitespace> </pre>`) ;
      }
      if (content !== initialContent) {
        await fs.outputFile(baseName, content) ;
      }
    }
  }
};
