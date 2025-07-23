const RESET_COLOR = '#444';

let activeIndicatorTimeouts = [];


export const turnRedFirstIndicator = () => {
    const indicatorsContainer = document.getElementById('indicators');
    const indicators = indicatorsContainer.querySelectorAll('.indicator');
    indicators[0].style.backgroundColor = 'red';
    indicators[1].style.backgroundColor = RESET_COLOR;
    indicators[2].style.backgroundColor = RESET_COLOR;
    indicators[3].style.backgroundColor = RESET_COLOR;
    indicators[4].style.backgroundColor = RESET_COLOR;
}

export const loadingCategoryIndicators = (animationDuration) => {
    const indicatorsContainer = document.getElementById('indicators');
    if (!indicatorsContainer) {
        console.warn('Indicators container not found for loadingCategoryIndicators.');
        return;
    }
    const indicators = indicatorsContainer.querySelectorAll('.indicator');
    const totalIndicators = indicators.length;
    const delayPerIndicator = animationDuration / totalIndicators;

    //console.log('⏳ Starting loading category indicators animation...');

    // Clear any previously active timeouts before starting new ones
    clearLoadingIndicators();

    indicators.forEach(indicator => {
        indicator.style.backgroundColor = RESET_COLOR;
    });

    indicators.forEach((indicator, index) => {
        const timeoutId = setTimeout(() => { // Store the ID
            if (indicator) {
                indicator.style.backgroundColor = 'limegreen';
            }
        }, index * delayPerIndicator);
        activeIndicatorTimeouts.push(timeoutId); // Add the ID to our tracking array
    });
    console.log(activeIndicatorTimeouts);
};

export const clearLoadingIndicators = () => {
    //console.log('🛑 Clearing loading category indicators animation...');
    activeIndicatorTimeouts.forEach(timeoutId => {
        clearTimeout(timeoutId); // Clear each stored timeout
    });
    activeIndicatorTimeouts = []; // Reset the array


    // Optionally, reset all indicators to their default color immediately
    const indicatorsContainer = document.getElementById('indicators');
    if (indicatorsContainer) {
        const indicators = indicatorsContainer.querySelectorAll('.indicator');
        indicators.forEach(indicator => {
            indicator.style.backgroundColor = RESET_COLOR;
        });
    }
};

export const updateIndicators = (currentCategory) => {
    const indicatorsContainer = document.getElementById('indicators');
    if (!indicatorsContainer) {
        console.error('Error: Indicators container not found.');
        return;
    }

    const indicators = indicatorsContainer.querySelectorAll('.indicator');
    const colorMap = {
        '1': 'limegreen',
        '2': 'gold',
        '3': 'red',
        '4': 'dodgerblue'
    };

    // Ensure we have a current category and its code
    if (!currentCategory || !currentCategory.code) {
        console.warn('Cannot update indicators: currentCategory or its code is missing.');
        indicators.forEach(indicator => indicator.style.backgroundColor = RESET_COLOR);
        return;
    }

    const codeString = String(currentCategory.code);

    indicators.forEach((indicator, index) => {
        if (index === 0) {
            // First indicator (data-index="0") is always green
            indicator.style.backgroundColor = 'limegreen';
        } else {
            // Other indicators depend on the code
            const codeDigit = codeString[index - 1];
            const color = colorMap[codeDigit];

            if (color) {
                indicator.style.backgroundColor = color;
            } else {
                console.warn(`Unknown code digit or no mapping for '${codeDigit}' at indicator index ${index}. Setting to default.`);
                indicator.style.backgroundColor = RESET_COLOR
            }
        }
    });

    //console.log('📊 Indicators updated for code:', codeString);
}

export const resetIndicators = () => {
    const indicatorsContainer = document.getElementById('indicators');
    if (indicatorsContainer) {
        const indicators = indicatorsContainer.querySelectorAll('.indicator');
        indicators.forEach(indicator => {
            indicator.style.backgroundColor = RESET_COLOR;
        });
    } else {
        console.warn('Indicators container not found for reset.');
    }
}