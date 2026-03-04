import { getWristbandConfig, updateWristbandConfig } from '../wristbandConfig.js';
import { drawWristband } from '../wristbandRenderer.js';

export const DEFAULT_SCALE = 1.1;

export const MAX_CHILDREN = 4;
export const MIN_CHILDREN = 0;
const MAX_CHILDREN_WITH_PARTNER = 3;

let childrenCount = 0;

function getEffectiveMaxChildren() {
    const config = getWristbandConfig();
    return config.draw_partner ? MAX_CHILDREN_WITH_PARTNER : MAX_CHILDREN;
}


export function initializeChildrenManagement() {
    const config = getWristbandConfig();
    const family = config.family;
    const childrenListElement = document.getElementById('children-list');
    
    if (childrenListElement) {
        const childForms = childrenListElement.querySelectorAll('.child-form');
        childForms.forEach(form => form.remove());
    }
    childrenCount = 0;

    const defaultPattern = config.pattern || 'line';
    Object.keys(family)
        .filter(childKey => childKey.startsWith('son_'))
        .forEach(childKey => {
            const child = family[childKey];
            addChild(child.born_year, child.name, child.pattern || defaultPattern);
        });
    
    updateChildrenControls();
    updateRemoveButtonsVisibility();
    updatePartnerCheckboxState();
}

export function addChild(bornYear = null, name = '', pattern = null) {
    if (pattern === null) {
        const config = getWristbandConfig();
        pattern = config.pattern || 'line';
    }
    const effectiveMax = getEffectiveMaxChildren();
    if (childrenCount >= effectiveMax) {
        alert(`Maximum ${effectiveMax} children allowed${getWristbandConfig().draw_partner ? ' when partner is shown' : ''}`);
        return;
    }

    childrenCount++;
    const childIndex = childrenCount;

    const childForm = document.createElement('div');
    childForm.className = 'child-form';
    childForm.innerHTML = `
        <h4>Child ${childIndex}</h4>
        <div class="form-group">
            <label for="child-${childIndex}-born-year">Born Year:</label>
            <select id="child-${childIndex}-born-year" name="child-${childIndex}-born-year">
                <!-- Options will be populated by JavaScript -->
            </select>
        </div>
        <div class="form-group">
            <label for="child-${childIndex}-name">Name:</label>
            <input type="text" id="child-${childIndex}-name" name="child-${childIndex}-name" value="${name}" placeholder="Enter child's name">
        </div>
        <button type="button" class="child-remove-btn" data-child-index="${childIndex}">Remove Child</button>
    `;
    
    const childrenListElement = document.getElementById('children-list');
    if (childrenListElement) {

        const addButton = childrenListElement.querySelector('#add-child-button');
        if (addButton) {
            childrenListElement.insertBefore(childForm, addButton);
        } else {
            childrenListElement.appendChild(childForm);
        }
    }

    const bornYearSelect = document.getElementById(`child-${childIndex}-born-year`);
    if (bornYearSelect) {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 100;
        
        for (let year = currentYear; year >= startYear; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (bornYear && year === bornYear) {
                option.selected = true;
            }
            bornYearSelect.appendChild(option);
        }
    }

    addChildEventListeners(childIndex);

    updateChildrenControls();
    updateRemoveButtonsVisibility();
    updatePartnerCheckboxState();
    updateFamilyConfig();
}

export function removeSpecificChild(childIndex) {
    if (childrenCount < MIN_CHILDREN) {
        alert(`Minimum ${MIN_CHILDREN} child required`);
        return;
    }

    const childForm = document.querySelector(`[data-child-index="${childIndex}"]`)?.closest('.child-form');
    if (childForm) {
        childForm.remove();
        childrenCount--;

        renumberChildren();
        updateChildrenControls();
        updateRemoveButtonsVisibility();
        updatePartnerCheckboxState();
        updateFamilyConfig();
    }
}

function addChildEventListeners(childIndex) {
    const bornYearSelect = document.getElementById(`child-${childIndex}-born-year`);
    const nameInput = document.getElementById(`child-${childIndex}-name`);
    const removeButton = document.querySelector(`[data-child-index="${childIndex}"]`);
    
    if (bornYearSelect) {
        bornYearSelect.addEventListener('change', updateFamilyConfig);
    }
    
    if (nameInput) {
        nameInput.addEventListener('input', updateFamilyConfig);
    }
    
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            removeSpecificChild(childIndex);
        });
    }
}


function renumberChildren() {
    const childrenListElement = document.getElementById('children-list');
    if (!childrenListElement) return;
    
    const childForms = childrenListElement.querySelectorAll('.child-form');
    childForms.forEach((form, index) => {
        const newIndex = index + 1;
        const title = form.querySelector('h4');
        if (title) title.textContent = `Child ${newIndex}`;

        const removeButton = form.querySelector('.child-remove-btn');
        if (removeButton) {
            removeButton.setAttribute('data-child-index', newIndex);
        }

        const bornYearSelect = form.querySelector('select[id*="born-year"]');
        const nameInput = form.querySelector('input[id*="name"]');
        
        if (bornYearSelect) {
            bornYearSelect.id = `child-${newIndex}-born-year`;
            bornYearSelect.name = `child-${newIndex}-born-year`;
        }
        if (nameInput) {
            nameInput.id = `child-${newIndex}-name`;
            nameInput.name = `child-${newIndex}-name`;
        }

        const labels = form.querySelectorAll('label');
        labels.forEach(label => {
            const forAttr = label.getAttribute('for');
            if (forAttr) {
                const fieldType = forAttr.split('-').pop();
                label.setAttribute('for', `child-${newIndex}-${fieldType}`);
            }
        });

        addChildEventListeners(newIndex);
    });
}

export function updateChildrenControls() {
    const addButton = document.getElementById('add-child-button');
    const effectiveMax = getEffectiveMaxChildren();
    
    if (addButton) {
        if (childrenCount >= effectiveMax) {
            addButton.style.display = 'none';
        } else {
            addButton.style.display = 'inline-block';
        }
    }

    const config = getWristbandConfig();
    if (config.draw_partner && childrenCount > MAX_CHILDREN_WITH_PARTNER) {
        const childForms = document.querySelectorAll('.child-form');
        if (childForms.length > 0) {
            const lastChildForm = childForms[childForms.length - 1];
            const removeButton = lastChildForm.querySelector('.child-remove-btn');
            if (removeButton) {
                const childIndex = parseInt(removeButton.getAttribute('data-child-index'));
                removeSpecificChild(childIndex);
            }
        }
    }
}

export function updateRemoveButtonsVisibility() {
    const removeButtons = document.querySelectorAll('.child-remove-btn');
    
    removeButtons.forEach(button => {
        if (childrenCount <= MIN_CHILDREN) {
            button.style.display = 'none';
        } else {
            button.style.display = 'inline-block';
        }
    });
}

export function updatePartnerCheckboxState() {
    const showPartnerCheckbox = document.getElementById('show-partner-checkbox');
    if (showPartnerCheckbox) {
        if (childrenCount >= MAX_CHILDREN) {
            showPartnerCheckbox.disabled = true;
            showPartnerCheckbox.checked = false;
            updateWristbandConfig({ draw_partner: false });
            drawWristband(DEFAULT_SCALE);
        } else {
            showPartnerCheckbox.disabled = false;
        }
    }
    updateChildrenControls();
}

export function updateFamilyConfig() {
    const family = {};
    
    const config = getWristbandConfig();
    const defaultPattern = config.pattern;

    if (config.family && config.family.partner) {
        family.partner = config.family.partner;
    }

    for (let i = 1; i <= childrenCount; i++) {
        const bornYearSelect = document.getElementById(`child-${i}-born-year`);
        const nameInput = document.getElementById(`child-${i}-name`);
        
        if (bornYearSelect && nameInput) {
            family[`son_${i}`] = {
                born_year: parseInt(bornYearSelect.value),
                name: nameInput.value || `Child ${i}`,
                pattern: defaultPattern
            };
        }
    }
    
    updateWristbandConfig({ family });
    drawWristband(DEFAULT_SCALE);
}
