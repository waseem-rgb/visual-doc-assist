import { supabase } from "@/integrations/supabase/client";

/**
 * Generates possible filename variations based on the storage bucket naming patterns
 */
export const generateImageFilenames = (bodyPart: string): string[] => {
  // Based on the actual files in the storage bucket which use UPPERCASE with spaces
  const bodyPartUpper = bodyPart.toUpperCase().trim();
  const bodyPartLower = bodyPart.toLowerCase().trim();
  const bodyPartOriginal = bodyPart.trim();
  
  return [
    // PRIORITY 1: Exact match format as seen in storage: "EYE VISION.png"
    `${bodyPartUpper}.png`,
    `${bodyPartUpper}.PNG`, // Try uppercase extension
    `${bodyPartUpper}.jpg`,
    `${bodyPartUpper}.JPG`, // Try uppercase extension
    `${bodyPartUpper}.jpeg`,
    `${bodyPartUpper}.JPEG`, // Try uppercase extension
    
    // PRIORITY 2: Original case with spaces
    `${bodyPartOriginal}.png`,
    `${bodyPartOriginal}.PNG`,
    `${bodyPartOriginal}.jpg`, 
    `${bodyPartOriginal}.JPG`,
    `${bodyPartOriginal}.jpeg`,
    `${bodyPartOriginal}.JPEG`,
    
    // PRIORITY 3: Lowercase variations
    `${bodyPartLower}.png`,
    `${bodyPartLower}.PNG`,
    `${bodyPartLower}.jpg`,
    `${bodyPartLower}.JPG`,
    `${bodyPartLower}.jpeg`,
    `${bodyPartLower}.JPEG`,
    
    // PRIORITY 4: Underscore variations
    `${bodyPartUpper.replace(/\s+/g, '_')}.png`, // EYE_VISION.png
    `${bodyPartUpper.replace(/\s+/g, '_')}.PNG`,
    `${bodyPartUpper.replace(/\s+/g, '_')}.jpg`,
    `${bodyPartUpper.replace(/\s+/g, '_')}.JPG`,
    `${bodyPartLower.replace(/\s+/g, '_')}.png`, // eye_vision.png
    `${bodyPartLower.replace(/\s+/g, '_')}.PNG`,
    `${bodyPartLower.replace(/\s+/g, '_')}.jpg`,
    `${bodyPartLower.replace(/\s+/g, '_')}.JPG`,
    
    // PRIORITY 5: Dash variations  
    `${bodyPartLower.replace(/\s+/g, '-')}.png`, // eye-vision.png
    `${bodyPartLower.replace(/\s+/g, '-')}.PNG`,
    `${bodyPartLower.replace(/\s+/g, '-')}.jpg`,
    `${bodyPartLower.replace(/\s+/g, '-')}.JPG`,
    `${bodyPartUpper.replace(/\s+/g, '-')}.png`, // EYE-VISION.png
    `${bodyPartUpper.replace(/\s+/g, '-')}.PNG`,
    `${bodyPartUpper.replace(/\s+/g, '-')}.jpg`,
    `${bodyPartUpper.replace(/\s+/g, '-')}.JPG`,
  ];
};

/**
 * Attempts to load an image from Supabase storage using multiple strategies
 * 1. Public URL access (fastest)
 * 2. Signed HTTPS URLs (most reliable)
 * 3. Data URL from blob (highest compatibility)
 */
export const loadImageFromStorage = async (
  bodyPart: string, 
  bucketName: string = 'Symptom_Images'
): Promise<{ url: string | null; filename: string | null; error?: string }> => {
  
  const possibleFilenames = generateImageFilenames(bodyPart);
  
  console.log(`🔍 [ENHANCED SEARCH] Looking for "${bodyPart}" in bucket "${bucketName}"`);
  console.log('📝 [FILENAME PATTERNS] Will try:', possibleFilenames.length, 'variations');
  console.log('🎯 [TOP PRIORITIES]:', possibleFilenames.slice(0, 6));
  
  for (let i = 0; i < possibleFilenames.length; i++) {
    const filename = possibleFilenames[i];
    console.log(`⏳ [ATTEMPT ${i + 1}/${possibleFilenames.length}] Trying: "${filename}"`);
    
    try {
      // STRATEGY 1: Try public URL first (fastest if bucket is public)
      try {
        const publicUrl = supabase.storage
          .from(bucketName)
          .getPublicUrl(filename);
        
        if (publicUrl.data?.publicUrl) {
          // Test if the public URL is accessible
          const testResponse = await fetch(publicUrl.data.publicUrl, { 
            method: 'HEAD',
            cache: 'no-cache' 
          });
          
          if (testResponse.ok) {
            console.log(`✅ [SUCCESS - PUBLIC] Found "${filename}" via public URL:`, publicUrl.data.publicUrl);
            return { 
              url: publicUrl.data.publicUrl, 
              filename,
            };
          } else {
            console.log(`🔄 [PUBLIC FAILED] "${filename}" not accessible via public URL (${testResponse.status})`);
          }
        }
      } catch (publicErr) {
        console.log(`🔄 [PUBLIC ERROR] "${filename}":`, publicErr);
      }
      
      // STRATEGY 2: Try signed HTTPS URL (most stable for private buckets)
      try {
        const { data: signedData, error: signedError } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(filename, 3600); // 1 hour expiry

        if (!signedError && signedData?.signedUrl) {
          // Verify the signed URL works
          const testResponse = await fetch(signedData.signedUrl, { 
            method: 'HEAD',
            cache: 'no-cache' 
          });
          
          if (testResponse.ok) {
            console.log(`✅ [SUCCESS - SIGNED] Found "${filename}" via signed URL:`, signedData.signedUrl);
            return { 
              url: signedData.signedUrl, 
              filename,
            };
          } else {
            console.log(`🔄 [SIGNED FAILED] "${filename}" signed URL not accessible (${testResponse.status})`);
          }
        } else {
          console.log(`🔄 [SIGNED ERROR] "${filename}":`, signedError?.message || 'No signed URL returned');
        }
      } catch (signedErr) {
        console.log(`💥 [SIGNED EXCEPTION] "${filename}":`, signedErr);
      }

      // STRATEGY 3: Fallback to data URL from blob download (highest compatibility)
      try {
        console.log(`🔄 [BLOB DOWNLOAD] Attempting blob download for "${filename}"`);
        const { data, error } = await supabase.storage
          .from(bucketName)
          .download(filename);

        if (error) {
          console.log(`❌ [BLOB ERROR] Download failed "${filename}":`, error.message);
          continue;
        }

        if (data) {
          console.log(`📦 [BLOB SUCCESS] Downloaded "${filename}" (${data.size} bytes)`);
          
          // Convert blob to data URL for maximum compatibility
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(data);
          });
          
          console.log(`✅ [SUCCESS - DATA URL] Found "${filename}" converted to data URL`);
          console.log(`📊 [DATA URL INFO] Type: ${data.type}, Size: ${dataUrl.length} characters`);
          
          return { 
            url: dataUrl, 
            filename,
          };
        }
      } catch (downloadErr) {
        console.log(`💥 [BLOB EXCEPTION] "${filename}":`, downloadErr);
      }
      
    } catch (err) {
      console.log(`💥 [GENERAL EXCEPTION] "${filename}":`, err);
      continue;
    }
  }
  
  const errorMsg = `No image found for "${bodyPart}" in bucket "${bucketName}" after trying ${possibleFilenames.length} filename patterns`;
  console.error(`🚫 [FINAL FAILURE] ${errorMsg}`);
  console.log('📋 [ATTEMPTED FILES] Complete list:', possibleFilenames.map((f, i) => `${i + 1}. ${f}`).join('\n'));
  
  return { 
    url: null, 
    filename: null, 
    error: errorMsg
  };
};