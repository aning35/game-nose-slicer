
const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let audioCtx: AudioContext | null = null;

const getCtx = () => {
    if (!audioCtx) {
        audioCtx = new AudioContextClass();
    }
    return audioCtx;
};

export const ensureAudioContext = () => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') {
        ctx.resume().catch(e => console.error("Audio resume failed", e));
    }
    return ctx;
};

export const playSliceSound = () => {
    try {
        const ctx = ensureAudioContext();
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // High pitch swipe
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.2);
    } catch (e) {
        // Ignore audio errors
    }
};

export const playBombSound = () => {
    try {
        const ctx = ensureAudioContext();
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Low rumble explosion
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(10, t + 0.4);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.5);
    } catch (e) { }
};

export const playStartSound = () => {
    try {
        const ctx = ensureAudioContext();
        const t = ctx.currentTime;
        
        // Positive major arpeggio
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.1, t + 0.1 + (i * 0.05));
            gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(t);
            osc.stop(t + 1.0);
        });
    } catch (e) { }
};

export const playGameOverSound = () => {
     try {
        const ctx = ensureAudioContext();
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Sad slide down
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.linearRampToValueAtTime(50, t + 1);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0, t + 1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 1.1);
     } catch (e) { }
};
