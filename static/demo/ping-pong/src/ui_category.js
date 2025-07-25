/**
 * Gets the .category-title DOM element.
 * @returns {HTMLElement | null} The category title element, or null if not found.
 */
function getCategoryTitleElement() {
    // Assuming #controlPanel exists when this function is called in context
    const controlPanel = document.getElementById("controlPanel");
    if (controlPanel) {
        const element = controlPanel.querySelector('.category-title');
        if (!element) {
            console.warn('Warning: .category-title element not found inside #controlPanel.');
        }
        return element;
    } else {
        console.warn('Warning: Cannot get category title element, #controlPanel not found.');
        return null;
    }
}

/**
 * Displays the name of the chosen category in the .category-title div.
 * @param {object | null} category The category object, or null to clear the text.
 * Expected to have a 'category' property (e.g., { category: "Yodel" }).
 */
export function showCategoryName(category) {
    const categoryTitleElement = getCategoryTitleElement();
    if (!categoryTitleElement) {
        // Warning already logged by getCategoryTitleElement
        return;
    }

    if (category && category.category) {
        categoryTitleElement.textContent = category.category;
        console.log(`Category name displayed: ${category.category}`);
    } else {
        categoryTitleElement.textContent = ''; // Clear the text if no category or category name
        console.log('Category name cleared.');
    }
}


export function resetCategoryName() {
    showCategoryName(null);
    console.log('Category title content cleared by resetCategoryName.');
}

export function updateShowCategoryUI(text) {
    const showCategoryDiv = document.querySelector('.show-category');
    if (showCategoryDiv) { 
        showCategoryDiv.textContent = text;
    } else {
        console.warn('Warning: .show-category element not found.');
    }
}