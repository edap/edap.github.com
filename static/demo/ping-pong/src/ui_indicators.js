export const turnRedFirstIndicator = () => {
    const indicatorsContainer = document.getElementById('indicators');
    const indicators = indicatorsContainer.querySelectorAll('.indicator');
    indicators[0].style.backgroundColor = 'red'; 
}


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
        indicators.forEach(indicator => indicator.style.backgroundColor = '#444');
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
                indicator.style.backgroundColor = '#444'
            }
        }
    });

    console.log('📊 Indicators updated for code:', codeString);
}

export const resetIndicators = () => {
    const indicatorsContainer = document.getElementById('indicators');
    if (indicatorsContainer) {
        const indicators = indicatorsContainer.querySelectorAll('.indicator');
        indicators.forEach(indicator => {
            indicator.style.backgroundColor = '#444';
        });
    } else {
        console.warn('Indicators container not found for reset.');
    }
}