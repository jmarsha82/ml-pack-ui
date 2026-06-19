// defineConfig provides editor hints and validates Vitest configuration keys.
import { defineConfig } from 'vitest/config';
// The React plugin lets Vitest transform JSX with the same rules used by Vite.
import react from '@vitejs/plugin-react';

// Export the shared test and coverage configuration.
export default defineConfig({
  // Enable React's JSX transformation during tests.
  plugins: [react()],
  test: {
    // jsdom supplies browser-like globals without launching a real browser.
    environment: 'jsdom',
    coverage: {
      // V8 coverage is fast and maps executed JavaScript back to source lines.
      provider: 'v8',
      // Catalog helpers contain the deterministic business logic under unit test.
      include: ['src/catalog.js'],
      // Fail the command whenever line coverage falls below the requested 90% gate.
      thresholds: { lines: 90 },
    },
  },
});
