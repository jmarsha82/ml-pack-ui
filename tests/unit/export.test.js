import { describe, expect, it, vi } from 'vitest';
import { buildResultsCsv, downloadChartPng, downloadResultsCsv, safeFilename } from '../../src/export';

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

  it('renders an SVG chart to PNG before downloading it', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.innerHTML = '<circle cx="5" cy="5" r="5"></circle>';

    const createObjectURL = vi.fn(() => 'blob:test-chart');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });

    const drawImage = vi.fn();
    const toBlob = vi.fn((callback) => callback(new Blob(['png'], { type: 'image/png' })));
    const appendChild = vi.spyOn(document.body, 'appendChild');
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      const element = Document.prototype.createElement.call(document, tagName, options);
      if (tagName === 'canvas') {
        element.getContext = vi.fn(() => ({ drawImage }));
        element.toBlob = toBlob;
      }
      return element;
    });

    class TestImage {
      set src(value) {
        this._src = value;
        this.onload();
      }
    }
    vi.stubGlobal('Image', TestImage);

    downloadChartPng(svg, 'Validation Curve');

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(drawImage).toHaveBeenCalledOnce();
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png');
    expect(appendChild).toHaveBeenCalled();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-chart');

    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('ignores missing chart SVGs', () => {
    expect(downloadChartPng(null, 'Missing')).toBeUndefined();
  });
});
