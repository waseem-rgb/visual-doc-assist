import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mic, MicOff, Volume2, Languages, Loader2 } from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
];

export default function BhashiniTest() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [inputText, setInputText] = useState('');
  const [transcribedText, setTranscribedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState<'stt' | 'translate' | 'tts' | null>(null);

  // Start/Stop Recording
  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const audioChunks: Blob[] = [];

        recorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          await processAudio(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        toast.success('Recording started');
      } catch (error) {
        toast.error('Failed to start recording. Please check microphone permissions.');
        console.error('Recording error:', error);
      }
    } else {
      if (mediaRecorder) {
        mediaRecorder.stop();
        setIsRecording(false);
        setMediaRecorder(null);
        toast.success('Recording stopped');
      }
    }
  };

  // Process recorded audio
  const processAudio = async (audioBlob: Blob) => {
    setIsLoading('stt');
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const { data, error } = await supabase.functions.invoke('bhashini-speech-to-text', {
        body: { 
          audio: base64Audio,
          language: selectedLanguage 
        }
      });

      if (error) throw error;
      
      setTranscribedText(data.text || '');
      setInputText(data.text || '');
      toast.success('Speech transcribed successfully');
    } catch (error) {
      console.error('Speech-to-text error:', error);
      toast.error('Failed to transcribe speech');
    } finally {
      setIsLoading(null);
    }
  };

  // Translate text
  const translateText = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter some text to translate');
      return;
    }

    setIsLoading('translate');
    try {
      const { data, error } = await supabase.functions.invoke('bhashini-translate', {
        body: {
          text: inputText,
          sourceLanguage: selectedLanguage,
          targetLanguage: 'en'
        }
      });

      if (error) throw error;
      
      setTranslatedText(data.translatedText || '');
      toast.success('Text translated successfully');
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate text');
    } finally {
      setIsLoading(null);
    }
  };

  // Text to speech
  const speakText = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter some text for speech synthesis');
      return;
    }

    setIsLoading('tts');
    try {
      const { data, error } = await supabase.functions.invoke('bhashini-text-to-speech', {
        body: {
          text: inputText,
          language: selectedLanguage
        }
      });

      if (error) throw error;
      
      if (data.audioContent) {
        // Convert base64 to audio and play
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
          { type: 'audio/wav' }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        await audio.play();
        toast.success('Audio played successfully');
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
      toast.error('Failed to generate speech');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Bhashini Integration Test</h1>
          <p className="text-muted-foreground">
            Test speech-to-text, translation, and text-to-speech capabilities
          </p>
        </div>

        {/* Language Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="w-5 h-5" />
              Language Selection
            </CardTitle>
            <CardDescription>
              Choose the Indian language for testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name} ({lang.nativeName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Speech-to-Text Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Speech-to-Text Test
            </CardTitle>
            <CardDescription>
              Record audio in {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name} and convert to text
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={toggleRecording}
              variant={isRecording ? "destructive" : "default"}
              className="w-full"
              disabled={isLoading === 'stt'}
            >
              {isLoading === 'stt' ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : isRecording ? (
                <><MicOff className="w-4 h-4 mr-2" /> Stop Recording</>
              ) : (
                <><Mic className="w-4 h-4 mr-2" /> Start Recording</>
              )}
            </Button>
            
            {transcribedText && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Transcribed Text:</label>
                <div className="p-3 bg-muted rounded-md">
                  {transcribedText}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Text Input & Processing */}
        <Card>
          <CardHeader>
            <CardTitle>Text Input & Processing</CardTitle>
            <CardDescription>
              Enter or use transcribed text for translation and speech synthesis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={`Enter text in ${SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={4}
            />
            
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={translateText} 
                disabled={!inputText.trim() || isLoading === 'translate'}
                variant="secondary"
              >
                {isLoading === 'translate' ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Translating...</>
                ) : (
                  <><Languages className="w-4 h-4 mr-2" /> Translate to English</>
                )}
              </Button>
              
              <Button 
                onClick={speakText} 
                disabled={!inputText.trim() || isLoading === 'tts'}
                variant="secondary"
              >
                {isLoading === 'tts' ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Volume2 className="w-4 h-4 mr-2" /> Text-to-Speech</>
                )}
              </Button>
            </div>

            {translatedText && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Translated Text (English):</label>
                <div className="p-3 bg-muted rounded-md">
                  {translatedText}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Status */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant={transcribedText ? "default" : "secondary"}>
                Speech-to-Text: {transcribedText ? "✓ Working" : "Not tested"}
              </Badge>
              <Badge variant={translatedText ? "default" : "secondary"}>
                Translation: {translatedText ? "✓ Working" : "Not tested"}
              </Badge>
              <Badge variant="secondary">
                Text-to-Speech: Click button to test
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}