const {resources} = require("../i18n/full.json");
let i18nLanguage = "de";
const countries = require("i18n-iso-countries");
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));
countries.registerLocale(require("i18n-iso-countries/langs/de.json"));
module.exports = (key, values) => {
  const ARRAY_INDEX_RE = /\{(\d+)\}/g;
  if (!resources) {
    throw new Error("resources is missing");
  }
  if (!resources[i18nLanguage]) {
    throw new Error("resources is missing");
  }
  if (typeof key !== "string") {
    return "";
  }

  const i18n = resources[i18nLanguage];

  if (key === "countryForIsoCode") {
    return countries.getName(values, i18n.languageCodeForCountries);
  }
  if (typeof i18n[key] !== "string" || i18n[key] === "") {
    return `[[__${key}__]]`;
  }
  if (!Array.isArray(values)) {
    return i18n[key];
  }
  return i18n[key].replace(ARRAY_INDEX_RE, (original, matched) => {
    const index = parseInt(matched, 10);
    if (index < values.length) {
      return values[index];
    }
    return original;
  });
};
module.exports.init = (out) => {
  if (out && out.global && out.global.i18nLanguage) {
    i18nLanguage = out.global.i18nLanguage || "de";
  } else if ((new Error()).stack.includes("bc-marko-core/pages.js")) {
    console.warn(`init with missing i18n\n${(new Error()).stack}`);
    i18nLanguage = "de";
  } else {
    throw new Error("init with missing i18n");
  }
};
