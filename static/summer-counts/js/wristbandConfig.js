export const defaultWristbandConfig = {
    fabric_width: 210,
    fabric_height: 15,  
    fabric_printable_height: 12,    
    fabric_padding_left: 20,    
    fabric_visible_width: 155,  
    fabric_padding_right: 70,   
    son_padding: 1, 
    draw_counter: true,
    draw_partner: false,
    font: "Verdana, Geneva, sans-serif",
    pattern: "line",
    palette_id: "coral_sunset",
    me:{born_year: 1983, met_partner_year: 2010},
    partner:{born_year: 1983},
    age_holyday_alone: 16,
    expected_life: 100,
    end_quality_life: 60,
    family: {
        partner:{born_year: 1983},
        son_1: {born_year: 2021, name:"Milo", pattern:"dots"},
        son_2: {born_year: 2024, name:"Nika", pattern:"circle"},
    }
};

let currentConfig = { ...defaultWristbandConfig };

export function getWristbandConfig() {
    return { ...currentConfig };
}

export function updateWristbandConfig(newConfig) {
    currentConfig = { ...currentConfig, ...newConfig };
    return currentConfig;
}
