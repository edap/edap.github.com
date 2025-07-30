import { loadCategorySounds } from "./utils/loaders.js";
import GameScene from "./engine/game_scene.js";
import { getRandomCategory } from "./utils/scene_utils.js"
import { turnRedFirstIndicator, updateIndicators, resetIndicators, loadingCategoryIndicators, clearLoadingIndicators } from "./ui/ui_indicators.js"
import { showCategoryName, resetCategoryName, updateShowCategoryUI } from "./ui/ui_category.js";
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

        modeSelectButton.addEventListener('pointerdown', this.handlePressStart.bind(this));
        modeSelectButton.addEventListener('pointerup', this.handlePressEnd.bind(this));
        modeSelectButton.addEventListener('pointerleave', this.handlePressCancel.bind(this));
        modeSelectButton.addEventListener('pointercancel', this.handlePressCancel.bind(this));
    }

    handlePressStart() {
        this.resetCategory();
        if (this.pressTimer) {
            clearTimeout(this.pressTimer);
            this.pressTimer = null;
        }
        this.pressStartTime = Date.now();

        this.pressTimer = setTimeout(() => {
            console.log('Button held for 0.4 seconds - starting long press sound...');
            if (this.longPressSound) {
                this.longPressSound.play().catch(e => console.warn('Error playing long press sound:', e));
            }
            loadingCategoryIndicators(PANEL_ANIMATION_DURATION);

            this.pressTimer = setTimeout(() => {
                console.log('Button held for 2 seconds - stopping sound and calling getRandomCategory.');
                if (this.longPressSound) {
                    this.longPressSound.pause();
                    this.longPressSound.currentTime = 0;
                }
                const category = getRandomCategory(this.categories)
                if (category) {
                    console.log('✨ Very Long Press: New Random Category:', category);
                    this.selectedCategory = category;
                    updateIndicators(category);
                    showCategoryName(category);
                    updateShowCategoryUI(`Category: ${category.category}`);
                    loadCategorySounds(category.key, category.sounds)
                    .then(loadedSoundsArray => {
                        console.log('Loaded Audio Elements:', loadedSoundsArray);
                        this.gameScene.updateCategorySounds(loadedSoundsArray);
                        this.gameScene.simulation.audio.playRandomSound();
                    })
                    .catch(error => {
                        console.error('❌ Failed to load category sounds:', error);
                    });
                }
                this.pressTimer = null;
            }, PANEL_ANIMATION_DURATION);
        }, PANEL_ANIMATION_DELAY);
    }

    handlePressEnd() {
        const pressDuration = Date.now() - this.pressStartTime;

        if (this.pressTimer) {
            clearTimeout(this.pressTimer);
            this.pressTimer = null;
        }

        if (this.longPressSound && !this.longPressSound.paused) {
            this.longPressSound.pause();
            this.longPressSound.currentTime = 0;
        }

        if (pressDuration < 400) {
            this.selectedCategory = null;
            clearLoadingIndicators();
            turnRedFirstIndicator();
            updateShowCategoryUI("Random Mode")
        } else if (pressDuration >= 400 && pressDuration < 2000) {
            clearLoadingIndicators();
            turnRedFirstIndicator();
            updateShowCategoryUI("Random Mode")
            this.selectedCategory = null;
        }

        this.togglePanelDelayed();
    }

    handlePressCancel() {
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