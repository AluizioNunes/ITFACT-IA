const fs = require('fs');
const content = fs.readFileSync('server.js', 'utf8');
const lines = content.split('\n');

// Find the cross-platform endpoint
let startLine = -1;
let endLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("app.post('/api/discovery/cross-platform'")) {
    startLine = i;
    break;
  }
}

if (startLine !== -1) {
  // Find the end of the function
  let braceCount = 0;
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    braceCount += (line.match(/\{/g) || []).length;
    braceCount -= (line.match(/\}/g) || []).length;
    if (braceCount === 0 && i > startLine) {
      endLine = i;
      break;
    }
  }

  if (endLine !== -1) {
    console.log('Cross-platform endpoint found from line', startLine + 1, 'to', endLine + 1);
    console.log('Lines around definition:');
    for (let i = Math.max(0, startLine - 2); i <= Math.min(lines.length - 1, endLine + 2); i++) {
      console.log(`${i + 1}:${lines[i]}`);
    }
  } else {
    console.log('Could not find end of function');
  }
} else {
  console.log('Cross-platform endpoint not found');
}
