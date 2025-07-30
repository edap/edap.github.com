import { Vector3 } from "three"

export const updateCameraForTableVisibility = (tableSize, camera, screenSize) => {
    if (!tableSize) {
        console.log('Error: tableSize is undefined.');
        return;
    }

    const aspectRatio = screenSize.width / screenSize.height;
    const isMobile = window.innerWidth < 768; // Standard breakpoint for mobile devices

    // --- DEBUG PARAMETERS: TWEAK THESE VALUES ---
    // These are values you can experiment with to find the perfect camera angle.
    // Make sure to test on both mobile and desktop, and portrait/landscape.

    // FOV (Field of View) in degrees
    let fovDegreesMobilePortrait = 75;   // Higher FOV for very tall, narrow mobile screens
    let fovDegreesMobileLandscape = 65;  // Moderate FOV for wider mobile screens
    let fovDegreesDesktop = 50;        // Balanced FOV for desktop, allowing more of the scene

    // Camera Z-distance buffer: Multiplier for calculated distance (1.0 = exact fit, >1.0 = pulls back)
    // NOW TWO SEPARATE VARIABLES
    let cameraZBufferMobile = 1.95; // Keeps your current good value for mobile
    let cameraZBufferDesktop = 1.3; // **NEW VALUE TO TWEAK for Desktop: try values like 1.05 to 1.5**

    // Vertical Play Area Buffer: How much space (as a factor of tableHeight) above the table to include in view
    // This affects how high cameraY needs to be to fit the entire ball arc.
    let verticalPlayAreaBuffer = 1.2;

    // Camera Y-position factor: Determines the angle/steepness of the camera looking down
    // (Relative to cameraZ and lookAtY). Higher value = more overhead.
    let cameraYFactorMobile = 1.0;
    let cameraYFactorDesktop = 0.3;

    // --- END OF DEBUG PARAMETERS ---


    // Calculate the total dimensions of the area we want the camera to see
    // Add buffers for horizontal play area around the table
    const horizontalPlayAreaBuffer = 0.2; // 20% extra on width/depth
    const targetWidth = tableSize.width * (1 + horizontalPlayAreaBuffer);
    const targetDepth = tableSize.depth * (1 + horizontalPlayAreaBuffer);

    // --- 1. Adjust FOV based on device/orientation ---
    let currentFovDegrees;
    if (isMobile) {
        if (aspectRatio < 1) { // Mobile Portrait (tall screen)
            currentFovDegrees = fovDegreesMobilePortrait;
        } else { // Mobile Landscape (wide screen)
            currentFovDegrees = fovDegreesMobileLandscape;
        }
    } else { // Desktop
        currentFovDegrees = fovDegreesDesktop;
    }
    camera.fov = currentFovDegrees;
    camera.updateProjectionMatrix();

    const fovRadians = (camera.fov * Math.PI) / 180;

    // --- 2. Calculate camera Z position (distance from target) ---
    const distForTargetWidth = (targetWidth / 2) / Math.tan(fovRadians / 2);

    const verticalFovRadians = 2 * Math.atan(Math.tan(fovRadians / 2) / aspectRatio);
    const targetHeightInView = tableSize.height + (tableSize.height * verticalPlayAreaBuffer);
    const distForTargetHeight = (targetHeightInView / 2) / Math.tan(verticalFovRadians / 2);

    // `cameraZ` must be the largest of these to ensure both dimensions fit
    let cameraZ = Math.max(distForTargetWidth, distForTargetHeight);

    // Apply the device-specific Z buffer
    if (isMobile) {
        cameraZ *= cameraZBufferMobile;
    } else {
        cameraZ *= cameraZBufferDesktop; // Apply desktop specific buffer
    }

    // --- 3. Calculate camera Y position (height above table) ---
    const lookAtY = tableSize.height;

    let cameraY;
    if (isMobile) {
        cameraY = lookAtY + (cameraZ * cameraYFactorMobile);
    } else {
        cameraY = lookAtY + (cameraZ * cameraYFactorDesktop);
    }

    // --- 4. Set camera position and look-at target ---
    camera.position.set(0, cameraY, cameraZ);
    camera.lookAt(new Vector3(0, lookAtY, 0));

    const debugMessage =
        `📐 Camera adjusted: ` +
        `pos(${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}) ` +
        `FOV: ${camera.fov.toFixed(1)}° ` +
        `Aspect: ${aspectRatio.toFixed(2)} ` +
        `Device: ${isMobile ? 'Mobile' : 'Desktop'}` +
        ` | Debug Params: fovMP=${fovDegreesMobilePortrait}, fovML=${fovDegreesMobileLandscape}, fovD=${fovDegreesDesktop}, ` +
        `zBufM=${cameraZBufferMobile}, zBufD=${cameraZBufferDesktop}, yBuf=${verticalPlayAreaBuffer}, yFacM=${cameraYFactorMobile}, yFacD=${cameraYFactorDesktop}`;
};