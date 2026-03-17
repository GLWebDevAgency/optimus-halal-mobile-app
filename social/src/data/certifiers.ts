import { z } from "zod";
import { certSpotlightSchema } from "../compositions/CertificateurSpotlight";

type CertData = z.infer<typeof certSpotlightSchema>;

/**
 * 6 certifiers — data from backend/asset/certification-list.json
 * Covers the full spectrum: S-tier to F-tier.
 * Principle: "Présenter les faits" — no judgment, only measured rigor.
 */
export const CERTIFIERS: CertData[] = [
  {
    name: "AVS",
    country: "France",
    founded: "1991",
    trustScore: 100,
    tier: "S",
    controllersEmployees: true,
    controllersPresentEach: true,
    salariedSlaughterers: true,
    acceptsMechanical: false,
    acceptsElectronarcosis: false,
    acceptsStunning: false,
    mode: "dark",
  },
  {
    name: "ACHAHADA",
    country: "France",
    founded: "2009",
    trustScore: 89,
    tier: "A",
    controllersEmployees: true,
    controllersPresentEach: true,
    salariedSlaughterers: false,
    acceptsMechanical: false,
    acceptsElectronarcosis: false,
    acceptsStunning: false,
    mode: "dark",
  },
  {
    name: "MCI",
    country: "France",
    trustScore: 72,
    tier: "B",
    controllersEmployees: true,
    controllersPresentEach: true,
    salariedSlaughterers: false,
    acceptsMechanical: false,
    acceptsElectronarcosis: true,
    acceptsStunning: false,
    mode: "dark",
  },
  {
    name: "ARGML",
    country: "France",
    trustScore: 44,
    tier: "C",
    controllersEmployees: false,
    controllersPresentEach: false,
    salariedSlaughterers: false,
    acceptsMechanical: true,
    acceptsElectronarcosis: false,
    acceptsStunning: false,
    mode: "dark",
  },
  {
    name: "SFCVH",
    country: "France",
    founded: "1994",
    trustScore: 0,
    tier: "F",
    controllersEmployees: false,
    controllersPresentEach: false,
    salariedSlaughterers: false,
    acceptsMechanical: true,
    acceptsElectronarcosis: true,
    acceptsStunning: true,
    mode: "dark",
  },
  {
    name: "AFCAI",
    country: "France",
    founded: "1992",
    trustScore: 0,
    tier: "F",
    controllersEmployees: false,
    controllersPresentEach: false,
    salariedSlaughterers: false,
    acceptsMechanical: true,
    acceptsElectronarcosis: true,
    acceptsStunning: true,
    mode: "dark",
  },
];
