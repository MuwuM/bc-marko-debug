const ini = require("ini");
const fs = require("fs-extra");
const path = require("path");

const countries = require("i18n-iso-countries");
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));
countries.registerLocale(require("i18n-iso-countries/langs/de.json"));


function formatLocale(locale) {
  // support zh_CN, en_US => zh-CN, en-US
  return locale.replace(/_/g, "-").toLowerCase();
}

const localesDir = path.resolve(__dirname, "..", "i18n");
const loadedRessources = (async() => {
  const locales = await fs.readdir(localesDir);

  const resources = Object.assign({}, ...await Promise.all(locales.map(async(fileName) => {
    if (!fileName.endsWith(".properties")) {
      return {};
    }
    const fileContent = await fs.readFile(path.resolve(localesDir, fileName));
    const langCode = formatLocale(path.basename(fileName, ".properties"));
    const content = ini.parse(`${fileContent}`);

    for (const [
      key,
      value
    ] of Object.entries(content)) {
      content[key] = value
        .replace(/\{n\}/g, "\n")
        .replace(/”/g, "\"")
        .replace(/’/g, "'")
        .replace(/\{!\w+\}/g, "")
        .replace(/(^\s+|\s+$)/g, "");
    }
    let text = content.langName;
    if (typeof text !== "string" || text === "") {
      console.warn(`translation missing for: langName in [${langCode}]`);
      text = "[[__langName__]]";
    }
    return {[langCode]: content};
  })));

  return {resources};
})();

module.exports = {async load() {
  try {
    const res = await loadedRessources;
    await fs.outputJSON(path.join(localesDir, "full.json"), res);
  } catch (error) {
    console.error(error);
    throw error;
  }
}};
