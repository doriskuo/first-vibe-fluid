import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 使用 webpack 模式以支援 GLSL shader 載入
  // Turbopack 尚不支援 raw-loader
  turbopack: {
    rules: {
      '*.vert': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
      '*.frag': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
      '*.glsl': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
  webpack: (config) => {
    // 支援 GLSL shader 檔案導入
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: ['raw-loader'],
    });
    return config;
  },
};

export default nextConfig;
