import { existsSync } from 'fs';

export type PdfMode = 'html' | 'url';

export interface PdfRequestPayload {
  mode?: PdfMode;
  html?: string;
  url?: string;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  cookies?: string;
  waitForSelector?: string;
  timeoutMs?: number;
}

const DEFAULT_MARGIN = {
  top: '0.2in',
  right: '0.2in',
  bottom: '0.2in',
  left: '0.2in',
} as const;

function resolveExecutablePath(): string | undefined {
  const orderedCandidates: Array<string | undefined> = [];

  // Allow explicit overrides to win first.
  orderedCandidates.push(process.env.PUPPETEER_EXECUTABLE_PATH, process.env.CHROME_PATH);

  const platform = process.platform;
  const home = process.env.HOME || process.env.USERPROFILE;

  if (platform === 'darwin') {
    orderedCandidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    );

    if (home) {
      orderedCandidates.push(
        `${home}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
        `${home}/Applications/Chromium.app/Contents/MacOS/Chromium`
      );
    }
  } else if (platform === 'win32') {
    const programFiles = process.env.PROGRAMFILES;
    const programFilesX86 = process.env['PROGRAMFILES(X86)'];
    const localAppData = process.env.LOCALAPPDATA;

    orderedCandidates.push(
      programFiles ? `${programFiles}\\Google\\Chrome\\Application\\chrome.exe` : undefined,
      programFilesX86 ? `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe` : undefined,
      localAppData ? `${localAppData}\\Google\\Chrome\\Application\\chrome.exe` : undefined,
      programFiles ? `${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe` : undefined,
      programFilesX86 ? `${programFilesX86}\\Microsoft\\Edge\\Application\\msedge.exe` : undefined
    );
  } else {
    // Common Linux locations for local development.
    orderedCandidates.push(
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    );
  }

  for (const candidate of orderedCandidates) {
    if (candidate && existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

export async function renderPdf(payload: PdfRequestPayload): Promise<Uint8Array> {
  const mode: PdfMode = payload.mode || 'html';
  const cookies = payload.cookies;
  const displayHeaderFooter = Boolean(payload.displayHeaderFooter);
  const headerTemplate = payload.headerTemplate || '<span></span>';
  const footerTemplate = payload.footerTemplate || '<span></span>';
  const margin = {
    ...DEFAULT_MARGIN,
    ...(payload.margin || {}),
  };
  const waitForSelector = payload.waitForSelector;
  const timeoutMs = typeof payload.timeoutMs === 'number' ? payload.timeoutMs : 60_000;

  const { default: chromium }: any = await import('@sparticuz/chromium');
  if (!process.env.CHROME_PATH && !process.env.PUPPETEER_EXECUTABLE_PATH) {
    process.env.PUPPETEER_CHROMIUM_REVISION = process.env.PUPPETEER_CHROMIUM_REVISION || '';
  }
  const { default: puppeteer }: any = await import('puppeteer-core');

  let executablePath: string | undefined;
  let useBundledChromium = false;

  // Prefer the optimized Chromium binary in serverless/Linux environments where
  // the system browser is not guaranteed to exist.
  const shouldUseBundledChromium =
    process.platform === 'linux' ||
    process.env.NETLIFY === 'true' ||
    Boolean(process.env.AWS_REGION);

  if (shouldUseBundledChromium) {
    try {
      const resolved = await chromium.executablePath();
      if (resolved && process.platform === 'linux') {
        executablePath = resolved;
        useBundledChromium = true;
      }
    } catch {
      // Ignore resolution failures and fall back to native installations below.
    }
  }

  if (!executablePath) {
    executablePath = resolveExecutablePath();
  }

  if (!executablePath) {
    throw new Error(
      'Chrome executable not found for PDF rendering. Set CHROME_PATH or install Google Chrome.'
    );
  }

  const launchOptions: Record<string, unknown> = {
    executablePath,
    headless: chromium.headless ?? true,
  };

  if (useBundledChromium) {
    launchOptions.args = chromium.args;
    launchOptions.defaultViewport = chromium.defaultViewport;
  }

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();
    if (cookies) {
      await page.setExtraHTTPHeaders({ Cookie: cookies });
    }
    await page.emulateMediaType('print');

    if (mode === 'url') {
      const url = payload.url;
      if (!url) {
        throw new Error("Missing 'url' for mode 'url'");
      }
      await page.goto(url, { waitUntil: 'networkidle0', timeout: timeoutMs });
      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, {
          timeout: Math.max(1_000, Math.min(120_000, timeoutMs)),
        });
      }
    } else {
      const html = payload.html;
      if (!html) {
        throw new Error("Missing 'html' for mode 'html'");
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

    const bytes = Buffer.isBuffer(pdfBuffer)
      ? pdfBuffer
      : Buffer.from(pdfBuffer as unknown as ArrayBuffer);

    return new Uint8Array(bytes);
  } finally {
    await browser.close();
  }
}
