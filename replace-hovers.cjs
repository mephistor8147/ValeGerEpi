const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') && file !== 'Home.tsx') {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;

      content = content.replace(/hover:bg-\[\#152A32\]/g, 'hover:bg-[#0D2027] hover:text-[#FFA767]');

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory('./src/views');
