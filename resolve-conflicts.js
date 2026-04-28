#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find all files recursively
function findAllConflictFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // Skip node_modules, .git, and other irrelevant dirs
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build' || file.startsWith('.')) {
      return;
    }
    
    if (stat.isDirectory()) {
      findAllConflictFiles(filePath, fileList);
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if (['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.yaml', '.yml', '.json'].includes(ext)) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

const cwd = process.cwd();
const allFiles = findAllConflictFiles(cwd);
let fixedCount = 0;

console.log(`\nScanning ${allFiles.length} files for merge conflicts...\n`);

for (const filePath of allFiles) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Improved regex to handle merge conflicts
    // This pattern matches: <<<<<<< HEAD ... ======= ... >>>>>>
    const conflictPattern = /<<<<<<< HEAD\n([\s\S]*?)\n=======\n[\s\S]*?\n>>>>>>> [^\n]+\n/g;
    
    content = content.replace(conflictPattern, '$1');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      fixedCount++;
      const relPath = path.relative(cwd, filePath);
      console.log(`✓ Fixed: ${relPath}`);
    }
  } catch (error) {
    // Silently skip any files that can't be read
  }
}

console.log(`\n✅ Resolution complete: ${fixedCount} files fixed!\n`);
