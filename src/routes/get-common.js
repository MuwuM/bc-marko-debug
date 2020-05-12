const i18nAccess = require("../../bc-marko-core/i18n-next.js");


module.exports = {
  async getCommonLite(ctx) {
    if (ctx.commonLite) {
      return ctx.commonLite;
    }

    const lang = await i18nAccess.getLocale(ctx);
    const i18n = await i18nAccess.getI18n(ctx);

    ctx.commonLite = {
      i18n,
      page: {user: null},
      $global: {
        i18nLanguage: lang,
        serializedGlobals: {
          i18nLanguage: true,
          sitekey: true
        },
        flags: ["all"]
      }
    };

    return ctx.commonLite;

  },
  async getCommon(ctx, refresh) {
    if (!refresh && ctx.common) {
      return ctx.common;
    }

    const commonLite = await module.exports.getCommonLite(ctx, refresh);
    ctx.type = "html";
    ctx.common = commonLite;
    return ctx.common;
  }
};
