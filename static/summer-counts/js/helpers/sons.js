import { mmToPixels } from './measure.js';
import { getPalette } from '../paletteCollection.js';
import { drawRect } from './drawing.js';

// Constants
export const CHILDREN_NAME_PADDING = 2;

export function getOldestReachesAgeRelativeToMe(meBornYear, family, ageHolydayAlone) {
    const children = Object.values(family);
    if (children.length > 0) {
        // Select oldest child (earliest born_year)
        const oldestChild = children.reduce((oldest, child) => {
            return child.born_year < oldest.born_year ? child : oldest;
        });
        const yearWhenOldestReachesAge = oldestChild.born_year + ageHolydayAlone;
        return yearWhenOldestReachesAge - meBornYear;
    } else {
        return 60;
    }
}

/**
 * Create a son stripe (both rectangles for one son)
 * @param {string} sonKey - Son key (e.g., 'son_1', 'son_2')
 * @param {number} myAgeWhenSonBorn - My age when the son was born
 * @param {number} wristbandStartX - Starting X position of the wristband
 * @param {number} rectWidth - Total rectangle width in pixels
 * @param {number} sonRectY - Y position for the son rectangle
 * @param {number} sonRectHeightPx - Height of the son rectangle in pixels
 * @param {Object} palette - Color palette object
 * @param {number} ageHolydayAlone - Age when son can go on holiday alone
 * @param {string} pattern - Pattern type (optional)
 * @param {number} scale - Scale factor for patterns
 * @param {string} name - Son's name
 */
export function createSonStripe(sonKey, myAgeWhenSonBorn, wristbandStartX, rectWidth, sonRectY, sonRectHeightPx, palette, ageHolydayAlone, pattern=null, scale=1, name='', font='Arial, sans-serif', expectedLife=100) {
    // First rectangle: from birth to age 16
    const startAge = Math.max(0, myAgeWhenSonBorn); // Don't start before 0
    const endAge = Math.min(expectedLife, myAgeWhenSonBorn + ageHolydayAlone); // Don't go beyond expectedLife
    
    if (startAge < endAge) {
        const rect1StartX = wristbandStartX + (startAge / expectedLife) * rectWidth;
        const rect1Width = ((endAge - startAge) / expectedLife) * rectWidth;
        
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
    
    // Second rectangle: from age 16 to end (expectedLife)
    const startAge2 = Math.max(0, myAgeWhenSonBorn + ageHolydayAlone);
    const endAge2 = expectedLife;
    
    if (startAge2 < endAge2) {
        const rect2StartX = wristbandStartX + (startAge2 / expectedLife) * rectWidth;
        const rect2Width = ((endAge2 - startAge2) / expectedLife) * rectWidth;
        
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
    
    // Write son name on the left side of the stripe
    if (name) {
        writeSonName(name, myAgeWhenSonBorn, wristbandStartX, rectWidth, sonRectY, sonRectHeightPx, palette.text_color, scale, font, expectedLife);
    }
}

/**
 * Write son name on the left side of the stripe
 * @param {string} name - Son's name
 * @param {number} myAgeWhenSonBorn - My age when the son was born
 * @param {number} wristbandStartX - Starting X position of the wristband
 * @param {number} rectWidth - Total rectangle width in pixels
 * @param {number} sonRectY - Y position for the son rectangle
 * @param {number} sonRectHeightPx - Height of the son rectangle in pixels
 * @param {string} textColor - Text color
 * @param {number} scale - Scale factor
 */
function writeSonName(name, myAgeWhenSonBorn, wristbandStartX, rectWidth, sonRectY, sonRectHeightPx, textColor, scale, font, expectedLife=100) {
    // Calculate where the son stripe actually starts
    const startAge = Math.max(0, myAgeWhenSonBorn);
    const sonStripeStartX = wristbandStartX + (startAge / expectedLife) * rectWidth;
    
    // Calculate text position: CHILDREN_NAME_PADDING from the left side of the son stripe
    const textOffsetPx = mmToPixels(CHILDREN_NAME_PADDING) * scale;
    
    // Calculate font size first
    const fontSize = Math.max(8, sonRectHeightPx * 0.6);
    
    // Create a temporary text element to measure its width
    const tempText = new paper.PointText(new paper.Point(0, 0));
    tempText.content = name;
    tempText.fontSize = fontSize;
    tempText.fontFamily = font;
    
    // Get the text bounds to calculate width
    const textBounds = tempText.bounds;
    const textWidth = textBounds.width;
    
    // Remove the temporary text
    tempText.remove();
    
    // Position the last letter of the name at 10mm from the left edge of the son stripe
    // So the text should start at: sonStripeStartX + textOffsetPx - textWidth
    const textX = sonStripeStartX - textOffsetPx - textWidth;
    const textY = sonRectY + sonRectHeightPx / 2; // Center vertically in the stripe
    
    // Create the actual text element
    const text = new paper.PointText(new paper.Point(textX, textY));
    text.content = name;
    text.fillColor = textColor;
    text.fontSize = fontSize;
    text.fontFamily = font;
    text.justification = 'left';
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
    const ageHolydayAlone = config.age_holyday_alone;
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
        const sonName = sonData.name || `Child ${index + 1}`;
        const myAgeWhenSonBorn = sonBornYear - meBornYear; // My age when the son was born
        // Calculate the me rectangle top boundary
        const meRectTop = meRectY - meRectHeightPx / 2;        
        // Simple positioning: start from meRectTop + padding, then add son height + padding for each son
        const sonRectY = meRectTop + sonPaddingPx + index * (sonRectHeightPx + sonPaddingPx);
        const pattern = config.family[sonKey].pattern;
        // Create the son stripe (both rectangles)
        createSonStripe(sonKey, myAgeWhenSonBorn, wristbandStartX, rectWidth, sonRectY, sonRectHeightPx, palette, ageHolydayAlone, pattern, scale, sonName, config.font, config.expected_life);
    });
}
