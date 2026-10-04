// Web Audio API procedural sound engine for "Bullshit: El Juego de la Mentira"
// Implements zero-dependency, zero-latency TV game show sound effects and transitions

export type TransitionType =
  | 'question_start'
  | 'defense_phase'
  | 'voting_start'
  | 'reveal'
  | 'game_over';

class SoundFX {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  public enabled: boolean = true;
  private volume: number = 0.85;

  public initCtx() {
    if (typeof window === 'undefined') return;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.setupAudioGraph();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private setupAudioGraph() {
    if (!this.ctx) return;
    try {
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(20, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime);

      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // Audio graph setup fallback
    }
  }

  private getDestination(): AudioNode | null {
    this.initCtx();
    if (!this.ctx) return null;
    return this.compressor || this.masterGain || this.ctx.destination;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(enabled ? this.volume : 0, this.ctx.currentTime);
    }
    if (enabled && this.audienceActive && !this.audienceSourceNode) {
      this.startAudienceAmbient();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && this.enabled) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  // --- STUDIO AUDIENCE AMBIENT TRACK ---
  private audienceSourceNode: AudioBufferSourceNode | null = null;
  private audienceGainNode: GainNode | null = null;
  private audienceBuffer: AudioBuffer | null = null;
  public audienceActive: boolean = false;

  private createAudienceBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (this.audienceBuffer) return this.audienceBuffer;

    try {
      const sampleRate = this.ctx.sampleRate;
      const durationSeconds = 6;
      const length = Math.floor(sampleRate * durationSeconds);
      const buffer = this.ctx.createBuffer(2, length, sampleRate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);

      let b0_L = 0, b1_L = 0, b2_L = 0;
      let b0_R = 0, b1_R = 0, b2_R = 0;

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;

        // Dynamic crowd energy wave (breathing, soft murmurs, room presence)
        const crowdModL = 0.55 + 0.25 * Math.sin(2 * Math.PI * 0.21 * t) + 0.2 * Math.sin(2 * Math.PI * 0.43 * t + 0.5);
        const crowdModR = 0.55 + 0.25 * Math.sin(2 * Math.PI * 0.17 * t + 1.2) + 0.2 * Math.sin(2 * Math.PI * 0.39 * t);

        // Low frequency TV studio room air circulation (55Hz & 110Hz soft hum)
        const roomAir = 0.07 * Math.sin(2 * Math.PI * 55 * t) + 0.035 * Math.sin(2 * Math.PI * 110 * t);

        // Filtered pink-like noise for warm acoustic presence
        const whiteL = Math.random() * 2 - 1;
        const whiteR = Math.random() * 2 - 1;

        b0_L = 0.99 * b0_L + whiteL * 0.045;
        b1_L = 0.95 * b1_L + whiteL * 0.075;
        b2_L = 0.85 * b2_L + whiteL * 0.11;
        const pinkL = (b0_L + b1_L + b2_L) * 0.4;

        b0_R = 0.99 * b0_R + whiteR * 0.045;
        b1_R = 0.95 * b1_R + whiteR * 0.075;
        b2_R = 0.85 * b2_R + whiteR * 0.11;
        const pinkR = (b0_R + b1_R + b2_R) * 0.4;

        let sL = (pinkL * crowdModL + roomAir) * 0.35;
        let sR = (pinkR * crowdModR + roomAir) * 0.35;

        // Smooth cross-fade window at loop seams to avoid clicks
        const fadeLen = Math.floor(sampleRate * 0.25);
        if (i < fadeLen) {
          const fade = i / fadeLen;
          const factor = Math.sin((fade * Math.PI) / 2);
          sL *= factor;
          sR *= factor;
        } else if (i > length - fadeLen) {
          const fade = (length - i) / fadeLen;
          const factor = Math.sin((fade * Math.PI) / 2);
          sL *= factor;
          sR *= factor;
        }

        left[i] = sL;
        right[i] = sR;
      }

      this.audienceBuffer = buffer;
      return buffer;
    } catch {
      return null;
    }
  }

  // Starts the continuous, low-volume 'studio audience' ambient track
  public startAudienceAmbient(targetVolume: number = 0.065) {
    this.audienceActive = true;
    if (!this.enabled) return;

    try {
      this.initCtx();
      if (!this.ctx) return;
      const dest = this.getDestination();
      if (!dest) return;

      // If already playing, ensure volume is smoothly maintained
      if (this.audienceSourceNode && this.audienceGainNode) {
        const now = this.ctx.currentTime;
        this.audienceGainNode.gain.cancelScheduledValues(now);
        this.audienceGainNode.gain.linearRampToValueAtTime(targetVolume, now + 1.2);
        return;
      }

      const buffer = this.createAudienceBuffer();
      if (!buffer) return;

      const now = this.ctx.currentTime;
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Warm lowpass filter so audience murmurs sit comfortably underneath game speech
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(0.9, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(targetVolume, now + 1.8);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      source.start(now);

      this.audienceSourceNode = source;
      this.audienceGainNode = gain;
    } catch {
      // Ambient audio setup fallback
    }
  }

  // Smoothly fades out and stops the studio audience ambient track
  public stopAudienceAmbient(fadeDurationSeconds: number = 1.0) {
    this.audienceActive = false;
    if (!this.audienceGainNode || !this.ctx) {
      this.cleanupAudienceNodes();
      return;
    }

    try {
      const now = this.ctx.currentTime;
      this.audienceGainNode.gain.cancelScheduledValues(now);
      this.audienceGainNode.gain.setValueAtTime(this.audienceGainNode.gain.value, now);
      this.audienceGainNode.gain.linearRampToValueAtTime(0.0001, now + fadeDurationSeconds);

      const oldSource = this.audienceSourceNode;
      const oldGain = this.audienceGainNode;
      this.audienceSourceNode = null;
      this.audienceGainNode = null;

      setTimeout(() => {
        try {
          if (oldSource) {
            oldSource.stop();
            oldSource.disconnect();
          }
          if (oldGain) {
            oldGain.disconnect();
          }
        } catch {}
      }, (fadeDurationSeconds + 0.1) * 1000);
    } catch {
      this.cleanupAudienceNodes();
    }
  }

  private cleanupAudienceNodes() {
    try {
      if (this.audienceSourceNode) {
        this.audienceSourceNode.stop();
        this.audienceSourceNode.disconnect();
      }
      if (this.audienceGainNode) {
        this.audienceGainNode.disconnect();
      }
    } catch {}
    this.audienceSourceNode = null;
    this.audienceGainNode = null;
  }

  // --- TACTILE & UI SOUNDS ---

  // Tactile button click
  playClick() {
    if (!this.enabled) return;
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  // Subtle blip when a player vote is registered
  playVoteRegistered() {
    if (!this.enabled) return;
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  // Ticking countdown clock (supports normal tick or urgent high-tempo tick)
  playTick(urgent: boolean = false) {
    if (!this.enabled) return;
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = urgent ? 'sawtooth' : 'sine';
      const startFreq = urgent ? 950 : 700;
      const endFreq = urgent ? 420 : 350;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.06);

      gain.gain.setValueAtTime(urgent ? 0.28 : 0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  // --- BULLSHIT & VOTE SOUNDS ---

  // Harsh, punchy Game Show Big Buzzer for Bullshit!
  playBullshitBuzzer() {
    if (!this.enabled) return;
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;

      // Two rapid harsh buzzer bursts
      [0, 0.22].forEach((offset) => {
        if (!this.ctx || !dest) return;
        const burstTime = now + offset;

        // Sub bass thump for physical impact
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(110, burstTime);
        subOsc.frequency.exponentialRampToValueAtTime(45, burstTime + 0.18);
        subGain.gain.setValueAtTime(0.35, burstTime);
        subGain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.18);
        subOsc.connect(subGain);
        subGain.connect(dest);
        subOsc.start(burstTime);
        subOsc.stop(burstTime + 0.18);

        // Harsh detuned buzzer pair (sawtooth + square)
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const bzGain = this.ctx.createGain();

        // Low-pass filter to shape the buzzer tone
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1600, burstTime);
        filter.frequency.exponentialRampToValueAtTime(600, burstTime + 0.18);

        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(124, burstTime);
        osc2.frequency.setValueAtTime(133, burstTime); // Inharmonic detune for classic game show buzzer

        bzGain.gain.setValueAtTime(0.42, burstTime);
        bzGain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.18);

        osc1.connect(bzGain);
        osc2.connect(bzGain);
        bzGain.connect(filter);
        filter.connect(dest);

        osc1.start(burstTime);
        osc2.start(burstTime);
        osc1.stop(burstTime + 0.18);
        osc2.stop(burstTime + 0.18);
      });
    } catch {}
  }

  // Bright, crystalline "Le Creo" / Faith vote chime
  playBelieveChime() {
    if (!this.enabled) return;
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;

      // Two bright bell tones: F#5 (739.99 Hz) and C#6 (1108.73 Hz)
      const freqs = [739.99, 1108.73];
      freqs.forEach((freq, idx) => {
        if (!this.ctx || !dest) return;
        const noteTime = now + idx * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.28, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(noteTime);
        osc.stop(noteTime + 0.35);
      });
    } catch {}
  }

  // --- TRUTH / CORRECT ANSWER FANFARES ---

  // Victorious / Correct Answer Sparkle Chime
  playTruthChime() {
    this.playCorrectAnswer();
  }

  playCorrectAnswer() {
    if (!this.enabled) return;
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;

      // Major triumphant ascending arpeggio: C5, E5, G5, C6 + high shimmer
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];

      notes.forEach((freq, idx) => {
        if (!this.ctx || !dest) return;
        const noteTime = now + idx * 0.08;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.3, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(noteTime);
        osc.stop(noteTime + 0.45);
      });

      // Extra high sparkle overtone
      const sparkleOsc = this.ctx.createOscillator();
      const sparkleGain = this.ctx.createGain();
      sparkleOsc.type = 'sine';
      sparkleOsc.frequency.setValueAtTime(2093, now + 0.32); // C7
      sparkleGain.gain.setValueAtTime(0.2, now + 0.32);
      sparkleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      sparkleOsc.connect(sparkleGain);
      sparkleGain.connect(dest);
      sparkleOsc.start(now + 0.32);
      sparkleOsc.stop(now + 0.7);
    } catch {}
  }

  // Wrong answer / Lie reveal descending slide
  playWrongAnswer() {
    if (!this.enabled) return;
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.75);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.75);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.75);
    } catch {}
  }

  // --- SUSPENSE, CASH LADDER & ELIMINATION ---

  // Cinematic suspense riser
  playSuspense() {
    if (!this.enabled) return;
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;

      // Low suspense drone rising in frequency with resonance
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(150, now);
      filter.frequency.exponentialRampToValueAtTime(650, now + 1.2);
      filter.Q.setValueAtTime(4, now);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.linearRampToValueAtTime(180, now + 1.2);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.32, now + 0.9);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 1.3);
    } catch {}
  }

  // Cash ladder ascension (scales note frequencies higher with higher ladder steps)
  playCashAscend(stepIndex: number = 1) {
    if (!this.enabled) return;
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;

      // Pitch multiplier based on ladder step (1 to 10)
      const pitchMultiplier = 1 + Math.min(stepIndex, 10) * 0.05;
      const baseNotes = [440, 554.37, 659.25, 880, 1108.73, 1318.51].map(
        (f) => f * pitchMultiplier
      );

      baseNotes.forEach((freq, idx) => {
        if (!this.ctx || !dest) return;
        const noteTime = now + idx * 0.08;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.3, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.38);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(noteTime);
        osc.stop(noteTime + 0.38);
      });
    } catch {}
  }

  // Defeat / Elimination Thud
  playEliminated() {
    if (!this.enabled) return;
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;

      // Heavy sub-bass drop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.85);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.85);
    } catch {}
  }

  // Whoosh noise sweep for card appearances and fast UI motions
  playWhoosh() {
    if (!this.enabled) return;
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;

      // Generate a short noise burst buffer
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(250, now);
      filter.frequency.exponentialRampToValueAtTime(2200, now + 0.12);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.25);
      filter.Q.setValueAtTime(3, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.25);
    } catch {}
  }

  // --- PHASE TRANSITIONS ---

  playTransition(type: TransitionType) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      switch (type) {
        case 'question_start': {
          // Energetic game-show round opener
          this.playWhoosh();
          const now = this.ctx.currentTime + 0.08;
          const chord = [392.0, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
          chord.forEach((freq) => {
            if (!this.ctx) return;
            const dest = this.getDestination();
            if (!dest) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(now);
            osc.stop(now + 0.45);
          });
          break;
        }

        case 'defense_phase': {
          // Double studio boxing bell ("DING-DING! La defensa comienza")
          const now = this.ctx.currentTime;
          [0, 0.18].forEach((offset) => {
            if (!this.ctx) return;
            const dest = this.getDestination();
            if (!dest) return;
            const t = now + offset;
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc1.type = 'sine';
            osc2.type = 'triangle';
            osc1.frequency.setValueAtTime(880, t); // A5
            osc2.frequency.setValueAtTime(1760, t); // A6 overtone

            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(dest);

            osc1.start(t);
            osc2.start(t);
            osc1.stop(t + 0.35);
            osc2.stop(t + 0.35);
          });
          break;
        }

        case 'voting_start': {
          // Urgent tension pulse signaling voting is open
          const now = this.ctx.currentTime;
          [0, 0.14, 0.28].forEach((offset, idx) => {
            if (!this.ctx) return;
            const dest = this.getDestination();
            if (!dest) return;
            const t = now + offset;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(587.33 + idx * 80, t); // D5 climbing

            gain.gain.setValueAtTime(0.22, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

            osc.connect(gain);
            gain.connect(dest);

            osc.start(t);
            osc.stop(t + 0.12);
          });
          break;
        }

        case 'reveal': {
          // Deep dramatic rumble and suspense riser
          this.playSuspense();
          break;
        }

        case 'game_over': {
          // Grand fanfare chords
          const now = this.ctx.currentTime;
          const chords = [
            [523.25, 659.25, 783.99], // C Major
            [587.33, 739.99, 880.0], // D Major
            [659.25, 830.61, 987.77], // E Major
            [1046.5, 1318.51, 1567.98], // C6 Octave triumphant
          ];

          chords.forEach((chord, stepIdx) => {
            const stepTime = now + stepIdx * 0.22;
            const dur = stepIdx === chords.length - 1 ? 0.9 : 0.24;

            chord.forEach((freq) => {
              if (!this.ctx) return;
              const dest = this.getDestination();
              if (!dest) return;
              const osc = this.ctx.createOscillator();
              const gain = this.ctx.createGain();

              osc.type = stepIdx === chords.length - 1 ? 'sawtooth' : 'triangle';
              osc.frequency.setValueAtTime(freq, stepTime);

              gain.gain.setValueAtTime(0.28, stepTime);
              gain.gain.exponentialRampToValueAtTime(0.001, stepTime + dur);

              osc.connect(gain);
              gain.connect(dest);

              osc.start(stepTime);
              osc.stop(stepTime + dur);
            });
          });
          break;
        }
      }
    } catch {}
  }
}

export const sounds = new SoundFX();

// Auto-unlock Web Audio API on first user gesture anywhere in document
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    sounds.initCtx();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
}
