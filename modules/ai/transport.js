function resolveAIEndpoint(baseUrl, protocol) {
  return String(baseUrl || '').trim();
}

function buildAIRequestOptions(provider, protocol, apiKey, model, prompt, systemPrompt, jsonMode = true) {
  if (protocol === 'anthropic') {
    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      })
    };
  }
  if (protocol === 'responses') {
    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        instructions: systemPrompt,
        input: prompt,
        max_output_tokens: 1200
      })
    };
  }
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
      , ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
    })
  };
}

function parseAIResponse(provider, protocol, data) {
  if (protocol === 'responses') {
    return JSON.parse(extractJSONText(extractResponsesText(data)));
  }
  if (protocol === 'anthropic' || provider === 'anthropic') {
    const content = Array.isArray(data.content)
      ? data.content.filter((item) => item.type === 'text').map((item) => item.text).join('\n')
      : '{}';
    return JSON.parse(extractJSONText(content));
  }
  const content = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(extractJSONText(content));
}

function parseAIText(provider, protocol, data) {
  if (protocol === 'responses') return extractResponsesText(data);
  if (protocol === 'anthropic' || provider === 'anthropic') return Array.isArray(data.content) ? data.content.filter((item) => item.type === 'text').map((item) => item.text).join('\n').trim() : '';
  const content = data.choices?.[0]?.message?.content;
  return Array.isArray(content) ? content.map((item) => item.text || '').join('\n').trim() : String(content || '').trim();
}

function extractResponsesText(data) {
  if (!data) return '';
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  if (!Array.isArray(data.output)) return '';
  return data.output
    .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
    .filter((item) => item && (item.type === 'output_text' || item.type === 'text'))
    .map((item) => item.text || '')
    .join('\n')
    .trim();
}

function extractJSONText(content) {
  const text = String(content || '').trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end >= start) {
    return text.slice(start, end + 1).trim();
  }
  return text || '{}';
}

Object.assign(window, { resolveAIEndpoint, buildAIRequestOptions, parseAIResponse, parseAIText, extractResponsesText, extractJSONText });
