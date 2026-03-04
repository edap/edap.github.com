import { mmToPixels } from './helpers/measure.js';
import { drawRect } from './helpers/drawing.js';
import { getWristbandConfig } from './wristbandConfig.js';
import { getPalette } from './paletteCollection.js';
import { createFamilyMemberRectangles, getOldestReachesAgeRelativeToMe, getYoungestReachesAgeRelativeToMe} from './helpers/family.js';
import { drawCounter } from './helpers/counter.js';
import { createRuler } from './helpers/ruler.js';


function calculateWristBandDimension(scale = 1) {
    const config = getWristbandConfig();

    const canvasWidth = paper.view.size.width;
    const canvasHeight = paper.view.size.height;

    const fabricWidthPx = mmToPixels(config.fabric_width);
    const fabricHeightPx = mmToPixels(config.fabric_height);
    const targetWidth = canvasWidth * 0.9;
    const baseScale = targetWidth / fabricWidthPx;

    const finalScale = baseScale * scale;
    const rectWidth = fabricWidthPx * finalScale;
    const rectHeight = fabricHeightPx * finalScale;

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    return {
        config,
        canvasWidth,
        canvasHeight,
        fabricWidthPx,
        fabricHeightPx,
        targetWidth,
        baseScale,
        finalScale,
        rectWidth,
        rectHeight,
        centerX,
        centerY
    };
}

export function drawWristband(scale = 1) {
    paper.project.clear();
    const dimensions = calculateWristBandDimension(scale);
    const { config, rectWidth, rectHeight, centerX, centerY, finalScale } = dimensions;
    createWristbandRectangle(centerX, centerY, rectWidth, rectHeight, config);
    createMeRectangle(centerX, centerY, rectWidth, rectHeight, config, finalScale);

    createFamilyMemberRectangles(centerX, centerY, rectWidth, rectHeight, config, finalScale);
    drawCounter(centerX, centerY, rectWidth, rectHeight, config, finalScale);
    createRuler(centerX, centerY, rectWidth, rectHeight, finalScale, config);
    coverBorder(centerX, centerY, rectWidth, rectHeight, config, finalScale);
    drawFocusRectangle(centerX, centerY, rectWidth, rectHeight, config, finalScale);
}

export function onResize() {
    drawWristband(2);
}

export function onFrame() {
    if (paper.project.activeLayer.children.length === 0) {
        drawWristband(2);
    }
}

function createWristbandRectangle(centerX, centerY, rectWidth, rectHeight, config) {
    const wristbandRect = new paper.Rectangle(
        centerX - rectWidth / 2,
        centerY - rectHeight / 2,
        rectWidth,
        rectHeight
    );

    const palette = getPalette(config.palette_id);
    const wristband = new paper.Path.Rectangle(wristbandRect);
    wristband.fillColor = palette.bg_color;
    wristband.strokeWidth = 1;
}


function createMeRectangle(centerX, centerY, rectWidth, rectHeight, config, scale) {
    const palette = getPalette(config.palette_id);

    const wristbandStartX = centerX - rectWidth / 2;
    const wristbandStartY = centerY - rectHeight / 2;

    const totalHeightMm = config.fabric_height;
    const printableHeightMm = config.fabric_printable_height;
    const printableHeightRatio = printableHeightMm / totalHeightMm;
    const meRectHeight = rectHeight * printableHeightRatio;
    const meRectY = centerY;

    const currentYear = new Date().getFullYear();
    const myAge = currentYear - config.me.born_year;

    const a1Width = (myAge / config.expected_life) * rectWidth;
    drawRect(
        wristbandStartX,
        meRectY - meRectHeight / 2,
        a1Width,
        meRectHeight,
        palette.me_color
    );

    const a2StartX = wristbandStartX + a1Width;

    const oldestSonAge = getOldestReachesAgeRelativeToMe(
        config.me.born_year,
        config.family,
        config.age_holyday_alone,
        config.end_quality_life
    );
    
    const a2EndAge = Math.min(config.end_quality_life, oldestSonAge);
    const a2Width = (a2EndAge / config.expected_life) * rectWidth - a1Width;
    
    if (a2Width > 0) {
        drawRect(
            a2StartX,
            meRectY - meRectHeight / 2,
            a2Width,
            meRectHeight,
            palette.partner_color,
            'solid',
            scale
        );
    }

    if (a2EndAge < config.end_quality_life) {
        const b1StartX = wristbandStartX + (a2EndAge / config.expected_life) * rectWidth;
        const b1EndX = wristbandStartX + (config.end_quality_life / config.expected_life) * rectWidth;
        const b1Width = b1EndX - b1StartX;
        
        if (b1Width > 0) {
            drawRect(
                b1StartX,
                meRectY - meRectHeight / 2,
                b1Width,
                meRectHeight,
                palette.me_color
            );
        }
    }

    const b2StartX = wristbandStartX + (config.end_quality_life / config.expected_life) * rectWidth;
    const b2Width = ((config.expected_life - config.end_quality_life) / config.expected_life) * rectWidth;
    
    drawRect(
        b2StartX,
        meRectY - meRectHeight / 2,
        b2Width,
        meRectHeight,
        palette.me_old_color
    );
}

function coverBorder(centerX, centerY, rectWidth, rectHeight, config, scale) {
    const palette = getPalette(config.palette_id);

    const borderHeightMm = (config.fabric_height - config.fabric_printable_height) / 2;
    const borderHeightPx = mmToPixels(borderHeightMm) * scale;

    const wristbandStartX = centerX - rectWidth / 2;
    const wristbandStartY = centerY - rectHeight / 2;

    const topBorderY = wristbandStartY;
    drawRect(
        wristbandStartX,
        topBorderY,
        rectWidth,
        borderHeightPx,
        palette.me_color
    );

    const bottomBorderY = wristbandStartY + rectHeight - borderHeightPx;
    drawRect(
        wristbandStartX,
        bottomBorderY,
        rectWidth,
        borderHeightPx,
        palette.me_color
    );
}

function drawFocusRectangle(centerX, centerY, rectWidth, rectHeight, config, scale) {
    const palette = getPalette(config.palette_id);
    const wristbandStartX = centerX - rectWidth / 2;
    const totalHeightMm = config.fabric_height;
    const printableHeightMm = config.fabric_printable_height;
    const printableHeightRatio = printableHeightMm / totalHeightMm;
    const meRectHeight = rectHeight * printableHeightRatio;
    const meRectY = centerY;
    const currentYear = new Date().getFullYear();
    const myAge = currentYear - config.me.born_year;
    const a1Width = (myAge / config.expected_life) * rectWidth;
    const a2StartX = wristbandStartX + a1Width;
    const leftX = a2StartX ;

    const rectTop = meRectY - meRectHeight / 2;
    const rectBottom = meRectY + meRectHeight / 2;
    const lineColor = palette.focus_color;
    const lineWidth = 1 * scale;

    const leftLine = new paper.Path.Line(
        new paper.Point(leftX, rectTop),
        new paper.Point(leftX, rectBottom)
    );
    leftLine.strokeColor = lineColor;
    leftLine.strokeWidth = lineWidth * 3;

    const youngestSonAge = getYoungestReachesAgeRelativeToMe(
        config.me.born_year,
        config.family,
        config.age_holyday_alone,
        config.end_quality_life
    );
    const b1EndX = wristbandStartX + (youngestSonAge / config.expected_life) * rectWidth;
    const rightLine = new paper.Path.Line(
        new paper.Point(b1EndX, rectTop),
        new paper.Point(b1EndX, rectBottom)
    );
    rightLine.strokeColor = lineColor;
    rightLine.strokeWidth = lineWidth;

    // first horizontal line
    const topLine = new paper.Path.Line(
        new paper.Point(leftX, rectTop),
        new paper.Point(b1EndX, rectTop)
    );
    topLine.strokeColor = lineColor;
    topLine.strokeWidth = lineWidth;

    // second horizontal line
    const bottomLine = new paper.Path.Line(
        new paper.Point(leftX, rectBottom),
        new paper.Point(b1EndX, rectBottom)
    );
    bottomLine.strokeColor = lineColor;
    bottomLine.strokeWidth = lineWidth;
    
}


