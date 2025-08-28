import { supabase } from "@/integrations/supabase/client";

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
      return { regions: [], fallbackSymptoms: [] };
    }

    // Convert database data to regions with estimated coordinates
    // Since we don't have exact coordinates stored, we'll distribute them evenly
    const regions: SymptomRegion[] = data.map((item, index) => {
      // Distribute regions across the image (simple grid layout)
      const cols = Math.ceil(Math.sqrt(data.length));
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const regionWidth = 90 / cols; // Leave some margin
      const regionHeight = 85 / Math.ceil(data.length / cols);
      
      return {
        id: `${bodyPart.toLowerCase().replace(/\s+/g, '_')}_${index}`,
        text: item.Symptoms || '',
        diagnosis: item['Probable Diagnosis'] || '',
        summary: item['Short Summary'] || '',
        coordinates: {
          xPct: 5 + (col * regionWidth),
          yPct: 5 + (row * regionHeight),
          wPct: regionWidth - 2,
          hPct: regionHeight - 2
        }
      };
    });

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