import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships WASM and argon2 ships a native binary; both must stay out of the bundle.
  serverExternalPackages: ["@electric-sql/pglite", "@node-rs/argon2"],
};

export default nextConfig;
