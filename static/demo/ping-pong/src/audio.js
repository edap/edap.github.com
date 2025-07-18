class AudioManager {
    constructor() {
        this.randomSounds = [];
        this.ballSounds = [];
        this.categorySounds = [];
        this.isUnlocked = false;
        this.volume = 0.7;
        this.lastSoundIndex = -1;
        this.recentSounds = [];
        this.maxRecentSounds = 5;

        // Feedback tracking
        this.soundFeedback = {};
        this.playCount = 0;
        this.sessionStartTime = Date.now();
    }

    init(settings, randomSounds, ballSounds) {
        this.randomSounds = randomSounds;
        this.ballSounds = ballSounds;
        this.setupMobileAudioUnlock();
        this.initFeedbackTracking();
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
            }).catch(() => {
                // Even simpler fallback - just mark as unlocked
                console.log('MOBILE AUDIO: Silent audio failed, using fallback unlock');
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
            //this.showAudioFeedback('❌ Audio not ready');
            return;
        }

        volume = volume !== undefined ? volume : this.volume;

        // Play from RND folder or play randomly from the category sounds?
        // it depends wheter categorySounds is set or not

        const playRandomlyFromCategory = this.categorySounds.length !== 0;
        let selectedIndex = this.getSoundNotPlayedRecently(playRandomlyFromCategory);

        let selectedSound;
        if (playRandomlyFromCategory) {
            selectedSound = this.categorySounds[selectedIndex];
        } else {
            selectedSound = this.randomSounds[selectedIndex];
        }

        // Play the selected sound
        selectedSound.volume = volume;
        selectedSound.currentTime = 0; // Reset to beginning
        selectedSound.play();

        // Track usage
        this.playCount++;
        this.lastSoundIndex = selectedIndex;

        // Track feedback data
        if (!this.soundFeedback[selectedIndex]) {
            this.soundFeedback[selectedIndex] = { plays: 0, likes: 0, dislikes: 0 };
        }
        this.soundFeedback[selectedIndex].plays++;

        return selectedIndex;
    }

    getSoundNotPlayedRecently(fromCategoryFolder) {
        // Select a sound that wasn't played recently
        let attempts = 0;
        //let selectedIndex;
        let selectedIndex = 0;
        let limitAttempts;
        if (fromCategoryFolder) {
            limitAttempts = 2;
            do {
                selectedIndex = Math.floor(Math.random() * this.categorySounds.length);
                attempts++;
            } while (this.categorySounds.includes(selectedIndex) && attempts < limitAttempts);
        } else {
            limitAttempts = 10;
            do {
                selectedIndex = Math.floor(Math.random() * this.randomSounds.length);
                attempts++;
            } while (this.recentSounds.includes(selectedIndex) && attempts < limitAttempts);
        }



        // Update recent sounds tracking
        this.recentSounds.push(selectedIndex);
        if (this.recentSounds.length > this.maxRecentSounds) {
            this.recentSounds.shift();
        }
        return selectedIndex;
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
                //this.showAudioFeedback('❌ Ball sounds failed - upload files');
            });
        }
    }

    // Legacy method name for compatibility
    playPaddleSound(volume) {
        return this.playRandomSound(volume);
    }

    setCategorySounds(catSounds) {
        this.categorySounds = catSounds;
        this.recentSounds = [];
    }
}

export default AudioManager;