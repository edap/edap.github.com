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

    clearLoadingIndicators();

    indicators.forEach(indicator => {
        indicator.style.backgroundColor = RESET_COLOR;
    });

    indicators.forEach((indicator, index) => {
        const timeoutId = setTimeout(() => {
            if (indicator) {
                indicator.style.backgroundColor = 'limegreen';
            }
        }, index * delayPerIndicator);
        activeIndicatorTimeouts.push(timeoutId);
    });
    console.log(activeIndicatorTimeouts);
};

export const clearLoadingIndicators = () => {
    activeIndicatorTimeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
    });
    activeIndicatorTimeouts = [];


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

    if (!currentCategory || !currentCategory.code) {
        console.warn('Cannot update indicators: currentCategory or its code is missing.');
        indicators.forEach(indicator => indicator.style.backgroundColor = RESET_COLOR);
        return;
    }

    const codeString = String(currentCategory.code);

    indicators.forEach((indicator, index) => {
        if (index === 0) {
            indicator.style.backgroundColor = 'limegreen';
        } else {
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