// Palette collection for wristband design tool

// Helper function to darken a hex color by a percentage
function darkenColor(hex, percent) {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// Helper function to get contrasting text color (white or black)
function getContrastTextColor(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

// Base palettes with only 4 colors each
const basePalettes = {
    coral_sunset: {
        name: "Coral Sunset",
        bg_color: "#F7EFE8",        // Light beige
        me_color: "#FC6454",        // Coral
        son_1_color: "#BAF5D9",     // Light mint
        son_2_color: "#F3E16B",     // Light yellow
        son_1_pattern: "dots",
        son_2_pattern: "circle"
    },
    
    ocean_depths: {
        name: "Ocean Depths",
        bg_color: "#EEEEEE",        // Light gray
        me_color: "#1E517B",        // Dark blue
        son_1_color: "#FD9B7B",     // Coral
        son_2_color: "#7DFEE3",     // Light turquoise
        son_1_pattern: "circle",
        son_2_pattern: "dots"
    },
    
    lavender_dreams: {
        name: "Lavender Dreams",
        bg_color: "#FFE2C4",        // Cream peach
        me_color: "#9588E8",        // Soft lavender
        son_1_color: "#F375F9",     // Bright pink
        son_2_color: "#A6C3ED",     // Light blue
        son_1_pattern: "dots",
        son_2_pattern: "circle"
    },
    
    earthy_warmth: {
        name: "Earthy Warmth",
        bg_color: "#F49A5F",        // Light orange
        me_color: "#EE6C3C",        // Vibrant orange
        son_1_color: "#87CEEB",     // Sky blue
        son_2_color: "#FFD700",     // Gold yellow
        son_1_pattern: "circle",
        son_2_pattern: "dots"
    },
    
    mint_fresh: {
        name: "Mint Fresh",
        bg_color: "#FFB5B5",        // Light pink
        me_color: "#F10479",        // Bright fuchsia
        son_1_color: "#E9F9FF",     // Very light blue
        son_2_color: "#90EE90",     // Light green
        son_1_pattern: "dots",
        son_2_pattern: "circle"
    },
    
    sage_garden: {
        name: "Sage Garden",
        bg_color: "#F0EAD6",        // Light khaki
        me_color: "#6B8E23",        // Olive drab
        son_1_color: "#8FBC8F",     // Dark sea green
        son_2_color: "#DDA0DD",     // Plum
        son_1_pattern: "circle",
        son_2_pattern: "dots"
    }
};

// Generate full palettes with derived colors
export const paletteCollection = {};

for (const [id, basePalette] of Object.entries(basePalettes)) {
    paletteCollection[id] = {
        ...basePalette,
        me_old_color: darkenColor(basePalette.me_color, 25),
        son_1_a16_color: darkenColor(basePalette.son_1_color, 25),
        son_2_a16_color: darkenColor(basePalette.son_2_color, 25),
        text_color: getContrastTextColor(basePalette.me_color)
    };
}

/**
 * Get a specific palette by ID
 * @param {string} paletteId - The palette identifier
 * @returns {Object|null} The palette object or null if not found
 */
export function getPalette(paletteId) {
    return paletteCollection[paletteId] || null;
}

/**
 * Get all available palettes
 * @returns {Object} All palettes
 */
export function getAllPalettes() {
    return paletteCollection;
}

/**
 * Get palette names for dropdown options
 * @returns {Array} Array of {value, text} objects
 */
export function getPaletteOptions() {
    return Object.entries(paletteCollection).map(([id, palette]) => ({
        value: id,
        text: palette.name
    }));
}
