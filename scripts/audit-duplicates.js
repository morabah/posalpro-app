#!/usr/bin/env node

/**
 * PosalPro MVP2 - Duplicate Functionality Audit Script
 *
 * Automatically detects potential duplicate functionality across scripts,
 * documentation, and configuration files to prevent redundancy.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SCRIPTS_DIR = path.join(__dirname);
const DOCS_DIR = path.join(__dirname, '../docs');
const PROJECT_ROOT = path.join(__dirname, '..');

// Keywords that indicate similar functionality
const FUNCTIONALITY_KEYWORDS = {
  deployment: ['deploy', 'build', 'release', 'publish', 'version', 'bump'],
  development: ['dev', 'start', 'serve', 'watch', 'hot', 'reload'],
  database: ['db', 'migrate', 'seed', 'schema', 'prisma', 'sql'],
  testing: ['test', 'spec', 'jest', 'cypress', 'e2e', 'unit'],
  quality: ['lint', 'format', 'type-check', 'validate', 'audit'],
  documentation: ['docs', 'readme', 'changelog', 'history', 'guide'],
  environment: ['env', 'config', 'setup', 'init', 'install'],
  monitoring: ['health', 'status', 'check', 'monitor', 'metrics'],
};

/**
 * Get all files in a directory recursively
 */
function getAllFiles(dir, extensions = ['.js', '.sh', '.md', '.json']) {
  const files = [];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...getAllFiles(fullPath, extensions));
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}`);
  }

  return files;
}

/**
 * Extract keywords from file content
 */
function extractKeywords(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
    const fileName = path.basename(filePath).toLowerCase();

    const foundKeywords = [];

    for (const [category, keywords] of Object.entries(FUNCTIONALITY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (content.includes(keyword) || fileName.includes(keyword)) {
          foundKeywords.push({ category, keyword, inFileName: fileName.includes(keyword) });
        }
      }
    }

    return foundKeywords;
  } catch (error) {
    return [];
  }
}

/**
 * Analyze package.json scripts for duplicates
 */
function analyzePackageScripts() {
  const packagePath = path.join(PROJECT_ROOT, 'package.json');

  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const scripts = packageJson.scripts || {};

    const duplicates = [];
    const scriptGroups = {};

    // Group scripts by functionality
    for (const [scriptName, scriptCommand] of Object.entries(scripts)) {
      for (const [category, keywords] of Object.entries(FUNCTIONALITY_KEYWORDS)) {
        for (const keyword of keywords) {
          if (scriptName.includes(keyword) || scriptCommand.includes(keyword)) {
            if (!scriptGroups[category]) {
              scriptGroups[category] = [];
            }
            scriptGroups[category].push({ name: scriptName, command: scriptCommand });
            break;
          }
        }
      }
    }

    return { scriptGroups, duplicates };
  } catch (error) {
    console.error('Error analyzing package.json:', error.message);
    return { scriptGroups: {}, duplicates: [] };
  }
}

/**
 * Find files with similar functionality
 */
function findSimilarFiles() {
  const allFiles = [
    ...getAllFiles(SCRIPTS_DIR),
    ...getAllFiles(DOCS_DIR),
    ...getAllFiles(PROJECT_ROOT, ['.json', '.js']),
  ].filter(file => !file.includes('node_modules') && !file.includes('.git'));

  const fileAnalysis = {};

  // Analyze each file
  for (const file of allFiles) {
    const keywords = extractKeywords(file);
    if (keywords.length > 0) {
      fileAnalysis[file] = keywords;
    }
  }

  // Find files with overlapping functionality
  const similarities = [];
  const files = Object.keys(fileAnalysis);

  for (let i = 0; i < files.length; i++) {
    for (let j = i + 1; j < files.length; j++) {
      const file1 = files[i];
      const file2 = files[j];

      const keywords1 = fileAnalysis[file1];
      const keywords2 = fileAnalysis[file2];

      // Find common categories
      const categories1 = new Set(keywords1.map(k => k.category));
      const categories2 = new Set(keywords2.map(k => k.category));
      const commonCategories = [...categories1].filter(c => categories2.has(c));

      if (commonCategories.length > 0) {
        // Calculate overlap score
        const totalCategories = new Set([...categories1, ...categories2]).size;
        const overlapScore = commonCategories.length / totalCategories;

        if (overlapScore > 0.5) {
          similarities.push({
            file1: path.relative(PROJECT_ROOT, file1),
            file2: path.relative(PROJECT_ROOT, file2),
            commonCategories,
            overlapScore: Math.round(overlapScore * 100),
            keywords1: keywords1.map(k => k.keyword),
            keywords2: keywords2.map(k => k.keyword),
          });
        }
      }
    }
  }

  return similarities;
}

/**
 * Display audit results
 */
function displayResults(packageAnalysis, fileSimilarities) {
  console.log('\n🔍 PosalPro MVP2 - Duplicate Functionality Audit');
  console.log('═'.repeat(60));

  // Summary
  console.log('\n📊 AUDIT SUMMARY');
  console.log(`   Package Script Groups: ${Object.keys(packageAnalysis.scriptGroups).length}`);
  console.log(`   File Similarities Found: ${fileSimilarities.length}`);

  // Script groups overview
  console.log('\n📋 PACKAGE SCRIPT GROUPS');
  for (const [category, scripts] of Object.entries(packageAnalysis.scriptGroups)) {
    console.log(`   ${category}: ${scripts.map(s => s.name).join(', ')}`);
  }

  // File similarities
  if (fileSimilarities.length > 0) {
    console.log('\n⚠️  POTENTIAL DUPLICATES');
    fileSimilarities.forEach((sim, index) => {
      console.log(`\n   ${index + 1}. ${sim.overlapScore}% overlap`);
      console.log(`      Files: ${sim.file1} ↔ ${sim.file2}`);
      console.log(`      Categories: ${sim.commonCategories.join(', ')}`);
    });
  }

  // Quick actions
  console.log('\n🚀 RECOMMENDATIONS');
  console.log('   1. Review File Responsibility Matrix: docs/DEVELOPMENT_STANDARDS.md');
  console.log('   2. Check Critical Reference Documents: docs/CRITICAL_REFERENCE_DOCUMENTS.md');
  console.log('   3. Consolidate similar files where appropriate');

  if (fileSimilarities.length === 0) {
    console.log('\n✅ No significant duplicates found');
  }
}

/**
 * Main execution function
 */
function main() {
  console.log('🔍 Starting duplicate functionality audit...');

  try {
    // Analyze package.json scripts
    const packageAnalysis = analyzePackageScripts();

    // Find similar files
    const fileSimilarities = findSimilarFiles();

    // Display results
    displayResults(packageAnalysis, fileSimilarities);
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzePackageScripts,
  findSimilarFiles,
};
