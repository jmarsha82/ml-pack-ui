/** Replace characters that Windows and browsers do not accept in download filenames. */
export function safeFilename(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Quote values when CSV syntax requires it and double embedded quote characters. */
function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Convert visible mlpack row results into a spreadsheet-compatible CSV document. */
export function buildResultsCsv(result) {
  const header = ['row_id', 'actual', 'prediction', 'confidence'];
  const rows = result.rows.map((row) => [row.id, row.actual, row.predicted, row.confidence]);
  return `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
}

/** Trigger a local browser download without transmitting result data. */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  // Firefox and embedded browsers are more reliable when the anchor briefly exists in the DOM.
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke on the next event loop so the browser has time to begin reading the Blob.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Download row-level predictions in a format that opens directly in Excel. */
export function downloadResultsCsv(result) {
  downloadBlob(new Blob([buildResultsCsv(result)], { type: 'text/csv;charset=utf-8' }), `${safeFilename(result.title)}-predictions.csv`);
}

/** Render the code-native SVG chart to a high-resolution PNG and download it. */
export function downloadChartPng(svg, title) {
  if (!svg) return;
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1160" height="480" viewBox="0 0 580 240"><rect width="100%" height="100%" fill="white"/>${svg.innerHTML}</svg>`;
  const svgUrl = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1160;
    canvas.height = 480;
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(svgUrl);
    canvas.toBlob((png) => png && downloadBlob(png, `${safeFilename(title)}-graph.png`), 'image/png');
  };
  image.src = svgUrl;
}
