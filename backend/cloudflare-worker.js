/**
 * AmazonSEO Pro — Cloudflare Worker (100% Free Serverless Hosting)
 *
 * How to deploy:
 * 1. Go to dash.cloudflare.com -> Workers & Pages -> Create Worker.
 * 2. Paste this code.
 * 3. Add an Environment Secret: GEMINI_API_KEY = your_key.
 * 4. Deploy! Use your worker URL (e.g., https://my-seo-api.yourname.workers.dev)
 *    in the Chrome Extension settings.
 */

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'online',
        provider: 'Cloudflare Workers',
        hasApiKey: !!env.GEMINI_API_KEY
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/api/optimize' && request.method === 'POST') {
      try {
        if (!env.GEMINI_API_KEY) {
          return new Response(JSON.stringify({ error: 'GEMINI_API_KEY secret not set on worker' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const body = await request.json();
        const { title, brand, bullets, keywords, price } = body;

        const prompt = `You are a world-class Amazon SEO copywriter. Optimize this Amazon product listing for maximum organic ranking (A9/Cosmo algorithm) and high conversion:

Current Title: ${title || 'N/A'}
Brand: ${brand || 'N/A'}
Price: ${price || 'N/A'}
Current Bullets:
${(bullets || []).join('\n')}
Keywords:
${(keywords || []).slice(0, 15).join(', ')}

Strict Requirements:
1. Title: Under 200 characters. Structure: [Brand] + [Core Keyword in first 70 chars] + [Key Differentiators & Specs]. Title Case. No promotional spam terms ("Best Seller", "Cheap").
2. Bullets: Exactly 5 bullets. Each MUST begin with a [CAPITALIZED BENEFIT HEADER] followed by a persuasive 150-250 character benefit-driven sentence.
3. Backend Search Terms: Space-separated keywords strictly UNDER 249 BYTES total. Do NOT repeat words from the title. Do NOT use commas or punctuation. Do NOT use brand names.

Return strictly a valid JSON object with keys:
{
  "title": "...",
  "bullets": ["...", "...", "...", "...", "..."],
  "backendKeywords": "..."
}`;

        const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (!gRes.ok) {
          const err = await gRes.text();
          return new Response(JSON.stringify({ error: `Gemini API error: ${err}` }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const json = await gRes.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        return new Response(JSON.stringify({ success: true, data: JSON.parse(text) }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};
