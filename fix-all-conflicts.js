#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Recursively find all files
function findAllFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      // Skip node_modules, .git, and other irrelevant dirs
      if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build' || file.startsWith('.')) {
        return;
      }
      
      if (stat.isDirectory()) {
        findAllFiles(filePath, fileList);
      } else if (stat.isFile()) {
        const ext = path.extname(file);
        if (['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.yaml', '.yml', '.json'].includes(ext)) {
          fileList.push(filePath);
        }
      }
    });
  } catch (err) {
    // Silently skip inaccessible directories
  }
  
  return fileList;
}

const cwd = process.cwd();
const allFiles = findAllFiles(cwd);
let fixedCount = 0;

console.log(`\nScanning ${allFiles.length} files for merge conflicts...\n`);

for (const filePath of allFiles) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Check if file has conflict markers
    if (!content.includes('<<<<<<< HEAD')) {
      continue;
    }
    
    // Replace all conflicts keeping HEAD version
    // Handles both \n and \r\n line endings
    content = content.replace(/<<<<<<< HEAD\r?\n([\s\S]*?)\r?\n=======\r?\n[\s\S]*?\r?\n>>>>>>> [^\r\n]+\r?\n/g, '$1');
    
    // If there are still conflict markers, use alternative pattern
    if (content.includes('<<<<<<< HEAD')) {
      content = content.replace(/<<<<<<< HEAD\n([\s\S]*?)\n=======\n[\s\S]*?\n>>>>>>> [^\n]+\n/g, '$1');
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      fixedCount++;
      const relPath = path.relative(cwd, filePath);
      console.log(`✓ Fixed: ${relPath}`);
    }
  } catch (error) {
    const relPath = path.relative(cwd, filePath);
    console.log(`✗ Error processing ${relPath}: ${error.message}`);
  }
}

console.log(`\n✅ Resolution complete: ${fixedCount} files fixed!\n`);
