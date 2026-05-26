import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // lucide-react + date-fns are optimized by default — these aren't.
    // @base-ui/react ships ~15MB of source so barrel-import tree-shaking
    // matters; @dnd-kit/* is only used in the setlist editor.
    optimizePackageImports: [
      "@base-ui/react",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
      "react-markdown",
    ],
  },
};

export default nextConfig;
