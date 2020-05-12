const Router = require("koa-better-router");

const {getCommonLite} = require("./get-common.js");

module.exports = (pages) => {
  const router = Router().loadMethods();


  router.get("/", async(ctx) => {
    const common = await getCommonLite(ctx);
    const {
      i18n, $global, page
    } = common;
    ctx.type = "html";
    ctx.body = pages.home.stream({
      $global,
      i18n,
      page
    });
  });

  return [router.middleware()];
};
