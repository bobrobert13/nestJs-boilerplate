/**
 * Webpack configuration for the NestJS build.
 *
 * The default NestJS webpack config (from @nestjs/cli) uses
 * `fork-ts-checker-webpack-plugin` with a hard-coded `memoryLimit` of
 * 2048 MB. On machines with strict cgroup memory limits (CI runners,
 * containerized dev environments) the TypeScript check subprocess OOMs
 * and the build aborts with `RpcExitError: Process ... exited [SIGABRT]`,
 * even though webpack's compile step itself succeeded.
 *
 * We extend the NestJS defaults here to bump the limit to 8 GB, which
 * is enough for the full apps + packages tree. The path is
 * `typescript.memoryLimit` (the RPC worker reads it from there).
 */
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: 'apps/nominas/tsconfig.app.json',
        memoryLimit: 8192,
      },
    }),
  ],
};
