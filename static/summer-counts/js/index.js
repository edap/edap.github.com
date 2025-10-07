// Summer Counts - Wristband Design Tool with Paper.js
import { drawWristband, onResize, onFrame } from './wristbandRenderer.js';
import { getWristbandConfig, updateWristbandConfig } from './wristbandConfig.js';
import { getAllPalettes } from './paletteCollection.js';
import { exportAsSVG } from './helpers/export.js';
import { initializeChildrenManagement, addChild, removeSpecificChild, updateChildrenControls, updateFamilyConfig } from './helpers/sonsForm.js';
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
    const meBornYearSelect = document.getElementById('me-born-year');
    const meMetPartnerYearSelect = document.getElementById('me-met-partner-year');
    const ageHolidayAloneSelect = document.getElementById('age-holiday-alone');
    const partnerBornYearSelect = document.getElementById('partner-born-year');
    const exportButton = document.getElementById('export-button');
    const addChildButton = document.getElementById('add-child-button');
    const childrenList = document.getElementById('children-list');
    const fontSelect = document.getElementById('font-select');
    const showPartnerCheckbox = document.getElementById('show-partner-checkbox');
    
    // Populate year selectors
    populateYearSelectors();
    
    // Initialize children management
    initializeChildrenManagement();
    
    // Ensure add button is visible on page load
    const addButton = document.getElementById('add-child-button');
    if (addButton) {
        addButton.style.display = 'inline-block';
    }
    
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
            
            // Update configuration - preserve all existing children and only update patterns
            const config = getWristbandConfig();
            const updatedFamily = {};
            
            // Update patterns for all existing children
            Object.keys(config.family).forEach(sonKey => {
                updatedFamily[sonKey] = { 
                    ...config.family[sonKey], 
                    pattern: randomPattern 
                };
            });
            
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
    
    if (meBornYearSelect) {
        // Set initial value from config
        const config = getWristbandConfig();
        meBornYearSelect.value = config.me.born_year;
        
        // Add event listener for me born year changes
        meBornYearSelect.addEventListener('change', function() {
            const newBornYear = parseInt(this.value);
            updateWristbandConfig({ 
                me: { ...getWristbandConfig().me, born_year: newBornYear }
            });
            drawWristband(DEFAULT_SCALE);
        });
    }
    
    if (meMetPartnerYearSelect) {
        // Set initial value from config
        const config = getWristbandConfig();
        meMetPartnerYearSelect.value = config.me.met_partner_year;
        
        // Add event listener for me met partner year changes
        meMetPartnerYearSelect.addEventListener('change', function() {
            const newMetPartnerYear = parseInt(this.value);
            updateWristbandConfig({ 
                me: { ...getWristbandConfig().me, met_partner_year: newMetPartnerYear }
            });
            drawWristband(DEFAULT_SCALE);
        });
    }
    
    if (ageHolidayAloneSelect) {
        // Set initial value from config
        const config = getWristbandConfig();
        ageHolidayAloneSelect.value = config.age_holyday_alone;
        
        // Add event listener for age holiday alone changes
        ageHolidayAloneSelect.addEventListener('change', function() {
            const newAgeHolidayAlone = parseInt(this.value);
            updateWristbandConfig({ 
                age_holyday_alone: newAgeHolidayAlone
            });
            drawWristband(DEFAULT_SCALE);
        });
    }
    
    if (partnerBornYearSelect) {
        // Set initial value from config
        const config = getWristbandConfig();
        partnerBornYearSelect.value = config.partner.born_year;
        
        // Add event listener for partner born year changes
        partnerBornYearSelect.addEventListener('change', function() {
            const newBornYear = parseInt(this.value);
            updateWristbandConfig({ 
                partner: { ...getWristbandConfig().partner, born_year: newBornYear }
            });
            drawWristband(DEFAULT_SCALE);
        });
    }
    
    if (exportButton) {
        // Add event listener for export button
        exportButton.addEventListener('click', function() {
            exportAsSVG();
        });
    }
    
    if (addChildButton) {
        addChildButton.addEventListener('click', function() {
            addChild();
        });
    }

    if (fontSelect) {
        const config = getWristbandConfig();
        // If current config font isn't in options, fall back to Arial
        const options = Array.from(fontSelect.options).map(o => o.value);
        const initialFont = options.includes(config.font) ? config.font : 'Arial, sans-serif';
        fontSelect.value = initialFont;
        if (initialFont !== config.font) {
            updateWristbandConfig({ font: initialFont });
        }
        fontSelect.addEventListener('change', function() {
            const newFont = this.value;
            updateWristbandConfig({ font: newFont });
            drawWristband(DEFAULT_SCALE);
        });
    }
    
    // Show Counter checkbox
    const showCounterCheckbox = document.getElementById('show-counter-checkbox');
    if (showCounterCheckbox) {
        // Set initial value from config
        const config = getWristbandConfig();
        showCounterCheckbox.checked = config.draw_counter;
        
        // Add event listener for checkbox changes
        showCounterCheckbox.addEventListener('change', function() {
            updateWristbandConfig({ draw_counter: this.checked });
            drawWristband(DEFAULT_SCALE);
        });
    }

    // Show Partner checkbox
    if (showPartnerCheckbox) {
        const config = getWristbandConfig();
        showPartnerCheckbox.checked = config.draw_partner;
        showPartnerCheckbox.addEventListener('change', function() {
            updateWristbandConfig({ draw_partner: this.checked });
            drawWristband(DEFAULT_SCALE);
        });
    }
}

// Populate year selectors with years from current year to 100 years ago
function populateYearSelectors() {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 100;
    
    const meBornYearSelect = document.getElementById('me-born-year');
    const meMetPartnerYearSelect = document.getElementById('me-met-partner-year');
    const partnerBornYearSelect = document.getElementById('partner-born-year');
    
    // Populate me born year selector
    if (meBornYearSelect) {
        meBornYearSelect.innerHTML = '';
        for (let year = currentYear; year >= startYear; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            meBornYearSelect.appendChild(option);
        }
    }
    
    // Populate me met partner year selector
    if (meMetPartnerYearSelect) {
        meMetPartnerYearSelect.innerHTML = '';
        for (let year = currentYear; year >= startYear; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            meMetPartnerYearSelect.appendChild(option);
        }
    }
    
    // Populate partner born year selector
    if (partnerBornYearSelect) {
        partnerBornYearSelect.innerHTML = '';
        for (let year = currentYear; year >= startYear; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            partnerBornYearSelect.appendChild(option);
        }
    }
}


