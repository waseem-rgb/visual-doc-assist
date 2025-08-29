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
    const { audio, language } = await req.json()

    if (!audio) {
      throw new Error('Audio data is required')
    }

    const requestBody = {
      input: [{ 
        source: audio 
      }],
      modelId: 'ai4bharat/conformer-hi-male',
      task: 'asr',
      config: {
        language: {
          sourceLanguage: language || 'hi'
        },
        audioFormat: 'wav',
        samplingRate: 16000
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
      throw new Error(`Bhashini ASR API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    
    // Extract transcribed text from Bhashini response
    const text = result.output?.[0]?.target || ''

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Bhashini speech-to-text error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})