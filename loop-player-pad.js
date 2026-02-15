/**
 * Loop Player - Rhythm Pad Controller (Simplified Web Audio version)
 * 
 * Features:
 * - Loads loops from /loops/ folder (LOOP01-03 and FILL1-3)
 * - Pad-based switching (6 pads: 3 loops + 3 fills)
 * - Switches only after current loop completes (maintains rhythm)
 * - Auto-fill mode: plays fill before switching to target loop
 * - Tempo range: 50-200% (0.5x-2x)
 * - Volume control
 * 
 * Note: Uses basic Web Audio API playbackRate (pitch changes with tempo)
 * For true pitch preservation, advanced DSP algorithms like Phase Vocoder or WSOLA would be needed
 */

class LoopPlayerPad {
    constructor() {
        this.audioContext = null;
        this.audioBuffers = new Map(); // Map<name, AudioBuffer>
        this.rawAudioData = new Map(); // Map<name, ArrayBuffer> - raw data before decoding
        this.currentSource = null;
        this.gainNode = null;
        
        // Playback state
        this.isPlaying = false;
        this.currentLoop = 'loop1';
        this.nextLoop = null;
        this.nextFill = null;
        this.loopTimeout = null;
        
        // Settings
        this.autoFill = false;
        this.volumeLevel = 0.8;
        this.playbackRate = 1.0; // 0.5-2.0
        
        // Timing
        this.loopDuration = 0;
        
        // Callbacks
        this.onLoopChange = null;
        this.onPadActive = null;
        this.onError = null;
    }

    /**
     * Initialize Web Audio API
     */
    async initialize() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = this.volumeLevel;
            
            console.log('Web Audio API initialized');
        }
        
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * Load loop samples from the /loops/ folder (fetch only, decode later after user gesture)
     * @param {Object} loopMap - Optional map of loop names to URLs
     * Uses new naming convention v2.0: {taal}_{time}_{tempo}_{genre}_{TYPE}{num}.wav
     * Falls back to keherwa_4_4 files if no map provided (backward compatibility)
     */
    async loadLoops(loopMap = null) {
        // Default to keherwa_4_4 files if no map provided (backward compatibility)
        if (!loopMap) {
            loopMap = {
                'loop1': '/loops/keherwa_4_4_LOOP1.wav',
                'loop2': '/loops/keherwa_4_4_LOOP2.wav',
                'loop3': '/loops/keherwa_4_4_LOOP3.wav',
                'fill1': '/loops/keherwa_4_4_FILL1.wav',
                'fill2': '/loops/keherwa_4_4_FILL2.wav',
                'fill3': '/loops/keherwa_4_4_FILL3.wav'
            };
        }

        // Only fetch raw audio data (don't decode yet - requires user gesture)
        const loadPromises = Object.entries(loopMap).map(async ([name, url]) => {
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                this.rawAudioData.set(name, arrayBuffer);
                console.log(`Fetched: ${name}, size: ${(arrayBuffer.byteLength / 1024).toFixed(2)} KB`);
            } catch (error) {
                console.error(`Failed to fetch ${name}:`, error);
                throw error;
            }
        });

        await Promise.all(loadPromises);
        
        console.log(`Successfully fetched ${this.rawAudioData.size} loop files`);
    }
    
    /**
     * Decode all raw audio data into AudioBuffers (after user gesture)
     * @private
     */
    async _decodeAudioData() {
        if (this.audioBuffers.size > 0) {
            return; // Already decoded
        }
        
        if (!this.audioContext) {
            throw new Error('AudioContext not initialized');
        }
        
        console.log('Decoding audio buffers...');
        
        const decodePromises = Array.from(this.rawAudioData.entries()).map(async ([name, arrayBuffer]) => {
            try {
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.audioBuffers.set(name, audioBuffer);
                console.log(`Decoded: ${name}, duration: ${audioBuffer.duration.toFixed(2)}s`);
            } catch (error) {
                console.warn(`Failed to decode ${name}:`, error.message);
                // Don't throw - continue with other files
                // The pad will be disabled in the UI
            }
        });
        
        await Promise.all(decodePromises);
        
        // Set initial loop duration
        const loop1Buffer = this.audioBuffers.get('loop1');
        if (loop1Buffer) {
            this.loopDuration = loop1Buffer.duration;
        }
        
        console.log(`Successfully decoded ${this.audioBuffers.size} audio buffers`);
    }

    /**
     * Start playing the current loop
     */
    async play() {
        if (this.isPlaying) return;
        
        // Initialize Web Audio API NOW (after user gesture)
        await this.initialize();
        
        // Decode audio data if not already decoded
        if (this.audioBuffers.size === 0 && this.rawAudioData.size > 0) {
            await this._decodeAudioData();
        }
        
        // Check if loops are loaded
        if (this.audioBuffers.size === 0) {
            if (this.onError) this.onError(new Error('No loops loaded'));
            return;
        }
        
        this.isPlaying = true;
        this._playLoop(this.currentLoop, true);
    }

    /**
     * Pause playback
     */
    pause() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        
        // Stop current source
        if (this.currentSource) {
            try {
                this.currentSource.stop();
            } catch (e) {
                // Already stopped
            }
            this.currentSource = null;
        }
        
        // Clear any scheduled loops
        if (this.loopTimeout) {
            clearTimeout(this.loopTimeout);
            this.loopTimeout = null;
        }
    }

    /**
     * Switch to a different loop pad (queued - waits for current to finish)
     * @param {string} loopName - 'loop1', 'loop2', or 'loop3'
     */
    switchToLoop(loopName) {
        if (!['loop1', 'loop2', 'loop3'].includes(loopName)) {
            return;
        }

        // If auto-fill is on, queue fill matching the CURRENT loop (source)
        if (this.autoFill && loopName !== this.currentLoop) {
            const currentLoopNum = this.currentLoop.replace('loop', '');
            this.nextFill = `fill${currentLoopNum}`;
        }

        this.nextLoop = loopName;
    }

    /**
     * Play a fill immediately after current loop finishes
     * @param {string} fillName - 'fill1', 'fill2', or 'fill3'
     */
    playFill(fillName) {
        if (!['fill1', 'fill2', 'fill3'].includes(fillName)) {
            return;
        }

        this.nextFill = fillName;
    }

    /**
     * Toggle auto-fill mode
     * @param {boolean} enabled
     */
    setAutoFill(enabled) {
        this.autoFill = enabled;
    }

    /**
     * Set volume (0-1)
     * @param {number} vol - Volume level 0-1
     */
    setVolume(vol) {
        this.volumeLevel = Math.max(0, Math.min(1, vol));
        if (this.gainNode) {
            this.gainNode.gain.value = this.volumeLevel;
        }
    }

    /**
     * Set playback rate (tempo) - Note: pitch changes slightly with tempo
     * Range: 0.9-1.1 (90-110%) - minimal pitch change for percussion
     * @param {number} rate - Playback speed multiplier
     */
    setPlaybackRate(rate) {
        this.playbackRate = Math.max(0.9, Math.min(1.1, rate));
        // Rate will be applied to next loop cycle
    }

    /**
     * Internal: Play a specific loop or fill
     * @param {string} name - Loop/fill name
     * @param {boolean} continueSequence - Whether to continue the sequence after playing
     * @private
     */
    _playLoop(name, continueSequence = true) {
        const buffer = this.audioBuffers.get(name);
        if (!buffer) {
            console.warn(`Loop ${name} not found`);
            return;
        }

        console.log(`Starting playback of ${name}`);
        
        // Stop current source if any
        if (this.currentSource) {
            try {
                this.currentSource.stop();
            } catch (e) {
                // Already stopped
            }
        }
        
        // Clear existing timeout
        if (this.loopTimeout) {
            clearTimeout(this.loopTimeout);
            this.loopTimeout = null;
        }

        // Create new source
        this.currentSource = this.audioContext.createBufferSource();
        this.currentSource.buffer = buffer;
        this.currentSource.playbackRate.value = this.playbackRate;
        this.currentSource.connect(this.gainNode);
        
        // Start playback
        this.currentSource.start();
        console.log(`Playing ${name}, duration: ${buffer.duration}s, playbackRate: ${this.playbackRate}`);

        // Calculate duration accounting for playback rate
        const duration = buffer.duration / this.playbackRate;

        // Set up loop end handling
        if (continueSequence) {
            this.loopTimeout = setTimeout(() => {
                if (!this.isPlaying) return;

                // Priority: Fill -> Next Loop -> Continue Current Loop
                if (this.nextFill) {
                    // Play queued fill
                    const fill = this.nextFill;
                    this.nextFill = null;
                    
                    if (this.onPadActive) this.onPadActive(fill);
                    if (this.onLoopChange) this.onLoopChange(fill);
                    
                    // Play fill (not continuing sequence)
                    this._playLoop(fill, false);
                    
                    // Schedule next loop after fill
                    const fillBuffer = this.audioBuffers.get(fill);
                    const fillDuration = fillBuffer.duration / this.playbackRate;
                    
                    this.loopTimeout = setTimeout(() => {
                        if (this.isPlaying) {
                            const targetLoop = this.nextLoop || this.currentLoop;
                            this.currentLoop = targetLoop;
                            this.nextLoop = null;
                            
                            if (this.onPadActive) this.onPadActive(targetLoop);
                            if (this.onLoopChange) this.onLoopChange(targetLoop);
                            
                            this._playLoop(targetLoop, true);
                        }
                    }, fillDuration * 1000);
                    
                } else if (this.nextLoop) {
                    // Switch to queued loop
                    this.currentLoop = this.nextLoop;
                    this.nextLoop = null;
                    
                    if (this.onPadActive) this.onPadActive(this.currentLoop);
                    if (this.onLoopChange) this.onLoopChange(this.currentLoop);
                    
                    this._playLoop(this.currentLoop, true);
                    
                } else {
                    // Continue current loop
                    if (this.onLoopChange) this.onLoopChange(this.currentLoop);
                    this._playLoop(this.currentLoop, true);
                }
            }, duration * 1000);
        }
    }

    /**
     * Get current playback state
     */
    getState() {
        return {
            isPlaying: this.isPlaying,
            currentLoop: this.currentLoop,
            nextLoop: this.nextLoop,
            nextFill: this.nextFill,
            autoFill: this.autoFill,
            volume: this.volumeLevel,
            playbackRate: this.playbackRate,
            loopsLoaded: this.audioBuffers.size,
            loopsFetched: this.rawAudioData.size
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.pause();
        if (this.currentSource) {
            this.currentSource.disconnect();
            this.currentSource = null;
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
        this.audioBuffers.clear();
    }
}
