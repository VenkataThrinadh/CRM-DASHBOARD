const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting CRM Dashboard Build Process...');

try {
  // Clean previous build
  console.log('🧹 Cleaning previous build...');
  if (fs.existsSync('build')) {
    fs.rmSync('build', { recursive: true, force: true });
  }

  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Build the application
  console.log('🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });

  // Create deployment structure
  console.log('📁 Creating deployment structure...');
  const deployDir = path.join(__dirname, 'deploy');
  if (fs.existsSync(deployDir)) {
    fs.rmSync(deployDir, { recursive: true, force: true });
  }
  fs.mkdirSync(deployDir, { recursive: true });

  // Copy build files to root directory (not admin subdirectory)
  console.log('📋 Copying build files for root directory deployment...');
  const buildDir = path.join(__dirname, 'build');
  const targetDir = path.join(deployDir, 'root');
  
  function copyRecursive(src, dest) {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      fs.readdirSync(src).forEach(file => {
        copyRecursive(path.join(src, file), path.join(dest, file));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
  
  copyRecursive(buildDir, targetDir);

  // Create .htaccess for React Router (Root directory deployment)
  console.log('⚙️ Creating .htaccess file for root directory...');
  const htaccessContent = `# Real Estate CRM Dashboard - Root Directory Configuration
Options -MultiViews
RewriteEngine On

# Handle backend API requests - DO NOT redirect these to React
RewriteCond %{REQUEST_URI} ^/backend [NC]
RewriteRule ^(.*)$ - [L]

# Handle static files - DO NOT redirect these to React
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^(.*)$ - [L]

# Handle directories - DO NOT redirect these to React
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^(.*)$ - [L]

# Handle React Router - redirect all other requests to index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/backend [NC]
RewriteRule ^ index.html [QSA,L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# CORS headers for API requests
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, Accept"

# Cache static assets
<filesMatch "\\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
  ExpiresActive On
  ExpiresDefault "access plus 1 month"
  Header set Cache-Control "public, max-age=2592000"
</filesMatch>

# Cache HTML files for shorter time
<filesMatch "\\.(html|htm)$">
  ExpiresActive On
  ExpiresDefault "access plus 1 hour"
  Header set Cache-Control "public, max-age=3600"
</filesMatch>

# Compress files for better performance
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
  AddOutputFilterByType DEFLATE application/json
</IfModule>

# Prevent access to sensitive files
<Files ".env">
  Order allow,deny
  Deny from all
</Files>

<Files "*.log">
  Order allow,deny
  Deny from all
</Files>`;

  fs.writeFileSync(path.join(targetDir, '.htaccess'), htaccessContent);

  // Create deployment instructions
  console.log('📝 Creating deployment instructions...');
  const deployInstructions = `# CRM Dashboard Deployment Instructions

## Files to Upload
Upload all files from the 'deploy/root' folder to your web server's ROOT directory.

⚠️ IMPORTANT: These files should be placed in the ROOT directory of your domain, NOT in a subdirectory.

## File Structure After Upload
Your server root should look like:
\`\`\`
/public_html/ (or your server root)
├── index.html (Admin Dashboard)
├── static/ (CSS, JS files)
├── .htaccess (React Router configuration)
├── backend/ (Your existing backend folder)
└── ... (other admin dashboard files)
\`\`\`

## Server Configuration
1. Ensure your web server supports .htaccess files (Apache)
2. Enable mod_rewrite module
3. Set proper file permissions (644 for files, 755 for directories)

## Domain Configuration
The admin dashboard will be accessible at:
- https://mobileapplication.creativeethics.co.in/ (ROOT URL)

## Backend API Configuration
Ensure your backend API is running and accessible at:
- https://mobileapplication.creativeethics.co.in/backend/api

## Environment Detection
The app automatically detects the environment:
- Local development: Uses localhost:3000/backend/api
- Live server: Uses current domain + /backend/api

## SSL Certificate
Make sure SSL certificate is properly configured for HTTPS access.

## Testing
After deployment, test the following:
1. Visit https://mobileapplication.creativeethics.co.in/ (should show admin login)
2. Admin login functionality
3. API connectivity (check browser console for errors)
4. Image loading from backend
5. Responsive design on different devices

## Troubleshooting
- If routes don't work, check .htaccess configuration
- If API calls fail, verify CORS settings in backend
- If images don't load, check file permissions and paths
- If you get 404 errors, ensure backend server is running

## Backend Server Status
Make sure your backend is running by checking:
- https://mobileapplication.creativeethics.co.in/backend/api/health
`;

  fs.writeFileSync(path.join(deployDir, 'DEPLOYMENT_INSTRUCTIONS.md'), deployInstructions);

  console.log('✅ Build completed successfully!');
  console.log(`📁 Deployment files are ready in: ${deployDir}`);
  console.log('📖 Check DEPLOYMENT_INSTRUCTIONS.md for deployment steps');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}