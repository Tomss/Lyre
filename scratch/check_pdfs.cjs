const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory() && file !== 'node_modules' && file !== '.git') {
      getFiles(filePath, files);
    } else if (file.toLowerCase().endsWith('.pdf')) {
      files.push({
        path: filePath,
        sizeMb: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
        sizeBytes: stats.size
      });
    }
  }
  return files;
}

const uploadsDir = path.join(process.cwd(), 'uploads');
const pdfs = getFiles(uploadsDir);
console.log('PDFs in uploads:', pdfs);
