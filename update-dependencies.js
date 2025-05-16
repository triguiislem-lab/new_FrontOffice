/**
 * Script to update package.json dependencies
 * 
 * This script adds the necessary dependencies for the performance optimizations
 * 
 * Usage: node update-dependencies.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Dependencies to add
const newDevDependencies = {
  'rollup-plugin-visualizer': '^5.9.2',
  'terser': '^5.19.2',
  'vite-plugin-compression2': '^0.10.3',
  'vite-plugin-pwa': '^0.16.4',
  'workbox-window': '^7.0.0',
  'rimraf': '^5.0.1',
  'sharp': '^0.32.6'
};

// Add new dev dependencies
packageJson.devDependencies = {
  ...packageJson.devDependencies,
  ...newDevDependencies
};

// Add new scripts
packageJson.scripts = {
  ...packageJson.scripts,
  'build:analyze': 'vite build --mode analyze',
  'build:production': 'NODE_ENV=production vite build',
  'optimize:images': 'node scripts/optimize-images.js',
  'clean': 'rimraf dist'
};

// Write updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('✅ package.json updated successfully');
console.log('');
console.log('To install the new dependencies, run:');
console.log('npm install');
console.log('');
console.log('To build for production with optimizations, run:');
console.log('npm run build:production');
