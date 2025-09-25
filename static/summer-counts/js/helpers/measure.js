// Measurement utilities for converting between millimeters and pixels

const MM_TO_PIXELS = 3.7795275591;

/**
 * Convert millimeters to pixels
 * @param {number} mm - Value in millimeters
 * @returns {number} Value in pixels
 */
export function mmToPixels(mm) {
    return mm * MM_TO_PIXELS;
}

/**
 * Convert pixels to millimeters
 * @param {number} pixels - Value in pixels
 * @returns {number} Value in millimeters
 */
export function pixelsToMm(pixels) {
    return pixels / MM_TO_PIXELS;
}
