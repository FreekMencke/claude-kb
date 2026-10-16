/**
 * Bundles the server and all of node_modules into dist/server.mjs, which the image runs (Dockerfile), with rspack like
 * osrs-tracker-api: it idled at 83 MiB, and 72 with `--lite-mode` (Dockerfile), where the .ts files with the SDK took
 * 136 (FreekMencke/claude-kb#146). Tests and `node server.ts` run the sources.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Configuration, rspack } from '@rspack/core';

const HERE = dirname(fileURLToPath(import.meta.url));

const config: Configuration = {
  mode: 'production',
  target: 'node24',
  context: HERE,
  entry: './server.ts',
  // Node reads source maps only with --enable-source-maps, which costs memory; stack traces name the bundle's lines
  devtool: false,
  output: {
    path: join(HERE, 'dist'),
    filename: 'server.mjs',
    module: true,
    chunkFormat: 'module',
    library: { type: 'module' },
    clean: true,
  },
  // Node's own modules, node:sqlite among them, stay imports
  externalsType: 'module-import',
  externals: [/^node:/],
  resolve: { extensions: ['.ts', '.js', '.json'] },
  module: {
    // Keep import.meta as it is: server.ts finds the assets from import.meta.url and starts on import.meta.main
    parser: { javascript: { importMeta: false } },
    rules: [
      {
        test: /\.ts$/,
        loader: 'builtin:swc-loader',
        options: { jsc: { parser: { syntax: 'typescript' }, target: 'es2024' } },
        type: 'javascript/auto',
      },
    ],
  },
  // Readable stack traces, for a few hundred KB
  optimization: { minimize: false },
  // Expressions in express (view engines) and debug (an optional supports-color) that the server never reaches
  ignoreWarnings: [{ module: /node_modules\/(express\/lib\/view|debug\/src\/node)\.js$/ }],
};

rspack(config, (error, stats) => {
  if (error) throw error;
  if (!stats) throw new Error('rspack returned no stats');
  const report = stats.toString({ preset: 'errors-warnings', colors: false });
  if (report) console.log(report);
  if (stats.hasErrors() || stats.hasWarnings()) process.exitCode = 1;
});
