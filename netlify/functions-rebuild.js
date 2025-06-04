/**
 * Custom Netlify build script to ensure native modules are properly rebuilt
 * for the Netlify serverless function environment.
 * 
 * This follows PosalPro's platform engineering and quality-first approach.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Log with timestamp for better debugging
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Main rebuild function
async function rebuildNativeModules() {
  try {
    log('Starting native modules rebuild process...');
    
    // Get the functions directory from environment or use default
    const functionsDir = process.env.NETLIFY_FUNCTIONS_DIR || '.netlify/functions';
    
    log(`Using functions directory: ${functionsDir}`);
    
    // Check if we're running in a Netlify environment
    if (process.env.NETLIFY) {
      log('Detected Netlify environment');
      
      // Rebuild bcrypt specifically for this platform
      log('Rebuilding bcrypt native module...');
      execSync('npm rebuild bcrypt --build-from-source', { 
        stdio: 'inherit',
        env: { ...process.env, npm_config_build_from_source: 'true' }
      });
      
      log('Successfully rebuilt native modules for Netlify functions!');
    } else {
      log('Not running in Netlify environment, skipping rebuild');
    }
  } catch (error) {
    log(`Error rebuilding native modules: ${error.message}`);
    process.exit(1);
  }
}

// Run the rebuild function
rebuildNativeModules();
