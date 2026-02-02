import { mmToPixels } from './measure.js';
import { getPalette } from '../paletteCollection.js';
import { drawRect } from './drawing.js';

// Constants
export const CHILDREN_NAME_PADDING = 2;
export const CHILDREN_NAME_MAX_FONT_SIZE = 14;

export function getOldestReachesAgeRelativeToMe(meBornYear, family, ageHolydayAlone, endQualityLife = 60) {
    const children = Object.values(family);
    if (children.length > 0) {
        // Select oldest child (earliest born_year)
        const oldestChild = children.reduce((oldest, child) => {
            return child.born_year < oldest.born_year ? child : oldest;
        });
        const yearWhenOldestReachesAge = oldestChild.born_year + ageHolydayAlone;
        return yearWhenOldestReachesAge - meBornYear;
    } else {
        return endQualityLife;
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
export function createChildrenStripe(sonKey, myAgeWhenSonBorn, wristbandStartX, rectWidth, sonRectY, sonRectHeightPx, palette, ageHolydayAlone, pattern=null, scale=1, name='', font='Arial, sans-serif', expectedLife=100, numberOfSons=1) {
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
        writeSonName(name, myAgeWhenSonBorn, wristbandStartX, rectWidth, sonRectY, sonRectHeightPx, palette.text_color, scale, font, expectedLife, ageHolydayAlone, numberOfSons);
    }
}

export function createPartnerStripe(myAgeWhenMetPartner, wristbandStartX, rectWidth, partnerRectY, partnerRectHeightPx, palette, pattern=null, scale=1, expectedLife=100) {
    // Partner rectangle: from when partner was met until end (expectedLife)
    const startAge = Math.max(0, myAgeWhenMetPartner); // Don't start before 0
    const endAge = expectedLife;
    
    if (startAge < endAge) {
        const partnerStartX = wristbandStartX + (startAge / expectedLife) * rectWidth;
        const partnerWidth = ((endAge - startAge) / expectedLife) * rectWidth;
        
        // Use drawRect function for partner rectangle
        drawRect(
            partnerStartX,
            partnerRectY,
            partnerWidth,
            partnerRectHeightPx,
            palette.son_4_color,
            pattern,
            scale
        );
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
 * @param {number} ageHolydayAlone - Age when son can go on holiday alone
 * @param {number} numberOfSons - Number of children
 */
function writeSonName(name, myAgeWhenSonBorn, wristbandStartX, rectWidth, sonRectY, sonRectHeightPx, textColor, scale, font, expectedLife=100, ageHolydayAlone=16, numberOfSons=1) {
    // Calculate where the son stripe actually starts
    const startAge = Math.max(0, myAgeWhenSonBorn);
    const sonStripeStartX = wristbandStartX + (startAge / expectedLife) * rectWidth;
    
    // Calculate text position: CHILDREN_NAME_PADDING from the left side of the son stripe
    const textOffsetPx = mmToPixels(CHILDREN_NAME_PADDING) * scale;
    
    // Calculate font size first (with max limit)
    const fontSize = Math.min(CHILDREN_NAME_MAX_FONT_SIZE * scale, Math.max(8, sonRectHeightPx * 0.6));
    
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
    
    // Calculate Y position: when there's only one child, align to the light green stripe (second rectangle)
    // The light green stripe is the second rectangle which has the same Y and height as the son stripe
    // So it's centered at: sonRectY + sonRectHeightPx / 2
    // When there's only one child, this ensures the name aligns with the light green stripe
    const textY = sonRectY + sonRectHeightPx / 2; // Center vertically in the stripe (which is also the center of the light green stripe)
    
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
export function createFamilyMemberRectangles(centerX, centerY, rectWidth, rectHeight, config, scale) {
    const ageHolydayAlone = config.age_holyday_alone;
    const palette = getPalette(config.palette_id);
    const meBornYear = config.me.born_year;
    
    const sonPaddingPx = mmToPixels(config.son_padding) * scale;
    
    // Calculate the height of the "me" rectangles (already in pixels from drawWristband)
    const printableHeightRatio = config.fabric_printable_height / config.fabric_height;
    const meRectHeightPx = rectHeight * printableHeightRatio;
    
    // Include partner in familyEntries if draw_partner is true, otherwise filter it out
    console.log('config.family', config.family);
    const familyEntries = Object.entries(config.family).filter(([key]) => {
        console.log('key', key);
        if (key === 'partner') {
            return config.draw_partner; // Include partner if draw_partner is true, filter out if false
        }
        return true; // Include all sons
    });
    const numberOfFamilyMembers = familyEntries.length;
    
    // Simple calculation: meRectangleHeight - totalPadding, then divide by number of sons
    const totalPaddingPx = (numberOfFamilyMembers + 1) * sonPaddingPx; // top + bottom + between sons
    const sonRectHeightPx = (meRectHeightPx - totalPaddingPx) / numberOfFamilyMembers;
    
    // Calculate positions
    const wristbandStartX = centerX - rectWidth / 2;
    const meRectY = centerY;
    
    // Iterate through each family member (sons and partner if draw_partner is true)
    familyEntries.forEach(([famKey, famData], index) => {
        console.log('famKey', famKey);
        const pattern = config.family[famKey].pattern || config.pattern;
        const meRectTop = meRectY - meRectHeightPx / 2;        
        // Simple positioning: start from meRectTop + padding, then add son height + padding for each son
        const sonRectY = meRectTop + sonPaddingPx + index * (sonRectHeightPx + sonPaddingPx);
        
        if (famKey === 'partner') {
            // Handle partner stripe
            const metPartnerYear = config.me.met_partner_year;
            const myAgeWhenMetPartner = metPartnerYear - meBornYear;
            createPartnerStripe(myAgeWhenMetPartner, wristbandStartX, rectWidth, sonRectY, sonRectHeightPx, palette, pattern, scale, config.expected_life);
        } else {
            // Handle children stripe
            const sonBornYear = famData.born_year;
            const sonName = famData.name || `Child ${index + 1}`;
            const myAgeWhenSonBorn = sonBornYear - meBornYear; // My age when the son was born
            // Calculate the me rectangle top boundary

            // Create the son stripe (both rectangles)
            createChildrenStripe(famKey, myAgeWhenSonBorn, wristbandStartX, rectWidth, sonRectY, sonRectHeightPx, palette, ageHolydayAlone, pattern, scale, sonName, config.font, config.expected_life, numberOfFamilyMembers);
        }
    });
}
