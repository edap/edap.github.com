import { updateWristbandConfig } from '../wristbandConfig.js';
import { drawWristband } from '../wristbandRenderer.js';
import { DEFAULT_SCALE } from '../index.js';

export const updateEndQualityLifeIfNeeded = (newExpectedLife, endQualityLifeSlider, endQualityLifeValue) => {
    if (endQualityLifeSlider) {
        const currentEndQualityLife = parseInt(endQualityLifeSlider.value);
        if (parseInt(currentEndQualityLife) > newExpectedLife - 1) {
            endQualityLifeSlider.value = newExpectedLife - 1;
            endQualityLifeValue.textContent = endQualityLifeSlider.value;
            updateWristbandConfig({ end_quality_life: parseInt(endQualityLifeSlider.value) });
        }
    }
};

export const updateExpectedLifeIfNeeded = (newEndQualityLife, expectedLifeSlider, expectedLifeValue) => {
    if (expectedLifeSlider) {
        const currentExpectedLife = parseInt(expectedLifeSlider.value);
        if (parseInt(currentExpectedLife) < newEndQualityLife + 1) {
            expectedLifeSlider.value = newEndQualityLife + 1;
            expectedLifeValue.textContent = expectedLifeSlider.value;
            updateWristbandConfig({ expected_life: parseInt(expectedLifeSlider.value) });
        }
    }
};

export const updateExpectedLifeValue = (expectedLifeSlider, expectedLifeValue, endQualityLifeSlider, endQualityLifeValue) => {
    console.log('updateExpectedLifeValue called');
    const newExpectedLife = parseInt(expectedLifeSlider.value);
    if (expectedLifeValue) {
        expectedLifeValue.textContent = newExpectedLife;
    }

    updateEndQualityLifeIfNeeded(newExpectedLife, endQualityLifeSlider, endQualityLifeValue);
    
    updateWristbandConfig({ expected_life: newExpectedLife });
    drawWristband(DEFAULT_SCALE);
};

export const updateEndQualityLifeValue = (endQualityLifeSlider, endQualityLifeValue, expectedLifeSlider, expectedLifeValue) => {
    const newEndQualityLife = parseInt(endQualityLifeSlider.value);
    if (endQualityLifeValue) {
        endQualityLifeValue.textContent = newEndQualityLife;
    }
    updateExpectedLifeIfNeeded(newEndQualityLife, expectedLifeSlider, expectedLifeValue);

    updateWristbandConfig({ end_quality_life: newEndQualityLife });
    drawWristband(DEFAULT_SCALE);
};
