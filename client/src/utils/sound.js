
class SoundManager {
    constructor() {
        this.audioCtx = null;
        this.oscillator = null;
        this.gainNode = null;
        this.ringInterval = null;
    }

    init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    playNotification() {
        this.init();
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(500, this.audioCtx.currentTime); // Beep
        gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);

        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.5);
        oscillator.stop(this.audioCtx.currentTime + 0.5);
    }

    playRing() {
        this.init();
        if (this.ringInterval) return; // Already ringing

        const playTone = () => {
            // Stop any currently playing tone to avoid overlap (start fresh)
            this.stopActiveTone();

            this.oscillator = this.audioCtx.createOscillator();
            this.gainNode = this.audioCtx.createGain();

            this.oscillator.connect(this.gainNode);
            this.gainNode.connect(this.audioCtx.destination);

            // Phone ring pattern
            // High-Low tone
            const now = this.audioCtx.currentTime;

            this.oscillator.type = 'triangle';
            this.oscillator.frequency.setValueAtTime(440, now);
            this.oscillator.frequency.setValueAtTime(480, now + 0.4);

            this.gainNode.gain.setValueAtTime(0.2, now);
            this.gainNode.gain.linearRampToValueAtTime(0, now + 1.5);

            this.oscillator.start(now);
            this.oscillator.stop(now + 1.5);

            // Cleanup references when done naturally
            this.oscillator.onended = () => {
                // Only nullify if these are still the active ones (not replaced by new ones)
                // This checks identity strictly effectively by closure? No, checking 'this.oscillator' vs local 'osc' is better?
                // Actually we don't strictly need to nullify if we always create new ones in playTone.
                // But it's good practice.
            };
        };

        playTone();
        this.ringInterval = setInterval(playTone, 2000);
    }

    // Helper to cut the sound immediately
    stopActiveTone() {
        if (this.oscillator) {
            try {
                this.oscillator.stop();
                this.oscillator.disconnect();
            } catch (e) { }
            this.oscillator = null;
        }
        if (this.gainNode) {
            try { this.gainNode.disconnect(); } catch (e) { }
            this.gainNode = null;
        }
    }

    stopRing() {
        if (this.ringInterval) {
            clearInterval(this.ringInterval);
            this.ringInterval = null;
        }
        this.stopActiveTone();
    }
}

export const soundManager = new SoundManager();
