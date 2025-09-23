import type { Handler } from '@netlify/functions';
import { renderPdf, PdfRequestPayload } from '../../src/server/pdf/pdfFunction';

export const handler: Handler = async event => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Method Not Allowed' }),
    };
  }

  try {
    const body: PdfRequestPayload = event.body ? JSON.parse(event.body) : {};
    const bytes = await renderPdf(body);
    const base64 = Buffer.from(bytes).toString('base64').replace(/\r?\n/g, '');

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'inline; filename=render.pdf',
        'cache-control': 'no-store',
      },
      isBase64Encoded: true,
      body: base64,
    };
  } catch (error: any) {
    const message = error?.message || String(error);
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: false, code: 'PDF_FUNCTION_ERROR', message }),
    };
  }
};

export default handler;
