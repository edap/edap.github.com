
import { mmToPixels } from './helpers/measure.js';
import { drawRect } from './helpers/drawing.js';
import { getWristbandConfig } from './wristbandConfig.js';
import { getPalette } from './paletteCollection.js';
import { createFamilyMemberRectangles, getOldestReachesAgeRelativeToMe} from './helpers/family.js';
import { drawCounter } from './helpers/counter.js';
import { createRuler } from './helpers/ruler.js';


function calculateWristBandDimension(scale = 1) {
    const config = getWristbandConfig();
    
    const canvasWidth = paper.view.size.width;
    const canvasHeight = paper.view.size.height;
    
    const fabricWidthPx = mmToPixels(config.fabric_width);
    const fabricHeightPx = mmToPixels(config.fabric_height);
    

    const targetWidth = canvasWidth * 0.9; // Use 90% of canvas width
    const baseScale = targetWidth / fabricWidthPx;
    
    // Apply the custom scale factor
    const finalScale = baseScale * scale;
    
    // Calculate the actual rectangle dimensions after scaling
    const rectWidth = fabricWidthPx * finalScale;
    const rectHeight = fabricHeightPx * finalScale;
    
    // Center the rectangle on the canvas
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
    // Clear the canvas
    paper.project.clear();
    
    // Calculate all dimensions
    const dimensions = calculateWristBandDimension(scale);
    const { config, rectWidth, rectHeight, centerX, centerY, finalScale } = dimensions;
    
    // Create the wristband rectangle
    createWristbandRectangle(centerX, centerY, rectWidth, rectHeight, config);
    
    // Create the "me" rectangles (life from 0 to end_quality_life and end_quality_life to expected_life)
    createMeRectangle(centerX, centerY, rectWidth, rectHeight, config, finalScale);
    
    // Create the sons' rectangles
    createFamilyMemberRectangles(centerX, centerY, rectWidth, rectHeight, config, finalScale);
    
    // Draw counter text
    drawCounter(centerX, centerY, rectWidth, rectHeight, config, finalScale);
    
    createRuler(centerX, centerY, rectWidth, rectHeight, finalScale, config);
    
    // Draw cover borders
    coverBorder(centerX, centerY, rectWidth, rectHeight, config, finalScale);
    
    // Draw focus rectangle on top of everything
    drawFocusRectangle(centerX, centerY, rectWidth, rectHeight, config, finalScale);
    
}

export function onResize() {
    drawWristband(2); // Default scale of 1
}

export function onFrame() {
    // This runs every frame, but we only need to draw once
    if (paper.project.activeLayer.children.length === 0) {
        drawWristband(2); // Default scale of 1
    }
}

function createWristbandRectangle(centerX, centerY, rectWidth, rectHeight, config) {
    // Create the wristband rectangle
    const wristbandRect = new paper.Rectangle(
        centerX - rectWidth / 2,
        centerY - rectHeight / 2,
        rectWidth,
        rectHeight
    );

    const palette = getPalette(config.palette_id);
    
    // Create the path and set its properties
    const wristband = new paper.Path.Rectangle(wristbandRect);
    //wristband.fillColor = palette.me_color;
    wristband.fillColor = palette.bg_color;
    //wristband.strokeColor = '#333';
    wristband.strokeWidth = 1;
}

// removed: inlined ruler creation moved to helpers/ruler.js

function createMeRectangle(centerX, centerY, rectWidth, rectHeight, config, scale) {
    const palette = getPalette(config.palette_id);
    
    // Calculate the position and dimensions relative to the wristband
    const wristbandStartX = centerX - rectWidth / 2;
    const wristbandStartY = centerY - rectHeight / 2;
    
    // Calculate the height of the "me" rectangles to cover the printable area
    const totalHeightMm = config.fabric_height;
    const printableHeightMm = config.fabric_printable_height;
    const printableHeightRatio = printableHeightMm / totalHeightMm; // 12/15 = 0.8
    const meRectHeight = rectHeight * printableHeightRatio;
    const meRectY = centerY; // Center vertically on the wristband
    
    // Calculate current age
    const currentYear = new Date().getFullYear();
    const myAge = currentYear - config.me.born_year;
    
    // A1: From 0 to current age
    const a1Width = (myAge / config.expected_life) * rectWidth;
    drawRect(
        wristbandStartX,
        meRectY - meRectHeight / 2,
        a1Width,
        meRectHeight,
        palette.me_color
    );
    
    // A2: From current age until youngest son reaches age_holyday_alone (black)
    const a2StartX = wristbandStartX + a1Width;
    
    // Calculate when the oldest son will reach age_holyday_alone (relative to me)
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
            palette.partner_color, // we sue the partner color for the focus area. This need to be renamed.
            'solid',
            scale
        );
    }
    
    // B1: From youngest son reaches age_holyday_alone until end_quality_life years old
    // Only draw B1 if the youngest son reaches age_holyday_alone before me turns end_quality_life
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
    
    // B2: From end_quality_life to expected_life years
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
    
    // Calculate border height: (fabric_height - fabric_printable_height) / 2
    const borderHeightMm = (config.fabric_height - config.fabric_printable_height) / 2;
    const borderHeightPx = mmToPixels(borderHeightMm) * scale;
    
    // Calculate positions
    const wristbandStartX = centerX - rectWidth / 2;
    const wristbandStartY = centerY - rectHeight / 2;
    
    // Top border rectangle
    const topBorderY = wristbandStartY;
    drawRect(
        wristbandStartX,
        topBorderY,
        rectWidth,
        borderHeightPx,
        palette.me_color
    );
    
    // Bottom border rectangle
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
    
    // Calculate positions
    const wristbandStartX = centerX - rectWidth / 2;
    
    // Calculate printable area height
    const totalHeightMm = config.fabric_height;
    const printableHeightMm = config.fabric_printable_height;
    const printableHeightRatio = printableHeightMm / totalHeightMm;
    const meRectHeight = rectHeight * printableHeightRatio;
    const meRectY = centerY;
    
    // Calculate current age
    const currentYear = new Date().getFullYear();
    const myAge = currentYear - config.me.born_year;
    
    // Calculate the first vertical line starting from the left
    const a1Width = (myAge / config.expected_life) * rectWidth;
    const a2StartX = wristbandStartX + a1Width;
    const leftX = a2StartX ;

    
    
    // Calculate rectangle boundaries
    const rectTop = meRectY - meRectHeight / 2;
    const rectBottom = meRectY + meRectHeight / 2;
    
    // Draw four lines to form a rectangle border using focus_color from palette
    const lineColor = palette.focus_color;
    const lineWidth = 1 * scale;
    

    const leftLine = new paper.Path.Line(
        new paper.Point(leftX, rectTop),
        new paper.Point(leftX, rectBottom)
    );
    leftLine.strokeColor = lineColor;
    leftLine.strokeWidth = lineWidth * 3;

    // second vertical line
    const b1EndX = wristbandStartX + (config.end_quality_life / config.expected_life) * rectWidth;
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


