import { describe, expect, it, vi } from 'vitest';
import { buildResultsCsv, downloadResultsCsv, safeFilename } from './export';

describe('result exports', () => {
  it('creates safe descriptive filenames', () => {
    expect(safeFilename('Random Forest: Results!')).toBe('random-forest-results');
  });

  it('creates an Excel-friendly CSV and escapes special cells', () => {
    const csv = buildResultsCsv({ rows: [{ id: 1, actual: 'class, one', predicted: 'class "one"', confidence: 0.95 }] });
    expect(csv.startsWith('\uFEFFrow_id,actual,prediction,confidence')).toBe(true);
    expect(csv).toContain('"class, one"');
    expect(csv).toContain('"class ""one"""');
  });

  it('starts a browser download and later releases the temporary Blob URL', () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => 'blob:test-export');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadResultsCsv({ title: 'Random Forest Results', rows: [] });
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-export');

    click.mockRestore();
    vi.useRealTimers();
  });
});
