const express = require('express');
const path = require('path');
const { GoogleGenAI, Type } = require('@google/genai');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory caches to keep repeated TTS and Hinglish conversions instant
const ttsCache = new Map();
const hlCache = new Map();
const MAX_TTS_CACHE = 120;
const MAX_HL_CACHE = 400;

function setCache(map, max, key, val) {
  if (map.size >= max) {
    const firstKey = map.keys().next().value;
    if (firstKey !== undefined) map.delete(firstKey);
  }
  map.set(key, val);
}

// Neural Text-to-Speech endpoint (gemini-3.8-flash-lite-tts) tuned for natural Hinglish & Indian English
app.post('/api/tts', async (req, res) => {
  try {
    const rawText = String((req.body && req.body.text) || '').trim();
    const isHinglish = Boolean(req.body && req.body.isHinglish);
    const requestedVoice = String((req.body && req.body.voice) || 'Kore');
    const allowedVoices = ['Kore', 'Puck', 'Zephyr', 'Charon', 'Fenrir'];
    const voiceName = allowedVoices.includes(requestedVoice) ? requestedVoice : 'Kore';

    if (!rawText) {
      return res.status(400).json({ error: 'Text is required for speech generation.' });
    }

    const clipped = rawText.slice(0, 1600);
    const cacheKey = `${voiceName}|${isHinglish ? 'hl' : 'en'}|${clipped}`;
    if (ttsCache.has(cacheKey)) {
      return res.json({ audioBase64: ttsCache.get(cacheKey), mimeType: 'audio/wav', cached: true });
    }

    const ai = getAI();
    const stylePrompt = isHinglish
      ? 'Warm, engaging Indian AI & Machine Learning teacher speaking natural conversational Hinglish (Roman Hindi mixed with English technical terms) with authentic Indian pronunciation and smooth pacing'
      : 'Warm, clear, articulate Indian AI & Machine Learning teacher speaking with natural Indian English intonation';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: clipped,
              speechMetadata: {
                style: stylePrompt,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio =
      response.candidates &&
      response.candidates[0] &&
      response.candidates[0].content &&
      response.candidates[0].content.parts &&
      response.candidates[0].content.parts[0] &&
      response.candidates[0].content.parts[0].inlineData &&
      response.candidates[0].content.parts[0].inlineData.data;

    if (!base64Audio) {
      return res.status(502).json({ error: 'No audio returned by Gemini TTS model.' });
    }

    setCache(ttsCache, MAX_TTS_CACHE, cacheKey, base64Audio);
    return res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
  } catch (err) {
    console.error('[/api/tts error]:', err && err.message ? err.message : err);
    return res.status(500).json({
      error: (err && err.message) || 'Failed to generate speech audio.',
    });
  }
});

// Conversational Hinglish rewriting endpoint (gemini-3.8-flash)
app.post('/api/hinglish', async (req, res) => {
  try {
    const items = Array.isArray(req.body && req.body.texts) ? req.body.texts : [];
    if (!items.length) {
      return res.json({ translations: [] });
    }

    const cleanItems = items.slice(0, 40).map((t) => String(t || ''));
    const results = new Array(cleanItems.length);
    const toFetch = [];
    const toFetchIdx = [];

    cleanItems.forEach((txt, idx) => {
      const trimmed = txt.trim();
      if (!trimmed || trimmed.length < 3 || !/[A-Za-z]/.test(trimmed)) {
        results[idx] = txt;
      } else if (hlCache.has(trimmed)) {
        results[idx] = txt.replace(trimmed, hlCache.get(trimmed));
      } else {
        toFetch.push(trimmed);
        toFetchIdx.push(idx);
      }
    });

    if (!toFetch.length) {
      return res.json({ translations: results, cached: true });
    }

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: JSON.stringify(toFetch),
      config: {
        systemInstruction:
          'You are an expert Indian AI & Machine Learning teacher (like CampusX and Krish Naik). ' +
          'Rewrite each English string in the input JSON array into natural, fluent, conversational Hinglish (Hindi written in Roman script mixed naturally with English technical terms). ' +
          'Rules:\n' +
          '1. Use authentic Hindi sentence structure and grammar in Roman script (e.g., "Is module mein hum samjhenge ki machine learning bina hard-coded rules ke data se patterns kaise seekhta hai.").\n' +
          '2. Keep ALL technical AI/ML/math/programming terms, function names, library names, numbers, and formulas in English (e.g., gradient descent, loss function, matrix, vector, DataFrame, overfitting, Python, SQL, neural network).\n' +
          '3. Keep any existing "(देवनागरी, roman)" brackets intact.\n' +
          '4. Preserve leading/trailing punctuation and return a JSON object with a "translations" array of the exact same length and order as the input array.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['translations'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{"translations":[]}');
    const translatedList = Array.isArray(parsed.translations) ? parsed.translations : [];

    toFetchIdx.forEach((origIdx, k) => {
      const origRaw = cleanItems[origIdx];
      const origTrimmed = toFetch[k];
      const tr = translatedList[k] ? String(translatedList[k]).trim() : origTrimmed;
      if (tr) {
        setCache(hlCache, MAX_HL_CACHE, origTrimmed, tr);
      }
      results[origIdx] = origRaw.replace(origTrimmed, tr || origTrimmed);
    });

    return res.json({ translations: results });
  } catch (err) {
    console.error('[/api/hinglish error]:', err && err.message ? err.message : err);
    return res.status(500).json({
      error: (err && err.message) || 'Failed to generate Hinglish translation.',
    });
  }
});

app.use(express.static(path.join(__dirname)));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AI Marg server running on http://0.0.0.0:${PORT}`);
});
