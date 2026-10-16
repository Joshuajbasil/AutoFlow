import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { testTimeout: 20000, hookTimeout: 600000, fileParallelism: false } });
