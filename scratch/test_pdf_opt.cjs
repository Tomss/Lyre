const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

async function testPdfLib() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const files = fs.readdirSync(uploadsDir).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log('Found PDF files:', files);

  for (const file of files.slice(0, 3)) {
    const filePath = path.join(uploadsDir, file);
    const stat = fs.statSync(filePath);
    console.log(`\nFile: ${file} (Original size: ${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
    try {
      const buffer = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      console.log(`Page count: ${pdfDoc.getPageCount()}`);
      
      // Save with maximum compression and object stream optimization
      const optimizedBytes = await pdfDoc.save({ useObjectStreams: true });
      console.log(`Optimized size with pdf-lib: ${(optimizedBytes.length / 1024 / 1024).toFixed(2)} MB`);
    } catch (err) {
      console.error('Error processing:', err.message);
    }
  }
}

testPdfLib();
