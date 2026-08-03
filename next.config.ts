import type { NextConfig } from "next";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const webpack: any = require("next/dist/compiled/webpack/webpack-lib");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // pptxgenjs imports node: builtins; rewrite for client webpack builds
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins = config.plugins ?? [];
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:/,
          (resource: { request: string }) => {
            resource.request = resource.request.replace(/^node:/, "");
          }
        )
      );
      config.resolve = config.resolve ?? {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        https: false,
        http: false,
        path: false,
        stream: false,
        crypto: false,
        zlib: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
