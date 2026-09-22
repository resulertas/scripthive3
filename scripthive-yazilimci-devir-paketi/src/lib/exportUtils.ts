import { saveAs } from 'file-saver';

/**
 * Downloads a string as a file, ensuring UTF-8 BOM (\ufeff) is added for text/markdown files.
 */
export function downloadUtf8File(content: string, filename: string, mimeType: string = 'text/plain;charset=utf-8') {
  // Add UTF-8 Byte Order Mark (\ufeff) so text editors and Windows/Office immediately recognize Turkish unicode
  const withBom = content.startsWith('\ufeff') ? content : '\ufeff' + content;
  const blob = new Blob([withBom], { type: mimeType });
  saveAs(blob, filename);
}

/**
 * Escapes HTML characters to prevent XSS and malformed HTML.
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Opens an ultra-elegant, print-to-PDF ready window with full Turkish character support,
 * clean typography (Inter, Lora, Courier Prime with latin-ext), badges, cards, and page margin controls.
 */
export function printStyledDocument(options: {
  title: string;
  categoryBadge?: string;
  subtitle?: string;
  date?: string;
  bodyHtml: string;
  accentColor?: string;
  customStyles?: string;
}) {
  const {
    title,
    categoryBadge,
    subtitle,
    date = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
    bodyHtml,
    accentColor = '#2563eb',
    customStyles = ''
  } = options;

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400&display=swap&subset=latin,latin-ext" rel="stylesheet">
  <style>
    :root {
      --primary: ${accentColor};
      --primary-soft: rgba(37, 99, 235, 0.08);
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border-color: #e2e8f0;
      --bg-card: #f8fafc;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    @page {
      size: A4;
      margin: 18mm 15mm;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: var(--text-main);
      background-color: #ffffff;
      line-height: 1.6;
      font-size: 10pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }

    /* Header Banner */
    .doc-header {
      border-bottom: 2px solid var(--border-color);
      padding-bottom: 18px;
      margin-bottom: 24px;
    }

    .doc-meta-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .doc-badge {
      display: inline-block;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 4px 10px;
      border-radius: 6px;
      background: var(--primary-soft);
      color: var(--primary);
      border: 1px solid rgba(37, 99, 235, 0.2);
    }

    .doc-date {
      font-size: 8.5pt;
      color: var(--text-muted);
      font-weight: 500;
    }

    .doc-title {
      font-size: 18pt;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #0f172a;
      line-height: 1.25;
      margin-bottom: 6px;
    }

    .doc-subtitle {
      font-size: 10pt;
      color: var(--text-muted);
      font-weight: 500;
    }

    /* Section Styles */
    .section-title {
      font-size: 13pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 24px;
      margin-bottom: 14px;
      padding-bottom: 6px;
      border-bottom: 1.5px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 8px;
      page-break-after: avoid;
    }

    /* Cards */
    .card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 6px;
    }

    .card-title {
      font-size: 11pt;
      font-weight: 700;
      color: #1e293b;
    }

    .card-badge {
      font-size: 8pt;
      font-weight: 600;
      color: var(--text-muted);
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .guiding-questions {
      background: #f8fafc;
      border-left: 3px solid var(--primary);
      padding: 8px 12px;
      margin: 8px 0;
      border-radius: 0 6px 6px 0;
      font-size: 9pt;
      color: #475569;
      font-style: italic;
    }

    .guiding-questions ul {
      margin-left: 16px;
      margin-top: 4px;
    }

    .writer-note {
      margin-top: 10px;
      padding: 10px 12px;
      background: #fafaf9;
      border: 1px solid #e7e5e4;
      border-radius: 6px;
      font-size: 9.5pt;
      line-height: 1.6;
      white-space: pre-wrap;
      color: #1c1917;
    }

    .writer-note-label {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #78716c;
      margin-bottom: 4px;
    }

    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 9pt;
      page-break-inside: auto;
    }

    table.data-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 7.5pt;
      letter-spacing: 0.05em;
      padding: 10px 12px;
      border: 1px solid var(--border-color);
      text-align: left;
    }

    table.data-table td {
      padding: 9px 12px;
      border: 1px solid var(--border-color);
      color: #1e293b;
      vertical-align: top;
    }

    table.data-table tr:nth-child(even) {
      background-color: #fbfcfd;
    }

    /* Stat Cards Grid */
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .stat-box {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }

    .stat-val {
      font-size: 16pt;
      font-weight: 800;
      color: var(--primary);
      line-height: 1.2;
    }

    .stat-lbl {
      font-size: 7.5pt;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-top: 4px;
    }

    /* Script Screenplay / Couriers */
    .screenplay-font {
      font-family: 'Courier Prime', Courier, monospace;
    }

    /* Footer */
    .doc-footer {
      margin-top: 36px;
      padding-top: 14px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      color: var(--text-muted);
      page-break-inside: avoid;
    }

    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }

    ${customStyles}
  </style>
</head>
<body>
  <div class="doc-header">
    <div class="doc-meta-top">
      ${categoryBadge ? `<span class="doc-badge">${escapeHtml(categoryBadge)}</span>` : '<span></span>'}
      <span class="doc-date">${escapeHtml(date)}</span>
    </div>
    <h1 class="doc-title">${escapeHtml(title)}</h1>
    ${subtitle ? `<div class="doc-subtitle">${escapeHtml(subtitle)}</div>` : ''}
  </div>

  <div class="doc-body">
    ${bodyHtml}
  </div>

  <div class="doc-footer">
    <span>ScriptHive Professional Suite</span>
    <span>Sayfa 1</span>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 450);
  }
}
