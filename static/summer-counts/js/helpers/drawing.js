// Drawing utilities for creating shapes and patterns
import { createCirclePattern, createDotsPattern, createDiagonalLinesPattern } from './patterns.js';

/**
 * Draw a rectangle with optional pattern support
 */
export function drawRect(x, y, width, height, fillColor, pattern = null, scale = 1) {
    // Create the rectangle
    const rect = new paper.Rectangle(x, y, width, height);
    const rectPath = new paper.Path.Rectangle(rect);
    
    // Set fill color or pattern
    if (pattern) {
        // Create pattern - all patterns overlay on the underlying layer
        const patternGroup = createPattern(pattern, x, y, width, height, fillColor, scale);
        return patternGroup;
    } else {
        // Set solid fill color
        rectPath.fillColor = fillColor;
        return rectPath;
    }
}

/**
 * Create a pattern based on the pattern type
 */
function createPattern(patternType, x, y, width, height, fillColor, scale) {
    switch (patternType) {
        case 'circle':
            return createCirclePattern(x, y, width, height, fillColor, scale);
        case 'dots':
            return createDotsPattern(x, y, width, height, fillColor, scale);
        case 'diagonal_lines':
            return createDiagonalLinesPattern(x, y, width, height, fillColor, scale);
        case 'line':
            const halfHeight = height/2;
            const line = new paper.Path.Rectangle(x, y+halfHeight/2, width, halfHeight);
            line.fillColor = fillColor;
            const lineGroup = new paper.Group();
            lineGroup.addChild(line);
            return lineGroup;
        default:
            // Fallback to solid color if pattern not recognized
            const rect = new paper.Path.Rectangle(x, y, width, height);
            rect.fillColor = fillColor;
            const group = new paper.Group();
            group.addChild(rect);
            return group;
    }
}
