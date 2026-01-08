// Wristband renderer module using Paper.js
import { mmToPixels } from './helpers/measure.js';
import { drawRect } from './helpers/drawing.js';
import { getWristbandConfig } from './wristbandConfig.js';
import { getPalette } from './paletteCollection.js';
import { createSonsRectangles, getOldestReachesAgeRelativeToMe} from './helpers/sons.js';
import { drawCounter } from './helpers/counter.js';
import { createRuler } from './helpers/ruler.js';
import { DEFAULT_SCALE } from './index.js';

// Constants
const ME_RECT_HEIGHT_RATIO = 0.6; // Height of "me" rectangles as ratio of wristband height
export const OLDER_ME = 0.6;

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
    
    // Draw cover borders
    coverBorder(centerX, centerY, rectWidth, rectHeight, config, finalScale);
    
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
        config.age_holyday_alone
    );
    
    const a2EndAge = Math.min(60, oldestSonAge); // Don't go beyond 60
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
    
    // B1: From youngest son reaches age_holyday_alone until 60 years old
    // Only draw B1 if the youngest son reaches age_holyday_alone before me turns 60
    if (a2EndAge < 60) {
        const b1StartX = wristbandStartX + (a2EndAge / config.expected_life) * rectWidth;
        const b1EndX = wristbandStartX + (60 / config.expected_life) * rectWidth;
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
    
    // B2: From 60 to expected_life years
    const b2StartX = wristbandStartX + (60 / config.expected_life) * rectWidth;
    const b2Width = ((config.expected_life - 60) / config.expected_life) * rectWidth;
    
    drawRect(
        b2StartX,
        meRectY - meRectHeight / 2,
        b2Width,
        meRectHeight,
        palette.me_old_color
    );
}

function drawPartnerRectangle(centerX, centerY, rectWidth, rectHeight, config, scale) {
    // Respect visibility flag
    if (!config.draw_partner) {
        return;
    }
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
    const partnerRectHeight = meRectHeight / 5;

    // position to the top
    const partnerRectY = centerY - rectHeight / 2 + partnerRectHeight;
    //const partnerRectY = centerY; // Center vertically on the wristband


    
    // Calculate when partner was met (my age when partner was met)
    const meBornYear = config.me.born_year;
    const metPartnerYear = config.me.met_partner_year;
    const myAgeWhenMetPartner = metPartnerYear - meBornYear;
    
    // Calculate partner rectangle position and width
    const partnerStartAge = Math.max(0, myAgeWhenMetPartner); // Don't start before 0
    const partnerEndAge = config.expected_life; // Goes until the end
    
    const partnerStartX = wristbandStartX + (partnerStartAge / config.expected_life) * rectWidth;
    const partnerWidth = ((partnerEndAge - partnerStartAge) / config.expected_life) * rectWidth;
    
    // Only draw if the partner rectangle has a valid width
    if (partnerWidth > 0) {

        const h = 3;
        drawRect(
            partnerStartX,
            partnerRectY - h / 2,
            partnerWidth,
            h,
            'black'
        );

        // drawRect(
        //     partnerStartX,
        //     partnerRectY - partnerRectHeight / 2,
        //     partnerWidth,
        //     partnerRectHeight,
        //     palette.partner_color
        // );
    }
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


