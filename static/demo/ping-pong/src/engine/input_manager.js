// InputManager.js
import { STATES } from "../constants.js";

export class InputManager {
    constructor(rendererDomElement, gameSceneInstance) {
        this.domElement = rendererDomElement;
        this.game = gameSceneInstance;
        this.mobileYOffsetPixels = -40;

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

        setTimeout(() => {
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
            if (this.game.state === STATES.SERVING) {
                this.game.serve();
            }
            return;
        }

        let x = ev.targetTouches ? ev.targetTouches[0].clientX : ev.clientX;
        let y = ev.targetTouches ? ev.targetTouches[0].clientY : ev.clientY;

        this.game.processInput(x, y);
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