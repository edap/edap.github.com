// Wristband configuration module

// Default wristband configuration JSON object
export const defaultWristbandConfig = {
    fabric_width: 255,        // mm
    fabric_height: 15,        // mm
    fabric_printable_height: 12,  // mm
    fabric_padding_left: 20,  // mm
    fabric_visible_width: 155,    // mm
    fabric_padding_right: 70, // mm
    son_padding: 1, // mm - vertical padding between sons and me rectangle
    palette_id: "coral_sunset",    // Default palette
    me:{born_year: 1983,},
    family: {
        son_1: {born_year: 2021, name:"Milo", pattern:"dots"},
        son_2: {born_year: 2024, name:"Nika", pattern:"circle"},
    }
};

// Current configuration (starts with default)
let currentConfig = { ...defaultWristbandConfig };

/**
 * Get the current wristband configuration
 * @returns {Object} Current configuration object
 */
export function getWristbandConfig() {
    return { ...currentConfig };
}

/**
 * Update the wristband configuration
 * @param {Object} newConfig - New configuration values to merge
 */
export function updateWristbandConfig(newConfig) {
    currentConfig = { ...currentConfig, ...newConfig };
    console.log('Updated wristband configuration:', currentConfig);
    return currentConfig;
}
