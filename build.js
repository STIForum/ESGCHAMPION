/**
 * Build Script
 * ESG Champions Platform
 * 
 * Prepares the project for deployment by copying files to public/ directory
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_DIR = __dirname;
const OUTPUT_DIR = path.join(__dirname, 'public');

// Files and directories to copy
const INCLUDE_PATTERNS = [
    // HTML files
    '*.html',
    // CSS files
    '*.css',
    // JavaScript files
    '*.js',
    // Assets
    'assets/**/*',
    // Favicon
    'favicon.ico',
    // Robots
    'robots.txt'
];

// Files and directories to exclude
const EXCLUDE_PATTERNS = [
    'node_modules',
    '.git',
    '.gitignore',
    'build.js',
    'package.json',
    'package-lock.json',
    '*.md',
    '*.sql',
    'public',
    '.env*',
    '*.log'
];

/**
 * Check if file should be excluded
 */
function shouldExclude(filename) {
    return EXCLUDE_PATTERNS.some(pattern => {
        if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
            return regex.test(filename);
        }
        return filename === pattern;
    });
}

/**
 * Copy file
 */
function copyFile(src, dest) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log(`  Copied: ${path.relative(SOURCE_DIR, src)}`);
}

/**
 * Copy directory recursively
 */
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (shouldExclude(entry.name)) {
            continue;
        }

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            copyFile(srcPath, destPath);
        }
    }
}

/**
 * Clean output directory
 */
function cleanOutput() {
    if (fs.existsSync(OUTPUT_DIR)) {
        fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Main build function
 */
function build() {
    console.log('🔨 Building ESG Champions Platform...\n');
    
    // Clean output
    console.log('📁 Cleaning output directory...');
    cleanOutput();
    console.log('');

    // Get all files in source directory
    console.log('📋 Copying files...');
    const entries = fs.readdirSync(SOURCE_DIR, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(SOURCE_DIR, entry.name);
        const destPath = path.join(OUTPUT_DIR, entry.name);

        // Skip excluded
        if (shouldExclude(entry.name)) {
            continue;
        }

        if (entry.isDirectory()) {
            // Copy assets and homepage directories
            if (entry.name === 'assets' || entry.name === 'homepage') {
                copyDir(srcPath, destPath);
            }
        } else {
            // Copy HTML, CSS, JS files
            const ext = path.extname(entry.name).toLowerCase();
            if (['.html', '.css', '.js', '.ico', '.txt'].includes(ext)) {
                copyFile(srcPath, destPath);
            }
        }
    }

    console.log('');
    console.log('✅ Build complete!');
    console.log(`📦 Output: ${OUTPUT_DIR}`);
    console.log('');
    console.log('To deploy:');
    console.log('  vercel --prod');
    console.log('');
}

// Run build
build();