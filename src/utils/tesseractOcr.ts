import Tesseract from 'tesseract.js';

export interface TesseractProgress {
  status: string;
  progress: number;
}

export interface TesseractLine {
  text: string;
  confidence?: number;
  type?: 'body';
}

export async function runTesseractOCR(
  imageSource: string,
  onProgress?: (info: TesseractProgress) => void
) {
  try {
    const result = await Tesseract.recognize(imageSource, 'eng', {
      logger: (m) => {
        if (onProgress && typeof m.progress === 'number') {
          onProgress({
            status: m.status || 'processing',
            progress: Math.round(m.progress * 100),
          });
        }
      },
    });

    const fullText: string = result.data.text || '';
    
    // Safely extract lines from Tesseract data or fall back to newline split
    const rawLines = (result.data as any)?.lines;
    let lines: TesseractLine[] = [];

    if (Array.isArray(rawLines)) {
      lines = rawLines
        .map((line: any) => ({
          text: (line.text || '').trim(),
          confidence: typeof line.confidence === 'number' ? Math.round(line.confidence) : undefined,
          type: 'body' as const,
        }))
        .filter((l: TesseractLine) => l.text.length > 0);
    } else {
      lines = fullText
        .split('\n')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .map((text) => ({
          text,
          type: 'body' as const,
        }));
    }

    return {
      success: true,
      fullText,
      lines,
      confidence: Math.round(result.data.confidence || 0),
    };
  } catch (error: any) {
    console.error('Tesseract in-browser OCR error:', error);
    throw new Error(error?.message || 'In-browser OCR failed to process the image.');
  }
}
