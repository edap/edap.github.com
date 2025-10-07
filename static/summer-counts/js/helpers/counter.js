// Counter display utilities for the wristband
import { mmToPixels } from './measure.js';
import { getPalette } from '../paletteCollection.js';
import { OLDER_ME } from '../wristbandRenderer.js';

// Constants
export const COUNTER_TEXT_SIZE = 10;
const COUNTER_LEFT_PADDING = 40; // mm - padding from the left edge of the printable area

export function drawCounter(centerX, centerY, rectWidth, rectHeight, config, scale) {
    // Check if counter should be drawn
    if (!config.draw_counter) {
        return;
    }

    const palette = getPalette(config.palette_id);
    
    // Calculate the printable area dimensions
    const totalHeightMm = config.fabric_height;
    const printableHeightMm = config.fabric_printable_height;
    const printableHeightRatio = printableHeightMm / totalHeightMm;
    const printableHeightPx = rectHeight * printableHeightRatio;
    
    // Calculate the left padding in pixels
    const leftPaddingPx = mmToPixels(COUNTER_LEFT_PADDING) * scale;
    
    // Calculate the text position (left side of printable area + padding)
    const wristbandStartX = centerX - rectWidth / 2;
    const textX = wristbandStartX + leftPaddingPx;
    const textY = centerY; // Center vertically
    
    // Calculate font size with scale
    const fontSize = COUNTER_TEXT_SIZE * scale;
    
    // Calculate line spacing
    const lineSpacing = fontSize * 1.2; // 20% spacing between lines
    
    // Calculate the three lines of text
    const familyCount = calculateFamilyCount(config.family, config.age_holyday_alone);
    const quality = calculateQuality(config.me);
    const total = calculateTotal(config.me);
    
    // Create the three lines of text
    const lines = [
        `Family: ${familyCount}`,
        `Quality: ${quality}`,
        `Total: ${total}`
    ];
    
    // Draw each line
    const font = config.font;
    lines.forEach((line, index) => {
        const lineY = textY + (index - 1) * lineSpacing; // Center the middle line at textY
        
        const text = new paper.PointText(new paper.Point(textX, lineY));
        text.content = line;
        text.fillColor = palette.text_color;
        text.fontSize = fontSize;
        text.fontFamily = font;
        text.justification = 'left';
    });
}

function calculateFamilyCount(family, ageHolidayAlone) {
    const currentYear = new Date().getFullYear();
    const children = Object.values(family);
    
    if (children.length === 0) {
        return 0;
    }
    
    // Find the oldest child
    const oldestChild = children.reduce((oldest, child) => {
        return child.born_year < oldest.born_year ? child : oldest;
    });
    
    // Calculate when the oldest child will reach age_holyday_alone
    const yearWhenOldestReachesAge = oldestChild.born_year + ageHolidayAlone;
    
    // Return years from now until that year
    return Math.max(0, yearWhenOldestReachesAge - currentYear);
}

function calculateQuality(me) {
    const currentYear = new Date().getFullYear();
    const myAge = currentYear - me.born_year;
    const targetAge = 100 * OLDER_ME; // 100 * OLDER_ME
    
    return Math.max(0, targetAge - myAge);
}

function calculateTotal(me) {
    const currentYear = new Date().getFullYear();
    const myAge = currentYear - me.born_year;
    
    return Math.max(0, 100 - myAge);
}
