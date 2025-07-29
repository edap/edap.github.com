import { loadCategorySounds, loadRandomSounds } from "./loaders.js";
import GameScene from "./game_scene.js";
import { getRandomCategory } from "./utils.js"
import { turnRedFirstIndicator, updateIndicators, resetIndicators, loadingCategoryIndicators, clearLoadingIndicators } from "./ui_indicators.js"
import { showCategoryName, resetCategoryName, updateShowCategoryUI } from "./ui_category.js";
import { PANEL_ANIMATION_DELAY, PANEL_ANIMATION_DURATION, PANEL_CLOSE_DELAY } from "./constants.js";

class GamePanel {
    constructor() {
        this.container = null;
        this.volume = 1.0;
        this.isVisible = false;
        this.pressTimer = null;
        this.pressStartTime = 0;
        this.longPressSound = null;
        this.gameScene = null;
        this.categories = null;
        this.selectedCategory = null;

        this.getAudioPanel();
        this.addPanelToggleButton();
        this.addModeSelectButtonListener();
    }

    init(categories, longPressSound, randomSounds, ballSounds, renderer, settings, glbModel) {
        this.longPressSound = longPressSound;
        this.gameScene = new GameScene(renderer, settings);
        this.gameScene.init(randomSounds, ballSounds, glbModel);
        this.categories = categories;
    }

    addPanelToggleButton() {
        const button = document.getElementById("audio-panel-toggle-btn");
        if (!button) {
            console.warn('Toggle button #audio-panel-toggle-btn not found. Panel will not be togglable.');
            return;
        }

        button.addEventListener('click', (e) => {
            if (e.pointerType === 'touch' && !this.touchStarted) return;
            this.toggle();
            this.touchStarted = false;
        });

        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchStarted = true;
            this.toggle();
        }, { passive: false });
    }


    getAudioPanel() {
        this.container = document.getElementById("controlPanel");
        if (!this.container) {
            console.error('Error: #controlPanel not found. AudioPanel cannot function.');
        }
    }


    toggle() {
        if (!this.container) return;
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        this.isVisible = !this.isVisible;
        if (this.isVisible) {
            this.container.classList.add('is-visible');
        } else {
            this.container.classList.remove('is-visible');
            if (this.longPressSound && !this.longPressSound.paused) {
                this.longPressSound.pause();
                this.longPressSound.currentTime = 0;
            }
        }
    }

    addModeSelectButtonListener() {
        const modeSelectButton = document.getElementById("modeSelectButton");
        if (!modeSelectButton) {
            console.error('Error: #modeSelectButton not found. Mode selection will not work.');
            return;
        }

        // Use Pointer Events for better cross-device compatibility (handles mouse and touch)
        // Alternative: Use mouseup/mousedown + touchend/touchstart if pointer events are problematic
        modeSelectButton.addEventListener('pointerdown', this.handlePressStart.bind(this));
        modeSelectButton.addEventListener('pointerup', this.handlePressEnd.bind(this));
        modeSelectButton.addEventListener('pointerleave', this.handlePressCancel.bind(this));
        modeSelectButton.addEventListener('pointercancel', this.handlePressCancel.bind(this));
    }

    handlePressStart() {
        this.resetCategory();
        // Clear any existing timer to prevent multiple triggers if button is rapidly pressed
        if (this.pressTimer) {
            clearTimeout(this.pressTimer);
            this.pressTimer = null;
        }
        this.pressStartTime = Date.now();

        // Set timer for 0.4 seconds (long press trigger)
        this.pressTimer = setTimeout(() => {
            // This code runs if the button is held for at least 0.4 seconds
            console.log('Button held for 0.4 seconds - starting long press sound...');
            if (this.longPressSound) {
                this.longPressSound.play().catch(e => console.warn('Error playing long press sound:', e));
            }
            loadingCategoryIndicators(PANEL_ANIMATION_DURATION);

            // Set another timer for 2 seconds (very long press trigger)
            this.pressTimer = setTimeout(() => {
                // This code runs if the button is held for 2 seconds or more
                console.log('Button held for 2 seconds - stopping sound and calling getRandomCategory.');
                if (this.longPressSound) {
                    this.longPressSound.pause();
                    this.longPressSound.currentTime = 0; // Reset sound to beginning
                }
                const category = getRandomCategory(this.categories)
                if (category) {
                    console.log('✨ Very Long Press: New Random Category:', category);
                    this.selectedCategory = category;
                    // Load category sounds
                    updateIndicators(category);
                    showCategoryName(category);
                    updateShowCategoryUI(`Category: ${category.category}`);
                    loadCategorySounds(category.key, category.sounds)
                    .then(loadedSoundsArray => {
                        // This block runs ONLY if loadCategorySounds successfully loads the sounds
                        console.log('Loaded Audio Elements:', loadedSoundsArray);
                        this.gameScene.updateCategorySounds(loadedSoundsArray);
                        this.gameScene.simulation.audio.playRandomSound();
                    })
                    .catch(error => {
                        console.error('❌ Failed to load category sounds:', error);
                    });
                }
                this.pressTimer = null; // Clear timer as action is complete
            }, PANEL_ANIMATION_DURATION); // 2000ms (2s) - 400ms (0.4s initial delay) = 1600ms
        }, PANEL_ANIMATION_DELAY); // 0.4 seconds
    }

    handlePressEnd() {
        const pressDuration = Date.now() - this.pressStartTime;

        // Clear the timer immediately on release
        if (this.pressTimer) {
            clearTimeout(this.pressTimer);
            this.pressTimer = null;
        }

        if (this.longPressSound && !this.longPressSound.paused) {
            this.longPressSound.pause();
            this.longPressSound.currentTime = 0;
        }

        if (pressDuration < 400) {
            // Short press (less than 0.4 seconds)
            //console.log('Short press (less than 0.4s) - calling loadRandomSounds.');
            this.selectedCategory = null;
            clearLoadingIndicators();
            turnRedFirstIndicator();
            updateShowCategoryUI("Random Mode")
        } else if (pressDuration >= 400 && pressDuration < 2000) {
            // Medium press (between 0.4 and 2 seconds)
            //console.log('Medium press (0.4s to 2s) - calling loadRandomSounds.');
            clearLoadingIndicators();
            turnRedFirstIndicator();
            updateShowCategoryUI("Random Mode")
            this.selectedCategory = null;
        }

        this.togglePanelDelayed();
        // If pressDuration is >= 2000, the 2-second timer would have already fired
    }

    handlePressCancel() {
        // This handles cases where the pointer (mouse or finger) leaves the button while pressed
        //console.log('Press cancelled (pointer left button).');
        if (this.pressTimer) {
            clearTimeout(this.pressTimer);
            this.pressTimer = null;
        }
        if (this.longPressSound && !this.longPressSound.paused) {
            this.longPressSound.pause();
            this.longPressSound.currentTime = 0;
        }
    }

    resetCategory() {
        console.log('🔄 Resetting category and indicators...');
        this.selectedCategory = null;
        resetCategoryName();
        resetIndicators();
    }


    togglePanelDelayed(delay = PANEL_CLOSE_DELAY) {
        setTimeout(() => {
            this.toggle();
        }, delay);
    }
}

export default GamePanel;