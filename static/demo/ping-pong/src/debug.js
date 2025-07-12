/* 
 * Mobile Debug Console for Racket Racket Ping Pong
 * Displays console messages on-screen for mobile debugging
 * Copyright (c) 2024
 */


class MobileDebug {
    constructor() {
        this.enabled = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.container = null;
        this.logs = [];
        this.maxLogs = 15;
        this.isVisible = false;
    }


    init() {
        this.createDebugConsole();
        this.addToggleButton();

        // Log initial status
        this.log('🚀 Racket Racket Debug Console Active');
        this.log('📱 Device: ' + (this.enabled ? 'Mobile' : 'Desktop'));
        this.log('🖥️ Screen: ' + window.innerWidth + 'x' + window.innerHeight);
        this.log('🎮 WebGL: ' + (this.checkWebGL() ? '✅ Supported' : '❌ Not Supported'));
        this.log('🔊 Audio Context: ' + (this.checkAudioContext() ? '✅' : '❌'));
        this.log('📐 Device Pixel Ratio: ' + window.devicePixelRatio);
    }

    createDebugConsole() {
        this.container = document.createElement('div');
        this.container.id = 'mobile-debug-console';
        this.container.style.cssText = `
            position: fixed;
            top: 50px;
            left: 10px;
            right: 10px;
            max-height: 250px;
            background: rgba(0, 0, 0, 0.95);
            color: #00ff88;
            font-family: 'Courier New', monospace;
            font-size: 10px;
            padding: 8px;
            border-radius: 8px;
            z-index: 9999;
            overflow-y: auto;
            display: none;
            border: 2px solid #00ff88;
            box-shadow: 0 4px 20px rgba(0,255,136,0.3);
            backdrop-filter: blur(5px);
        `;

        document.body.appendChild(this.container);
    }

    addToggleButton() {
        const button = document.createElement('button');
        button.textContent = '🐛';
        button.id = 'debug-toggle-btn';
        button.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 35px;
            height: 35px;
            background: rgba(255, 107, 53, 0.9);
            color: white;
            border: none;
            border-radius: 18px;
            font-size: 14px;
            z-index: 10000;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(255,107,53,0.4);
            touch-action: manipulation;
        `;

        button.addEventListener('click', () => {
            this.toggle();
        });

        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggle();
        });

        document.body.appendChild(button);
    }

    toggle() {
        if (!this.container) return;

        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'block' : 'none';

        if (this.isVisible) {
            this.log('👁️ Debug console opened');
        }
    }

    log(message, type = 'log') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️';
        const logEntry = `[${timestamp}] ${prefix} ${message}`;

        this.logs.push(logEntry);

        // Keep only recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        this.updateDisplay();

        // Also log to regular console
        const originalConsole = window.originalConsole || console;
        originalConsole[type](message);
    }

    error(message) {
        this.log(message, 'error');
    }

    warn(message) {
        this.log(message, 'warn');
    }

    updateDisplay() {
        if (!this.container) return;

        this.container.innerHTML = this.logs.join('<br>');
        this.container.scrollTop = this.container.scrollHeight;
    }

    checkWebGL() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                this.log(`🎨 WebGL Renderer: ${gl.getParameter(gl.RENDERER)}`);
                this.log(`🏭 WebGL Vendor: ${gl.getParameter(gl.VENDOR)}`);
                return true;
            }
            return false;
        } catch (e) {
            this.error(`WebGL Check Failed: ${e.message}`);
            return false;
        }
    }

    checkAudioContext() {
        try {
            return !!(window.AudioContext || window.webkitAudioContext);
        } catch (e) {
            return false;
        }
    }

    // Game-specific logging methods
    logGameState(state, details) {
        this.log(`🎮 Game: ${state}${details ? ' - ' + details : ''}`);
    }

    logAudioState(unlocked, soundsLoaded) {
        this.log(`🔊 Audio: ${unlocked ? '✅ Unlocked' : '🔒 Locked'} Sounds: ${soundsLoaded}`);
    }

    logCameraState(position, target) {
        if (position && target) {
            this.log(`📷 Camera: [${position.x.toFixed(1)} ${position.y.toFixed(1)} ${position.z.toFixed(1)}] → [${target.x.toFixed(1)} ${target.y.toFixed(1)} ${target.z.toFixed(1)}]`);
        }
    }

    logLoadingProgress(item, loaded, total) {
        this.log(`⏳ Loading: ${item} (${loaded}/${total})`);
    }

    logPerformance(fps, renderTime) {
        if (fps < 30) {
            this.warn(`🐌 Low FPS: ${fps.toFixed(1)} (${renderTime.toFixed(1)}ms)`);
        } else {
            this.log(`⚡ Performance: ${fps.toFixed(1)}fps (${renderTime.toFixed(1)}ms)`);
        }
    }
};

export default MobileDebug;

// TODO initialization

// Auto-initialize when DOM is ready
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', function() {
//         PingPong.MobileDebug.init();
//     });
// } else {
//     PingPong.MobileDebug.init();
// }