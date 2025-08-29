import { supabase } from "@/integrations/supabase/client";

interface BhashiniOptions {
  sourceLanguage?: string;
  targetLanguage?: string;
  modelId?: string;
}

interface BhashiniResponse {
  output: Array<{
    source: string;
    target: string;
  }>;
}

// Comprehensive list of Bhashini supported languages
export const BHASHINI_LANGUAGES = [
  // Constitutional Languages
  { code: 'en', name: 'English', nativeName: 'English', region: 'Official' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', region: 'North' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', region: 'Northeast' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', region: 'East' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', region: 'West' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'South' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر', region: 'North' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', region: 'South' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', region: 'West' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', region: 'North' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', region: 'East' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'North' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', region: 'Classical' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', region: 'West' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'South' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'South' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', region: 'North' },
  
  // Additional Scheduled Languages
  { code: 'bho', name: 'Bhojpuri', nativeName: 'भोजपुरी', region: 'North' },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो', region: 'Northeast' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', region: 'North' },
  { code: 'gom', name: 'Konkani', nativeName: 'कोंकणी', region: 'West' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', region: 'East' },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্', region: 'Northeast' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', region: 'Tribal' },
];

export class BhashiniService {
  private readonly API_ENDPOINT = 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/compute';

  // Translate text between languages
  async translateText(text: string, options: BhashiniOptions = {}): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('bhashini-translate', {
        body: {
          text,
          sourceLanguage: options.sourceLanguage || 'en',
          targetLanguage: options.targetLanguage || 'hi',
          modelId: options.modelId
        }
      });

      if (error) throw error;
      return data?.translatedText || text;
    } catch (error) {
      console.error('Bhashini translation failed:', error);
      // Fallback to original text if translation fails
      return text;
    }
  }

  // Convert speech to text using Bhashini
  async speechToText(audioBlob: Blob, language: string = 'hi'): Promise<string> {
    try {
      const audioBase64 = await this.blobToBase64(audioBlob);
      
      const { data, error } = await supabase.functions.invoke('bhashini-speech-to-text', {
        body: {
          audio: audioBase64.split(',')[1], // Remove data URL prefix
          language
        }
      });

      if (error) throw error;
      return data?.text || '';
    } catch (error) {
      console.error('Bhashini speech-to-text failed:', error);
      throw error;
    }
  }

  // Convert text to speech using Bhashini
  async textToSpeech(text: string, language: string = 'hi'): Promise<Blob> {
    try {
      const { data, error } = await supabase.functions.invoke('bhashini-text-to-speech', {
        body: {
          text,
          language
        }
      });

      if (error) throw error;
      
      if (data?.audioContent) {
        return this.base64ToBlob(data.audioContent, 'audio/wav');
      }
      
      throw new Error('No audio content received');
    } catch (error) {
      console.error('Bhashini text-to-speech failed:', error);
      throw error;
    }
  }

  // Get supported language pairs for translation
  getSupportedLanguages() {
    return BHASHINI_LANGUAGES;
  }

  // Check if a language is supported
  isLanguageSupported(languageCode: string): boolean {
    return BHASHINI_LANGUAGES.some(lang => lang.code === languageCode);
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
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
}

// Singleton instance
export const bhashiniService = new BhashiniService();