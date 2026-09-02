const fs = require('fs');
const path = require('path');
const { PDFDocument, PDFName, PDFRawStream } = require('pdf-lib');
const sharp = require('sharp');

async function testPdfImageCompress() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const files = fs.readdirSync(uploadsDir).filter(f => f.toLowerCase().endsWith('.pdf'));
  
  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    const stat = fs.statSync(filePath);
    if (stat.size > 1024 * 1024) { // Only test files > 1MB
      console.log(`\nTesting ${file} (${(stat.size / 1024 / 1024).toFixed(2)} MB)...`);
      try {
        const buffer = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        
        // Count and inspect objects
        let imageCount = 0;
        const context = pdfDoc.context;
        const indirectObjects = context.enumerateIndirectObjects();
        
        for (const [ref, obj] of indirectObjects) {
          if (obj instanceof PDFRawStream) {
            const dict = obj.dict;
            const subtype = dict.get(PDFName.of('Subtype'));
            if (subtype === PDFName.of('Image')) {
              imageCount++;
            }
          }
        }
        console.log(`Found ${imageCount} embedded images in PDF.`);
      } catch (err) {
        console.error('Error:', err.message);
      }
    }
  }
}

testPdfImageCompress();
