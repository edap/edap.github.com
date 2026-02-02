// Counter display utilities for the wristband
import { mmToPixels } from './measure.js';
import { getPalette } from '../paletteCollection.js';

// Constants
export const COUNTER_TEXT_SIZE = 10;
const COUNTER_LEFT_PADDING = 30; // mm - padding from the left edge of the printable area
const COUNTER_LABEL_WIDTH = 50; // pixels - width offset for label before numbers align

function truncateToOneDecimal(value) {
    return Math.floor(value * 10) / 10;
}

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
    
    // Check if there are any sons in the family object
    const hasSons = Object.keys(config.family || {}).some(key => key.startsWith('son_'));
    
    // Calculate the values
    const quality = calculateQuality(config.me, config.end_quality_life);
    const total = calculateTotal(config.me, config.expected_life);
    
    // Format values
    const qualityValue = Math.ceil(quality);
    const totalValue = truncateToOneDecimal(total);
    
    // Create labels and values (conditionally include Family)
    const labels = [];
    const values = [];
    
    if (hasSons) {
        const familyCount = calculateFamilyCount(config.family, config.age_holyday_alone);
        const familyValue = truncateToOneDecimal(familyCount);
        labels.push('Family:');
        values.push(familyValue);
    }
    
    labels.push('Quality:', 'Total:');
    values.push(qualityValue, totalValue);
    
    // Calculate reference position for numbers (using constant for manual adjustment)
    const numberX = textX + (COUNTER_LABEL_WIDTH * scale); // X position where numbers should align
    
    // Draw each line with right-aligned numbers
    const font = config.font;
    labels.forEach((label, index) => {
        // Adjust line positioning: if Family is shown, center Quality; otherwise center Total
        let lineY;
        if (hasSons) {
            // Three lines: center the middle one (Quality)
            lineY = textY + (index - 1) * lineSpacing;
        } else {
            // Two lines: center between them
            lineY = textY + (index - 0.5) * lineSpacing;
        }
        
        // Draw label
        const labelText = new paper.PointText(new paper.Point(textX, lineY));
        labelText.content = label;
        labelText.fillColor = palette.text_color;
        labelText.fontSize = fontSize;
        labelText.fontFamily = font;
        labelText.justification = 'left';
        
        // Draw number (right-aligned to reference position)
        const valueText = new paper.PointText(new paper.Point(numberX, lineY));
        valueText.content = String(values[index]);
        valueText.fillColor = palette.text_color;
        valueText.fontSize = fontSize;
        valueText.fontFamily = font;
        valueText.justification = 'right';
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

function calculateQuality(me, endQualityLife) {
    const currentYear = new Date().getFullYear();
    const myAge = currentYear - me.born_year;
    const targetAge = endQualityLife;
    
    return Math.max(0, targetAge - myAge);
}

function calculateTotal(me, expectedLife) {
    const currentYear = new Date().getFullYear();
    const myAge = currentYear - me.born_year;
    
    return Math.max(0, expectedLife - myAge);
}
