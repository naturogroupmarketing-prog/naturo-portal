import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Downgrade experimental React Compiler rules and common patterns
  // that produce false positives in existing portal app code.
  {
    rules: {
      // React Compiler rules are experimental — demote to warnings
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      // Allow `any` in complex data-handling and API code
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unescaped entities — common in JSX prose
      "react/no-unescaped-entities": "warn",
      // Allow <img> — some areas intentionally skip Next.js Image
      "@next/next/no-img-element": "warn",
      // Allow unused vars with _ prefix or when caught by TS already
      "@typescript-eslint/no-unused-vars": "warn",
      "prefer-const": "warn",
    },
  },
]);

export default eslintConfig;
