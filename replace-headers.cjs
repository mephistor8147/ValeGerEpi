const fs = require('fs');
const path = require('path');

const directory = './src/views';

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') && file !== 'Home.tsx') {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;

      // Replace header div container
      content = content.replace(
        /className="bg-\[\#FFA767\] px-4 pt-12 md:pt-8 pb-6([^"]+)"/g,
        'className="bg-[#152A32] px-6 pt-16 md:pt-12 pb-10 rounded-b-[40px] md:rounded-b-[50px] relative overflow-hidden bg-cover bg-center bg-no-repeat$1"\n        style={{ backgroundImage: \'linear-gradient(to bottom right, rgba(13, 32, 39, 0.95) 0%, rgba(13, 32, 39, 0.7) 100%), url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&q=80")\' }}'
      );

      // Replace header h1
      // Match text-xl md:text-2xl font-bold (with possible extra classes)
      content = content.replace(
        /className="text-xl md:text-2xl font-bold([^"]*)"/g,
        'className="text-3xl md:text-4xl font-bold text-[#FFA767] tracking-tight drop-shadow-sm$1"'
      );

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(directory);
console.log('Update headers complete.');
