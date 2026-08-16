// src/utils/multilang.utils.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Tesseract from 'tesseract.js';
import { franc } from 'franc';

// ==================== LANGUAGE DETECTION ====================

export const detectLanguage = (text: string): string => {
  // Check for Unicode ranges first
  const ranges = [
    { code: 'bn', range: /[\u0980-\u09FF]/, name: 'Bengali' },
    { code: 'hi', range: /[\u0900-\u097F]/, name: 'Hindi' },
    { code: 'sa', range: /[\u0900-\u097F]/, name: 'Sanskrit' },
    { code: 'te', range: /[\u0C00-\u0C7F]/, name: 'Telugu' },
    { code: 'ta', range: /[\u0B80-\u0BFF]/, name: 'Tamil' },
    { code: 'kn', range: /[\u0C80-\u0CFF]/, name: 'Kannada' },
    { code: 'ml', range: /[\u0D00-\u0D7F]/, name: 'Malayalam' },
    { code: 'gu', range: /[\u0A80-\u0AFF]/, name: 'Gujarati' },
    { code: 'pa', range: /[\u0A00-\u0A7F]/, name: 'Punjabi' },
    { code: 'or', range: /[\u0B00-\u0B7F]/, name: 'Odia' },
    { code: 'ur', range: /[\u0600-\u06FF]/, name: 'Urdu' },
    { code: 'ar', range: /[\u0600-\u06FF]/, name: 'Arabic' },
  ];

  for (const range of ranges) {
    if (range.range.test(text)) {
      return range.code;
    }
  }

  // Fallback to franc library
  try {
    const detected = franc(text, { only: ['eng', 'hin', 'ben', 'san', 'urd', 'ara', 'spa', 'fra', 'deu'] });
    return detected || 'en';
  } catch {
    return 'en'; // Default to English
  }
};

export const getLanguageName = (code: string): string => {
  const languages: { [key: string]: string } = {
    en: 'English',
    bn: 'Bengali',
    hi: 'Hindi',
    sa: 'Sanskrit',
    te: 'Telugu',
    ta: 'Tamil',
    kn: 'Kannada',
    ml: 'Malayalam',
    gu: 'Gujarati',
    pa: 'Punjabi',
    or: 'Odia',
    ur: 'Urdu',
    ar: 'Arabic',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
  };
  return languages[code] || code;
};

// ==================== MULTI-LANGUAGE OCR ====================

export const getOCRConfig = (languageCode: string): string => {
  const ocrConfig: { [key: string]: string } = {
    en: 'eng',
    bn: 'ben',
    hi: 'hin',
    sa: 'san',
    te: 'tel',
    ta: 'tam',
    kn: 'kan',
    ml: 'mal',
    gu: 'guj',
    pa: 'pan',
    or: 'ori',
    ur: 'urd',
    ar: 'ara',
    es: 'spa',
    fr: 'fra',
    de: 'deu',
  };
  return ocrConfig[languageCode] || 'eng';
};

export const extractTextWithMultiLanguageOCR = async (
  imageBuffer: Buffer,
  languageCode: string = 'en'
): Promise<string> => {
  try {
    const ocrLang = getOCRConfig(languageCode);
    console.log(`🖼️ OCR with language: ${ocrLang} (${languageCode})`);

    const result = await Tesseract.recognize(
      imageBuffer,
      ocrLang,
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`  OCR: ${Math.round(m.progress * 100)}%`);
          }
        },
      }
    );

    return result.data.text;
  } catch (error) {
    console.error('❌ OCR Error:', error);
    throw error;
  }
};

// ==================== TRANSLATION ====================

import { TranslationServiceClient } from '@google-cloud/translate';

let translationClient: TranslationServiceClient | null = null;

export const getTranslationClient = () => {
  if (!translationClient) {
    translationClient = new TranslationServiceClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }
  return translationClient;
};

export const translateText = async (
  text: string,
  targetLanguage: string = 'en',
  sourceLanguage?: string
): Promise<string> => {
  try {
    // If target is same as source, return original
    if (sourceLanguage === targetLanguage) {
      return text;
    }

    const client = getTranslationClient();

    const projectId = process.env.GOOGLE_PROJECT_ID;
    const location = 'global';
    const parent = `projects/${projectId}/locations/${location}`;

    const request: any = {
      parent,
      contents: [text],
      mimeType: 'text/plain',
      targetLanguageCode: targetLanguage,
    };

    if (sourceLanguage) {
      request.sourceLanguageCode = sourceLanguage;
    }

    const [response] = await client.translateText(request);
    const translation = response.translations?.[0]?.translatedText || text;

    return translation;
  } catch (error) {
    console.error('❌ Translation Error:', error);
    return text;
  }
};

// ==================== MULTI-LANGUAGE TEXT PROCESSING ====================

export interface ProcessedText {
  original: string;
  originalLanguage: string;
  english: string;
  detectedLanguage: string;
}

export const processMultiLanguageText = async (
  text: string
): Promise<ProcessedText> => {
  const detectedLanguage = detectLanguage(text);
  const isEnglish = detectedLanguage === 'en';

  let englishText = text;

  if (!isEnglish) {
    console.log(`🔄 Translating from ${detectedLanguage} to English...`);
    englishText = await translateText(text, 'en', detectedLanguage);
  }

  return {
    original: text,
    originalLanguage: detectedLanguage,
    english: englishText,
    detectedLanguage,
  };
};
