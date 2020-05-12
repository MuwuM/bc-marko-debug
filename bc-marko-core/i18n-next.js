const countries = require("i18n-iso-countries");
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));
countries.registerLocale(require("i18n-iso-countries/langs/de.json"));


const ARRAY_INDEX_RE = /\{(\d+)\}/g;

const queryField = "locale";

const hostParts = (process.env.VIRTUAL_HOST || "").split(",");

function hostIndex(index) {
  let i = index;
  while (i > 0 && !hostParts[i]) {
    i -= 1;
  }
  return hostParts[i];
}

const hostmap = {
  de: hostIndex(0),
  en: hostIndex(1)
};

const hostmapRev = {};

for (const [
  lang,
  url
] of Object.entries(hostmap)) {
  if (!hostmapRev[url]) {
    hostmapRev[url] = lang;
  }
}

function formatLocale(locale) {
  // support zh_CN, en_US => zh-CN, en-US
  return locale.replace(/_/g, "-").toLowerCase();
}

const loadedRessources = require("../i18n/full.json");

const languages = Object.entries(loadedRessources.resources).map(([
  langCode,
  resource
]) => ({
  id: langCode,
  name: resource.langName,
  host: hostmap[langCode]
}));

module.exports = {
  async getLocale(ctx) {
    if (ctx.__locale) {
      return ctx.__locale;
    }

    const defaultLocale = hostmapRev[ctx.hostname] || "de";

    const {resources} = loadedRessources;


    // 1. Query
    let locale = ctx.query[queryField];

    // 3. Header
    if (!locale) {
      let acceptedLanguages = ctx.acceptsLanguages();
      if (acceptedLanguages) {
        if (Array.isArray(acceptedLanguages)) {
          if (acceptedLanguages[0] === "*") {
            acceptedLanguages = acceptedLanguages.slice(1);
          }
          if (acceptedLanguages.length > 0) {
            for (let i = 0; i < acceptedLanguages.length; i++) {
              const lang = formatLocale(acceptedLanguages[i]);
              if (resources[lang]) {
                if (!ctx.__noI18nRedirect && hostmap[lang] !== ctx.hostname) {
                  ctx.redirect(`https://${hostmap[lang]}${ctx.request.url}`);
                  return lang;
                }
                locale = lang;
                break;
              }
            }
          }
        } else {
          locale = acceptedLanguages;
        }
      }

      // all missing, set it to defaultLocale
      if (!locale) {
        locale = defaultLocale;
      }
    }

    locale = formatLocale(locale);

    if (!resources[locale]) {
      locale = defaultLocale;
    }

    ctx.__locale = locale;
    return locale;
  },
  async getI18n(ctx) {
    const {resources} = loadedRessources;
    const locale = ctx.__locale;
    const resource = resources[locale] || {};
    const func = function(key, values) {

      if (typeof key !== "string") {
        console.warn("Invalid i18n call");
        return "";
      }
      if (key === "countryForIsoCode") {
        return countries.getName(values, resource.languageCodeForCountries);
      }
      if (typeof resource[key] !== "string" || resource[key] === "") {
        console.warn(`translation missing for: ${JSON.stringify(key)} in [${locale}]`);
        return `[[__${key}__]]`;
      }
      if (!Array.isArray(values)) {
        return resource[key];
      }
      return resource[key].replace(ARRAY_INDEX_RE, (original, matched) => {
        const index = parseInt(matched, 10);
        if (index < values.length) {
          return values[index];
        }
        return original;
      });
    };
    Object.defineProperty(func, "toJSON", {get() {
      return () => resource;
    }});
    return func;
  },
  async languages() {
    return languages;
  },
  host(ctx) {
    const defaultLocale = hostmapRev[ctx.hostname] || "de";
    if (hostmap[ctx.__locale || defaultLocale]) {
      return hostmap[ctx.__locale || defaultLocale];
    }
    return hostmap.de;
  }
};
