#!/usr/bin/env node

/**
 * PosalPro MVP2 - Environment Variables Copy Script
 * Copies production environment variables to clipboard or displays them
 */

const fs = require('fs');
const path = require('path');

function copyEnvVars() {
  console.log('🚀 PosalPro MVP2 - Environment Variables\n');
  console.log('=' .repeat(50));

  try {
    const envFile = path.join(__dirname, 'production-env-vars.env');
    const content = fs.readFileSync(envFile, 'utf8');

    // Parse and display variables
    const lines = content.split('\n');
    let currentSection = '';

    for (const line of lines) {
      if (line.startsWith('#') && line.includes('===')) {
        currentSection = line.replace(/#/g, '').trim();
        console.log(`\n${currentSection}`);
        console.log('-'.repeat(currentSection.length));
      } else if (line.includes('=') && !line.startsWith('#')) {
        const [key, value] = line.split('=', 2);
        if (key && value) {
          console.log(`${key}=${value}`);
        }
      } else if (line.startsWith('#') && !line.includes('===')) {
        // Skip comments but show important ones
        if (line.includes('Email:') || line.includes('Password:')) {
          console.log(line.replace('#', '').trim());
        }
      }
    }

    console.log('\n' + '=' .repeat(50));
    console.log('✅ Copy these variables to your Netlify Environment Variables');
    console.log('🌐 Netlify Dashboard: Site Settings → Environment Variables');
    console.log('🔗 https://app.netlify.com/sites/posalpro/overview');

  } catch (error) {
    console.error('❌ Error reading environment file:', error.message);
    console.log('\n📝 Make sure production-env-vars.env exists in the project root');
  }
}

// Copy to clipboard if available
function copyToClipboard(text) {
  const { exec } = require('child_process');

  if (process.platform === 'darwin') {
    exec(`echo "${text.replace(/"/g, '\\"')}" | pbcopy`, (error) => {
      if (!error) {
        console.log('📋 Variables copied to clipboard!');
      }
    });
  } else {
    console.log('💡 Variables displayed above - copy manually to Netlify');
  }
}

copyEnvVars();
