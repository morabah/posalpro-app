'use client';

export default function PrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        @page {
          margin: 0.75in;
          size: A4;
        }

        .no-print {
          display: none !important;
        }

        .print\\:hidden {
          display: none !important;
        }

        .print\\:bg-white {
          background: white !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .print\\:shadow-none {
          box-shadow: none !important;
        }

        body {
          font-size: 12pt;
          line-height: 1.4;
          color: black;
        }

        h1 {
          font-size: 24pt;
          margin-bottom: 12pt;
        }
        h2 {
          font-size: 18pt;
          margin-bottom: 10pt;
        }
        h3 {
          font-size: 16pt;
          margin-bottom: 8pt;
        }

        table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 20pt;
        }

        th,
        td {
          border: 1pt solid #ddd;
          padding: 6pt;
          text-align: left;
        }

        th {
          background-color: #f5f5f5 !important;
          font-weight: bold;
        }

        .break-inside-avoid {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .total-section {
          border: 2pt solid #28a745;
          padding: 12pt;
          margin: 20pt 0;
          background-color: #f8f9fa !important;
        }

        .terms-section {
          margin-top: 30pt;
          page-break-before: avoid;
        }

        .section-spacing {
          margin-bottom: 20pt;
        }

        .print-header {
          border-bottom: 2pt solid #333;
          padding-bottom: 10pt;
          margin-bottom: 20pt;
        }

        .proposal-content {
          max-width: none !important;
          margin: 0 !important;
          padding: 20pt !important;
        }
      }
    `}</style>
  );
}
