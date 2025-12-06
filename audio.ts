
const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let audioCtx: AudioContext | null = null;

// Music State
let isMusicPlaying = false;
let nextNoteTime = 0.0;
let current16thNote = 0;
let timerID: number | undefined;

// Constants
const TEMPO = 115;
const LOOKAHEAD = 25.0; // ms
const SCHEDULE_AHEAD_TIME = 0.1; // s

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

export const startBackgroundMusic = () => {
    if (isMusicPlaying) return;
    
    const ctx = ensureAudioContext();
    if (!ctx) return;

    isMusicPlaying = true;
    current16thNote = 0;
    nextNoteTime = ctx.currentTime + 0.1;
    scheduler();
};

export const stopBackgroundMusic = () => {
    isMusicPlaying = false;
    if (timerID) window.clearTimeout(timerID);
};

const scheduler = () => {
    if (!isMusicPlaying) return;

    const ctx = getCtx();
    while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_TIME) {
        scheduleNote(current16thNote, nextNoteTime);
        nextNote();
    }
    timerID = window.setTimeout(scheduler, LOOKAHEAD);
};

const nextNote = () => {
    const secondsPerBeat = 60.0 / TEMPO;
    // We are scheduling 16th notes (4 per beat)
    nextNoteTime += 0.25 * secondsPerBeat; 
    current16thNote++;
    if (current16thNote === 16) {
        current16thNote = 0;
    }
};

const scheduleNote = (beatNumber: number, time: number) => {
    const ctx = getCtx();

    // 1. Driving Kick (Every quarter note)
    if (beatNumber % 4 === 0) {
        playKick(ctx, time);
    }

    // 2. Hi-hats (16th note shuffle)
    // 0, 2, 4... are 8th notes. 
    if (beatNumber % 2 !== 0) {
         playHiHat(ctx, time, 0.04); // Off-beats louder
    } else if (beatNumber % 4 !== 0) {
         playHiHat(ctx, time, 0.015); // 8th note fillers quieter
    }

    // 3. Bass Groove (Cyberpunk-ish)
    // Pattern: 0, 3, 6, 11, 14
    const bassPattern = [0, 3, 6, 11, 14];
    if (bassPattern.includes(beatNumber)) {
        // Simple C Minor pentatonic-ish
        const freqs = [65.41, 77.78, 98.00]; // C2, Eb2, G2
        const freq = freqs[Math.floor(Math.random() * freqs.length)];
        playBass(ctx, time, freq);
    }
};

const playKick = (ctx: AudioContext, time: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + 0.5);
};

const playHiHat = (ctx: AudioContext, time: number, vol: number) => {
    // Create buffer for noise if not exists
    const bufferSize = ctx.sampleRate * 0.1; // 0.1s noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Highpass filter for "Tss" sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(time);
    noise.stop(time + 0.05);
};

const playBass = (ctx: AudioContext, time: number, freq: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    
    // Filter for "Pluck"
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(100, time + 0.2);

    gain.gain.setValueAtTime(0.1, time); // Low volume background
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + 0.3);
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
