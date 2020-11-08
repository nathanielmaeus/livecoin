import svelte from "rollup-plugin-svelte";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";
import typescript from "@rollup/plugin-typescript";
import autoPreprocess from "svelte-preprocess";
import babel from "@rollup/plugin-babel";

const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/main.ts",
  output: {
    sourcemap: true,
    format: "cjs",
    name: "app",
    file: "dist/bundle.js",
    exports: "auto",
  },
  plugins: [
    typescript({ sourceMap: true }),
    svelte({
      preprocess: autoPreprocess(),
      dev: !production,
      css: (css) => {
        css.write("bundle.css");
      },
    }),
    commonjs(),

    resolve({
      browser: true,
      dedupe: (importee) =>
        importee === "svelte" || importee.startsWith("svelte/"),
    }),
    !production && livereload("dist"),
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};
