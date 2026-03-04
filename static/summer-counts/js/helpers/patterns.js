import { mmToPixels } from './measure.js';

const DIAGONAL_LINES_WIDTH = 1;
const DIAGONAL_LINES_PADDING = 1;

export function createDotsPattern(x, y, width, height, fillColor, scale = 1) {
    const patternGroup = new paper.Group();
    
    const dotSize = 3.5 * scale;
    const spacing = 5.5 * scale;
    
    const dotsX = Math.floor(width / spacing);
    
    const dotsY = Math.min(3, Math.floor(height / spacing));
    console.log('dotsY', height / spacing);
    
    for (let row = 0; row < dotsY; row++) {
        for (let col = 0; col < dotsX; col++) {
            const rowOffset = (row % 2) * (spacing / 2);
            const dotX = x + col * spacing + spacing / 2 + rowOffset;
            const dotY = y + row * spacing + spacing / 2;
            
            const dot = new paper.Path.Circle({
                center: [dotX, dotY],
                radius: dotSize / 2,
                fillColor: fillColor
            });
            
            patternGroup.addChild(dot);
        }
    }
    
    return patternGroup;
}

export function createCirclePattern(x, y, width, height, fillColor, scale = 1) {
    const patternGroup = new paper.Group();
    
    const cellSize = (height / 2) * scale;
    
    const cellsX = Math.floor(width / cellSize);
    
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < cellsX; col++) {
            const cellX = x + col * cellSize;
            const cellY = y + row * cellSize;
            
            const patternType = (row + col) % 3;
            
            if (patternType === 0) {
                createFullCircle(cellX, cellY, cellSize, fillColor, patternGroup);
            }
            else if (patternType === 1) {
                createTopBottomSemicircles(cellX, cellY, cellSize, fillColor, patternGroup);
            } else {
                createLeftRightSemicircles(cellX, cellY, cellSize, fillColor, patternGroup);
            }
        }
    }
    
    return patternGroup;
}

function createFullCircle(cellX, cellY, cellSize, fillColor, group) {
    const centerX = cellX + cellSize / 2;
    const centerY = cellY + cellSize / 2;
    const radius = cellSize / 2;
    
    const circle = new paper.Path.Circle({
        center: [centerX, centerY],
        radius: radius,
        fillColor: fillColor
    });
    
    group.addChild(circle);
}

function createTopBottomSemicircles(cellX, cellY, cellSize, fillColor, group) {
    const centerX = cellX + cellSize / 2;
    const centerY = cellY + cellSize / 2;
    const radius = cellSize / 2;
    
    const topSemicircle = new paper.Path.Arc({
        from: [centerX - radius, centerY - radius],
        through: [centerX, centerY],
        to: [centerX + radius, centerY - radius],
        fillColor: fillColor
    });
    
    const bottomSemicircle = new paper.Path.Arc({
        from: [centerX + radius, centerY + radius],
        through: [centerX, centerY],
        to: [centerX - radius, centerY + radius],
        fillColor: fillColor
    });
    
    group.addChild(topSemicircle);
    group.addChild(bottomSemicircle);
}

function createLeftRightSemicircles(cellX, cellY, cellSize, fillColor, group) {
    const centerX = cellX + cellSize / 2;
    const centerY = cellY + cellSize / 2;
    const radius = cellSize / 2;
    
    const leftSemicircle = new paper.Path.Arc({
        from: [centerX-radius, centerY - radius],
        through: [centerX, centerY],
        to: [centerX-radius, centerY + radius],
        fillColor: fillColor
    });
    
    const rightSemicircle = new paper.Path.Arc({
        from: [centerX+radius, centerY + radius],
        through: [centerX, centerY],
        to: [centerX+radius, centerY - radius],
        fillColor: fillColor
    });
    
    group.addChild(leftSemicircle);
    group.addChild(rightSemicircle);
}

export function createDiagonalLinesPattern(x, y, width, height, fillColor, scale = 1) {
    const lineWidthPx = mmToPixels(DIAGONAL_LINES_WIDTH) * scale;
    const paddingPx = mmToPixels(DIAGONAL_LINES_PADDING) * scale;
    const spacingPx = lineWidthPx + paddingPx;
    
    const rect = new paper.Rectangle(x, y, width, height);
    const clipPath = new paper.Path.Rectangle(rect);
    clipPath.fillColor = 'white';
    
    const lineGroup = new paper.Group();
    
    const bounds = clipPath.bounds;
    const buffer = Math.max(width, height);
    
    const startX = bounds.x - buffer;
    const endX = bounds.x + bounds.width + buffer;
    
    for (let lineX = startX; lineX < endX; lineX += spacingPx) {
        const line = new paper.Path.Line({
            from: new paper.Point(lineX, bounds.top - buffer),
            to: new paper.Point(lineX, bounds.bottom + buffer),
            strokeColor: fillColor,
            strokeWidth: lineWidthPx
        });
        lineGroup.addChild(line);
    }
    
    lineGroup.rotate(45, bounds.center);
    
    const clippedGroup = new paper.Group(clipPath, lineGroup);
    clippedGroup.clipped = true;
    
    clipPath.fillColor = null;
    
    return clippedGroup;
}

