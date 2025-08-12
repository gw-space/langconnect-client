import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 환경에서는 standalone 비활성화
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  typescript: {
    // 개발 환경에서도 타입 에러가 있으면 빌드 실패
    ignoreBuildErrors: false,
  },
  eslint: {
    // 개발 환경에서도 ESLint 에러가 있으면 빌드 실패
    ignoreDuringBuilds: false,
  },
  // Turbopack과 충돌하는 설정 제거
  // experimental: {
  //   typedRoutes: true,
  // },
  // 개발 환경에서 핫 리로드 최적화
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
