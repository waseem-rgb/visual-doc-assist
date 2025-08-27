import { supabase } from "@/integrations/supabase/client";

/**
 * Generates possible filename variations based on the storage bucket naming patterns
 */
export const generateImageFilenames = (bodyPart: string): string[] => {
  // Based on the actual files in the storage bucket which use UPPERCASE with spaces
  const bodyPartUpper = bodyPart.toUpperCase().trim();
  const bodyPartLower = bodyPart.toLowerCase().trim();
  
  return [
    // Exact match format as seen in storage: "EAR HEARING.png"
    `${bodyPartUpper}.png`,
    `${bodyPartUpper}.jpg`,
    
    // Alternative formats just in case
    `${bodyPart}.png`, // Original case
    `${bodyPart}.jpg`,
    `${bodyPartLower}.png`,
    `${bodyPartLower}.jpg`,
    `${bodyPartLower.replace(/\s+/g, '_')}.png`, // ear_hearing.png
    `${bodyPartLower.replace(/\s+/g, '_')}.jpg`,
    `${bodyPartLower.replace(/\s+/g, '-')}.png`, // ear-hearing.png  
    `${bodyPartLower.replace(/\s+/g, '-')}.jpg`,
    `${bodyPartUpper.replace(/\s+/g, '_')}.png`, // EAR_HEARING.png
    `${bodyPartUpper.replace(/\s+/g, '_')}.jpg`,
  ];
};

/**
 * Attempts to load an image from Supabase storage using multiple filename patterns
 */
export const loadImageFromStorage = async (
  bodyPart: string, 
  bucketName: string = 'Symptom_Images'
): Promise<{ url: string | null; filename: string | null; error?: string }> => {
  
  const possibleFilenames = generateImageFilenames(bodyPart);
  
  console.log(`🔍 Searching for "${bodyPart}" image in bucket "${bucketName}"`);
  console.log('📝 Trying filenames:', possibleFilenames);
  
  for (const filename of possibleFilenames) {
    try {
      console.log(`⏳ Attempting: "${filename}"`);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filename);

      if (error) {
        console.log(`❌ Failed "${filename}":`, error.message);
        continue;
      }

      if (data) {
        const url = URL.createObjectURL(data);
        console.log(`✅ SUCCESS: Found "${filename}"`);
        return { url, filename };
      }
    } catch (err) {
      console.log(`💥 Exception for "${filename}":`, err);
      continue;
    }
  }
  
  const errorMsg = `No image found for "${bodyPart}" in bucket "${bucketName}"`;
  console.error(`🚫 ${errorMsg}`);
  console.log('📋 Tried all these filenames:', possibleFilenames.join(', '));
  
  return { 
    url: null, 
    filename: null, 
    error: errorMsg
  };
};