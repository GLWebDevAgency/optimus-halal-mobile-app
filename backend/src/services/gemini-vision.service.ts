/**
 * Gemini Vision Service — Image-based extraction using gemini-2.5-flash.
 *
 * Three capabilities:
 *   1. Extract ingredients from a photo of an ingredient label
 *   2. Extract nutrition table from a photo of a nutrition label
 *   3. Validate whether a photo is a food product label
 *
 * Uses the same @google/generative-ai SDK as the text extraction provider.
 * All functions accept base64-encoded images (JPEG/PNG).
 *
 * @see services/ai-extract/providers/gemini.provider.ts — text extraction pattern
 */

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// ── Types ───────────────────────────────────────────────

export interface VisionIngredientsResult {
  ingredients: string[];
  additives: string[];
  lang: string;
  confidence: number;
}

export interface VisionNutritionResult {
  energyKcal100g: number | null;
  fat100g: number | null;
  saturatedFat100g: number | null;
  carbohydrates100g: number | null;
  sugars100g: number | null;
  fiber100g: number | null;
  proteins100g: number | null;
  salt100g: number | null;
  servingSize: string | null;
  confidence: number;
}

export interface VisionValidationResult {
  isFood: boolean;
  isLabel: boolean;
  productType: string | null;
  confidence: number;
}

// ── Singleton Client ────────────────────────────────────

let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (_client) return _client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  _client = new GoogleGenerativeAI(apiKey);
  return _client;
}

const MODEL_ID = "gemini-2.5-flash";

// ── Helper ──────────────────────────────────────────────

function imagePart(base64: string, mimeType: string = "image/jpeg") {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
}

// ── 1. Extract Ingredients from Photo ───────────────────

export async function extractIngredientsFromPhoto(
  imageBase64: string,
  mimeType: string = "image/jpeg",
): Promise<VisionIngredientsResult> {
  const model = getClient().getGenerativeModel({
    model: MODEL_ID,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          ingredients: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Flat list of all ingredients, cleaned and deduplicated.",
          },
          additives: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "E-codes normalized to lowercase (e.g. 'e471').",
          },
          lang: {
            type: SchemaType.STRING,
            description: "ISO 639-1 language code of the ingredients text.",
          },
          confidence: {
            type: SchemaType.NUMBER,
            description: "Confidence score from 0 to 1.",
          },
        },
        required: ["ingredients", "additives", "lang", "confidence"],
      },
      temperature: 0,
      maxOutputTokens: 4096,
    },
  });

  const result = await model.generateContent([
    "Extract ALL ingredients from this food product label photo. " +
    "Return a flat list of ingredients (cleaned, deduplicated) and a separate list of E-codes (lowercase). " +
    "If the image is not a food label, return empty arrays with confidence 0.",
    imagePart(imageBase64, mimeType),
  ]);

  return JSON.parse(result.response.text()) as VisionIngredientsResult;
}

// ── 2. Extract Nutrition Table from Photo ───────────────

export async function extractNutritionFromPhoto(
  imageBase64: string,
  mimeType: string = "image/jpeg",
): Promise<VisionNutritionResult> {
  const model = getClient().getGenerativeModel({
    model: MODEL_ID,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          energyKcal100g: { type: SchemaType.NUMBER, nullable: true, description: "Energy in kcal per 100g" },
          fat100g: { type: SchemaType.NUMBER, nullable: true, description: "Fat in g per 100g" },
          saturatedFat100g: { type: SchemaType.NUMBER, nullable: true, description: "Saturated fat in g per 100g" },
          carbohydrates100g: { type: SchemaType.NUMBER, nullable: true, description: "Carbohydrates in g per 100g" },
          sugars100g: { type: SchemaType.NUMBER, nullable: true, description: "Sugars in g per 100g" },
          fiber100g: { type: SchemaType.NUMBER, nullable: true, description: "Fiber in g per 100g" },
          proteins100g: { type: SchemaType.NUMBER, nullable: true, description: "Proteins in g per 100g" },
          salt100g: { type: SchemaType.NUMBER, nullable: true, description: "Salt in g per 100g" },
          servingSize: { type: SchemaType.STRING, nullable: true, description: "Serving size text if visible" },
          confidence: { type: SchemaType.NUMBER, description: "Confidence score from 0 to 1" },
        },
        required: ["confidence"],
      },
      temperature: 0,
      maxOutputTokens: 2048,
    },
  });

  const result = await model.generateContent([
    "Extract the nutrition facts table from this food product label photo. " +
    "Return ALL values per 100g. If a column shows 'per serving' and 'per 100g', use the per 100g column. " +
    "Convert kJ to kcal if needed (÷ 4.184). Return null for missing values.",
    imagePart(imageBase64, mimeType),
  ]);

  return JSON.parse(result.response.text()) as VisionNutritionResult;
}

// ── 3. Validate Food Product Photo ──────────────────────

export async function validateFoodPhoto(
  imageBase64: string,
  mimeType: string = "image/jpeg",
): Promise<VisionValidationResult> {
  const model = getClient().getGenerativeModel({
    model: MODEL_ID,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          isFood: { type: SchemaType.BOOLEAN, description: "Is this a food product?" },
          isLabel: { type: SchemaType.BOOLEAN, description: "Does the photo show a product label (ingredients/nutrition)?" },
          productType: { type: SchemaType.STRING, nullable: true, description: "Brief product type if identifiable (e.g. 'chocolate bar', 'yogurt')" },
          confidence: { type: SchemaType.NUMBER, description: "Confidence score from 0 to 1" },
        },
        required: ["isFood", "isLabel", "confidence"],
      },
      temperature: 0,
      maxOutputTokens: 512,
    },
  });

  const result = await model.generateContent([
    "Is this a photo of a food product or its label? " +
    "Determine: (1) isFood — is this a food/beverage product, " +
    "(2) isLabel — does the photo show an ingredient list or nutrition facts, " +
    "(3) productType — what kind of product if identifiable.",
    imagePart(imageBase64, mimeType),
  ]);

  return JSON.parse(result.response.text()) as VisionValidationResult;
}
