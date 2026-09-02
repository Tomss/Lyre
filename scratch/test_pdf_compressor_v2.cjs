const fs = require('fs');
const path = require('path');
const { PDFDocument, PDFName, PDFRawStream, PDFNumber } = require('pdf-lib');
const sharp = require('sharp');

async function compressPdf(inputBuffer, options = { maxDim: 1200, quality: 65 }) {
  const pdfDoc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
  const context = pdfDoc.context;
  const indirectObjects = context.enumerateIndirectObjects();

  let count = 0;

  for (const [ref, obj] of indirectObjects) {
    if (obj instanceof PDFRawStream) {
      const dict = obj.dict;
      const subtype = dict.get(PDFName.of('Subtype'));
      
      if (subtype === PDFName.of('Image')) {
        const rawBytes = obj.contents;
        if (rawBytes.length > 20 * 1024) { // > 20KB
          try {
            const imgBuffer = Buffer.from(rawBytes);
            const metadata = await sharp(imgBuffer).metadata().catch(() => null);
            
            if (metadata && metadata.width && metadata.height) {
              const maxDim = options.maxDim;
              const isOversized = metadata.width > maxDim || metadata.height > maxDim;
              
              const recompressed = await sharp(imgBuffer)
                .resize({
                  width: isOversized ? maxDim : undefined,
                  height: isOversized ? maxDim : undefined,
                  fit: 'inside',
                  withoutEnlargement: true
                })
                .jpeg({ quality: options.quality, mozjpeg: true })
                .toBuffer();

              if (recompressed.length < rawBytes.length * 0.9) {
                obj.contents = recompressed;
                dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
                dict.set(PDFName.of('Length'), PDFNumber.of(recompressed.length));
                
                // If dimensions changed, update width & height in PDF dictionary
                if (isOversized) {
                  const scale = Math.min(maxDim / metadata.width, maxDim / metadata.height);
                  dict.set(PDFName.of('Width'), PDFNumber.of(Math.round(metadata.width * scale)));
                  dict.set(PDFName.of('Height'), PDFNumber.of(Math.round(metadata.height * scale)));
                }
                count++;
              }
            }
          } catch (e) {}
        }
      }
    }
  }

  const outputBytes = await pdfDoc.save({ useObjectStreams: true });
  return { buffer: Buffer.from(outputBytes), compressedImages: count };
}

async function testAll() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const files = fs.readdirSync(uploadsDir).filter(f => f.toLowerCase().endsWith('.pdf'));

  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    const stat = fs.statSync(filePath);
    if (stat.size > 500 * 1024) {
      const input = fs.readFileSync(filePath);
      const start = Date.now();
      const result = await compressPdf(input);
      const duration = Date.now() - start;
      console.log(`\n${file}:`);
      console.log(`  Initial: ${(input.length / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Optimized: ${(result.buffer.length / 1024 / 1024).toFixed(2)} MB in ${duration}ms (${result.compressedImages} images)`);
      console.log(`  Saved: ${((1 - result.buffer.length / input.length) * 100).toFixed(1)}%`);
    }
  }
}

testAll();
