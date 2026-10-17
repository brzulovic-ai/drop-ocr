import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Increase JSON limit for base64 image data
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Health check endpoint for Docker inference container
 */
app.get('/api/docker-health', async (req: Request, res: Response) => {
  const endpoint = (req.query.endpoint as string) || process.env.DOCKER_OCR_ENDPOINT || 'http://ocr-inference:8000';
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    // Try standard health endpoints
    let checkUrl = `${endpoint.replace(/\/+$/, '')}/health`;
    let response = await fetch(checkUrl, { signal: controller.signal }).catch(() => null);

    if (!response || !response.ok) {
      // Fallback check to /v1/models or root
      checkUrl = `${endpoint.replace(/\/+$/, '')}/v1/models`;
      response = await fetch(checkUrl, { signal: controller.signal }).catch(() => null);
    }

    clearTimeout(timeout);
    const latencyMs = Date.now() - startTime;

    if (response && (response.ok || response.status === 404)) {
      res.json({
        available: true,
        endpoint,
        status: 'online',
        latencyMs,
      });
      return;
    }

    res.json({
      available: false,
      endpoint,
      status: 'offline',
      message: `Container at ${endpoint} did not respond affirmatively`,
    });
  } catch (err: any) {
    res.json({
      available: false,
      endpoint,
      status: 'offline',
      message: err.message || 'Container unreachable',
    });
  }
});

/**
 * Proxy image downloading to prevent CORS errors when users drop/paste image URLs
 */
app.post('/api/fetch-image', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Image URL is required' });
      return;
    }

    // Basic URL validation
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      res.status(400).json({ error: 'Only HTTP and HTTPS URLs are allowed' });
      return;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      res.status(response.status).json({
        error: `Failed to fetch image from remote server (${response.status}: ${response.statusText})`,
      });
      return;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Limit image size to 25MB
    if (buffer.length > 25 * 1024 * 1024) {
      res.status(413).json({ error: 'Image exceeds maximum size of 25MB' });
      return;
    }

    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64Data}`;

    res.json({
      success: true,
      mimeType: contentType,
      dataUrl,
      base64: base64Data,
      size: buffer.length,
      originalUrl: url,
    });
  } catch (error: any) {
    console.error('Error fetching image URL:', error);
    res.status(500).json({
      error: error?.message || 'Failed to download image from the provided URL',
    });
  }
});

/**
 * OCR Text Extraction Endpoint
 * Supports:
 * - Docker Container Inference (vLLM / TGI container for SeerRay-Lab/Xiaomi-OCR-0)
 * - Hugging Face Inference API (SeerRay-Lab/Xiaomi-OCR-0 cloud)
 * - Gemini 3.8 Flash Vision OCR (Precision fallback & layout analysis)
 */
app.post('/api/ocr', async (req: Request, res: Response) => {
  try {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      provider = 'auto', // 'docker' | 'huggingface' | 'gemini' | 'auto'
      hfModel = 'SeerRay-Lab/Xiaomi-OCR-0',
      hfToken = '',
      dockerEndpoint = process.env.DOCKER_OCR_ENDPOINT || 'http://ocr-inference:8000',
      targetLang = '',
    } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'No image data provided' });
      return;
    }

    // Strip data URL header if present to get clean base64
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
    const imageBuffer = Buffer.from(cleanBase64, 'base64');

    let dockerErrorReason = '';
    let hfErrorReason = '';
    let extractedText = '';
    let structuredLines: any[] = [];
    let detectedLang = 'auto';
    let translatedText = '';
    let usedProvider = provider;

    // 1. Attempt Docker Container Inference if requested
    if (provider === 'docker') {
      try {
        const cleanEndpoint = dockerEndpoint.replace(/\/+$/, '');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout for local container

        // Try OpenAI Vision format standard for vLLM / Hugging Face Multimodal containers
        const v1Url = `${cleanEndpoint}/v1/chat/completions`;
        const v1Payload = {
          model: hfModel || 'SeerRay-Lab/Xiaomi-OCR-0',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all text verbatim from this image. Preserve Japanese characters, English, punctuation, and line breaks.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${cleanBase64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 2048,
          temperature: 0.1,
        };

        let dockerRes = await fetch(v1Url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(v1Payload),
          signal: controller.signal,
        }).catch(() => null);

        clearTimeout(timeout);

        if (dockerRes && dockerRes.ok) {
          const json = await dockerRes.json();
          extractedText = json.choices?.[0]?.message?.content || '';
          usedProvider = 'docker';
        } else {
          // Try Hugging Face TGI /generate or /predict endpoint
          const tgiUrl = `${cleanEndpoint}/generate`;
          const tgiRes = await fetch(tgiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inputs: `data:${mimeType};base64,${cleanBase64}`,
              parameters: { max_new_tokens: 1024 },
            }),
          }).catch(() => null);

          if (tgiRes && tgiRes.ok) {
            const tgiJson = await tgiRes.json();
            extractedText = tgiJson.generated_text || JSON.stringify(tgiJson);
            usedProvider = 'docker';
          } else {
            dockerErrorReason = `Docker Inference (${cleanEndpoint}): Container is currently offline or unreachable. Run 'make up' or start the container.`;
          }
        }
      } catch (dockErr: any) {
        dockerErrorReason = `Docker container connection error at ${dockerEndpoint}: ${dockErr?.message}. Falling back seamlessly.`;
      }
    }

    // 2. Attempt Hugging Face Cloud if requested or in auto mode
    if ((provider === 'huggingface' || provider === 'auto') && !extractedText) {
      try {
        const tokenToUse = hfToken || process.env.HF_TOKEN || '';
        const headers: Record<string, string> = {
          'Content-Type': 'application/octet-stream',
          'Accept': 'application/json',
        };
        if (tokenToUse) {
          headers['Authorization'] = `Bearer ${tokenToUse}`;
        }

        const endpoint = `https://api-inference.huggingface.co/models/${hfModel}`;
        const hfResponse = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: imageBuffer,
        });

        if (hfResponse.ok) {
          const contentType = hfResponse.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const hfData = await hfResponse.json();
            
            if (Array.isArray(hfData) && hfData[0]?.generated_text) {
              extractedText = hfData.map((item: any) => item.generated_text).join('\n');
            } else if (typeof hfData === 'object' && hfData.generated_text) {
              extractedText = hfData.generated_text;
            } else if (typeof hfData === 'string') {
              extractedText = hfData;
            } else {
              extractedText = JSON.stringify(hfData, null, 2);
            }
            usedProvider = 'huggingface';
          } else {
            extractedText = await hfResponse.text();
            usedProvider = 'huggingface';
          }
        } else {
          const errText = await hfResponse.text();
          let errJson: any;
          try {
            errJson = JSON.parse(errText);
          } catch {
            errJson = { error: errText };
          }
          hfErrorReason = `Hugging Face (${hfModel}): ${errJson.error || hfResponse.statusText || 'Inference not currently available on serverless tier'}`;
        }
      } catch (hfErr: any) {
        hfErrorReason = `HF connection error: ${hfErr?.message}`;
      }
    }

    // 3. Seamless Fallback or Gemini Requested
    if (!extractedText) {
      usedProvider = 'gemini';
      
      const translationPromptPart = targetLang
        ? `Also provide an accurate translation into ${targetLang}.`
        : 'If the text is predominantly Japanese or Chinese, provide an English translation as well.';

      const prompt = `You are a precision Optical Character Recognition (OCR) engine specialized in documents, manga panels, speech bubbles, handwriting, and signs.
Inspect the image with extreme fidelity. Extract all legible text verbatim without omitting characters, line breaks, or punctuation.
${translationPromptPart}

Return your result strictly formatted as valid JSON adhering to this schema:
{
  "fullText": "Full extracted text with proper line breaks preserving layout",
  "language": "Detected language (e.g. Japanese, English, Multilingual)",
  "readingDirection": "vertical or horizontal",
  "lines": [
    {
      "text": "Extracted line or speech bubble text",
      "type": "dialogue | narration | sfx | heading | body",
      "box": [ymin, xmin, ymax, xmax] // Normalized coordinates between 0 and 1000 representing bounding location
    }
  ],
  "translation": "Translated text if applicable, otherwise empty string",
  "summary": "Brief 1-sentence note of what this image or panel contains"
}`;

      const imagePart = {
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            imagePart,
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const rawJson = response.text || '{}';
      try {
        const parsed = JSON.parse(rawJson);
        extractedText = parsed.fullText || '';
        structuredLines = parsed.lines || [];
        detectedLang = parsed.language || 'auto';
        translatedText = parsed.translation || '';
      } catch {
        extractedText = rawJson;
      }
    }

    // Create lines fallback if not already structured
    if (structuredLines.length === 0 && extractedText) {
      structuredLines = extractedText
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .map((text, idx) => ({
          text,
          type: 'body',
          box: [Math.min(900, idx * 80), 50, Math.min(950, idx * 80 + 70), 950],
        }));
    }

    const note = dockerErrorReason || hfErrorReason || undefined;

    res.json({
      success: true,
      fullText: extractedText,
      lines: structuredLines,
      language: detectedLang,
      translation: translatedText,
      provider: usedProvider,
      model:
        usedProvider === 'docker'
          ? `${hfModel} (Docker Container)`
          : usedProvider === 'huggingface'
          ? hfModel
          : 'gemini-3.8-flash',
      dockerEndpoint: usedProvider === 'docker' ? dockerEndpoint : undefined,
      hfNote: note,
    });
  } catch (error: any) {
    console.error('OCR processing error:', error);
    res.status(500).json({
      error: error?.message || 'An unexpected error occurred during OCR extraction.',
    });
  }
});

// Serve frontend in production or mount Vite in dev
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Drop gere OCR server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
