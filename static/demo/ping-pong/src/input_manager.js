// InputManager.js
import { STATES } from "./constants.js";

export class InputManager {
    constructor(rendererDomElement, gameSceneInstance) {
        this.domElement = rendererDomElement;
        this.game = gameSceneInstance; // Reference to GameScene instance
        this.mobileYOffsetPixels = -40; // Can be a setting

        // Bind all event handlers to this instance
        this.handleMouseMoveOrTouchMove = this.handleMouseMoveOrTouchMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
    }

    initListeners() {
        // Desktop input setup
        this.domElement.addEventListener("mousedown", this.handleMouseDown);
        this.domElement.addEventListener("mousemove", this.handleMouseMoveOrTouchMove);

        // Mobile input setup
        this.domElement.addEventListener("touchstart", this.handleTouchStart, { passive: false });
        this.domElement.addEventListener("touchmove", this.handleMouseMoveOrTouchMove, { passive: false });

        // Fallback: Force remove any blocking overlays after 5 seconds
        setTimeout(() => { // Use arrow function to preserve 'this'
            let audioOverlay = document.getElementById('audio-unlock-overlay');
            if (audioOverlay) {
                console.log('MOBILE FIX: Force removing stuck audio overlay');
                audioOverlay.remove();
            }
        }, 5000);
    }

    removeListeners() {
        this.domElement.removeEventListener("mousedown", this.handleMouseDown);
        this.domElement.removeEventListener("mousemove", this.handleMouseMoveOrTouchMove);
        this.domElement.removeEventListener("touchstart", this.handleTouchStart);
        this.domElement.removeEventListener("touchmove", this.handleMouseMoveOrTouchMove);
    }

    handleMouseMoveOrTouchMove(ev) {
        if (ev.type.startsWith('touch')) {
            ev.preventDefault();
        }

        if (ev.targetTouches && ev.targetTouches.length > 1) {
            if (this.game.state === STATES.SERVING) { // Access state from game instance
                this.game.serve(); // Call serve method on game instance
            }
            return;
        }

        let x = ev.targetTouches ? ev.targetTouches[0].clientX : ev.clientX;
        let y = ev.targetTouches ? ev.targetTouches[0].clientY : ev.clientY;

        // Scale input coordinates based on canvas rendered size ---
        const canvasWidth = this.domElement.width;
        const canvasHeight = this.domElement.height;

        const clientRect = this.domElement.getBoundingClientRect();

        // Calculate the scale factor between the CSS display size and the internal rendering size
        const scaleX = canvasWidth / clientRect.width;
        const scaleY = canvasHeight / clientRect.height;

        // Adjust coordinates based on the canvas's position and scale
        // First, normalize to the canvas's display area (0 to clientRect.width/height)
        let scaledX = (x - clientRect.left) * scaleX;
        let scaledY = (y - clientRect.top) * scaleY;

        // Add a y-offset for mobile if needed
        // This offset is now applied relative to the scaled coordinates.
        if (ev.type.startsWith('touch')) {
            scaledY += this.mobileYOffsetPixels;
        }

        this.game.processInput(scaledX, scaledY); // Call processInput on game instance
    }

    handleMouseDown(ev) {
        if (this.game.state === STATES.SERVING) {
            try {
                this.game.serve();
            } catch (error) {
                console.warn('Desktop Serve error:', error);
                this.game.fallbackServe();
            }
        }
    }

    handleTouchStart(ev) {
        console.log('MOBILE TOUCH: touchstart event fired, state:', this.game.state, 'touches:', ev.targetTouches.length);
        ev.preventDefault();

        if (this.game.state === STATES.SERVING && ev.targetTouches.length === 1) {
            try {
                console.log('MOBILE TOUCH: attempting to serve (single tap)');
                this.game.serve();
            } catch (error) {
                console.warn('Touch serve error:', error);
                this.game.fallbackServe();
            }
        }
        this.handleMouseMoveOrTouchMove(ev);
    }
}