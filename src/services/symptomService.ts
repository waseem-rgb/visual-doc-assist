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
    console.log(`Fetching symptom data for body part: ${bodyPart}`);
    
    const { data, error } = await supabase
      .from('New Master')
      .select('*')
      .eq('Part of body_and general full body symptom', bodyPart);

    if (error) {
      console.error('Error fetching symptom data:', error);
      return { regions: [], fallbackSymptoms: [] };
    }

    if (!data || data.length === 0) {
      console.log(`No symptoms found for body part: ${bodyPart} in database`);
      return { regions: [], fallbackSymptoms: [] };
    }

    console.log(`Found ${data.length} symptoms for ${bodyPart}:`, data);

    // Create regions based on the database data
    const regions: SymptomRegion[] = [];
    
    // For most body parts, create a grid layout
    data.forEach((item, index) => {
      const cols = Math.ceil(Math.sqrt(data.length));
      const rows = Math.ceil(data.length / cols);
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const regionWidth = 80 / cols;
      const regionHeight = 80 / rows;
      
      // Ensure we have complete symptom text
      const symptomText = item.Symptoms || '';
      const shortSummary = item['Short Summary'] || '';
      const completeSymptomText = symptomText.trim() || shortSummary.trim() || 'Symptom description not available';
      
      regions.push({
        id: `${bodyPart.toLowerCase().replace(/\s+/g, '_')}_${index}`,
        text: completeSymptomText,
        diagnosis: item['Probable Diagnosis'] || 'Unknown diagnosis',
        summary: shortSummary || 'No summary available',
        coordinates: {
          xPct: 10 + (col * regionWidth),
          yPct: 10 + (row * regionHeight),
          wPct: regionWidth - 2,
          hPct: regionHeight - 2
        }
      });
    });

    // Create fallback symptoms from the database data
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