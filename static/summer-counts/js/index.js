// Summer Counts - Wristband Design Tool with Paper.js
import { drawWristband, onResize, onFrame } from './wristbandRenderer.js';
import { getWristbandConfig, updateWristbandConfig } from './wristbandConfig.js';
import { getAllPalettes } from './paletteCollection.js';
export const DEFAULT_SCALE = 1.1;

// Wait for Paper.js to be available
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Paper.js
    const canvas = document.getElementById('wristband-canvas');
    paper.setup(canvas);
    
    // Set up Paper.js event handlers
    paper.view.onResize = onResize;
    paper.view.onFrame = onFrame;
    
    // Set up form event listeners
    setupFormControls();
    
    // Make functions globally accessible for debugging and future GUI integration
    window.wristbandConfig = getWristbandConfig;
    window.updateWristbandConfig = updateWristbandConfig;
    window.drawWristband = drawWristband;
    
    console.log('Paper.js wristband design tool initialized');
    console.log('Initial wristband configuration:', getWristbandConfig());
    
    // Initial draw with larger scale for better visibility
    drawWristband(DEFAULT_SCALE); // Scale factor of 2 for better visibility
});

// Set up form controls and event listeners
function setupFormControls() {
    const paletteSelect = document.getElementById('palette-select');
    const childrenPatternsSelect = document.getElementById('children-patterns-select');
    const randomButton = document.getElementById('random-button');
    
    if (paletteSelect) {
        // Set initial value from config
        const config = getWristbandConfig();
        paletteSelect.value = config.palette_id;
        
        // Add event listener for palette changes
        paletteSelect.addEventListener('change', function() {
            const newPaletteId = this.value;
            updateWristbandConfig({ palette_id: newPaletteId });
            drawWristband(DEFAULT_SCALE);
        });
    }
    
    if (childrenPatternsSelect) {
        // Set initial value from config (use son_1 pattern as default)
        const config = getWristbandConfig();
        childrenPatternsSelect.value = config.family.son_1.pattern;
        
        // Add event listener for children patterns changes
        childrenPatternsSelect.addEventListener('change', function() {
            const newPattern = this.value;
            const config = getWristbandConfig();
            
            // Update both sons with the same pattern
            const updatedFamily = {
                son_1: { ...config.family.son_1, pattern: newPattern },
                son_2: { ...config.family.son_2, pattern: newPattern }
            };
            
            updateWristbandConfig({ family: updatedFamily });
            drawWristband(DEFAULT_SCALE);
        });
    }
    
    if (randomButton) {
        // Add event listener for random button
        randomButton.addEventListener('click', function() {
            const palettes = getAllPalettes();
            const paletteIds = Object.keys(palettes);
            const patterns = ['fill', 'dots', 'circle'];
            
            // Pick random palette
            const randomPaletteId = paletteIds[Math.floor(Math.random() * paletteIds.length)];
            
            // Pick random pattern for both sons
            const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
            
            // Update configuration
            const config = getWristbandConfig();
            const updatedFamily = {
                son_1: { ...config.family.son_1, pattern: randomPattern },
                son_2: { ...config.family.son_2, pattern: randomPattern }
            };
            
            updateWristbandConfig({ 
                palette_id: randomPaletteId,
                family: updatedFamily
            });
            
            // Update form controls to reflect new values
            if (paletteSelect) {
                paletteSelect.value = randomPaletteId;
            }
            if (childrenPatternsSelect) {
                childrenPatternsSelect.value = randomPattern;
            }
            
            drawWristband(DEFAULT_SCALE);
        });
    }
}