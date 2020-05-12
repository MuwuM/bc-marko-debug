require("marko/node-require");

const fs = require("fs-extra");
const path = require("path");

const pgk = require("../package.json");

const lasso = require("lasso");
const LassoPrebuildResult = require("lasso/src/LassoPrebuildResult");
const {buildPrebuildFileName} = require("lasso/src/util/prebuild.js");
const {buildPrebuildName} = require("lasso/src/util/prebuild.js");
const marko = require("marko");
const nodePath = require("path");
const coreJsBuilder = require("core-js-builder");

const preloadOnly = process.argv.includes("--preload-only");

module.exports = async() => {
  const isProduction = false;

  const staticDir = path.join(__dirname, "../static");

  const lassoConfig = {
    plugins: ["lasso-marko"],
    outputDir: staticDir,
    bundlingEnabled: isProduction,
    minify: isProduction,
    minifyJS: isProduction,
    minifyCSS: isProduction,
    fingerprintsEnabled: true,
    resolveCssUrls: false,
    loadPrebuild: !preloadOnly,
    require: {transforms: [
      {
        transform: `${__dirname}/lasso-babel7-transform.js`,
        config: {
          extensions: [
            ".marko",
            ".js",
            ".json",
            ".es6"
          ],
          obfuscate: isProduction,
          babelOptions: {
            compact: isProduction || "auto",
            inputSourceMap: false,
            comments: !isProduction,
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: pgk.browserslist,
                  useBuiltIns: "entry",
                  corejs: {
                    version: 3,
                    proposals: false
                  }
                }
              ]
            ]
          }
        }
      }
    ]}
  };

  lasso.configure(lassoConfig);

  const pagesDir = path.join(__dirname, "../pages");


  const pages = {};
  const pagesLoaded = (async() => {
    const files = await fs.readdir(pagesDir);
    for (const pageFile of files) {
      if (!pageFile.endsWith(".marko")) {
        continue;
      }
      const pagePath = path.join(pagesDir, pageFile);
      const name = path.basename(pageFile, ".marko");
      pages[name] = marko.load(require.resolve(pagePath));
    }
  })();


  await coreJsBuilder({
    modules: [
      "es",
      "web"
    ],
    blacklist: [],
    targets: pgk.browserslist,
    filename: path.join(__dirname, "../bc-marko-core/core-js-build.js")
  });

  await pagesLoaded;


  // cache pages
  console.info("caching pages");

  if (preloadOnly) {
    const lassoI = lasso.create(lassoConfig);
    const allConfig = [];
    console.time("read Dependencies");
    for (const [
      name,
      page
    ] of Object.entries(pages)) {
      const dependencies = page.getDependencies();
      /*console.log({
        name,
        dependencies: dependencies.length
      });*/
      const config = {
        from: pagesDir,
        name: "pages",
        pageName: name,
        cacheKey: page.path,
        cache: false,
        dependencies,
        dirname: path.dirname(page.path),
        filename: page.path,
        pageDir: pagesDir,
        flags: ["all"]
      };
      allConfig.push(config);
    }
    console.timeEnd("read Dependencies");

    console.time("cached pageByPage");
    const lassoPrebuildResult = new LassoPrebuildResult();
    //const steps = [];
    for (const pageConfig of allConfig) {
      //steps.push((async() => {

      try {
        //console.time(`cached page ${pageConfig.pageName}`);

        const lassoPageResult = await lassoI.lassoPage(pageConfig);
        const name = buildPrebuildName(pageConfig.pageName);
        const lassoPrebuild = lassoPageResult.toLassoPrebuild(name, pageConfig.flags);
        const buildPath = nodePath.resolve(pageConfig.pageDir, buildPrebuildFileName(name));
        console.log(`${name} -> ${buildPath}`);
        lassoPrebuildResult.addBuild(buildPath, lassoPrebuild);
        //console.timeEnd(`cached page ${pageConfig.pageName}`);
      } catch (error) {
        throw new Error(`failed precache ${pageConfig.pageName}: ${error.stack}`);
      }
      //})());
    }
    //await Promise.all(steps);
    console.timeEnd("cached pageByPage");

    console.time("cached allPages");
    await lassoPrebuildResult.write();
    //await lassoI.prebuildPage(allConfig, {writeToDisk: true});
    console.timeEnd("cached allPages");

    console.info("cached all pages");
  }
  return pages;
};

if (preloadOnly) {
  module.exports().catch((err) => {
    console.error(new Error(err && err.stack || err));
    process.exitCode = 1;
  });
}
