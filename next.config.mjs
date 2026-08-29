/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', 'three-stdlib'],
  reactStrictMode: true,
};

export default nextConfig;
