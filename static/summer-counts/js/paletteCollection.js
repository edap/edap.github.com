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
        partner_color: "#2E8B57",   // Sea green (complementary to coral, distinct from sons)
        focus_color: "#1E3A5F",     // Dark blue-gray (high contrast with light beige, complementary to coral)
        son_1_color: "#BAF5D9",     // Light mint
        son_2_color: "#F3E16B",     // Light yellow
        son_3_color: "#E6B8FF",     // Light purple (complementary to coral)
        son_4_color: "#FFB347",     // Light orange (warm complement to coral)
        son_1_pattern: "dots",
        son_2_pattern: "circle",
        son_3_pattern: "fill"
    },
    
    ocean_depths: {
        name: "Ocean Depths",
        bg_color: "#EEEEEE",        // Light gray
        me_color: "#1E517B",        // Dark blue
        partner_color: "#8B4513",   // Saddle brown (warm earth tone, distinct from cool blues)
        focus_color: "#0A1F3A",     // Very dark blue (high contrast with light gray, complements ocean theme)
        son_1_color: "#FD9B7B",     // Coral
        son_2_color: "#7DFEE3",     // Light turquoise
        son_3_color: "#FFE4B5",     // Light peach (warm complement to cool blues)
        son_4_color: "#B19CD9",     // Light lavender (complementary to ocean blue)
        son_1_pattern: "circle",
        son_2_pattern: "dots",
        son_3_pattern: "fill"
    },
    
    lavender_dreams: {
        name: "Lavender Dreams",
        bg_color: "#FFE2C4",        // Cream peach
        me_color: "#9588E8",        // Soft lavender
        partner_color: "#D2691E",   // Chocolate (warm earth tone, distinct from cool purples)
        focus_color: "#4A2C5F",     // Dark purple (high contrast with cream, complements lavender theme)
        son_1_color: "#F375F9",     // Bright pink
        son_2_color: "#A6C3ED",     // Light blue
        son_3_color: "#98FB98",     // Light green (complementary to purple)
        son_4_color: "#FFD700",     // Gold (warm complement to cool lavender)
        son_1_pattern: "dots",
        son_2_pattern: "circle",
        son_3_pattern: "fill"
    },
    
    earthy_warmth: {
        name: "Earthy Warmth",
        bg_color: "#F49A5F",        // Light orange
        me_color: "#EE6C3C",        // Vibrant orange
        partner_color: "#4B0082",   // Indigo (complementary to orange, distinct from sons)
        focus_color: "#2D1B3D",     // Dark indigo-purple (high contrast with light orange, complementary)
        son_1_color: "#87CEEB",     // Sky blue
        son_2_color: "#FFD700",     // Gold yellow
        son_3_color: "#DDA0DD",     // Plum (complementary to orange)
        son_4_color: "#90EE90",     // Light green (fresh complement to warm earth tones)
        son_1_pattern: "circle",
        son_2_pattern: "dots",
        son_3_pattern: "fill"
    },
    
    mint_fresh: {
        name: "Mint Fresh",
        bg_color: "#FFB5B5",        // Light pink
        me_color: "#F10479",        // Bright fuchsia
        partner_color: "#228B22",   // Forest green (complementary to fuchsia, distinct from sons)
        focus_color: "#0D4A0D",      // Dark forest green (high contrast with light pink, complementary to fuchsia)
        son_1_color: "#E9F9FF",     // Very light blue
        son_2_color: "#90EE90",     // Light green
        son_3_color: "#FFE4B5",     // Light peach (complementary to fuchsia)
        son_4_color: "#FFB6C1",     // Light pink (soft complement to bright fuchsia)
        son_1_pattern: "dots",
        son_2_pattern: "circle",
        son_3_pattern: "fill"
    },
    
    sage_garden: {
        name: "Sage Garden",
        bg_color: "#F0EAD6",        // Light khaki
        me_color: "#6B8E23",        // Olive drab
        partner_color: "#8B0000",   // Dark red (complementary to green, distinct from sons)
        focus_color: "#5C1A1A",     // Dark burgundy (high contrast with light khaki, complements sage green)
        son_1_color: "#8FBC8F",     // Dark sea green
        son_2_color: "#DDA0DD",     // Plum
        son_3_color: "#FFB6C1",     // Light pink (complementary to green)
        son_4_color: "#F0E68C",     // Khaki (earth tone complement to sage green)
        son_1_pattern: "circle",
        son_2_pattern: "dots",
        son_3_pattern: "fill"
    },
    
    spring_bloom: {
        name: "Spring Bloom",
        bg_color: "#F0EFFE",        // Grayish white
        me_color: "#98DBC6",        // Aquamarine
        partner_color: "#5BC8AC",    // Turquoise (distinct from me)
        focus_color: "#2D5A4A",      // Dark teal (high contrast with light background, complements aquamarine)
        son_1_color: "#E6D72A",     // Canary yellow
        son_2_color: "#F18D9E",     // Pink tulip
        son_3_color: "#FFE4B5",     // Light peach (complementary to aqua)
        son_4_color: "#E6B8FF",     // Light purple (complementary to aquamarine)
        son_1_pattern: "circle",
        son_2_pattern: "dots",
        son_3_pattern: "fill"
    },
    
    coastal_breeze: {
        name: "Coastal Breeze",
        bg_color: "#F0EFFE",        // Light neutral
        me_color: "#20948B",        // Sea teal
        partner_color: "#DE7A22",   // Burnt orange (complementary to teal)
        focus_color: "#0F4A47",     // Dark sea green (high contrast with light background, complements teal)
        son_1_color: "#F4CC70",     // Sandstone yellow
        son_2_color: "#6AB187",     // Lagoon green
        son_3_color: "#FFB6C1",     // Light pink (complementary to teal)
        son_4_color: "#DDA0DD",     // Plum (complementary to sea teal)
        son_1_pattern: "dots",
        son_2_pattern: "circle",
        son_3_pattern: "fill"
    },
    
    alpine_lake: {
        name: "Alpine Lake",
        bg_color: "#F0EFFE",        // Light neutral
        me_color: "#4CB5F5",        // Blue sky
        partner_color: "#34675C",   // Pine green (complementary to blue)
        focus_color: "#1A3A5C",      // Dark alpine blue (high contrast with light background, complements sky blue)
        son_1_color: "#B3C100",     // Fields yellow-green
        son_2_color: "#B7B8B6",    // Granite gray (lightened)
        son_3_color: "#FFD700",     // Gold (complementary to blue)
        son_4_color: "#FFB6C1",     // Light pink (soft complement to alpine blue)
        son_1_pattern: "circle",
        son_2_pattern: "dots",
        son_3_pattern: "fill"
    },
    
    autumn_forest: {
        name: "Autumn Forest",
        bg_color: "#F0EFFE",        // Light neutral
        me_color: "#8D230F",        // Crimson red
        partner_color: "#1E434C",   // Forest teal (complementary to red)
        focus_color: "#4A0F0F",      // Dark crimson (high contrast with light background, complements red)
        son_1_color: "#C99E10",     // Gold yellow
        son_2_color: "#9B4F0F",     // Rust orange (lightened)
        son_3_color: "#E6B8FF",     // Light purple (complementary to red)
        son_4_color: "#98FB98",     // Light green (complementary to crimson)
        son_1_pattern: "dots",
        son_2_pattern: "circle",
        son_3_pattern: "fill"
    },
    
    tropical_vibes: {
        name: "Tropical Vibes",
        bg_color: "#F0EFFE",        // Light neutral
        me_color: "#4897D8",        // Electric blue
        partner_color: "#FA6E59",   // Watermelon red (complementary to blue)
        focus_color: "#1E4A6B",      // Dark tropical blue (high contrast with light background, complements electric blue)
        son_1_color: "#FFDB5C",     // Banana yellow
        son_2_color: "#F8A055",     // Canteloupe orange
        son_3_color: "#98FB98",     // Light green (complementary to blue)
        son_4_color: "#FFB6C1",     // Light pink (tropical complement to electric blue)
        son_1_pattern: "circle",
        son_2_pattern: "dots",
        son_3_pattern: "fill"
    },
    
    apple_orchard: {
        name: "Apple Orchard",
        bg_color: "#F0EFFE",        // Light neutral
        me_color: "#E73F0B",        // Ripe apple red
        partner_color: "#BBCF4A",   // Granny smith green (complementary to red)
        focus_color: "#8B1A0B",     // Dark apple red (high contrast with light background, complements red)
        son_1_color: "#F4EC6A",     // Golden delicious yellow
        son_2_color: "#A11F0C",     // Red delicious (lightened)
        son_3_color: "#E6B8FF",     // Light purple (complementary to red)
        son_4_color: "#87CEEB",     // Sky blue (complementary to apple red)
        son_1_pattern: "dots",
        son_2_pattern: "circle",
        son_3_pattern: "fill"
    },
    
    mediterranean_sun: {
        name: "Mediterranean Sun",
        bg_color: "#F0EFFE",        // Light neutral
        me_color: "#D24136",        // Terracotta red
        partner_color: "#785A46",   // Stone brown (complementary to terracotta)
        focus_color: "#5C1F1A",     // Dark terracotta (high contrast with light background, complements terracotta)
        son_1_color: "#EB8A3E",     // Honey orange
        son_2_color: "#EBB582",     // Biscotti beige
        son_3_color: "#B0E0E6",     // Light blue (complementary to orange)
        son_4_color: "#DDA0DD",     // Plum (complementary to terracotta)
        son_1_pattern: "circle",
        son_2_pattern: "dots",
        son_3_pattern: "fill"
    },
    
    urban_energy: {
        name: "Urban Energy",
        bg_color: "#F0EFFE",        // Light neutral
        me_color: "#008DCB",        // Blue raspberry
        partner_color: "#E1315B",   // Fuschia (complementary to blue)
        focus_color: "#003D5C",      // Dark electric blue (high contrast with light background, complements blue raspberry)
        son_1_color: "#FFEC5C",     // Lemon drop yellow
        son_2_color: "#F47D4A",     // Orange (lightened)
        son_3_color: "#98FB98",     // Light green (complementary to blue)
        son_4_color: "#E6B8FF",     // Light purple (complementary to blue raspberry)
        son_1_pattern: "dots",
        son_2_pattern: "circle",
        son_3_pattern: "fill"
    },
    
    golden_gate: {
        name: "Golden Gate",
        bg_color: "#F0EFFE",        // Light neutral
        me_color: "#16253D",        // Midnight blue
        partner_color: "#EFB509",   // Golden (complementary to blue)
        focus_color: "#0A1526",      // Very dark navy (high contrast with light background, complements midnight blue)
        son_1_color: "#002C54",     // Dusk blue (lightened)
        son_2_color: "#CD7213",     // Bronze (lightened)
        son_3_color: "#FFB6C1",     // Light pink (complementary to blue)
        son_4_color: "#98FB98",     // Light green (complementary to midnight blue)
        son_1_pattern: "circle",
        son_2_pattern: "dots",
        son_3_pattern: "fill"
    },
    
    street_lights: {
        name: "Street Lights",
        bg_color: "#F0EFFE",        // Light neutral
        me_color: "#0205A9",        // Blue (very dark, will need light text)
        partner_color: "#00CFFA",   // Cyan (bright, distinct from black)
        focus_color: "#FFFFFF",      // White (high contrast with dark blue me_color, visible on dark background)
        son_1_color: "#FF0038",     // Magenta (lightened)
        son_2_color: "#FFCE38",     // Yellow
        son_3_color: "#E6B8FF",     // Light purple (complementary to yellow)
        son_4_color: "#90EE90",     // Light green (complementary to dark blue)
        son_1_pattern: "dots",
        son_2_pattern: "circle",
        son_3_pattern: "fill"
    },
    
    bicycle_wings: {
        name: "Bicycle Wings",
        bg_color: "#F0EFFE",        // Grayish white (from image)
        me_color: "#31A2AC",        // Turquoise
        partner_color: "#AF1C1C",   // Lipstick red (complementary to turquoise)
        focus_color: "#1A5A5F",      // Dark turquoise (high contrast with light background, complements turquoise)
        son_1_color: "#FFD700",     // Gold (complementary to turquoise)
        son_2_color: "#98FB98",     // Light green (complementary to red)
        son_3_color: "#FFB6C1",     // Light pink (complementary to turquoise)
        son_4_color: "#E6B8FF",     // Light purple (complementary to turquoise)
        son_1_pattern: "circle",
        son_2_pattern: "dots",
        son_3_pattern: "fill"
    },
    
    basketball_court: {
        name: "Basketball Court",
        bg_color: "#D5C9B1",        // Oatmeal (from image)
        me_color: "#5F968E",       // Blue green
        partner_color: "#E05858",   // Faded red (complementary to blue-green)
        focus_color: "#2F4A47",      // Dark blue-green (high contrast with oatmeal, complements blue-green)
        son_1_color: "#BFDCCF",    // Minty (from image)
        son_2_color: "#FFD700",     // Gold (complementary to blue-green)
        son_3_color: "#FFB6C1",    // Light pink (complementary to blue-green)
        son_4_color: "#E6B8FF",    // Light purple (complementary to blue-green)
        son_1_pattern: "dots",
        son_2_pattern: "circle",
        son_3_pattern: "fill"
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
        son_3_a16_color: darkenColor(basePalette.son_3_color, 25),
        son_4_a16_color: darkenColor(basePalette.son_4_color, 25),
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
