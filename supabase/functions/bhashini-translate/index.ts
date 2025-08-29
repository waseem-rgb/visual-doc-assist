import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, sourceLanguage, targetLanguage, modelId } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    const requestBody = {
      input: [{ source: text }],
      modelId: modelId || 'ai4bharat/indictrans-v2-all2en',
      task: 'translation',
      config: {
        language: {
          sourceLanguage: sourceLanguage || 'hi',
          targetLanguage: targetLanguage || 'en'
        }
      }
    }

    const response = await fetch('https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/compute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`Bhashini API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    
    // Extract translated text from Bhashini response
    const translatedText = result.output?.[0]?.target || text

    return new Response(
      JSON.stringify({ translatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Bhashini translation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})