import { createCirclePattern, createDotsPattern, createDiagonalLinesPattern } from './patterns.js';

export function drawRect(x, y, width, height, fillColor, pattern = null, scale = 1) {
    const rect = new paper.Rectangle(x, y, width, height);
    const rectPath = new paper.Path.Rectangle(rect);

    if (pattern) {
        const patternGroup = createPattern(pattern, x, y, width, height, fillColor, scale);
        return patternGroup;
    } else {
        rectPath.fillColor = fillColor;
        return rectPath;
    }
}

/**
 * This is not used at the moment.I left it here for future reference, in case patterns are needed in the future.
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
        case 'solid':
            const solidRect = new paper.Path.Rectangle(x, y, width, height);
            solidRect.fillColor = fillColor;
            const solidGroup = new paper.Group();
            solidGroup.addChild(solidRect);
            return solidGroup;
        default:
            const rect = new paper.Path.Rectangle(x, y, width, height);
            rect.fillColor = fillColor;
            const group = new paper.Group();
            group.addChild(rect);
            return group;
    }
}
