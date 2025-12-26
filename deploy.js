#!/usr/bin/env node

/**
 * Quick Deployment Script for Admin Dashboard
 * Builds and prepares files for root directory deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Real Estate CRM - Quick Deploy');
console.log('==================================\n');

try {
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    console.error('❌ Error: package.json not found');
    console.error('   Please run this script from the admin-crm-dashboard directory');
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (!packageJson.name.includes('admin') && !packageJson.name.includes('crm')) {
    console.error('❌ Error: This doesn\'t appear to be the admin dashboard directory');
    process.exit(1);
  }

  console.log('📋 Pre-deployment checks...');
  console.log(`✅ Project: ${packageJson.name}`);
  console.log(`✅ Version: ${packageJson.version}`);
  console.log('');

  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('build')) {
    fs.rmSync('build', { recursive: true, force: true });
    console.log('   Removed old build directory');
  }
  if (fs.existsSync('deploy')) {
    fs.rmSync('deploy', { recursive: true, force: true });
    console.log('   Removed old deploy directory');
  }

  // Install dependencies
  console.log('\n📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.error('❌ Failed to install dependencies');
    throw error;
  }

  // Build the application
  console.log('\n🔨 Building application...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed');
    throw error;
  }

  // Run custom build script
  console.log('\n📁 Preparing deployment files...');
  try {
    execSync('node build.js', { stdio: 'inherit' });
    console.log('✅ Deployment files prepared');
  } catch (error) {
    console.error('❌ Deployment preparation failed');
    throw error;
  }

  // Verify deployment files
  console.log('\n🔍 Verifying deployment files...');
  const deployDir = path.join(__dirname, 'deploy', 'root');
  
  if (!fs.existsSync(deployDir)) {
    throw new Error('Deploy directory not created');
  }

  const requiredFiles = ['index.html', '.htaccess'];
  const requiredDirs = ['static'];

  requiredFiles.forEach(file => {
    const filePath = path.join(deployDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ Missing: ${file}`);
      throw new Error(`Required file missing: ${file}`);
    }
  });

  requiredDirs.forEach(dir => {
    const dirPath = path.join(deployDir, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`✅ ${dir}/`);
    } else {
      console.log(`❌ Missing: ${dir}/`);
      throw new Error(`Required directory missing: ${dir}`);
    }
  });

  // Show deployment instructions
  console.log('\n🎉 Deployment Ready!');
  console.log('===================\n');
  
  console.log('📁 Files to upload:');
  console.log(`   Source: ${deployDir}`);
  console.log('   Destination: Server ROOT directory\n');
  
  console.log('🌐 Upload ALL files from deploy/root/ to:');
  console.log('   https://mobileapplication.creativeethics.co.in/ (ROOT directory)\n');
  
  console.log('⚠️  IMPORTANT:');
  console.log('   - Upload to ROOT directory, NOT a subdirectory');
  console.log('   - Don\'t overwrite your existing backend/ folder');
  console.log('   - Ensure .htaccess file is uploaded');
  console.log('   - Set proper file permissions (644 for files, 755 for directories)\n');
  
  console.log('🧪 After upload, test:');
  console.log('   1. https://mobileapplication.creativeethics.co.in/ (should show admin login)');
  console.log('   2. Login functionality');
  console.log('   3. API connectivity (check browser console)');
  console.log('   4. Image loading\n');
  
  console.log('📖 For detailed instructions, see:');
  console.log('   deploy/DEPLOYMENT_INSTRUCTIONS.md\n');
  
  console.log('✅ Deployment preparation completed successfully!');

} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  
  console.log('\n🔧 Troubleshooting:');
  console.log('   1. Ensure you\'re in the admin-crm-dashboard directory');
  console.log('   2. Check your internet connection');
  console.log('   3. Verify Node.js and npm are installed');
  console.log('   4. Try running: npm install && npm run build');
  
  process.exit(1);
}