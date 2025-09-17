import type { Handler } from '@netlify/functions';

// Lightweight PDF rendering function using puppeteer-core + @sparticuz/chromium
// Accepts JSON body:
// {
//   mode: "html" | "url",
//   html?: string,
//   url?: string,
//   displayHeaderFooter?: boolean,
//   headerTemplate?: string,
//   footerTemplate?: string,
//   margin?: { top?: string; right?: string; bottom?: string; left?: string },
//   cookies?: string, // raw Cookie header to forward
//   waitForSelector?: string, // optional selector to wait for when mode === 'url'
//   timeoutMs?: number // optional navigation/wait timeout
// }

export const handler: Handler = async event => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Method Not Allowed' }),
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const mode: 'html' | 'url' = body.mode || 'html';
    const cookies: string | undefined = body.cookies;
    const displayHeaderFooter: boolean = Boolean(body.displayHeaderFooter);
    const headerTemplate: string = body.headerTemplate || '<span></span>';
    const footerTemplate: string = body.footerTemplate || '<span></span>';
    const margin = {
      top: body?.margin?.top || '0.2in',
      right: body?.margin?.right || '0.2in',
      bottom: body?.margin?.bottom || '0.2in',
      left: body?.margin?.left || '0.2in',
    } as const;
    const waitForSelector: string | undefined = body.waitForSelector;
    const timeoutMs: number = typeof body.timeoutMs === 'number' ? body.timeoutMs : 60_000;

    // Dynamic imports (ESM default exports)
    const { default: chromium }: any = await import('@sparticuz/chromium');
    const { default: puppeteer }: any = await import('puppeteer-core');

    let executablePath: string | undefined;
    try {
      executablePath = await chromium.executablePath();
      if (!executablePath && process.env.CHROME_PATH) {
        executablePath = process.env.CHROME_PATH;
      }
    } catch (err) {
      // ignore and validate below
    }

    if (!executablePath) {
      return {
        statusCode: 500,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ok: false,
          code: 'CHROME_EXECUTABLE_MISSING',
          message: 'Chrome executable not found for PDF rendering',
        }),
      };
    }

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      headless: chromium.headless,
      executablePath,
    });

    try {
      const page = await browser.newPage();
      if (cookies) {
        await page.setExtraHTTPHeaders({ Cookie: cookies });
      }
      await page.emulateMediaType('print');

      if (mode === 'url') {
        const url: string | undefined = body.url;
        if (!url) {
          return {
            statusCode: 400,
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ok: false, message: "Missing 'url' for mode 'url'" }),
          };
        }
        await page.goto(url, { waitUntil: 'networkidle0', timeout: timeoutMs });
        if (waitForSelector) {
          await page.waitForSelector(waitForSelector, {
            timeout: Math.max(1_000, Math.min(120_000, timeoutMs)),
          });
        }
      } else {
        const html: string | undefined = body.html;
        if (!html) {
          return {
            statusCode: 400,
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ok: false, message: "Missing 'html' for mode 'html'" }),
          };
        }
        await page.setContent(html, { waitUntil: 'networkidle0' });
      }

      const pdfBuffer: Buffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter,
        headerTemplate,
        footerTemplate,
        margin,
      });

      return {
        statusCode: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': 'inline; filename=render.pdf',
          'cache-control': 'no-store',
        },
        isBase64Encoded: true,
        body: pdfBuffer.toString('base64'),
      };
    } finally {
      await browser.close();
    }
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
