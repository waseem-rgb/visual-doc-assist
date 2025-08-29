import { supabase } from "@/integrations/supabase/client";

interface VoiceServiceOptions {
  language?: string;
  voice?: string;
}

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class VoiceService {
  private recognition: any | null = null;
  private synthesis: SpeechSynthesis;
  private isListening = false;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    }
  }

  // Text-to-Speech using browser API for quick responses
  async speakText(text: string, options: VoiceServiceOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language based on options
      const language = options.language || 'en-US';
      utterance.lang = this.mapLanguageToVoiceLang(language);
      
      // Find appropriate voice
      const voices = this.synthesis.getVoices();
      const voice = voices.find(v => 
        v.lang.includes(utterance.lang) || 
        v.name.toLowerCase().includes(language.toLowerCase())
      );
      
      if (voice) {
        utterance.voice = voice;
      }

      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event.error);

      this.synthesis.speak(utterance);
    });
  }

  // High-quality Text-to-Speech using OpenAI API
  async speakTextHighQuality(text: string, options: VoiceServiceOptions = {}): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text,
          voice: options.voice || 'alloy',
          language: options.language || 'en'
        }
      });

      if (error) throw error;

      if (data?.audioContent) {
        // Convert base64 to audio and play
        const audioBlob = this.base64ToBlob(data.audioContent, 'audio/mpeg');
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        return new Promise((resolve, reject) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            resolve();
          };
          audio.onerror = () => reject(new Error('Audio playback failed'));
          audio.play();
        });
      }
    } catch (error) {
      console.error('High-quality TTS failed, falling back to browser TTS:', error);
      // Fallback to browser TTS
      return this.speakText(text, options);
    }
  }

  // Speech-to-Text
  async listenForSpeech(options: VoiceServiceOptions = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      if (this.isListening) {
        reject(new Error('Already listening'));
        return;
      }

      const language = options.language || 'en-US';
      this.recognition.lang = this.mapLanguageToVoiceLang(language);
      
      let finalTranscript = '';
      
      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        resolve(finalTranscript.trim());
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.start();
    });
  }

  // High-quality Speech-to-Text using OpenAI Whisper
  async transcribeAudio(audioBlob: Blob, options: VoiceServiceOptions = {}): Promise<string> {
    try {
      // Convert blob to base64
      const base64Audio = await this.blobToBase64(audioBlob);
      
      const { data, error } = await supabase.functions.invoke('speech-to-text', {
        body: {
          audio: base64Audio.split(',')[1], // Remove data:audio/webm;base64, prefix
          language: options.language || 'en'
        }
      });

      if (error) throw error;
      return data?.text || '';
    } catch (error) {
      console.error('Whisper transcription failed:', error);
      throw error;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  get isCurrentlyListening(): boolean {
    return this.isListening;
  }

  private mapLanguageToVoiceLang(language: string): string {
    const langMap: Record<string, string> = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'bn': 'bn-IN',
      'gu': 'gu-IN',
      'mr': 'mr-IN'
    };
    return langMap[language] || 'en-US';
  }

  private base64ToBlob(base64: string, contentType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// Singleton instance
export const voiceService = new VoiceService();