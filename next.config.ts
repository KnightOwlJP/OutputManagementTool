import type { NextConfig} from "next";

const nextConfig: NextConfig = {
  // Electron用の出力設定（SPAモード）
  output: 'export',
  distDir: 'out',
  
  // トレイリングスラッシュを有効化（Electron用）
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  
  // Electron用のプレフィックス（開発時は無効）
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : undefined,
  
  // 画像最適化の無効化（Electronでは不要）
  images: {
    unoptimized: true,
  },
  
  // TypeScriptの厳密チェック（ビルド時は無効化）
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ESLintチェック（ビルド時は無効化）
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // SWCのミニファイを無効化（console.logを保持）
  compiler: {
    removeConsole: false,
  },
  
  // 実験的機能（軽量化）
  experimental: {
    optimizePackageImports: ['@heroui/react', '@heroicons/react'],
  },
  
  // Webpack最適化（console.logを保持）
  webpack: (config, { isServer, dev }) => {
    // 開発モードまたはKEEP_CONSOLEが設定されている場合はconsole.logを保持
    if (!isServer && !dev && process.env.NODE_ENV === 'production') {
      console.log('[Next.js Build] Configuring webpack to keep console.log...');
      
      // TerserPluginを探して設定を変更
      const TerserPlugin = config.optimization.minimizer?.find(
        (plugin: any) => plugin.constructor.name === 'TerserPlugin'
      );
      
      if (TerserPlugin) {
        console.log('[Next.js Build] Found TerserPlugin, disabling drop_console');
        TerserPlugin.options = {
          ...TerserPlugin.options,
          terserOptions: {
            ...TerserPlugin.options.terserOptions,
            compress: {
              ...TerserPlugin.options.terserOptions?.compress,
              drop_console: false,
              drop_debugger: false,
            },
          },
        };
      } else {
        console.log('[Next.js Build] TerserPlugin not found');
      }
      
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        usedExports: true,
        sideEffects: true,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            default: false,
            vendors: false,
            // HeroUIを1つのチャンクにまとめる
            heroui: {
              name: 'heroui',
              test: /[\\/]node_modules[\\/]@heroui[\\/]/,
              priority: 40,
              reuseExistingChunk: true,
            },
            // React関連を1つのチャンクにまとめる
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },
            // その他のnode_modules
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name: 'lib',
              priority: 20,
              minChunks: 1,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
