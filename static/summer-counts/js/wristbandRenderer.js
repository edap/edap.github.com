// Wristband renderer module using Paper.js
import { mmToPixels } from './helpers/measure.js';
import { drawRect } from './helpers/drawing.js';
import { getWristbandConfig } from './wristbandConfig.js';
import { getPalette } from './paletteCollection.js';
import { createSonsRectangles } from './helpers/sons.js';
import { DEFAULT_SCALE } from './index.js';

// Constants
const ME_RECT_HEIGHT_RATIO = 0.6; // Height of "me" rectangles as ratio of wristband height

/**
 * Calculate wristband dimensions and positioning
 * @param {number} scale - Scale factor for the wristband (default: 1)
 * @returns {Object} Object containing all calculated dimensions
 */
function calculateWristBandDimension(scale = 1) {
    // Get current configuration
    const config = getWristbandConfig();
    
    // Get canvas dimensions
    const canvasWidth = paper.view.size.width;
    const canvasHeight = paper.view.size.height;
    
    // Convert fabric dimensions to pixels
    const fabricWidthPx = mmToPixels(config.fabric_width);
    const fabricHeightPx = mmToPixels(config.fabric_height);
    
    // Calculate base scale to fit the canvas properly
    // We want the wristband to take up most of the canvas width
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

/**
 * Draw the wristband rectangle with correct proportions
 * @param {number} scale - Scale factor for the wristband (default: 1)
 */
export function drawWristband(scale = 1) {
    // Clear the canvas
    paper.project.clear();
    
    // Calculate all dimensions
    const dimensions = calculateWristBandDimension(scale);
    const { config, rectWidth, rectHeight, centerX, centerY, finalScale } = dimensions;
    
    // Create the wristband rectangle
    createWristbandRectangle(centerX, centerY, rectWidth, rectHeight, config);
    
    // Create the "me" rectangles (life from 0-60 and 60-100)
    createMeRectangle(centerX, centerY, rectWidth, rectHeight, config, finalScale);
    
    // Create the sons' rectangles
    createSonsRectangles(centerX, centerY, rectWidth, rectHeight, config, finalScale);
    
    createRuler(centerX, centerY, rectWidth, rectHeight, finalScale, config);
    
}

/**
 * Handle canvas resize
 */
export function onResize() {
    drawWristband(2); // Default scale of 1
}

/**
 * Initialize the renderer
 */
export function onFrame() {
    // This runs every frame, but we only need to draw once
    if (paper.project.activeLayer.children.length === 0) {
        drawWristband(2); // Default scale of 1
    }
}

/**
 * Create the wristband rectangle
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {number} rectWidth - Rectangle width in pixels
 * @param {number} rectHeight - Rectangle height in pixels
 * @param {Object} config - Wristband configuration
 */
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
    wristband.fillColor = palette.bg_color;
    wristband.strokeColor = '#333';
    wristband.strokeWidth = 1;
}

/**
 * Create a ruler at the bottom of the wristband
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {number} rectWidth - Rectangle width in pixels
 * @param {number} rectHeight - Rectangle height in pixels
 */
function createRuler(centerX, centerY, rectWidth, rectHeight, scale, config) {
    // Calculate the printable area offset
    // If fabric_height is 15mm and fabric_printable_height is 12mm, 
    // there's a 3mm difference (1.5mm on each side)

    // Create the ruler
    const palette = getPalette(config.palette_id);
    const textColor = palette.text_color;
    const totalHeightMm = config.fabric_height;
    const printableHeightMm = config.fabric_printable_height;
    const nonPrintableMarginMm = (totalHeightMm - printableHeightMm) / 2; // 1.5mm on each side
    
    // Convert margin to pixels and adjust ruler position
    const marginPx = mmToPixels(nonPrintableMarginMm) * scale;
    const rulerY = centerY + rectHeight / 2 - marginPx - 2; // Position within printable area
    const rulerStartX = centerX - rectWidth / 2;
    const rulerEndX = centerX + rectWidth / 2;
    const rulerLength = rulerEndX - rulerStartX;
    
    // Create tick marks and labels (0 to 90, every 10)
    for (let i = 0; i < 100; i += 10) {
        const tickX = rulerStartX + (i / 100) * rulerLength;
        
        // Create tick mark
        const tickMark = new paper.Path.Line(
            new paper.Point(tickX, rulerY - 3),
            new paper.Point(tickX, rulerY + 2)
        );
        tickMark.strokeColor = textColor;
        tickMark.strokeWidth = 1 * scale;
        
        // Add label for multiples of 10
        const label = new paper.PointText({
            point: [tickX + 3, rulerY],
            content: i.toString(),
            justification: 'left',
            fontSize: 7 * scale,
            fillColor: textColor
        });
    }
}

/**
 * Create the "me" rectangles representing a person's life
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {number} rectWidth - Rectangle width in pixels
 * @param {number} rectHeight - Rectangle height in pixels
 * @param {Object} config - Wristband configuration
 * @param {number} scale - Scale factor
 */
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
    
    // First rectangle: 0 to 60 years (60% of the width)
    const meRect1Width = rectWidth * 0.6; // 60% of wristband width
    
    // Use drawRect function for first rectangle
    drawRect(
        wristbandStartX,
        meRectY - meRectHeight / 2,
        meRect1Width,
        meRectHeight,
        palette.me_color
    );
    
    // Second rectangle: 60 to 100 years (40% of the width)
    const meRect2Width = rectWidth * 0.4; // 40% of wristband width
    const meRect2StartX = wristbandStartX + meRect1Width; // Start where first rectangle ends
    
    // Use drawRect function for second rectangle
    drawRect(
        meRect2StartX,
        meRectY - meRectHeight / 2,
        meRect2Width,
        meRectHeight,
        palette.me_old_color
    );
}


