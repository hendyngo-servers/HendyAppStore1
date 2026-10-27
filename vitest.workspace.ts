import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'workers/*/vitest.config.ts',
  'packages/*/vitest.config.ts',
]);
