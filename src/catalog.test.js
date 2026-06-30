// Vitest supplies the test-group, assertion, and individual-test primitives.
import { describe, expect, it } from 'vitest';
// Import only public catalog behavior so tests do not depend on implementation details.
import { allTasks, taskById, buildDemoResult, formatFileSize, validateCsvFile } from './catalog';

// Group related catalog expectations under one readable suite name.
describe('task catalog', () => {
  it('contains broad ml workflows with unique ids', () => {
    // A broad workbench should expose substantially more than a token handful of tasks.
    expect(allTasks.length).toBeGreaterThan(10);
    // Set removes duplicates, so equal lengths prove every route id is unique.
    expect(new Set(allTasks.map((task) => task.id)).size).toBe(allTasks.length);
  });

  it('finds tasks and falls back safely', () => {
    // A known id should resolve to its human-readable task definition.
    expect(taskById('clustering').name).toBe('Clustering');
    // Unknown URLs or stale saved state must still produce a usable default task.
    expect(taskById('missing')).toBeDefined();
  });

  it('creates classification and clustering demos', () => {
    // Classification demo output should contain classification-oriented metrics.
    expect(buildDemoResult(taskById('classification'), 'Random Forest').metrics[0])
      .toContain('Accuracy');
    // Clustering demo output should switch to an unsupervised quality metric.
    expect(buildDemoResult(taskById('clustering'), 'K-Means').metrics[0])
      .toContain('Silhouette');
  });

  it('formats uploaded file sizes for the confirmation message', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });

  it('explains why an invalid CSV cannot be loaded', () => {
    expect(validateCsvFile(null)).toMatch(/No file/);
    expect(validateCsvFile({ name: 'notes.txt', size: 10 })).toMatch(/Unsupported/);
    expect(validateCsvFile({ name: 'empty.csv', size: 0 })).toMatch(/empty/);
    expect(validateCsvFile({ name: 'huge.csv', size: 51 * 1024 * 1024 })).toMatch(/50 MB/);
    expect(validateCsvFile({ name: 'valid.CSV', size: 10 })).toBeNull();
  });
});
