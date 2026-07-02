// Fetches the small Fixera logo mark and converts it to a base64 data URI
// for embedding in jsPDF documents via pdf.addImage(). Cached after first
// load so repeated PDF generation (statements, receipts) doesn't re-fetch.
let cached = null;

export async function getLogoDataUrl() {
  if (cached) return cached;
  try {
    const res = await fetch('/logo-mark-sm.png');
    const blob = await res.blob();
    cached = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return cached;
  } catch {
    return null; // PDF still generates fine without the logo if this fails
  }
}
