import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __APP_COMMIT__: JSON.stringify('test'),
    __APP_VERSION__: JSON.stringify('1.1.1'),
    __APP_DATE__: JSON.stringify('2026-10-18'),
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
