// 音頻管理器
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.backgroundMusic = null;
        this.flapSound = null;
        this.scoreSound = null;
        this.hitSound = null;
        this.isInitialized = false;
        this.isMuted = false;
        
        // 嘗試初始化音頻上下文
        this.initAudio();
    }
    
    // 初始化音頻
    initAudio() {
        try {
            // 創建音頻上下文
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // 創建音效
            this.createSounds();
            
            // 創建背景音樂
            this.createBackgroundMusic();
            
            this.isInitialized = true;
        } catch (e) {
            console.error('Web Audio API不受支持:', e);
        }
    }
    
    // 創建音效
    createSounds() {
        // 飛行音效 - 短促輕快的音效
        this.flapSound = this.createOscillator(440, 'triangle', 0.1);
        
        // 得分音效 - 清脆悅耳的音效
        this.scoreSound = this.createComplexSound([523.25, 659.25], ['sine', 'sine'], [0.2, 0.3], [0.1, 0.1]);
        
        // 碰撞音效 - 柔和提示音
        this.hitSound = this.createOscillator(220, 'sine', 0.3, 0.1);
    }
    
    // 創建簡單的振盪器音效
    createOscillator(frequency, type, duration, delay = 0) {
        return () => {
            if (!this.isInitialized || this.isMuted) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = type;
            oscillator.frequency.value = frequency;
            
            gainNode.gain.value = 0.3;
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(this.audioContext.currentTime + delay);
            oscillator.stop(this.audioContext.currentTime + delay + duration);
        };
    }
    
    // 創建複合音效
    createComplexSound(frequencies, types, durations, delays) {
        return () => {
            if (!this.isInitialized || this.isMuted) return;
            
            for (let i = 0; i < frequencies.length; i++) {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.type = types[i];
                oscillator.frequency.value = frequencies[i];
                
                gainNode.gain.value = 0.3;
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + durations[i]);
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.start(this.audioContext.currentTime + (delays[i] || 0));
                oscillator.stop(this.audioContext.currentTime + (delays[i] || 0) + durations[i]);
            }
        };
    }
    
    // 創建MIDI背景音樂
    createBackgroundMusic() {
        // 定義簡單的MIDI音符序列
        const notes = [
            { note: 'C4', duration: 0.25 },
            { note: 'E4', duration: 0.25 },
            { note: 'G4', duration: 0.25 },
            { note: 'C5', duration: 0.5 },
            { note: 'G4', duration: 0.25 },
            { note: 'E4', duration: 0.25 },
            { note: 'C4', duration: 0.5 },
            { note: 'D4', duration: 0.25 },
            { note: 'F4', duration: 0.25 },
            { note: 'A4', duration: 0.25 },
            { note: 'D5', duration: 0.5 },
            { note: 'A4', duration: 0.25 },
            { note: 'F4', duration: 0.25 },
            { note: 'D4', duration: 0.5 }
        ];
        
        // 音符頻率映射
        const noteFrequencies = {
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
            'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77
        };
        
        let currentNoteIndex = 0;
        let isPlaying = false;
        let nextNoteTime = 0;
        let intervalId = null;
        
        // 播放單個音符
        const playNote = (time, note, duration) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = noteFrequencies[note];
            
            gainNode.gain.value = 0.2;
            gainNode.gain.setValueAtTime(0.2, time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration - 0.05);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(time);
            oscillator.stop(time + duration);
        };
        
        // 調度下一個音符
        const scheduleNote = () => {
            if (!isPlaying || this.isMuted) return;
            
            const currentTime = this.audioContext.currentTime;
            
            // 調度未來1秒內的音符
            while (nextNoteTime < currentTime + 1) {
                const noteData = notes[currentNoteIndex];
                playNote(nextNoteTime, noteData.note, noteData.duration);
                
                nextNoteTime += noteData.duration;
                currentNoteIndex = (currentNoteIndex + 1) % notes.length;
            }
        };
        
        // 開始播放背景音樂
        this.playBackgroundMusic = () => {
            if (!this.isInitialized) return;
            
            // 如果音頻上下文被暫停，恢復它
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            if (!isPlaying) {
                isPlaying = true;
                currentNoteIndex = 0;
                nextNoteTime = this.audioContext.currentTime;
                
                // 每100毫秒調度一次音符
                intervalId = setInterval(scheduleNote, 100);
            }
        };
        
        // 停止播放背景音樂
        this.stopBackgroundMusic = () => {
            if (isPlaying) {
                isPlaying = false;
                clearInterval(intervalId);
            }
        };
    }
    
    // 播放飛行音效
    playFlapSound() {
        if (this.flapSound) {
            this.flapSound();
        }
    }
    
    // 播放得分音效
    playScoreSound() {
        if (this.scoreSound) {
            this.scoreSound();
        }
    }
    
    // 播放碰撞音效
    playHitSound() {
        if (this.hitSound) {
            this.hitSound();
        }
    }
    
    // 切換靜音狀態
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            this.stopBackgroundMusic();
        } else {
            this.playBackgroundMusic();
        }
        
        return this.isMuted;
    }
}

// 創建全局音頻管理器實例
window.addEventListener('load', () => {
    window.audioManager = new AudioManager();
});