import { drawWristband, onResize, onFrame } from './wristbandRenderer.js';
import { getWristbandConfig, updateWristbandConfig } from './wristbandConfig.js';
import { getAllPalettes } from './paletteCollection.js';
import { exportAsSVG } from './helpers/export.js';
import { initializeChildrenManagement, addChild, updateChildrenControls, updateFamilyConfig} from './helpers/sonsForm.js';
import { updateExpectedLifeValue, updateEndQualityLifeValue} from './helpers/life_expectations.js';
export const DEFAULT_SCALE = 1.1;

document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('wristband-canvas');
    paper.setup(canvas);
    
    paper.view.onResize = onResize;
    paper.view.onFrame = onFrame;
    
    setupFormControls();
    
    window.wristbandConfig = getWristbandConfig;
    window.updateWristbandConfig = updateWristbandConfig;
    window.drawWristband = drawWristband;
    
    console.log('Paper.js wristband design tool initialized');
    console.log('Initial wristband configuration:', getWristbandConfig());
    
    drawWristband(DEFAULT_SCALE);
});

function setupFormControls() {
    const paletteSelect = document.getElementById('palette-select');
    const randomButton = document.getElementById('random-button');
    const meBornYearSelect = document.getElementById('me-born-year');
    const meMetPartnerYearSelect = document.getElementById('me-met-partner-year');
    const ageHolidayAloneSelect = document.getElementById('age-holiday-alone');
    const partnerMeetYearSelect = document.getElementById('partner-meet-year');
    const exportButton = document.getElementById('export-button');
    const addChildButton = document.getElementById('add-child-button');
    const showPartnerCheckbox = document.getElementById('show-partner-checkbox');
    const expectedLifeSlider = document.getElementById('expected-life-slider');
    const expectedLifeValue = document.getElementById('expected-life-value');
    const endQualityLifeSlider = document.getElementById('end-quality-life-slider');
    const endQualityLifeValue = document.getElementById('end-quality-life-value');
    
    populateYearSelectors();
    
    initializeChildrenManagement();
    
    const addButton = document.getElementById('add-child-button');
    if (addButton) {
        addButton.style.display = 'inline-block';
    }
    
    if (paletteSelect) {
        const config = getWristbandConfig();
        paletteSelect.value = config.palette_id;
        
        paletteSelect.addEventListener('change', function() {
            const newPaletteId = this.value;
            updateWristbandConfig({ palette_id: newPaletteId });
            drawWristband(DEFAULT_SCALE);
        });
    }
    
    if (randomButton) {
        randomButton.addEventListener('click', function() {
            const palettes = getAllPalettes();
            const paletteIds = Object.keys(palettes);
            const patterns = ['fill', 'dots', 'circle'];
            
            const randomPaletteId = paletteIds[Math.floor(Math.random() * paletteIds.length)];
            
            const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
            
            const config = getWristbandConfig();
            const updatedFamily = {};
            
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
            
            if (paletteSelect) {
                paletteSelect.value = randomPaletteId;
            }
            
            drawWristband(DEFAULT_SCALE);
        });
    }
    
    if (meBornYearSelect) {
        const config = getWristbandConfig();
        meBornYearSelect.value = config.me.born_year;
        
        meBornYearSelect.addEventListener('change', function() {
            const newBornYear = parseInt(this.value);
            updateWristbandConfig({ 
                me: { ...getWristbandConfig().me, born_year: newBornYear }
            });
            drawWristband(DEFAULT_SCALE);
        });
    }
    
    if (meMetPartnerYearSelect) {
        const config = getWristbandConfig();
        meMetPartnerYearSelect.value = config.me.met_partner_year;
        
        meMetPartnerYearSelect.addEventListener('change', function() {
            const newMetPartnerYear = parseInt(this.value);
            updateWristbandConfig({ 
                me: { ...getWristbandConfig().me, met_partner_year: newMetPartnerYear }
            });
            drawWristband(DEFAULT_SCALE);
        });
    }
    
    if (ageHolidayAloneSelect) {
        const config = getWristbandConfig();
        ageHolidayAloneSelect.value = config.age_holyday_alone;
        
        ageHolidayAloneSelect.addEventListener('change', function() {
            const newAgeHolidayAlone = parseInt(this.value);
            updateWristbandConfig({ 
                age_holyday_alone: newAgeHolidayAlone
            });
            drawWristband(DEFAULT_SCALE);
        });
    }
    
    if (partnerMeetYearSelect) {
        const config = getWristbandConfig();
        partnerMeetYearSelect.value = config.me.met_partner_year;
        
        partnerMeetYearSelect.addEventListener('change', function() {
            const newMeetYear = parseInt(this.value);
            updateWristbandConfig({ 
                me: { ...getWristbandConfig().me, met_partner_year: newMeetYear }
            });
            drawWristband(DEFAULT_SCALE);
        });
    }
    
    if (exportButton) {
        exportButton.addEventListener('click', function() {
            exportAsSVG();
        });
    }
    
    if (addChildButton) {
        addChildButton.addEventListener('click', function() {
            addChild();
        });
    }

    const showCounterCheckbox = document.getElementById('show-counter-checkbox');
    if (showCounterCheckbox) {
        const config = getWristbandConfig();
        showCounterCheckbox.checked = config.draw_counter;
        
        showCounterCheckbox.addEventListener('change', function() {
            updateWristbandConfig({ draw_counter: this.checked });
            drawWristband(DEFAULT_SCALE);
        });
    }

    if (showPartnerCheckbox) {
        const config = getWristbandConfig();
        showPartnerCheckbox.checked = config.draw_partner;
        showPartnerCheckbox.addEventListener('change', function() {
            updateWristbandConfig({ draw_partner: this.checked });
            updateChildrenControls();
            updateFamilyConfig();
            drawWristband(DEFAULT_SCALE);
        });
    }
    
    if (expectedLifeSlider) {
        const config = getWristbandConfig();
        expectedLifeSlider.value = config.expected_life || 100;
        if (expectedLifeValue) {
            expectedLifeValue.textContent = expectedLifeSlider.value;
        }
        
        expectedLifeSlider.addEventListener('input', () => updateExpectedLifeValue(expectedLifeSlider, expectedLifeValue, endQualityLifeSlider, endQualityLifeValue));
        expectedLifeSlider.addEventListener('change', () => updateExpectedLifeValue(expectedLifeSlider, expectedLifeValue, endQualityLifeSlider, endQualityLifeValue));
    }
    
    if (endQualityLifeSlider) {
        const config = getWristbandConfig();
        const initialExpectedLife = config.expected_life;
        endQualityLifeSlider.max = initialExpectedLife - 1;
        endQualityLifeSlider.value = config.end_quality_life;
        
        if (parseInt(endQualityLifeSlider.value) > parseInt(endQualityLifeSlider.max)) {
            endQualityLifeSlider.value = endQualityLifeSlider.max;
        }
        
        if (endQualityLifeValue) {
            endQualityLifeValue.textContent = endQualityLifeSlider.value;
        }
        
        endQualityLifeSlider.addEventListener('input', () => updateEndQualityLifeValue(endQualityLifeSlider, endQualityLifeValue, expectedLifeSlider, expectedLifeValue));
        endQualityLifeSlider.addEventListener('change', () => updateEndQualityLifeValue(endQualityLifeSlider, endQualityLifeValue, expectedLifeSlider, expectedLifeValue));
    }
}

function populateYearSelectors() {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 100;
    
    const meBornYearSelect = document.getElementById('me-born-year');
    const meMetPartnerYearSelect = document.getElementById('me-met-partner-year');
    const partnerMeetYearSelect = document.getElementById('partner-meet-year');
    
    if (meBornYearSelect) {
        meBornYearSelect.innerHTML = '';
        for (let year = currentYear; year >= startYear; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            meBornYearSelect.appendChild(option);
        }
    }
    
    if (meMetPartnerYearSelect) {
        meMetPartnerYearSelect.innerHTML = '';
        for (let year = currentYear; year >= startYear; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            meMetPartnerYearSelect.appendChild(option);
        }
    }
    
    if (partnerMeetYearSelect) {
        partnerMeetYearSelect.innerHTML = '';
        for (let year = currentYear; year >= startYear; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            partnerMeetYearSelect.appendChild(option);
        }
    }
}


