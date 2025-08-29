import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { BHASHINI_LANGUAGES } from '@/utils/bhashiniService';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  region?: string;
}

// Use core languages for the main interface (most commonly supported)
const coreLanguages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', region: 'Official' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', region: 'North' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'South' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'South' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', region: 'East' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', region: 'West' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', region: 'West' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'South' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', region: 'South' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'North' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', region: 'East' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', region: 'Northeast' },
];

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'default' }) => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  const currentLanguage = coreLanguages.find(lang => lang.code === i18n.language) || coreLanguages[0];

  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const currentIndex = coreLanguages.findIndex(lang => lang.code === i18n.language);
          const nextIndex = (currentIndex + 1) % coreLanguages.length;
          handleLanguageChange(coreLanguages[nextIndex].code);
        }}
        className="gap-2"
      >
        <Languages size={16} />
        <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Languages size={16} className="text-muted-foreground" />
      <Select value={i18n.language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            <span className="flex items-center gap-2">
              {currentLanguage.nativeName}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {coreLanguages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex flex-col">
                <span className="font-medium">{language.nativeName}</span>
                <span className="text-xs text-muted-foreground">{language.name} • {language.region}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSwitcher;