import { mmToPixels } from './measure.js';
import { getPalette } from '../paletteCollection.js';

export const COUNTER_TEXT_SIZE = 10;
const COUNTER_LEFT_PADDING = 30;
const COUNTER_LABEL_WIDTH = 55;

function truncateToOneDecimal(value) {
    return Math.floor(value * 10) / 10;
}

export function drawCounter(centerX, centerY, rectWidth, rectHeight, config, scale) {
    if (!config.draw_counter) {
        return;
    }

    const palette = getPalette(config.palette_id);

    const leftPaddingPx = mmToPixels(COUNTER_LEFT_PADDING) * scale;

    const wristbandStartX = centerX - rectWidth / 2;
    const textX = wristbandStartX + leftPaddingPx;
    const textY = centerY;

    const fontSize = COUNTER_TEXT_SIZE * scale;

    const lineSpacing = fontSize * 1.2;

    const hasSons = Object.keys(config.family || {}).some(key => key.startsWith('son_'));

    const quality = calculateQuality(config.me, config.end_quality_life);
    const total = calculateTotal(config.me, config.expected_life);

    const qualityValue = Math.ceil(quality);
    const totalValue = truncateToOneDecimal(total);

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

    const numberX = textX + (COUNTER_LABEL_WIDTH * scale);

    const font = config.font;
    labels.forEach((label, index) => {
        let lineY;
        if (hasSons) {
            lineY = textY + (index - 1) * lineSpacing;
        } else {
            lineY = textY + (index - 0.5) * lineSpacing;
        }

        const labelText = new paper.PointText(new paper.Point(textX, lineY));
        labelText.content = label;
        labelText.fillColor = palette.text_color;
        labelText.fontSize = fontSize;
        labelText.fontFamily = font;
        labelText.justification = 'left';
      
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

    const oldestChild = children.reduce((oldest, child) => {
        return child.born_year < oldest.born_year ? child : oldest;
    });

    const yearWhenOldestReachesAge = oldestChild.born_year + ageHolidayAlone;

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
