
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
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            // Phone ring pattern
            // High-Low tone
            const now = this.audioCtx.currentTime;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(480, now + 0.4);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0, now + 1.5);

            osc.start(now);
            osc.stop(now + 1.5);
        };

        playTone();
        this.ringInterval = setInterval(playTone, 2000);
    }

    stopRing() {
        if (this.ringInterval) {
            clearInterval(this.ringInterval);
            this.ringInterval = null;
        }
    }
}

export const soundManager = new SoundManager();
