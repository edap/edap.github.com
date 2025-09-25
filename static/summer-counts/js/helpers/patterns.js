// Pattern utilities for creating geometric patterns

/**
 * Create a staggered dots pattern that overlays dots on the underlying layer
 * Dots are arranged in a brick-like pattern with alternate rows offset by half spacing
 * Limited to 3 rows for a subtle overlay effect
 * @param {number} x - X coordinate (top-left)
 * @param {number} y - Y coordinate (top-left)
 * @param {number} width - Pattern area width in pixels
 * @param {number} height - Pattern area height in pixels
 * @param {string} fillColor - Color for the dots
 * @param {number} scale - Scale factor for the pattern
 */
export function createDotsPattern(x, y, width, height, fillColor, scale = 1) {
    const patternGroup = new paper.Group();
    
    // Scale the dot size and spacing
    const dotSize = 3.5 * scale;
    const spacing = 5.5 * scale;
    
    // Calculate how many dots fit in the area horizontally
    const dotsX = Math.floor(width / spacing);
    
    // Limit to 3 rows for a subtle overlay effect
    const dotsY = Math.min(3, Math.floor(height / spacing));
    console.log('dotsY', height / spacing);
    
    // Create dots in a staggered pattern
    for (let row = 0; row < dotsY; row++) {
        for (let col = 0; col < dotsX; col++) {
            // Offset every other row by half the spacing to create staggered effect
            const rowOffset = (row % 2) * (spacing / 2);
            const dotX = x + col * spacing + spacing / 2 + rowOffset;
            const dotY = y + row * spacing + spacing / 2;
            
            // Create a small circle for the dot
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

/**
 * Create a semicircle pattern that overlays on the me rectangle
 * Creates 2 rows of square cells, each with 2 semicircles in 3 possible combinations
 * @param {number} x - X coordinate (top-left)
 * @param {number} y - Y coordinate (top-left)
 * @param {number} width - Pattern area width in pixels
 * @param {number} height - Pattern area height in pixels
 * @param {string} fillColor - Color for the pattern shapes
 * @param {number} scale - Scale factor for the pattern
 */
export function createCirclePattern(x, y, width, height, fillColor, scale = 1) {
    const patternGroup = new paper.Group();
    
    // Calculate cell size: height divided by 2 rows
    const cellSize = height / 2;
    const semicircleRadius = cellSize / 2; // Diameter = cellSize, so radius = cellSize/2
    
    // Calculate how many cells fit horizontally
    const cellsX = Math.floor(width / cellSize);
    
    // Create 2 rows of cells
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < cellsX; col++) {
            const cellX = x + col * cellSize;
            const cellY = y + row * cellSize;
            
            // Determine pattern type based on position (3 combinations)
            const patternType = (row + col) % 3;
            
            if (patternType === 0) {
                // Combination 1: Full circle (2 semicircles forming a complete circle)
                createFullCircle(cellX, cellY, cellSize, fillColor, patternGroup);
            }
            else if (patternType === 1) {
                // Combination 2: Top and bottom semicircles
                createTopBottomSemicircles(cellX, cellY, cellSize, fillColor, patternGroup);
            } else {
                // Combination 3: Left and right semicircles
                createLeftRightSemicircles(cellX, cellY, cellSize, fillColor, patternGroup);
            }
        }
    }
    
    return patternGroup;
}

/**
 * Create a full circle (2 semicircles forming a complete circle)
 */
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

/**
 * Create top and bottom semicircles
 */
function createTopBottomSemicircles(cellX, cellY, cellSize, fillColor, group) {
    const centerX = cellX + cellSize / 2;
    const centerY = cellY + cellSize / 2;
    const radius = cellSize / 2;
    
    // Top semicircle (upper half of circle)
    const topSemicircle = new paper.Path.Arc({
        from: [centerX - radius, centerY - radius],
        through: [centerX, centerY],
        to: [centerX + radius, centerY - radius],
        fillColor: fillColor
    });
    
    // Bottom semicircle (lower half of circle)
    const bottomSemicircle = new paper.Path.Arc({
        from: [centerX + radius, centerY + radius],
        through: [centerX, centerY],
        to: [centerX - radius, centerY + radius],
        fillColor: fillColor
    });
    
    group.addChild(topSemicircle);
    group.addChild(bottomSemicircle);
}

/**
 * Create left and right semicircles
 */
function createLeftRightSemicircles(cellX, cellY, cellSize, fillColor, group) {
    const centerX = cellX + cellSize / 2;
    const centerY = cellY + cellSize / 2;
    const radius = cellSize / 2;
    
    // Left semicircle (left half of circle)
    const leftSemicircle = new paper.Path.Arc({
        from: [centerX-radius, centerY - radius],
        through: [centerX, centerY],
        to: [centerX-radius, centerY + radius],
        fillColor: fillColor
    });
    
    // Right semicircle (right half of circle)
    const rightSemicircle = new paper.Path.Arc({
        from: [centerX+radius, centerY + radius],
        through: [centerX, centerY],
        to: [centerX+radius, centerY - radius],
        fillColor: fillColor
    });
    
    group.addChild(leftSemicircle);
    group.addChild(rightSemicircle);
}

