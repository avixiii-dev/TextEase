const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
    'Square44x44Logo': { width: 44, height: 44 },
    'Square71x71Logo': { width: 71, height: 71 },
    'Square150x150Logo': { width: 150, height: 150 },
    'Square310x310Logo': { width: 310, height: 310 },
    'Wide310x150Logo': { width: 310, height: 150 },
    'StoreLogo': { width: 50, height: 50 },
    'SplashScreen': { width: 620, height: 300 },
    // Additional sizes for Windows Store requirements
    'Square256x256Logo': { width: 256, height: 256 },
    'Square1240x1240Logo': { width: 1240, height: 1240 }, // High-res store logo
    'Square142x142Logo': { width: 142, height: 142 }, // Medium tile
    'Square284x284Logo': { width: 284, height: 284 }, // Large tile
    'Square30x30Logo': { width: 30, height: 30 }, // Small tile
    'Square89x89Logo': { width: 89, height: 89 }, // List tile
    'Wide558x270Logo': { width: 558, height: 270 } // Wide tile
};

async function generateIcon(size, name) {
    const { width, height } = size;
    const sourcePath = path.join(__dirname, 'logo.png');
    
    // For wide format, we'll add padding to maintain aspect ratio
    if (width > height) {
        const padding = (width - height) / 2;
        await sharp(sourcePath)
            .resize(height, height, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .extend({
                top: 0,
                bottom: 0,
                left: padding,
                right: padding,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .toFile(path.join(__dirname, 'assets', name + '.png'));
    } else {
        await sharp(sourcePath)
            .resize(width, height, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .toFile(path.join(__dirname, 'assets', name + '.png'));
    }
}

async function generateAllIcons() {
    // Ensure assets directory exists
    if (!fs.existsSync(path.join(__dirname, 'assets'))) {
        fs.mkdirSync(path.join(__dirname, 'assets'));
    }

    // Check if source logo exists
    const sourcePath = path.join(__dirname, 'logo.png');
    if (!fs.existsSync(sourcePath)) {
        console.error('Error: logo.png not found in the root directory');
        process.exit(1);
    }

    // Generate all required sizes
    for (const [name, size] of Object.entries(sizes)) {
        await generateIcon(size, name);
        console.log(`Generated ${name}.png`);
    }
}

// Run the generator
generateAllIcons().catch(console.error);
