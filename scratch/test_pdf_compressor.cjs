const fs = require('fs');
const path = require('path');
const { PDFDocument, PDFName, PDFRawStream, PDFNumber } = require('pdf-lib');
const sharp = require('sharp');

async function compressPdfImages(inputBuffer) {
  const pdfDoc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
  const context = pdfDoc.context;
  const indirectObjects = context.enumerateIndirectObjects();

  let compressedImagesCount = 0;

  for (const [ref, obj] of indirectObjects) {
    if (obj instanceof PDFRawStream) {
      const dict = obj.dict;
      const subtype = dict.get(PDFName.of('Subtype'));
      
      if (subtype === PDFName.of('Image')) {
        const filter = dict.get(PDFName.of('Filter'));
        const widthObj = dict.get(PDFName.of('Width'));
        const heightObj = dict.get(PDFName.of('Height'));
        
        const width = widthObj instanceof PDFNumber ? widthObj.value : 0;
        const height = heightObj instanceof PDFNumber ? heightObj.value : 0;

        // Only compress if the image is reasonably large or raw stream is big
        const rawBytes = obj.contents;
        if (rawBytes.length > 50 * 1024 || width > 1200 || height > 1200) {
          try {
            // Attempt to decode and re-compress via Sharp
            let imgBuffer = Buffer.from(rawBytes);
            
            // Check if it's already a valid JPEG/PNG
            const metadata = await sharp(imgBuffer).metadata().catch(() => null);
            if (metadata) {
              const maxDim = 1600;
              const recompressed = await sharp(imgBuffer)
                .resize({
                  width: metadata.width && metadata.width > maxDim ? maxDim : undefined,
                  height: metadata.height && metadata.height > maxDim ? maxDim : undefined,
                  fit: 'inside',
                  withoutEnlargement: true
                })
                .jpeg({ quality: 75, progressive: true })
                .toBuffer();

              if (recompressed.length < rawBytes.length) {
                // Update stream contents and dictionary
                obj.contents = recompressed;
                dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
                dict.set(PDFName.of('Length'), PDFNumber.of(recompressed.length));
                if (metadata.width && metadata.width > maxDim) {
                  const newW = Math.round(metadata.width * (maxDim / Math.max(metadata.width, metadata.height)));
                  const newH = Math.round(metadata.height * (maxDim / Math.max(metadata.width, metadata.height)));
                  dict.set(PDFName.of('Width'), PDFNumber.of(newW));
                  dict.set(PDFName.of('Height'), PDFNumber.of(newH));
                }
                compressedImagesCount++;
              }
            }
          } catch (e) {
            // Skip images that sharp cannot decode directly (e.g. JBIG2 or CCITT)
          }
        }
      }
    }
  }

  console.log(`Recompressed ${compressedImagesCount} images.`);
  const outputBytes = await pdfDoc.save({ useObjectStreams: true });
  return Buffer.from(outputBytes);
}

async function test() {
  const filePath = path.join(process.cwd(), 'uploads', 'split-1774280594963-659215374.pdf');
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    return;
  }
  const input = fs.readFileSync(filePath);
  console.log(`Input size: ${(input.length / 1024 / 1024).toFixed(2)} MB`);
  
  const start = Date.now();
  const output = await compressPdfImages(input);
  const duration = Date.now() - start;
  
  console.log(`Output size: ${(output.length / 1024 / 1024).toFixed(2)} MB in ${duration}ms`);
  console.log(`Reduction: ${((1 - output.length / input.length) * 100).toFixed(1)}%`);
}

test();
