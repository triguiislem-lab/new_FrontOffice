/**
 * Script to fix case sensitivity issues in import paths
 * This script will scan all JavaScript and JSX files in the src directory
 * and fix any imports that use the wrong case for directory names
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert ES module __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promisify fs functions
const readdir = fs.promises.readdir;
const readFile = fs.promises.readFile;
const writeFile = fs.promises.writeFile;
const stat = fs.promises.stat;

// Root directory of the project
const rootDir = path.resolve(__dirname);
const srcDir = path.join(rootDir, 'src');

// Map of directory names with their correct case
const directoryMap = {
  'contexts': 'Contexts',
  'components': 'Components',
  'services': 'Services',
  'utils': 'utils',
  'produit': 'Produit',
  'panier': 'panier',
  'pages': 'pages',
  'widgets': 'widgets',
  'style': 'style',
  'horloge': 'horloge',
  'marques': 'marques',
  'data': 'data',
  'client': 'client',
  'commandes': 'commandes'
};

// Function to recursively get all files in a directory
async function getFiles(dir) {
  const subdirs = await readdir(dir);
  const files = await Promise.all(
    subdirs.map(async (subdir) => {
      const res = path.resolve(dir, subdir);
      return (await stat(res)).isDirectory() ? getFiles(res) : res;
    })
  );
  return files.flat();
}

// Function to check if a file is a JavaScript or JSX file
function isJsFile(file) {
  return file.endsWith('.js') || file.endsWith('.jsx');
}

// Function to fix import paths in a file
async function fixImportPaths(filePath) {
  try {
    // Read the file content
    const content = await readFile(filePath, 'utf8');

    // Regular expression to match import statements
    const importRegex = /import\s+(?:(?:\{[^}]*\})|(?:[^{}\s,]+))?\s*(?:,\s*(?:\{[^}]*\}))?\s*from\s+['"]([^'"]+)['"]/g;

    let match;
    let updatedContent = content;
    let hasChanges = false;

    // Find all import statements
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];

      // Skip absolute imports and node_modules imports
      if (importPath.startsWith('@') || !importPath.startsWith('.')) {
        continue;
      }

      // Parse the import path
      const parts = importPath.split('/');

      // Skip if there's only one part (e.g., './file')
      if (parts.length <= 1) {
        continue;
      }

      // Check if any directory in the path needs to be fixed
      let needsFix = false;
      const fixedParts = parts.map((part, index) => {
        // Skip the first part if it's '.' or '..'
        if (index === 0 && (part === '.' || part === '..')) {
          return part;
        }

        // Check if this part is a directory that needs to be fixed
        const lowerPart = part.toLowerCase();
        for (const [lower, correct] of Object.entries(directoryMap)) {
          if (lowerPart === lower.toLowerCase() && part !== correct) {
            needsFix = true;
            return correct;
          }
        }

        return part;
      });

      // If the path needs to be fixed, update it
      if (needsFix) {
        const fixedPath = fixedParts.join('/');
        const originalImport = match[0];
        const fixedImport = originalImport.replace(importPath, fixedPath);

        updatedContent = updatedContent.replace(originalImport, fixedImport);
        hasChanges = true;

        console.log(`Fixed import in ${filePath}:`);
        console.log(`  Original: ${originalImport}`);
        console.log(`  Fixed:    ${fixedImport}`);
      }
    }

    // If there were changes, write the updated content back to the file
    if (hasChanges) {
      await writeFile(filePath, updatedContent, 'utf8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error fixing import paths in ${filePath}:`, error);
    return false;
  }
}

// Main function to fix all import paths
async function fixAllImportPaths() {
  try {
    // Get all JavaScript files in the src directory
    const files = (await getFiles(srcDir)).filter(isJsFile);

    console.log(`Found ${files.length} JavaScript files`);

    // Fix import paths in each file
    let fixedCount = 0;
    for (const file of files) {
      const fixed = await fixImportPaths(file);
      if (fixed) {
        fixedCount++;
      }
    }

    console.log(`Fixed import paths in ${fixedCount} files`);
  } catch (error) {
    console.error('Error fixing import paths:', error);
  }
}

// Run the script
fixAllImportPaths().then(() => {
  console.log('Import path fixing completed');
});
