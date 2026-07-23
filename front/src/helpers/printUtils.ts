/**
 * Utilidades de impresión — usa iframe oculto para evitar
 * que window.print() congele el hilo principal.
 * El iframe se limpia SOLO cuando el usuario cierra el diálogo de print
 * (onafterprint), no por timeout prematuro.
 */

function createPrintFrame(): HTMLIFrameElement {
  const f = document.createElement('iframe');
  f.style.position = 'fixed';
  f.style.right = '0';
  f.style.bottom = '0';
  f.style.width = '0';
  f.style.height = '0';
  f.style.border = 'none';
  document.body.appendChild(f);
  return f;
}

function cleanupFrame(iframe: HTMLIFrameElement, blobUrl?: string): void {
  try {
    if (iframe.parentNode) document.body.removeChild(iframe);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
  } catch { /* ignore */ }
}

function printAndCleanup(iframe: HTMLIFrameElement, blobUrl?: string): void {
  const win = iframe.contentWindow;
  if (!win) { cleanupFrame(iframe, blobUrl); return; }

  win.print();

  // Limpiar cuando el usuario cierre el diálogo de print
  const cleanup = () => cleanupFrame(iframe, blobUrl);
  win.onafterprint = cleanup;
  // Fallback: si onafterprint no se dispara, limpiar después de 30s
  setTimeout(cleanup, 30000);
}

/**
 * Imprime contenido HTML en un iframe oculto.
 */
export function printHtml(html: string): void {
  const iframe = createPrintFrame();
  const idoc = iframe.contentDocument || iframe.contentWindow!.document;
  idoc.open();
  idoc.write(html);
  idoc.close();
  // Esperar a que el DOM se renderice antes de print
  setTimeout(() => printAndCleanup(iframe), 300);
}

/**
 * Imprime un PDF desde un Blob URL en un iframe oculto.
 */
export function printPdf(blobUrl: string): void {
  const iframe = createPrintFrame();
  iframe.onload = () => printAndCleanup(iframe, blobUrl);
  iframe.src = blobUrl;
}
