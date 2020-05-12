const Koa = require("koa");
const serve = require("koa-better-static2");
const mount = require("koa-mount");

const server = require("./bc-marko-core/server.js");
const pagesLoader = require("./bc-marko-core/pages.js");
const routes = require("./src/routes/router.js");

(async() => {
  const app = new Koa();
  app.proxy = true;


  const pages = await pagesLoader();

  function mountStatic(prefix, target) {
    app.use(mount(prefix, serve(target, {maxage: 31536000000})));//immutable
  }

  mountStatic("/static", `${__dirname}/static`);

  routes(pages).map((route, index) => {
    if (typeof route !== "function") {
      console.warn(`@${index}:`, route);
    }
    app.use(route);
  });


  await server(app);

})().catch((err) => {
  console.error(new Error(err && err.stack || err));
  process.exit(1);
});
