import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    // 개발 환경에서도 타입 에러가 있으면 빌드 실패
    ignoreBuildErrors: false,
  },
  eslint: {
    // 개발 환경에서도 ESLint 에러가 있으면 빌드 실패
    ignoreDuringBuilds: false,
  },
  experimental: {
    // 타입 체크 강화
    typedRoutes: true,
  },
};

export default nextConfig;
