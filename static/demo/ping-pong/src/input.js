export const getCoordinates = (event) => {
    let x, y;
  
    if (event.type.startsWith('touch')) {
      // For touch events, use the first touch point
      if (event.touches.length > 0) {
        x = event.touches[0].clientX;
        y = event.touches[0].clientY;
      } else {
        // Fallback for touch events without touches (e.g., touchend, touchcancel)
        x = null;
        y = null;
      }
    } else {
      // For mouse events
      x = event.clientX;
      y = event.clientY;
    }
  
    return { x, y };
  }