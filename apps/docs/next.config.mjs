import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  env: {
    trackerId: process.env.TRACKER_ID || '',
  },
  images: {
    unoptimized: true,
  }
};

export default withMDX(config);
