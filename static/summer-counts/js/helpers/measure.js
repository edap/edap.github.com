const MM_TO_PIXELS = 3.7795275591;


export function mmToPixels(mm) {
    return mm * MM_TO_PIXELS;
}

export function pixelsToMm(pixels) {
    return pixels / MM_TO_PIXELS;
}
