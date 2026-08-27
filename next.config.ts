import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "pg-boss",
    "pg",
    "@fal-ai/client",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    "stripe",
    "bcryptjs",
    "nodemailer",
  ],
};

export default nextConfig;
