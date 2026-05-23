import fs from 'fs';
import path from 'path';

const directory = './src';

const replacements = [
  { regex: /#0B5C36/g, replacement: '#FFA767' },
  { regex: /#094d2d/g, replacement: '#E08E55' },
  { regex: /#149B55/g, replacement: '#FFC27A' },
  { regex: /bg-green-50\/50/g, replacement: 'bg-[#152A32]' },
  { regex: /bg-green-50/g, replacement: 'bg-[#152A32]' },
  { regex: /bg-\[\#152A32\]\/50/g, replacement: 'bg-[#152A32]' },
  { regex: /bg-\[\#0D2027\]\/50/g, replacement: 'bg-[#0D2027]' },
  { regex: /ring-green-50/g, replacement: 'ring-[#253B44]' },
  { regex: /border-green-200/g, replacement: 'border-[#253B44]' },
  { regex: /border-green-100/g, replacement: 'border-[#253B44]' },
  { regex: /hover:bg-green-100/g, replacement: 'hover:bg-[#253B44]' },
  { regex: /bg-green-100/g, replacement: 'bg-[#253B44]' },
  { regex: /text-green-500/g, replacement: 'text-[#FFA767]' },
  { regex: /text-green-600/g, replacement: 'text-[#FFA767]' },
  
  // Dark theme adjustments
  { regex: /bg-gray-50\/50/g, replacement: 'bg-[#0D2027]' },
  { regex: /bg-gray-50/g, replacement: 'bg-[#0D2027]' },
  { regex: /text-gray-900/g, replacement: 'text-[#F1F5F9]' },
  { regex: /text-gray-800/g, replacement: 'text-[#E2E8F0]' },
  { regex: /text-gray-700/g, replacement: 'text-[#CBD5E1]' },
  { regex: /text-gray-600/g, replacement: 'text-[#94A3B8]' },
  { regex: /text-gray-500/g, replacement: 'text-[#64748B]' },
  { regex: /text-gray-400/g, replacement: 'text-[#475569]' },
  { regex: /bg-white\/10/g, replacement: 'bg-[#152A32]' },
  { regex: /bg-white/g, replacement: 'bg-[#152A32]' },
  { regex: /border-gray-100\/50/g, replacement: 'border-[#253B44]' },
  { regex: /border-gray-100/g, replacement: 'border-[#253B44]' },
  { regex: /border-gray-200/g, replacement: 'border-[#2C4550]' },
  { regex: /border-gray-300/g, replacement: 'border-[#36525E]' }
];

function replaceInFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  for (const { regex, replacement } of replacements) {
    content = content.replace(regex, replacement);
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function processDirectory(dir: string) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

processDirectory(directory);
console.log('Theme replacement complete.');
