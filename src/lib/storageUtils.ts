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
 * Uses signed HTTPS URLs first (primary), then data URLs as fallback
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
      
      // STRATEGY 1: Try signed HTTPS URL first (most stable)
      try {
        const { data: signedData, error: signedError } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(filename, 3600); // 1 hour expiry

        if (!signedError && signedData?.signedUrl) {
          console.log(`✅ SUCCESS: Found "${filename}" - Using signed HTTPS URL:`, signedData.signedUrl);
          return { 
            url: signedData.signedUrl, 
            filename,
          };
        }
        
        console.log(`🔄 Signed URL failed for "${filename}":`, signedError?.message || 'No signed URL returned');
      } catch (signedErr) {
        console.log(`💥 Signed URL exception for "${filename}":`, signedErr);
      }

      // STRATEGY 2: Fallback to data URL from blob
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .download(filename);

        if (error) {
          console.log(`❌ Download failed "${filename}":`, error.message);
          continue;
        }

        if (data) {
          // Convert blob to data URL instead of object URL
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(data);
          });
          
          console.log(`✅ SUCCESS: Found "${filename}" - Using data URL (${dataUrl.substring(0, 50)}...)`);
          return { 
            url: dataUrl, 
            filename,
          };
        }
      } catch (downloadErr) {
        console.log(`💥 Download exception for "${filename}":`, downloadErr);
      }
      
    } catch (err) {
      console.log(`💥 General exception for "${filename}":`, err);
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