export interface OCRLine {
  text: string;
  type?: 'dialogue' | 'narration' | 'sfx' | 'heading' | 'body' | 'sign' | string;
  box?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  confidence?: number;
}

export interface OCRResult {
  fullText: string;
  lines: OCRLine[];
  language: string;
  readingDirection?: 'vertical' | 'horizontal';
  translation?: string;
  provider: 'huggingface' | 'gemini' | 'tesseract' | 'docker' | string;
  model: string;
  hfNote?: string;
  dockerEndpoint?: string;
  processingTimeMs: number;
  timestamp: string;
}

export type ImageFilterMode = 'normal' | 'manga-contrast' | 'invert' | 'grayscale';

export interface SampleImage {
  id: string;
  title: string;
  subtitle: string;
  src: string;
  description: string;
}
