import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { voiceService } from '@/utils/voiceService';
import { useToast } from '@/components/ui/use-toast';

interface VoiceInterfaceProps {
  onTextReceived?: (text: string) => void;
  onSpeakText?: (text: string) => void;
  textToSpeak?: string;
  placeholder?: string;
  disabled?: boolean;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  onTextReceived,
  onSpeakText,
  textToSpeak,
  placeholder,
  disabled = false
}) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    if (textToSpeak && textToSpeak.trim()) {
      handleSpeak(textToSpeak);
    }
  }, [textToSpeak]);

  const handleStartListening = async () => {
    if (disabled || isListening) return;

    try {
      setIsListening(true);
      setIsProcessing(true);
      setTranscript('');

      const result = await voiceService.listenForSpeech({
        language: i18n.language
      });

      if (result.trim()) {
        setTranscript(result);
        onTextReceived?.(result);
        toast({
          title: t('voice.success'),
          description: result,
        });
      }
    } catch (error) {
      console.error('Voice recognition error:', error);
      toast({
        title: t('common.error'),
        description: t('voice.repeatInstruction'),
        variant: 'destructive',
      });
    } finally {
      setIsListening(false);
      setIsProcessing(false);
    }
  };

  const handleStopListening = () => {
    voiceService.stopListening();
    setIsListening(false);
    setIsProcessing(false);
  };

  const handleSpeak = async (text: string) => {
    if (disabled || isSpeaking) return;

    try {
      setIsSpeaking(true);
      await voiceService.speakText(text, {
        language: i18n.language
      });
      onSpeakText?.(text);
    } catch (error) {
      console.error('Text-to-speech error:', error);
      toast({
        title: t('common.error'),
        description: 'Could not speak text',
        variant: 'destructive',
      });
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleStopSpeaking = () => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t('voice.voiceInstructions')}</h3>
        <div className="flex gap-2">
          {/* Speech-to-Text Button */}
          <Button
            variant={isListening ? "destructive" : "default"}
            size="sm"
            onClick={isListening ? handleStopListening : handleStartListening}
            disabled={disabled || isProcessing}
            className="gap-2"
          >
            {isProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isListening ? (
              <MicOff size={16} />
            ) : (
              <Mic size={16} />
            )}
            {isProcessing ? t('voice.processing') : isListening ? t('voice.stopListening') : t('voice.listen')}
          </Button>

          {/* Text-to-Speech Button */}
          {textToSpeak && (
            <Button
              variant={isSpeaking ? "destructive" : "outline"}
              size="sm"
              onClick={isSpeaking ? handleStopSpeaking : () => handleSpeak(textToSpeak)}
              disabled={disabled}
              className="gap-2"
            >
              {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
              {isSpeaking ? 'Stop' : t('voice.speak')}
            </Button>
          )}
        </div>
      </div>

      {/* Visual feedback */}
      {isListening && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full" />
          {t('voice.processing')}
        </div>
      )}

      {/* Transcript display */}
      {transcript && (
        <div className="bg-muted/50 rounded-md p-3">
          <p className="text-sm font-medium mb-1">Transcribed:</p>
          <p className="text-sm text-muted-foreground">{transcript}</p>
        </div>
      )}

      {/* Instructions */}
      <p className="text-xs text-muted-foreground">
        {placeholder || t('voice.voiceInstructions')}
      </p>
    </Card>
  );
};

export default VoiceInterface;