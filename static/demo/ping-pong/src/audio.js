/* 
 * Racket Racket Ping Pong Audio System
 * Enhanced for mobile compatibility and Random Mode sounds
 * Copyright (c) 2024 - Based on original PingPongWebGL by MortimerGoro
 */


class AudioManager {
    constructor() {
        this.randomSounds = [];
        this.ballSounds = [];
        this.isUnlocked = false;
        this.volume = 0.7;
        this.lastSoundIndex = -1;
        this.recentSounds = []; // Track recent sounds to avoid repetition
        this.maxRecentSounds = 5;

        // Feedback tracking
        this.soundFeedback = {};
        this.playCount = 0;
        this.sessionStartTime = Date.now();
    }

    init(settings) {
        this.loadRandomSounds();
        this.loadBallSounds(settings);
        this.setupMobileAudioUnlock();
        this.initFeedbackTracking();
    }

    loadRandomSounds() {
        // Load all 46 Random Mode sounds from the copied files
        const soundFiles = [
            '0.wav', '1.wav', '2.wav', '3.wav', '4.wav', '5.wav', '6.wav', '7.wav', '8.wav', '9.wav',
            '10.wav', '11.wav', '12.wav', '13.wav', '14.wav', '15.wav', '16.wav', '17.wav', '18.wav', '19.wav',
            '20.wav', '55.wav', '69.wav', '76.wav', '87.wav', '99.wav', '108.wav', '124.wav', '132.wav',
            '141.wav', '149.wav', '155.wav', '164.wav', '170.wav', '177.wav', '184.wav', '193.wav', '199.wav',
            '206.wav', '220.wav', '229.wav', '236.wav', '249.wav', '257.wav', '268.wav', '279.wav'
        ];

        for (let i = 0; i < soundFiles.length; i++) {
            const audio = new Audio();
            audio.src = 'audio/' + soundFiles[i];
            audio.preload = 'auto';
            audio.volume = this.volume;

            // Add error handling
            audio.addEventListener('error', function (e) {
                console.warn('Failed to load random sound:', soundFiles[i]);
            });

            this.randomSounds.push(audio);
        }

        console.log('Loaded', this.randomSounds.length, 'Random Mode sounds');
    }

    loadBallSounds(settings) {
        // Use dedicated bounce sounds from user's bounces folder
        const ballSoundFiles = ['1.wav', '2.wav', '3.wav', '4.wav', '5.wav'];

        for (let i = 0; i < ballSoundFiles.length; i++) {
            const audio = new Audio();
            audio.src = './audio/bounces/' + ballSoundFiles[i]; // Use relative path with ./
            audio.preload = 'auto';
            audio.volume = this.volume * 0.4; // Quieter than racket sounds

            audio.addEventListener('error', function (e) {
                console.warn('Failed to load bounce sound:', ballSoundFiles[i], 'Error:', e);
                console.warn('Attempted path:', audio.src);
            });

            audio.addEventListener('canplaythrough', function () {
                console.log('Successfully loaded bounce sound:', ballSoundFiles[i]);
            });

            this.ballSounds.push(audio);
        }

        console.log('Loading', ballSoundFiles.length, 'dedicated bounce sounds for ball hits');
    }

    setupMobileAudioUnlock() {
        // Create unlock UI overlay
        this.createAudioUnlockUI();

        // Audio unlock events
        const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'mouseup', 'click'];
        const unlockAudio = () => {
            console.log('MOBILE AUDIO: Unlock function called, isUnlocked:', this.isUnlocked);
            if (this.isUnlocked) return;

            // Play a silent sound to unlock audio context AND unlock all loaded sounds
            const silentAudio = new Audio();
            silentAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAbBjOH0fPTgjF+';
            silentAudio.volume = 0.01;

            // COMPLETELY SILENT unlock - just unlock context, don't play any files
            silentAudio.play().then(() => {
                // Simple approach: just unlock the audio context with the silent audio
                // Don't play any actual game sounds during unlock
                console.log('MOBILE AUDIO: Silent audio played successfully, context unlocked');
                if (PingPong.MobileDebug) {
                    PingPong.MobileDebug.log('Audio context unlocked silently for mobile device');
                }
            }).catch(() => {
                // Even simpler fallback - just mark as unlocked
                console.log('MOBILE AUDIO: Silent audio failed, using fallback unlock');
                if (PingPong.MobileDebug) {
                    PingPong.MobileDebug.log('Audio unlock fallback - context may need manual unlock');
                }
            });

            this.isUnlocked = true;
            console.log('MOBILE AUDIO: Setting isUnlocked to true and hiding UI');
            this.hideAudioUnlockUI();

            // Remove event listeners
            unlockEvents.forEach(event => {
                document.removeEventListener(event, unlockAudio, true);
            });
            console.log('MOBILE AUDIO: Event listeners removed');
        };

        // Add listeners for all possible unlock events
        unlockEvents.forEach(event => {
            document.addEventListener(event, unlockAudio, true);
        });
    }

    createAudioUnlockUI() {
        // Only show on mobile devices
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (!isMobile) {
            this.isUnlocked = true;
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = 'audio-unlock-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
            color: white;
            text-align: center;
        `;

        const button = document.createElement('button');
        button.textContent = '🔊 TAP TO ENABLE SOUND';
        button.style.cssText = `
            padding: 20px 40px;
            font-size: 18px;
            background: #ff6b35;
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
        `;

        // Ensure button click works on mobile
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            console.log('MOBILE AUDIO: Button touch event triggered');
            // The unlockAudio function will be triggered by the document listener
        });

        button.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('MOBILE AUDIO: Button click event triggered');
        });

        overlay.appendChild(button);
        document.body.appendChild(overlay);
        console.log('MOBILE AUDIO: Audio unlock overlay created and added to DOM');
    }

    hideAudioUnlockUI() {
        const overlay = document.getElementById('audio-unlock-overlay');
        if (overlay) {
            console.log('MOBILE AUDIO: Hiding audio unlock overlay');
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.remove();
                    console.log('MOBILE AUDIO: Audio unlock overlay removed from DOM');
                }
            }, 300);
        }
    }

    initFeedbackTracking() {
        // Initialize feedback tracking for sounds
        this.soundFeedback = JSON.parse(localStorage.getItem('racketSoundFeedback') || '{}');
    }

    saveFeedbackData() {
        localStorage.setItem('racketSoundFeedback', JSON.stringify(this.soundFeedback));
    }

    playRandomSound(volume) {
        if (!this.isUnlocked || this.randomSounds.length === 0) {
            console.log('AUDIO: Cannot play - unlocked:', this.isUnlocked, 'sounds loaded:', this.randomSounds.length);
            this.showAudioFeedback('❌ Audio not ready');
            return;
        }

        volume = volume !== undefined ? volume : this.volume;

        // Select a sound that wasn't played recently
        let attempts = 0;
        let selectedIndex;

        do {
            selectedIndex = Math.floor(Math.random() * this.randomSounds.length);
            attempts++;
        } while (this.recentSounds.includes(selectedIndex) && attempts < 10);

        // Update recent sounds tracking
        this.recentSounds.push(selectedIndex);
        if (this.recentSounds.length > this.maxRecentSounds) {
            this.recentSounds.shift();
        }

        // Play the selected sound
        const selectedSound = this.randomSounds[selectedIndex];
        selectedSound.volume = volume;
        selectedSound.currentTime = 0; // Reset to beginning

        const playPromise = selectedSound.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('✅ AUDIO: Successfully played sound', selectedIndex);
                this.showAudioFeedback('🔊 Sound #' + selectedIndex);
            }).catch(error => {
                console.warn('❌ AUDIO: Play failed for sound', selectedIndex, ':', error);
                this.showAudioFeedback('❌ Audio failed - upload files to server');
            });
        }

        // Track usage
        this.playCount++;
        this.lastSoundIndex = selectedIndex;

        // Track feedback data
        if (!this.soundFeedback[selectedIndex]) {
            this.soundFeedback[selectedIndex] = { plays: 0, likes: 0, dislikes: 0 };
        }
        this.soundFeedback[selectedIndex].plays++;

        return selectedIndex; // Return for potential feedback UI
    }

    showAudioFeedback(message) {
        // Show brief visual feedback for audio status
        let feedbackDiv = document.getElementById('audio-feedback');
        if (!feedbackDiv) {
            feedbackDiv = document.createElement('div');
            feedbackDiv.id = 'audio-feedback';
            feedbackDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 5px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                z-index: 9999;
                transition: opacity 0.3s ease;
                pointer-events: none;
            `;
            document.body.appendChild(feedbackDiv);
        }

        feedbackDiv.textContent = message;
        feedbackDiv.style.opacity = '1';

        // Auto-hide after 2 seconds
        clearTimeout(this.feedbackTimeout);
        this.feedbackTimeout = setTimeout(() => {
            feedbackDiv.style.opacity = '0';
        }, 2000);
    }

    playBallSound(volume) {
        if (!this.isUnlocked || this.ballSounds.length === 0) {
            console.log('BALL AUDIO: Cannot play - unlocked:', this.isUnlocked, 'ball sounds loaded:', this.ballSounds.length);
            return;
        }

        volume = volume !== undefined ? volume : this.volume * 0.6;

        const randomIndex = Math.floor(Math.random() * this.ballSounds.length);
        const selectedSound = this.ballSounds[randomIndex];
        selectedSound.volume = volume;
        selectedSound.currentTime = 0;

        const playPromise = selectedSound.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('✅ BALL AUDIO: Successfully played bounce sound', randomIndex);
            }).catch(error => {
                console.warn('❌ BALL AUDIO: Play failed:', error);
                this.showAudioFeedback('❌ Ball sounds failed - upload files');
            });
        }
    }

    // Legacy method name for compatibility
    playPaddleSound(volume) {
        return this.playRandomSound(volume);
    }

    // Feedback methods for future UI integration
    likSound(soundIndex) {
        if (soundIndex !== undefined && this.soundFeedback[soundIndex]) {
            this.soundFeedback[soundIndex].likes++;
            this.saveFeedbackData();
        }
    }

    dislikeSound(soundIndex) {
        if (soundIndex !== undefined && this.soundFeedback[soundIndex]) {
            this.soundFeedback[soundIndex].dislikes++;
            this.saveFeedbackData();
        }
    }

    getSessionStats() {
        return {
            soundsPlayed: this.playCount,
            sessionLength: Date.now() - this.sessionStartTime,
            totalSoundsAvailable: this.randomSounds.length,
            feedbackData: this.soundFeedback
        };
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));

        // Update all loaded sounds
        this.randomSounds.forEach(sound => {
            sound.volume = this.volume;
        });

        this.ballSounds.forEach(sound => {
            sound.volume = this.volume * 0.6;
        });
    }
}

// TODO Initialize audio
// Global instance
//PingPong.Audio = new PingPong.AudioManager();
export default AudioManager;