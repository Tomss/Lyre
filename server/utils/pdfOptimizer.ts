import { PDFDocument, PDFName, PDFRawStream, PDFNumber } from 'pdf-lib';
import sharp from 'sharp';

interface PdfOptimizationOptions {
  maxDim?: number;
  quality?: number;
  minImageSizeBytes?: number;
}

/**
 * Optimizes a PDF by downsampling and compressing embedded raster images
 * while preserving 100% of text, vector elements, fonts, and layouts.
 */
export async function optimizePdfBuffer(
  inputBuffer: Buffer,
  options: PdfOptimizationOptions = {}
): Promise<Buffer> {
  const maxDim = options.maxDim ?? 1400;
  const quality = options.quality ?? 70;
  const minImageSizeBytes = options.minImageSizeBytes ?? 20 * 1024; // 20KB

  // Skip optimization if PDF is already very small (< 400 KB)
  if (inputBuffer.length < 400 * 1024) {
    return inputBuffer;
  }

  try {
    const pdfDoc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
    const context = pdfDoc.context;
    const indirectObjects = context.enumerateIndirectObjects();

    let compressedCount = 0;

    for (const [, obj] of indirectObjects) {
      if (obj instanceof PDFRawStream) {
        const dict = obj.dict;
        const subtype = dict.get(PDFName.of('Subtype'));

        if (subtype === PDFName.of('Image')) {
          const rawBytes = obj.contents;
          if (rawBytes.length > minImageSizeBytes) {
            try {
              const imgBuffer = Buffer.from(rawBytes);
              const metadata = await sharp(imgBuffer).metadata().catch(() => null);

              if (metadata && metadata.width && metadata.height) {
                const isOversized = metadata.width > maxDim || metadata.height > maxDim;

                const recompressed = await sharp(imgBuffer)
                  .resize({
                    width: isOversized ? maxDim : undefined,
                    height: isOversized ? maxDim : undefined,
                    fit: 'inside',
                    withoutEnlargement: true
                  })
                  .jpeg({ quality, mozjpeg: true })
                  .toBuffer();

                // Only replace if recompressed image is at least 10% smaller
                if (recompressed.length < rawBytes.length * 0.9) {
                  (obj as any).contents = recompressed;
                  dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
                  dict.set(PDFName.of('Length'), PDFNumber.of(recompressed.length));

                  if (isOversized) {
                    const scale = Math.min(maxDim / metadata.width, maxDim / metadata.height);
                    dict.set(PDFName.of('Width'), PDFNumber.of(Math.round(metadata.width * scale)));
                    dict.set(PDFName.of('Height'), PDFNumber.of(Math.round(metadata.height * scale)));
                  }
                  compressedCount++;
                }
              }
            } catch {
              // Ignore individual image decode errors and proceed
            }
          }
        }
      }
    }

    const outputBytes = await pdfDoc.save({ useObjectStreams: true });
    const outputBuffer = Buffer.from(outputBytes);

    // If optimized PDF is smaller, return it; otherwise keep original
    if (outputBuffer.length < inputBuffer.length) {
      const savedPercent = ((1 - outputBuffer.length / inputBuffer.length) * 100).toFixed(1);
      console.log(`[PDF Optimizer] Compressed ${compressedCount} images: ${(inputBuffer.length / 1024 / 1024).toFixed(2)} MB -> ${(outputBuffer.length / 1024 / 1024).toFixed(2)} MB (-${savedPercent}%)`);
      return outputBuffer;
    }

    return inputBuffer;
  } catch (err: any) {
    console.warn('[PDF Optimizer] Optimization skipped or failed, using original:', err.message);
    return inputBuffer;
  }
}
