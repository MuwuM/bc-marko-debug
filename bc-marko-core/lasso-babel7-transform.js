"use strict";
const path = require("path");

const babel = require("@babel/core");
const UglifyJS = require("uglify-js");

const transformCache = {};
const uglifyNameCache = {};

async function transformFile(code, filename, extensions, babelOptions, obfuscate) {
  const ext = path.extname(filename);
  if (!filename || !Object.prototype.hasOwnProperty.call(extensions, ext)) {
    console.error(new Error(`Invalid file name: ${filename}`));
    process.exit(1);
  }

  if (ext === ".json") {
    return JSON.stringify(JSON.parse(code));
  }

  babelOptions.filename = path.relative(path.dirname(filename), filename);
  if (babelOptions.filename === "core-js-build.js") {
    return code;
  }

  try {
    const result = await babel.transformAsync(code, babelOptions);
    /*if (obfuscate && !filename.includes("node_modules")) {*/
    const obfuscationResult = UglifyJS.minify(result.code, {
      nameCache: uglifyNameCache,
      compress: {
        arguments: false,
        assignments: false,
        booleans: false,
        collapse_vars: false,
        comparisons: true,
        conditionals: true,
        directives: false,
        dead_code: true,
        drop_console: false,
        drop_debugger: true,
        evaluate: true,
        functions: false,
        hoist_funs: false,
        hoist_props: false,
        hoist_vars: false,
        if_return: false,
        inline: true,
        join_vars: true,
        keep_fargs: false,
        keep_fnames: false,
        keep_infinity: true,
        loops: true,
        negate_iife: true,
        objects: true,
        passes: 1,
        pure_funcs: null,
        pure_getters: "strict",
        properties: true,
        reduce_funcs: false,
        reduce_vars: true,
        sequences: false,
        side_effects: false,
        strings: true,
        switches: true,
        toplevel: false,
        typeofs: false,
        unsafe: false,
        unsafe_comps: false,
        unsafe_Function: false,
        unsafe_math: false,
        unsafe_proto: false,
        unsafe_regexp: false,
        unsafe_undefined: false,
        unused: false
      }
    });
    if (obfuscationResult.warnings && obfuscationResult.warnings.length > 0) {
      for (const warning of obfuscationResult.warnings) {
        console.warn(warning);
      }
    }
    return obfuscationResult.code;
    /*}
    return result.code;*/
  } catch (error) {
    console.error(new Error(error && error.stack || error));
    console.warn("Error while babel transform:", babelOptions.filename);
    process.exit(1);
    return code;
  }
}

module.exports = {
  id: __filename,
  stream: false,
  createTransform(transformConfig) {

    let extensions = transformConfig.extensions;

    if (!extensions) {
      extensions = [
        ".js",
        ".es6",
        ".json"
      ];
    }

    extensions = extensions.reduce((lookup, ext) => {
      if (ext.charAt(0) !== ".") {
        ext = `.${ext}`;
      }
      lookup[ext] = true;
      return lookup;
    }, {});

    const {
      babelOptions, obfuscate
    } = transformConfig;

    if (!babelOptions) {
      console.error(new Error("babelOptions not defined !!!!!!!"));
      process.exit(1);
    }

    babelOptions.babelrc = false;

    return function lassoBabelTransform(code, lassoContext) {
      const {filename} = lassoContext;
      console.log({filename});
      if (transformCache[filename]) {
        return transformCache[filename];
      }
      transformCache[filename] = transformFile(code, filename, extensions, babelOptions, obfuscate);
      return transformCache[filename];
    };
  }
};
