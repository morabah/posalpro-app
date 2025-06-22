#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * PosalPro MVP2 Deployment Information Script
 * Displays current version, deployment history, and provides deployment commands
 */

function getPackageVersion() {
  const packageJson = require('../package.json');
  return packageJson.version;
}

function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const commitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    const lastCommitDate = execSync('git log -1 --format=%cd --date=iso', {
      encoding: 'utf8',
    }).trim();

    return {
      branch,
      commit,
      commitMessage,
      lastCommitDate,
    };
  } catch (error) {
    return {
      branch: 'unknown',
      commit: 'unknown',
      commitMessage: 'unknown',
      lastCommitDate: 'unknown',
    };
  }
}

function getDeploymentHistory() {
  const historyFile = path.join(__dirname, '..', '.deployment-history.json');

  if (fs.existsSync(historyFile)) {
    try {
      return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    } catch (error) {
      console.warn('Warning: Could not read deployment history');
      return { deployments: [] };
    }
  }

  return { deployments: [] };
}

function saveDeploymentHistory(deployment) {
  const historyFile = path.join(__dirname, '..', '.deployment-history.json');
  const history = getDeploymentHistory();

  history.deployments = history.deployments || [];
  history.deployments.unshift(deployment);

  // Keep only last 20 deployments
  if (history.deployments.length > 20) {
    history.deployments = history.deployments.slice(0, 20);
  }

  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

function addDeploymentRecord(type, environment) {
  const gitInfo = getGitInfo();
  const version = getPackageVersion();

  const deployment = {
    version,
    type,
    environment,
    timestamp: new Date().toISOString(),
    git: gitInfo,
    url: environment === 'production' ? 'https://posalpro-mvp2.windsurf.build' : 'staging',
  };

  saveDeploymentHistory(deployment);
  return deployment;
}

function displayInfo() {
  const version = getPackageVersion();
  const gitInfo = getGitInfo();
  const history = getDeploymentHistory();

  console.log('\n🚀 PosalPro MVP2 Deployment Information');
  console.log('═'.repeat(50));

  console.log('\n📦 Current Version Information:');
  console.log(`   Version: ${version}`);
  console.log(`   Branch: ${gitInfo.branch}`);
  console.log(`   Commit: ${gitInfo.commit}`);
  console.log(`   Last Commit: ${gitInfo.lastCommitDate}`);

  console.log('\n💻 Current URLs:');
  console.log('   🌐 Production: https://posalpro-mvp2.windsurf.build');
  console.log('   🧪 Local Dev: http://localhost:3000');

  console.log('\n📋 Version Progression Guide:');
  console.log('   Alpha: 0.1.0-alpha.1 → 0.1.0-alpha.2 → 0.1.0-alpha.3...');
  console.log('   Beta:  0.1.0-beta.1 → 0.1.0-beta.2 → 0.1.0-beta.3...');
  console.log('   RC:    0.1.0-rc.1 → 0.1.0-rc.2 → 0.1.0-rc.3...');
  console.log('   Prod:  0.1.0 → 0.1.1 → 0.2.0 → 1.0.0');

  console.log('\n🚀 Deployment Commands:');
  console.log('   npm run deploy:alpha   # Alpha release (increments alpha version)');
  console.log('   npm run deploy:beta    # Beta release (increments beta version)');
  console.log('   npm run deploy:prod    # Production release (increments patch version)');
  console.log('   npm run deploy:staging # Staging deployment (no version bump)');

  console.log('\n📊 Recent Deployment History:');
  if (history.deployments && history.deployments.length > 0) {
    history.deployments.slice(0, 5).forEach((deployment, index) => {
      const date = new Date(deployment.timestamp).toLocaleDateString();
      const time = new Date(deployment.timestamp).toLocaleTimeString();
      console.log(`   ${index + 1}. ${deployment.version} (${deployment.type}) - ${date} ${time}`);
      console.log(
        `      ${deployment.environment} | ${deployment.git.commit} | ${deployment.git.branch}`
      );
    });
  } else {
    console.log('   No deployment history found');
  }

  console.log('\n📝 Quick Actions:');
  console.log('   View this info: npm run deployment:info');
  console.log('   Check git status: git status');
  console.log('   View recent commits: git log --oneline -5');
  console.log('');
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--add-deployment')) {
  const type = args[args.indexOf('--type') + 1] || 'manual';
  const environment = args[args.indexOf('--env') + 1] || 'production';

  const deployment = addDeploymentRecord(type, environment);
  console.log(`✅ Deployment recorded: ${deployment.version} (${type}) to ${environment}`);
} else {
  displayInfo();
}
