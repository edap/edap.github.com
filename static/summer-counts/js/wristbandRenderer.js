// Wristband renderer module using Paper.js
import { mmToPixels } from './helpers/measure.js';
import { drawRect } from './helpers/drawing.js';
import { getWristbandConfig } from './wristbandConfig.js';
import { getPalette } from './paletteCollection.js';
import { createSonsRectangles } from './helpers/sons.js';
import { drawCounter } from './helpers/counter.js';
import { DEFAULT_SCALE } from './index.js';

// Constants
const ME_RECT_HEIGHT_RATIO = 0.6; // Height of "me" rectangles as ratio of wristband height
export const OLDER_ME = 0.6;

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
    
    drawPartnerRectangle(centerX, centerY, rectWidth, rectHeight, config, finalScale);
    
    // Create the sons' rectangles
    createSonsRectangles(centerX, centerY, rectWidth, rectHeight, config, finalScale);
    
    // Draw counter text
    drawCounter(centerX, centerY, rectWidth, rectHeight, config, finalScale);
    
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
    
    // Calculate current age
    const currentYear = new Date().getFullYear();
    const myAge = currentYear - config.me.born_year;
    
    // A1: From 0 to current age
    const a1Width = (myAge / 100) * rectWidth;
    drawRect(
        wristbandStartX,
        meRectY - meRectHeight / 2,
        a1Width,
        meRectHeight,
        palette.me_color
    );
    
    // A2: From current age until youngest son reaches age_holyday_alone (black)
    const a2StartX = wristbandStartX + a1Width;
    
    // Calculate when the youngest son will reach age_holyday_alone
    const children = Object.values(config.family);
    let youngestSonAge = 0;
    if (children.length > 0) {
        const youngestSon = children.reduce((youngest, child) => {
            return child.born_year > youngest.born_year ? child : youngest;
        });
        const yearWhenYoungestReachesAge = youngestSon.born_year + config.age_holyday_alone;
        youngestSonAge = yearWhenYoungestReachesAge - config.me.born_year;
    } else {
        // If no children, use 60 as fallback
        youngestSonAge = 60;
    }
    
    const a2EndAge = Math.min(60, youngestSonAge); // Don't go beyond 60
    const a2Width = (a2EndAge / 100) * rectWidth - a1Width;
    
    if (a2Width > 0) {
        drawRect(
            a2StartX,
            meRectY - meRectHeight / 2,
            a2Width,
            meRectHeight,
            palette.me_color, // Black color
            'diagonal_lines', // Diagonal lines pattern
            scale
        );
    }
    
    // B1: From youngest son reaches age_holyday_alone until 60 years old
    // Only draw B1 if the youngest son reaches age_holyday_alone before me turns 60
    if (a2EndAge < 60) {
        const b1StartX = wristbandStartX + (a2EndAge / 100) * rectWidth;
        const b1EndX = wristbandStartX + (60 / 100) * rectWidth;
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
    
    // B2: From 60 to 100 years (unchanged)
    const b2StartX = wristbandStartX + (60 / 100) * rectWidth;
    const b2Width = rectWidth * 0.4; // 40% of wristband width
    
    drawRect(
        b2StartX,
        meRectY - meRectHeight / 2,
        b2Width,
        meRectHeight,
        palette.me_old_color
    );
}

function drawPartnerRectangle(centerX, centerY, rectWidth, rectHeight, config, scale) {
    const palette = getPalette(config.palette_id);
    
    // Calculate the position and dimensions relative to the wristband
    const wristbandStartX = centerX - rectWidth / 2;
    const wristbandStartY = centerY - rectHeight / 2;
    
    // Calculate the height of the "me" rectangles to cover the printable area
    const totalHeightMm = config.fabric_height;
    const printableHeightMm = config.fabric_printable_height;
    const printableHeightRatio = printableHeightMm / totalHeightMm; // 12/15 = 0.8
    const meRectHeight = rectHeight * printableHeightRatio;
    
    // Partner rectangle height is half of the me rectangle height
    const partnerRectHeight = meRectHeight / 2;
    const partnerRectY = centerY; // Center vertically on the wristband
    
    // Calculate when partner was met (my age when partner was met)
    const meBornYear = config.me.born_year;
    const metPartnerYear = config.me.met_partner_year;
    const myAgeWhenMetPartner = metPartnerYear - meBornYear;
    
    // Calculate partner rectangle position and width
    const partnerStartAge = Math.max(0, myAgeWhenMetPartner); // Don't start before 0
    const partnerEndAge = 100; // Goes until the end
    
    const partnerStartX = wristbandStartX + (partnerStartAge / 100) * rectWidth;
    const partnerWidth = ((partnerEndAge - partnerStartAge) / 100) * rectWidth;
    
    // Only draw if the partner rectangle has a valid width
    if (partnerWidth > 0) {
        drawRect(
            partnerStartX,
            partnerRectY - partnerRectHeight / 2,
            partnerWidth,
            partnerRectHeight,
            palette.partner_color
        );
    }
}


