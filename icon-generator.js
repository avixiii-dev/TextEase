const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Define colors globally
const colors = {
    bgColor: '#2C3E50', // Dark blue
    primaryColor: '#ECF0F1', // Light gray
    accentColor: '#3498DB', // Bright blue
    highlightColor: '#E74C3C', // Red
    secondaryColor: '#2ECC71', // Green
    warningColor: '#F1C40F' // Yellow
};

const sizes = {
    'Square44x44Logo': { width: 44, height: 44 },
    'Square71x71Logo': { width: 71, height: 71 },
    'Square150x150Logo': { width: 150, height: 150 },
    'Square310x310Logo': { width: 310, height: 310 },
    'Wide310x150Logo': { width: 310, height: 150 },
    'StoreLogo': { width: 50, height: 50 },
    'SplashScreen': { width: 620, height: 300 },
    'Square256x256Logo': { width: 256, height: 256 },
    'Square1240x1240Logo': { width: 1240, height: 1240 }
};

async function generateIcon(size, name) {
    const { width, height } = size;
    const isWide = width > height;
    
    // Create a unique text editor icon
    const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${colors.bgColor};stop-opacity:1" />
                <stop offset="100%" style="stop-color:#34495E;stop-opacity:1" />
            </linearGradient>
            <filter id="shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
            </filter>
        </defs>
        
        <!-- Background with gradient -->
        <rect width="100%" height="100%" fill="url(#bgGrad)" rx="${Math.min(width, height) * 0.15}"/>
        
        ${isWide ? generateWideContent(width, height) : generateSquareContent(width, height)}
    </svg>`;

    await sharp(Buffer.from(svg))
        .resize(width, height)
        .toFile(path.join(__dirname, 'assets', name + '.png'));
}

function generateSquareContent(width, height) {
    const scale = Math.min(width, height);
    const padding = scale * 0.15;
    const lineHeight = scale * 0.08;
    
    return `
        <!-- Document lines -->
        <g transform="translate(${padding}, ${padding})" filter="url(#shadow)">
            <!-- Title bar -->
            <rect width="${scale - padding * 2}" height="${lineHeight * 1.8}" 
                  fill="${colors.accentColor}" rx="${lineHeight * 0.4}"/>
            
            <!-- Window controls -->
            <circle cx="${scale - padding * 1.5}" cy="${lineHeight * 0.9}" r="${lineHeight * 0.45}" 
                    fill="${colors.highlightColor}" opacity="0.9"/>
            <circle cx="${scale - padding * 2.7}" cy="${lineHeight * 0.9}" r="${lineHeight * 0.45}" 
                    fill="${colors.warningColor}" opacity="0.9"/>
            <circle cx="${scale - padding * 3.9}" cy="${lineHeight * 0.9}" r="${lineHeight * 0.45}" 
                    fill="${colors.secondaryColor}" opacity="0.9"/>
            
            <!-- Text lines with better spacing -->
            <rect y="${lineHeight * 3}" width="${(scale - padding * 2) * 0.85}" height="${lineHeight * 1.2}" 
                  fill="${colors.primaryColor}" opacity="0.95" rx="${lineHeight * 0.4}"/>
            <rect y="${lineHeight * 5}" width="${(scale - padding * 2) * 0.7}" height="${lineHeight * 1.2}" 
                  fill="${colors.primaryColor}" opacity="0.8" rx="${lineHeight * 0.4}"/>
            <rect y="${lineHeight * 7}" width="${(scale - padding * 2) * 0.75}" height="${lineHeight * 1.2}" 
                  fill="${colors.primaryColor}" opacity="0.65" rx="${lineHeight * 0.4}"/>
            <rect y="${lineHeight * 9}" width="${(scale - padding * 2) * 0.6}" height="${lineHeight * 1.2}" 
                  fill="${colors.primaryColor}" opacity="0.5" rx="${lineHeight * 0.4}"/>
        </g>
        
        <!-- TextEase label with shadow -->
        <text x="50%" y="88%" 
              font-family="Arial" 
              font-weight="bold" 
              font-size="${scale * 0.13}px" 
              fill="${colors.primaryColor}"
              text-anchor="middle" 
              dominant-baseline="middle"
              filter="url(#shadow)">
            TextEase
        </text>`;
}

function generateWideContent(width, height) {
    const scale = height;
    const padding = scale * 0.15;
    const lineHeight = scale * 0.08;
    
    return `
        <!-- Split view -->
        <g transform="translate(${padding}, ${padding})">
            <!-- Left panel (editor) -->
            <rect x="0" y="0" 
                  width="${(width - padding * 2) * 0.48}" height="${height - padding * 2}" 
                  fill="${colors.bgColor}" rx="${lineHeight * 0.4}"/>
            
            <!-- Right panel (preview) -->
            <rect x="${(width - padding * 2) * 0.52}" y="0" 
                  width="${(width - padding * 2) * 0.48}" height="${height - padding * 2}" 
                  fill="#34495E" rx="${lineHeight * 0.4}"/>
            
            <!-- Editor content -->
            <g transform="translate(${scale * 0.1}, ${scale * 0.15})">
                <rect width="${(width - padding * 2) * 0.3}" height="${lineHeight * 1.2}" 
                      fill="${colors.primaryColor}" opacity="0.95" rx="${lineHeight * 0.4}"/>
                <rect y="${lineHeight * 2}" width="${(width - padding * 2) * 0.25}" height="${lineHeight * 1.2}" 
                      fill="${colors.primaryColor}" opacity="0.8" rx="${lineHeight * 0.4}"/>
                <rect y="${lineHeight * 4}" width="${(width - padding * 2) * 0.28}" height="${lineHeight * 1.2}" 
                      fill="${colors.primaryColor}" opacity="0.65" rx="${lineHeight * 0.4}"/>
            </g>
            
            <!-- Preview content -->
            <g transform="translate(${(width - padding * 2) * 0.62}, ${scale * 0.15})">
                <rect width="${(width - padding * 2) * 0.3}" height="${lineHeight * 1.2}" 
                      fill="${colors.primaryColor}" opacity="0.95" rx="${lineHeight * 0.4}"/>
                <rect y="${lineHeight * 2}" width="${(width - padding * 2) * 0.25}" height="${lineHeight * 1.2}" 
                      fill="${colors.primaryColor}" opacity="0.8" rx="${lineHeight * 0.4}"/>
                <rect y="${lineHeight * 4}" width="${(width - padding * 2) * 0.28}" height="${lineHeight * 1.2}" 
                      fill="${colors.primaryColor}" opacity="0.65" rx="${lineHeight * 0.4}"/>
            </g>
        </g>`;
}

async function generateAllIcons() {
    // Ensure assets directory exists
    if (!fs.existsSync(path.join(__dirname, 'assets'))) {
        fs.mkdirSync(path.join(__dirname, 'assets'));
    }

    // Generate all required sizes
    for (const [name, size] of Object.entries(sizes)) {
        await generateIcon(size, name);
        console.log(`Generated ${name}.png`);
    }
}

// Run the generator
generateAllIcons().catch(console.error);
