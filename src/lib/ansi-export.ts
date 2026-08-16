/**
 * ANSI / plain-text export helpers.
 * Scaffold only — coloring and download wiring land later.
 */

export type AnsiExportFormat = 'plain' | 'ansi' | 'html'

export type AnsiExportResult = {
  format: AnsiExportFormat
  content: string
  mimeType: string
  filename: string
}

export function exportAscii(
  _ascii: string,
  _format: AnsiExportFormat = 'plain',
): AnsiExportResult {
  throw new Error('exportAscii: ještě není implementováno')
}
