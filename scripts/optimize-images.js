/**
 * Image optimization script
 * 
 * This script optimizes all images in the public directory
 * It uses sharp to resize and compress images
 * 
 * Usage: npm run optimize:images
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  // Source directory (relative to project root)
  sourceDir: path.join(__dirname, '../public'),
  // Output directory (relative to project root)
  outputDir: path.join(__dirname, '../public/optimized'),
  // Image extensions to process
  extensions: ['.jpg', '.jpeg', '.png', '.webp'],
  // Sizes to generate (width in pixels)
  sizes: [320, 640, 960, 1280, 1920],
  // Quality (1-100)
  quality: 80,
  // Whether to convert to WebP
  convertToWebP: true,
  // Whether to keep original images
  keepOriginal: true,
};

// Create output directory if it doesn't exist
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Function to process a single image
async function processImage(filePath) {
  const fileName = path.basename(filePath);
  const fileExt = path.extname(filePath).toLowerCase();
  const fileNameWithoutExt = path.basename(filePath, fileExt);
  
  // Skip if not an image
  if (!config.extensions.includes(fileExt)) {
    return;
  }
  
  console.log(`Processing ${fileName}...`);
  
  try {
    // Get image metadata
    const metadata = await sharp(filePath).metadata();
    
    // Process each size
    for (const size of config.sizes) {
      // Skip if image is smaller than target size
      if (metadata.width < size) {
        continue;
      }
      
      // Resize image
      const resizedImage = sharp(filePath)
        .resize(size, null, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: config.quality })
        .png({ quality: config.quality });
      
      // Save resized image
      await resizedImage.toFile(
        path.join(config.outputDir, `${fileNameWithoutExt}-${size}${fileExt}`)
      );
      
      // Convert to WebP if enabled
      if (config.convertToWebP) {
        await resizedImage
          .webp({ quality: config.quality })
          .toFile(
            path.join(config.outputDir, `${fileNameWithoutExt}-${size}.webp`)
          );
      }
    }
    
    // Keep original if enabled
    if (config.keepOriginal) {
      await sharp(filePath)
        .jpeg({ quality: config.quality })
        .png({ quality: config.quality })
        .toFile(
          path.join(config.outputDir, fileName)
        );
      
      // Convert original to WebP if enabled
      if (config.convertToWebP) {
        await sharp(filePath)
          .webp({ quality: config.quality })
          .toFile(
            path.join(config.outputDir, `${fileNameWithoutExt}.webp`)
          );
      }
    }
    
    console.log(`✅ Processed ${fileName}`);
  } catch (error) {
    console.error(`❌ Error processing ${fileName}:`, error);
  }
}

// Function to walk directory recursively
function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Recursively walk directory
      results = results.concat(walkDir(filePath));
    } else {
      // Add file to results
      results.push(filePath);
    }
  });
  
  return results;
}

// Main function
async function main() {
  console.log('Starting image optimization...');
  console.log(`Source directory: ${config.sourceDir}`);
  console.log(`Output directory: ${config.outputDir}`);
  
  // Get all files in source directory
  const files = walkDir(config.sourceDir);
  
  // Filter image files
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return config.extensions.includes(ext);
  });
  
  console.log(`Found ${imageFiles.length} images to process`);
  
  // Process each image
  for (const file of imageFiles) {
    await processImage(file);
  }
  
  console.log('Image optimization complete!');
}

// Run main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
