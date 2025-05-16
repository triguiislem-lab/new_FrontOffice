/**
 * Script to fix all @/ alias imports in the project
 * This script will scan all JavaScript and JSX files in the src directory
 * and replace @/ imports with relative paths
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert ES module __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root directory of the project
const rootDir = path.resolve(__dirname);
const srcDir = path.join(rootDir, 'src');

// Function to recursively get all files in a directory
async function getFiles(dir) {
  const subdirs = await fs.promises.readdir(dir);
  const files = await Promise.all(
    subdirs.map(async (subdir) => {
      const res = path.resolve(dir, subdir);
      return (await fs.promises.stat(res)).isDirectory() ? getFiles(res) : res;
    })
  );
  return files.flat();
}

// Function to check if a file is a JavaScript or JSX file
function isJsFile(file) {
  return file.endsWith('.js') || file.endsWith('.jsx');
}

// Function to convert @/ import to relative path
function convertToRelativePath(filePath, importPath) {
  // Get the directory of the current file
  const fileDir = path.dirname(filePath);
  
  // Construct the absolute path of the imported file
  const importAbsolutePath = path.join(srcDir, importPath);
  
  // Get the relative path from the current file to the imported file
  let relativePath = path.relative(fileDir, importAbsolutePath);
  
  // Ensure the path starts with ./ or ../
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }
  
  // Replace backslashes with forward slashes for consistency
  relativePath = relativePath.replace(/\\/g, '/');
  
  return relativePath;
}

// Function to fix @/ imports in a file
async function fixAliasImports(filePath) {
  try {
    // Read the file content
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Regular expression to match @/ imports
    const aliasImportRegex = /import\s+(?:(?:\{[^}]*\})|(?:[^{}\s,]+))?\s*(?:,\s*(?:\{[^}]*\}))?\s*from\s+['"]@\/([^'"]+)['"]/g;
    
    let match;
    let updatedContent = content;
    let hasChanges = false;
    
    // Find all @/ imports
    while ((match = aliasImportRegex.exec(content)) !== null) {
      const importPath = match[1];
      const fullMatch = match[0];
      
      // Convert to relative path
      const relativePath = convertToRelativePath(filePath, importPath);
      
      // Replace the import statement
      const newImport = fullMatch.replace(`@/${importPath}`, relativePath);
      updatedContent = updatedContent.replace(fullMatch, newImport);
      
      hasChanges = true;
      
      console.log(`Fixed import in ${filePath}:`);
      console.log(`  Original: ${fullMatch}`);
      console.log(`  Fixed:    ${newImport}`);
    }
    
    // If there were changes, write the updated content back to the file
    if (hasChanges) {
      await fs.promises.writeFile(filePath, updatedContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing imports in ${filePath}:`, error);
    return false;
  }
}

// Main function to fix all @/ imports
async function fixAllAliasImports() {
  try {
    // Get all JavaScript files in the src directory
    const files = (await getFiles(srcDir)).filter(isJsFile);
    
    console.log(`Found ${files.length} JavaScript files`);
    
    // Fix imports in each file
    let fixedCount = 0;
    for (const file of files) {
      const fixed = await fixAliasImports(file);
      if (fixed) {
        fixedCount++;
      }
    }
    
    console.log(`Fixed imports in ${fixedCount} files`);
  } catch (error) {
    console.error('Error fixing imports:', error);
  }
}

// Run the script
fixAllAliasImports().then(() => {
  console.log('Import fixing completed');
});
