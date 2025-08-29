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
    const { text, sourceLanguage, targetLanguage } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    const apiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY')
    if (!apiKey) {
      throw new Error('Google Cloud API key not configured')
    }

    // Google Cloud Translation API v2 endpoint
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`

    const requestBody = {
      q: text,
      source: sourceLanguage || 'auto',
      target: targetLanguage || 'en',
      format: 'text'
    }

    console.log('Google Translate request:', { 
      text: text.substring(0, 50) + '...', 
      source: sourceLanguage, 
      target: targetLanguage 
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Translate API error:', response.status, errorText)
      throw new Error(`Google Translate API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('Google Translate response:', result)
    
    // Extract translated text from Google Translate response
    const translatedText = result.data?.translations?.[0]?.translatedText || text

    return new Response(
      JSON.stringify({ translatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Google Translate error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})