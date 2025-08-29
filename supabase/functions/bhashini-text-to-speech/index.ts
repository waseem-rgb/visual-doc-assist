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
    const { text, language } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    const requestBody = {
      input: [{ 
        source: text 
      }],
      modelId: 'ai4bharat/indictts-hi-female',
      task: 'tts',
      config: {
        language: {
          sourceLanguage: language || 'hi'
        },
        audioFormat: 'wav',
        samplingRate: 22050
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
      throw new Error(`Bhashini TTS API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    
    // Extract audio content from Bhashini response
    const audioContent = result.output?.[0]?.target || ''

    return new Response(
      JSON.stringify({ audioContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Bhashini text-to-speech error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})