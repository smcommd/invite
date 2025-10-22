/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
};

const isProd = process.env.NODE_ENV === "production";
if (isProd) {
  const repositoryName = "invite_2";
  nextConfig.basePath = `/${repositoryName}`;
  nextConfig.assetPrefix = `/${repositoryName}/`;
}

nextConfig.images = { unoptimized: true };

module.exports = nextConfig;

