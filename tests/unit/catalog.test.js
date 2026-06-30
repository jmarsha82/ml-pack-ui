import { describe, expect, it } from 'vitest';
import { allTasks, taskById, buildDemoResult, formatFileSize, validateCsvFile } from '../../src/catalog';

describe('task catalog', () => {
  it('contains broad ml workflows with unique ids', () => {
    expect(allTasks.length).toBeGreaterThan(10);
    expect(new Set(allTasks.map((task) => task.id)).size).toBe(allTasks.length);
  });

  it('finds tasks and falls back safely', () => {
    expect(taskById('clustering').name).toBe('Clustering');
    expect(taskById('missing')).toBeDefined();
  });

  it('creates classification and clustering demos', () => {
    expect(buildDemoResult(taskById('classification'), 'Random Forest').metrics[0])
      .toContain('Accuracy');
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
