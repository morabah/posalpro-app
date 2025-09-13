#!/usr/bin/env node
/**
 * Script to upload test product images
 * Usage: node scripts/upload-test-images.js
 */

const fs = require('fs');
const path = require('path');

// Create sample product images for testing
const createSampleImages = () => {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');

  // Ensure directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Create multiple test images with different content
  const images = [
    {
      name: 'product-cmffuseaa00ddd3ai5tkotdqt-sample1.png',
      content: 'Sample Product Image 1 - IoT Device',
      color: '#3B82F6' // Blue
    },
    {
      name: 'product-cmffuseaa00ddd3ai5tkotdqt-sample2.png',
      content: 'Sample Product Image 2 - Analytics',
      color: '#10B981' // Green
    },
    {
      name: 'product-cmffuseaa00ddd3ai5tkotdqt-sample3.png',
      content: 'Sample Product Image 3 - Security',
      color: '#F59E0B' // Orange
    }
  ];

  console.log('🎨 Creating sample product images...');

  images.forEach((image, index) => {
    try {
      // Create a simple colored rectangle as placeholder
      const svg = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="${image.color}"/>
          <text x="100" y="100" text-anchor="middle" dy="0.3em" fill="white" font-family="Arial" font-size="14" font-weight="bold">
            ${image.content}
          </text>
        </svg>
      `;

      const filePath = path.join(uploadsDir, image.name);
      fs.writeFileSync(filePath, svg);
      console.log(`✅ Created: ${image.name}`);
    } catch (error) {
      console.error(`❌ Failed to create ${image.name}:`, error.message);
    }
  });

  console.log('🎉 Sample images created successfully!');
  console.log('📁 Location: public/uploads/products/');
  console.log('🌐 Access via: http://localhost:3000/uploads/products/[filename]');
};

// Run if called directly
if (require.main === module) {
  createSampleImages();
}

module.exports = { createSampleImages };
