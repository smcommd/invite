const isProd = process.env.NODE_ENV === "production";
const isVercel = Boolean(process.env.VERCEL);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
};

if (!isVercel) {
  nextConfig.output = "export";
}

// GitHub Pages용 경로는 Vercel이 아닐 때만 적용
if (isProd && !isVercel) {
  const repositoryName = "invite";
  nextConfig.basePath = `/${repositoryName}`;
  nextConfig.assetPrefix = `/${repositoryName}/`;
}

nextConfig.images = { unoptimized: true };

module.exports = nextConfig;
