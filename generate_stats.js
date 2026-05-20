const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, files);
    } else {
      files.push(filePath);
    }
  }
  return files;
}

const srcFiles = getFiles('src');
let totalLines = 0;
let markdown = '# RozgarSync Project Statistics\n\n## File Tree\n```text\n';

srcFiles.forEach(f => {
  markdown += `${f.replace(/\\/g, '/')}\n`;
});

markdown += '```\n\n## Line Counts\n\n| File | Lines |\n|---|---|\n';

srcFiles.forEach(f => {
  try {
    const content = fs.readFileSync(f, 'utf-8');
    const lines = content.split('\n').length;
    totalLines += lines;
    markdown += `| \`${f.replace(/\\/g, '/')}\` | ${lines} |\n`;
  } catch(e) {
    // Ignore binary or unreadable files
  }
});

markdown += `\n**Total Lines of Code (src/ directory):** ${totalLines}\n`;

fs.writeFileSync('PROJECT_STATS.md', markdown);
console.log('Successfully generated PROJECT_STATS.md');
