import { supabase } from "@/integrations/supabase/client";
import { symptomContent } from "@/data/symptomContent";

export interface SymptomData {
  symptoms: string;
  probable_diagnosis: string;
  short_summary: string;
  basic_investigations: string;
  common_treatments: string;
  prescription_yn: string;
}

export interface SymptomRegion {
  id: string;
  text: string;
  diagnosis: string;
  summary: string;
  coordinates: {
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
  };
}

export interface SymptomContent {
  regions: SymptomRegion[];
  fallbackSymptoms: Array<{ id: string; text: string; }>;
}

export const fetchSymptomData = async (bodyPart: string): Promise<SymptomContent> => {
  try {
    const { data, error } = await supabase
      .from('New Master')
      .select('*')
      .eq('Part of body_and general full body symptom', bodyPart);

    if (error) {
      console.error('Error fetching symptom data:', error);
      return { regions: [], fallbackSymptoms: [] };
    }

    if (!data || data.length === 0) {
      console.log(`No symptoms found for body part: ${bodyPart}, using fallback data`);
      // Use fallback data from symptomContent.ts
      const fallbackData = symptomContent[bodyPart];
      if (fallbackData) {
        return fallbackData;
      }
      return { regions: [], fallbackSymptoms: [] };
    }

    console.log(`Found ${data.length} symptoms for ${bodyPart}:`, data);

    // Create specific regions based on body part and content
    const regions: SymptomRegion[] = [];
    
    if (bodyPart === 'SKIN RASHES') {
      // Define specific text regions for skin rashes based on actual image layout
      const skinRashRegions = [
        {
          xPct: 8, yPct: 25, wPct: 35, hPct: 15,
          keywords: ['blotchy', 'red rash', 'itchy', 'group', 'flea']
        },
        {
          xPct: 45, yPct: 25, wPct: 35, hPct: 15,
          keywords: ['itchy', 'red skin', 'eczema', 'allergic', 'contact']
        },
        {
          xPct: 8, yPct: 42, wPct: 35, hPct: 15,
          keywords: ['intense irritation', 'night', 'scabies', 'burrows']
        },
        {
          xPct: 45, yPct: 42, wPct: 35, hPct: 15,
          keywords: ['small', 'raised', 'purplish', 'flat spots', 'wrists']
        },
        {
          xPct: 8, yPct: 59, wPct: 35, hPct: 15,
          keywords: ['herald', 'coloured', 'rash', 'christmas tree']
        },
        {
          xPct: 45, yPct: 59, wPct: 35, hPct: 15,
          keywords: ['contagious', 'viral', 'blister', 'chickenpox']
        }
      ];

      data.forEach((item, index) => {
        const regionData = skinRashRegions[index] || skinRashRegions[0];
        const symptomText = item.Symptoms || '';
        const shortSummary = item['Short Summary'] || '';
        
        // Find matching region based on keywords
        const matchingRegion = skinRashRegions.find(region => 
          region.keywords.some(keyword => 
            symptomText.toLowerCase().includes(keyword.toLowerCase()) ||
            shortSummary.toLowerCase().includes(keyword.toLowerCase())
          )
        ) || regionData;

        // Ensure we have complete symptom text
        const completeSymptomText = symptomText.trim() || shortSummary.trim() || 'Symptom description not available';

        regions.push({
          id: `${bodyPart.toLowerCase().replace(/\s+/g, '_')}_${index}`,
          text: completeSymptomText,
          diagnosis: item['Probable Diagnosis'] || '',
          summary: shortSummary,
          coordinates: {
            xPct: matchingRegion.xPct,
            yPct: matchingRegion.yPct,
            wPct: matchingRegion.wPct,
            hPct: matchingRegion.hPct
          }
        });
      });
    } else {
      // Fallback to grid layout for other body parts
      data.forEach((item, index) => {
        const cols = Math.ceil(Math.sqrt(data.length));
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        const regionWidth = 90 / cols;
        const regionHeight = 85 / Math.ceil(data.length / cols);
        
        // Ensure we have complete symptom text
        const completeSymptomText = (item.Symptoms || '').trim() || (item['Short Summary'] || '').trim() || 'Symptom description not available';
        
        regions.push({
          id: `${bodyPart.toLowerCase().replace(/\s+/g, '_')}_${index}`,
          text: completeSymptomText,
          diagnosis: item['Probable Diagnosis'] || '',
          summary: item['Short Summary'] || '',
          coordinates: {
            xPct: 5 + (col * regionWidth),
            yPct: 5 + (row * regionHeight),
            wPct: regionWidth - 2,
            hPct: regionHeight - 2
          }
        });
      });
    }

    // Create fallback symptoms from the data
    const fallbackSymptoms = data.map((item, index) => ({
      id: `fallback_${index}`,
      text: item['Short Summary'] || item.Symptoms || 'General symptom'
    }));

    return {
      regions,
      fallbackSymptoms
    };

  } catch (error) {
    console.error('Error in fetchSymptomData:', error);
    // Use fallback data from symptomContent.ts
    const fallbackData = symptomContent[bodyPart];
    if (fallbackData) {
      return fallbackData;
    }
    return {
      regions: [],
      fallbackSymptoms: [
        { id: 'generic', text: 'General symptom for this area' }
      ]
    };
  }
};

export const getSymptomContentForBodyPart = async (bodyPart: string): Promise<SymptomContent | null> => {
  return await fetchSymptomData(bodyPart);
};