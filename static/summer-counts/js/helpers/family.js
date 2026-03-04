import { mmToPixels } from './measure.js';
import { getPalette } from '../paletteCollection.js';
import { drawRect } from './drawing.js';

export const CHILDREN_NAME_PADDING = 2;
export const CHILDREN_NAME_MAX_FONT_SIZE = 14;

export function getOldestReachesAgeRelativeToMe(meBornYear, family, ageHolydayAlone, endQualityLife = 60) {
    const children = Object.values(family);
    if (children.length > 0) {
        const oldestChild = children.reduce((oldest, child) => {
            return child.born_year < oldest.born_year ? child : oldest;
        });
        const yearWhenOldestReachesAge = oldestChild.born_year + ageHolydayAlone;
        return yearWhenOldestReachesAge - meBornYear;
    } else {
        return endQualityLife;
    }
}

export function getYoungestReachesAgeRelativeToMe(meBornYear, family, ageHolydayAlone, endQualityLife = 60) {
    const children = Object.entries(family)
        .filter(([key]) => key.startsWith('son_'))
        .map(([, child]) => child);
    if (children.length > 0) {
        const youngestChild = children.reduce((youngest, child) => {
            return child.born_year > youngest.born_year ? child : youngest;
        });
        const myAgeWhenSonBorn = youngestChild.born_year - meBornYear;
        return myAgeWhenSonBorn + ageHolydayAlone;
    } else {
        return endQualityLife;
    }
}

export function createChildrenStripe(sonKey, myAgeWhenSonBorn, wristbandStartX, rectWidth, sonRectY, sonRectHeightPx, palette, ageHolydayAlone, pattern=null, scale=1, name='', font='Arial, sans-serif', expectedLife=100, numberOfSons=1) {
    const startAge = Math.max(0, myAgeWhenSonBorn);
    const endAge = Math.min(expectedLife, myAgeWhenSonBorn + ageHolydayAlone);
    
    if (startAge < endAge) {
        const rect1StartX = wristbandStartX + (startAge / expectedLife) * rectWidth;
        const rect1Width = ((endAge - startAge) / expectedLife) * rectWidth;
        
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
    
    const startAge2 = Math.max(0, myAgeWhenSonBorn + ageHolydayAlone);
    const endAge2 = expectedLife;
    
    if (startAge2 < endAge2) {
        const rect2StartX = wristbandStartX + (startAge2 / expectedLife) * rectWidth;
        const rect2Width = ((endAge2 - startAge2) / expectedLife) * rectWidth;
        
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
    
    if (name) {
        writeSonName(name, myAgeWhenSonBorn, wristbandStartX, rectWidth, sonRectY, sonRectHeightPx, palette.text_color, scale, font, expectedLife, ageHolydayAlone, numberOfSons);
    }
}

export function createPartnerStripe(myAgeWhenMetPartner, wristbandStartX, rectWidth, partnerRectY, partnerRectHeightPx, palette, pattern=null, scale=1, expectedLife=100) {
    const startAge = Math.max(0, myAgeWhenMetPartner);
    const endAge = expectedLife;
    
    if (startAge < endAge) {
        const partnerStartX = wristbandStartX + (startAge / expectedLife) * rectWidth;
        const partnerWidth = ((endAge - startAge) / expectedLife) * rectWidth;
        
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

function writeSonName(name, myAgeWhenSonBorn, wristbandStartX, rectWidth, sonRectY, sonRectHeightPx, textColor, scale, font, expectedLife=100, ageHolydayAlone=16, numberOfSons=1) {
    const startAge = Math.max(0, myAgeWhenSonBorn);
    const sonStripeStartX = wristbandStartX + (startAge / expectedLife) * rectWidth;
    
    const textOffsetPx = mmToPixels(CHILDREN_NAME_PADDING) * scale;
    
    const baseFontSize = Math.min(CHILDREN_NAME_MAX_FONT_SIZE * scale, Math.max(8, sonRectHeightPx * 0.6));
    const fontSize = numberOfSons === 1 ? baseFontSize * 0.7 : baseFontSize;
    
    const tempText = new paper.PointText(new paper.Point(0, 0));
    tempText.content = name;
    tempText.fontSize = fontSize;
    tempText.fontFamily = font;
    
    const textBounds = tempText.bounds;
    const textWidth = textBounds.width;
    
    tempText.remove();
    
    const textX = sonStripeStartX - textOffsetPx - textWidth;
    
    const textY = sonRectY + sonRectHeightPx / 2;
    
    const text = new paper.PointText(new paper.Point(textX, textY));
    text.content = name;
    text.fillColor = textColor;
    text.fontSize = fontSize;
    text.fontFamily = font;
    text.justification = 'left';
}

export function createFamilyMemberRectangles(centerX, centerY, rectWidth, rectHeight, config, scale) {
    const ageHolydayAlone = config.age_holyday_alone;
    const palette = getPalette(config.palette_id);
    const meBornYear = config.me.born_year;
    
    const sonPaddingPx = mmToPixels(config.son_padding) * scale;
    
    const printableHeightRatio = config.fabric_printable_height / config.fabric_height;
    const meRectHeightPx = rectHeight * printableHeightRatio;

    const familyEntries = Object.entries(config.family).filter(([key]) => {
        if (key === 'partner') {
            return config.draw_partner;
        }
        return true;
    });
    const numberOfFamilyMembers = familyEntries.length;
    
    const totalPaddingPx = (numberOfFamilyMembers + 1) * sonPaddingPx;
    const sonRectHeightPx = (meRectHeightPx - totalPaddingPx) / numberOfFamilyMembers;
    
    const wristbandStartX = centerX - rectWidth / 2;
    const meRectY = centerY;
    
    familyEntries.forEach(([famKey, famData], index) => {
        const pattern = config.family[famKey].pattern || config.pattern;
        const meRectTop = meRectY - meRectHeightPx / 2;        
        const sonRectY = meRectTop + sonPaddingPx + index * (sonRectHeightPx + sonPaddingPx);
        
        if (famKey === 'partner') {
            const metPartnerYear = config.me.met_partner_year;
            const myAgeWhenMetPartner = metPartnerYear - meBornYear;
            createPartnerStripe(myAgeWhenMetPartner, wristbandStartX, rectWidth, sonRectY, sonRectHeightPx, palette, pattern, scale, config.expected_life);
        } else {
            const sonBornYear = famData.born_year;
            const sonName = famData.name || `Child ${index + 1}`;
            const myAgeWhenSonBorn = sonBornYear - meBornYear;

            createChildrenStripe(famKey, myAgeWhenSonBorn, wristbandStartX, rectWidth, sonRectY, sonRectHeightPx, palette, ageHolydayAlone, pattern, scale, sonName, config.font, config.expected_life, numberOfFamilyMembers);
        }
    });
}
