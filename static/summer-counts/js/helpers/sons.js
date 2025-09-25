import { mmToPixels } from './measure.js';
import { getPalette } from '../paletteCollection.js';
import { drawRect } from './drawing.js';

// Constants
const AGE_HOLIDAY_ALONE = 16;

/**
 * Create a son stripe (both rectangles for one son)
 * @param {string} sonKey - Son key (e.g., 'son_1', 'son_2')
 * @param {number} myAgeWhenSonBorn - My age when the son was born
 * @param {number} wristbandStartX - Starting X position of the wristband
 * @param {number} rectWidth - Total rectangle width in pixels
 * @param {number} sonRectY - Y position for the son rectangle
 * @param {number} sonRectHeightPx - Height of the son rectangle in pixels
 * @param {Object} palette - Color palette object
 * @param {string} pattern - Pattern type (optional)
 * @param {number} scale - Scale factor for patterns
 */
export function createSonStripe(sonKey, myAgeWhenSonBorn, wristbandStartX, rectWidth, sonRectY, sonRectHeightPx, palette, pattern=null, scale=1) {
    // First rectangle: from birth to age 16
    const startAge = Math.max(0, myAgeWhenSonBorn); // Don't start before 0
    const endAge = Math.min(100, myAgeWhenSonBorn + AGE_HOLIDAY_ALONE); // Don't go beyond 100
    
    if (startAge < endAge) {
        const rect1StartX = wristbandStartX + (startAge / 100) * rectWidth;
        const rect1Width = ((endAge - startAge) / 100) * rectWidth;
        
        // Use drawRect function for first son rectangle
        const colorKey = sonKey + '_color';
        drawRect(
            rect1StartX,
            sonRectY,
            rect1Width,
            sonRectHeightPx,
            palette[colorKey],
            pattern,
            scale
        );
    }
    
    // Second rectangle: from age 16 to end (100)
    const startAge2 = Math.max(0, myAgeWhenSonBorn + AGE_HOLIDAY_ALONE);
    const endAge2 = 100;
    
    if (startAge2 < endAge2) {
        const rect2StartX = wristbandStartX + (startAge2 / 100) * rectWidth;
        const rect2Width = ((endAge2 - startAge2) / 100) * rectWidth;
        
        // Use drawRect function for second son rectangle
        const colorKey2 = sonKey + '_a16_color';
        drawRect(
            rect2StartX,
            sonRectY,
            rect2Width,
            sonRectHeightPx,
            palette[colorKey2],
            pattern,
            scale
        );
    }
}

/**
 * Create rectangles for each son in the family
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {number} rectWidth - Rectangle width in pixels
 * @param {number} rectHeight - Rectangle height in pixels
 * @param {Object} config - Wristband configuration
 * @param {number} scale - Scale factor
 */
export function createSonsRectangles(centerX, centerY, rectWidth, rectHeight, config, scale) {
    const palette = getPalette(config.palette_id);
    const meBornYear = config.me.born_year;
    
    const sonPaddingPx = mmToPixels(config.son_padding) * scale;
    
    // Calculate the height of the "me" rectangles (already in pixels from drawWristband)
    const printableHeightRatio = config.fabric_printable_height / config.fabric_height;
    const meRectHeightPx = rectHeight * printableHeightRatio;
    
    // Calculate son rectangle height considering padding and number of sons
    const numberOfSons = Object.keys(config.family).length;
    
    // Simple calculation: meRectangleHeight - totalPadding, then divide by number of sons
    const totalPaddingPx = (numberOfSons + 1) * sonPaddingPx; // top + bottom + between sons
    const sonRectHeightPx = (meRectHeightPx - totalPaddingPx) / numberOfSons;
    
    // Calculate positions
    const wristbandStartX = centerX - rectWidth / 2;
    const meRectY = centerY;
    
    // Iterate through each son in the family
    Object.entries(config.family).forEach(([sonKey, sonData], index) => {
        const sonBornYear = sonData.born_year;
        const myAgeWhenSonBorn = sonBornYear - meBornYear; // My age when the son was born
        // Calculate the me rectangle top boundary
        const meRectTop = meRectY - meRectHeightPx / 2;        
        // Simple positioning: start from meRectTop + padding, then add son height + padding for each son
        const sonRectY = meRectTop + sonPaddingPx + index * (sonRectHeightPx + sonPaddingPx);
        const pattern = config.family[sonKey].pattern;
        // Create the son stripe (both rectangles)
        createSonStripe(sonKey, myAgeWhenSonBorn, wristbandStartX, rectWidth, sonRectY, sonRectHeightPx, palette, pattern, scale);
    });
}
