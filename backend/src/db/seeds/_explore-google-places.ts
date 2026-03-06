/**
 * Google Places API (New) — Store Enrichment Explorer
 *
 * Tests the API on 8 diverse sample stores to evaluate data quality
 * before committing to a full enrichment pipeline.
 *
 * Usage:
 *   pnpm tsx --env-file=.env src/db/seeds/_explore-google-places.ts
 *
 * Requires: GOOGLE_PLACES_API_KEY in .env
 *
 * API Reference: https://developers.google.com/maps/documentation/places/web-service/text-search
 */

// ── 8 diverse sample stores ──────────────────────────────────────────

const SAMPLE_STORES = [
  {
    id: "5ad2fe54-53f0-42dc-b770-493b8778425a",
    name: "BOUCHERIE BOUDALIA",
    address: "37, boulevard de Belleville",
    city: "Paris 11",
    postalCode: "75011",
    storeType: "butcher",
    certifier: "avs",
    lat: 48.8689955,
    lng: 2.3802444,
  },
  {
    id: "12c2999d-6b65-4265-9a30-30ad3d9bf9c3",
    name: "GRILLADES AU FEU DE BOIS",
    address: "10, rue de Chartres",
    city: "Paris 18",
    postalCode: "75018",
    storeType: "restaurant",
    certifier: "avs",
    lat: 48.8845539,
    lng: 2.3549882,
  },
  {
    id: "4e64a5cc-6a98-42f1-ad1e-f57760232928",
    name: "Azul Restaurant",
    address: "103 rue Pierre Brossolette",
    city: "Sarcelles",
    postalCode: "95200",
    storeType: "restaurant",
    certifier: "achahada",
    lat: 48.99429,
    lng: 2.37834,
  },
  {
    id: "a87e1327-ec85-4a84-abdc-840ef37076ec",
    name: "SOCOPA COUTANCES",
    address: "rue petite vitesse",
    city: "Coutances",
    postalCode: "50205",
    storeType: "wholesaler",
    certifier: "avs",
    lat: 47.8418483,
    lng: -0.3451175,
  },
  {
    id: "c26d5f70-a10e-47d8-bdb0-6fd283850d8b",
    name: "DPS Market Toulouse",
    address: "88 Bd de Courties,",
    city: "Portet-sur-Garonne",
    postalCode: "31120",
    storeType: "supermarket",
    certifier: "achahada",
    lat: 43.53419,
    lng: 1.38706,
  },
  {
    id: "e6f536ae-267a-475c-81db-d4e1904cc73d",
    name: "YASMINE",
    address: "39, rue de la Gare",
    city: "Deuil la Barre",
    postalCode: "95170",
    storeType: "butcher",
    certifier: "avs",
    lat: 48.9752904,
    lng: 2.3392937,
  },
  {
    id: "c433a838-cff6-4b01-97b8-a666df638503",
    name: "Pepper Grill Saint Maximin",
    address: "288 Rue Saint-Just 60740 Saint-Maximin",
    city: "Saint-Maximin",
    postalCode: null,
    storeType: "restaurant",
    certifier: "achahada",
    lat: 49.2426,
    lng: 2.47048,
  },
  {
    id: "4d225b58-07a0-42c0-87d4-bcaa1bd1659f",
    name: "ONYXIA",
    address: "Centre commercial Créteil Soleil",
    city: "Créteil",
    postalCode: "94012",
    storeType: "restaurant",
    certifier: "avs",
    lat: 48.7800207,
    lng: 2.4573906,
  },
];

// ── Google Places API (New) helpers ─────────────────────────────────

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!API_KEY) {
  console.error("❌ GOOGLE_PLACES_API_KEY is required in .env");
  console.error("   Get one at: https://console.cloud.google.com/apis/credentials");
  console.error("   Enable: Places API (New)");
  process.exit(1);
}

const PLACES_BASE = "https://places.googleapis.com/v1/places";

// All fields we want to explore — we'll see which ones come back
const ALL_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.websiteUri",
  "places.internationalPhoneNumber",
  "places.nationalPhoneNumber",
  "places.regularOpeningHours",
  "places.photos",
  "places.editorialSummary",
  "places.types",
  "places.priceLevel",
  "places.businessStatus",
  "places.currentOpeningHours",
  "places.delivery",
  "places.dineIn",
  "places.takeout",
  "places.reviews",
].join(",");

interface PlaceResult {
  id: string;
  displayName?: { text: string; languageCode: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  websiteUri?: string;
  internationalPhoneNumber?: string;
  nationalPhoneNumber?: string;
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
    openNow?: boolean;
    periods?: Array<{
      open: { day: number; hour: number; minute: number };
      close: { day: number; hour: number; minute: number };
    }>;
  };
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
    authorAttributions?: Array<{ displayName: string; uri: string }>;
  }>;
  editorialSummary?: { text: string; languageCode: string };
  types?: string[];
  priceLevel?: string;
  businessStatus?: string;
  currentOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  delivery?: boolean;
  dineIn?: boolean;
  takeout?: boolean;
  reviews?: Array<{
    name: string;
    rating: number;
    text?: { text: string; languageCode: string };
    authorAttribution?: { displayName: string; uri: string; photoUri: string };
    relativePublishTimeDescription?: string;
    publishTime?: string;
  }>;
}

/**
 * Search for a store using Google Places Text Search (New API)
 */
async function textSearch(store: (typeof SAMPLE_STORES)[0]): Promise<PlaceResult | null> {
  // Build a search query combining name + address for best match
  const query = `${store.name} ${store.address} ${store.city}`;

  const body = {
    textQuery: query,
    languageCode: "fr",
    // Bias results near the known location (500m radius)
    locationBias: {
      circle: {
        center: { latitude: store.lat, longitude: store.lng },
        radius: 500.0,
      },
    },
    maxResultCount: 1,
  };

  const response = await fetch(`${PLACES_BASE}:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY!,
      "X-Goog-FieldMask": ALL_FIELDS,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`  ⚠ API error: ${response.status} — ${err}`);
    return null;
  }

  const data = (await response.json()) as { places?: PlaceResult[] };
  return data.places?.[0] ?? null;
}

/**
 * Get a photo URL from a photo reference
 */
function getPhotoUrl(photoName: string, maxWidth: number = 400): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${API_KEY}`;
}

// ── Main exploration loop ───────────────────────────────────────────

async function main() {
  console.log("━━━ Google Places API (New) — Store Enrichment Explorer ━━━\n");
  console.log(`Testing ${SAMPLE_STORES.length} diverse stores...\n`);

  const results: Array<{
    store: (typeof SAMPLE_STORES)[0];
    place: PlaceResult | null;
  }> = [];

  for (const store of SAMPLE_STORES) {
    console.log(`─── ${store.name} (${store.storeType}, ${store.certifier}) ───`);
    console.log(`  📍 ${store.address}, ${store.city} ${store.postalCode ?? ""}`);

    const place = await textSearch(store);
    results.push({ store, place });

    if (!place) {
      console.log("  ❌ No match found\n");
      continue;
    }

    // Display name comparison
    console.log(`  ✅ Google: "${place.displayName?.text}"`);
    console.log(`     Address: ${place.formattedAddress}`);

    // Distance check (simple approximation)
    if (place.location) {
      const dLat = Math.abs(place.location.latitude - store.lat);
      const dLng = Math.abs(place.location.longitude - store.lng);
      const distM = Math.sqrt(dLat ** 2 + dLng ** 2) * 111_000; // rough meters
      console.log(`     Distance from our coords: ~${Math.round(distM)}m`);
    }

    // Rating
    if (place.rating !== undefined) {
      console.log(`  ⭐ Rating: ${place.rating}/5 (${place.userRatingCount ?? 0} reviews)`);
    } else {
      console.log(`  ⭐ Rating: N/A`);
    }

    // Business status
    if (place.businessStatus) {
      console.log(`  🏪 Status: ${place.businessStatus}`);
    }

    // Phone
    if (place.nationalPhoneNumber) {
      console.log(`  📞 Phone: ${place.nationalPhoneNumber}`);
    }

    // Website
    if (place.websiteUri) {
      console.log(`  🌐 Website: ${place.websiteUri}`);
    }

    // Google Maps URL
    if (place.googleMapsUri) {
      console.log(`  🗺️  Maps: ${place.googleMapsUri}`);
    }

    // Photos
    if (place.photos && place.photos.length > 0) {
      console.log(`  📸 Photos: ${place.photos.length} available`);
      // Show first photo URL
      const firstPhoto = place.photos[0];
      console.log(`     First: ${firstPhoto.widthPx}×${firstPhoto.heightPx}px`);
      console.log(`     URL: ${getPhotoUrl(firstPhoto.name)}`);
    } else {
      console.log(`  📸 Photos: none`);
    }

    // Editorial summary
    if (place.editorialSummary?.text) {
      console.log(`  📝 Description: "${place.editorialSummary.text}"`);
    }

    // Opening hours
    if (place.regularOpeningHours?.weekdayDescriptions) {
      console.log(`  🕐 Hours:`);
      for (const day of place.regularOpeningHours.weekdayDescriptions) {
        console.log(`     ${day}`);
      }
      if (place.regularOpeningHours.openNow !== undefined) {
        console.log(`     Currently: ${place.regularOpeningHours.openNow ? "OPEN" : "CLOSED"}`);
      }
    } else {
      console.log(`  🕐 Hours: N/A`);
    }

    // Service options (restaurants)
    const services = [];
    if (place.delivery) services.push("delivery");
    if (place.dineIn) services.push("dine-in");
    if (place.takeout) services.push("takeout");
    if (services.length > 0) {
      console.log(`  🍽️  Services: ${services.join(", ")}`);
    }

    // Price level
    if (place.priceLevel) {
      console.log(`  💰 Price: ${place.priceLevel}`);
    }

    // Types
    if (place.types) {
      console.log(`  🏷️  Types: ${place.types.join(", ")}`);
    }

    // Reviews (show first 2)
    if (place.reviews && place.reviews.length > 0) {
      console.log(`  💬 Reviews (top ${Math.min(2, place.reviews.length)} of ${place.reviews.length}):`);
      for (const review of place.reviews.slice(0, 2)) {
        const author = review.authorAttribution?.displayName ?? "Anonymous";
        const text = review.text?.text?.slice(0, 120) ?? "(no text)";
        console.log(`     ${author} — ⭐${review.rating}: "${text}${text.length >= 120 ? "..." : ""}"`);
      }
    }

    // Google Place ID (for future reference)
    console.log(`  🆔 Place ID: ${place.id}`);

    console.log();

    // Rate limit: 100ms between requests
    await new Promise((r) => setTimeout(r, 100));
  }

  // ── Summary report ─────────────────────────────────────────────

  console.log("━━━ SUMMARY REPORT ━━━\n");

  const matched = results.filter((r) => r.place !== null);
  console.log(`Match rate: ${matched.length}/${SAMPLE_STORES.length} (${Math.round((matched.length / SAMPLE_STORES.length) * 100)}%)\n`);

  // Field coverage
  const fields = {
    rating: 0,
    reviews: 0,
    photos: 0,
    hours: 0,
    phone: 0,
    website: 0,
    description: 0,
    priceLevel: 0,
    delivery: 0,
  };

  for (const { place } of matched) {
    if (!place) continue;
    if (place.rating !== undefined) fields.rating++;
    if (place.reviews && place.reviews.length > 0) fields.reviews++;
    if (place.photos && place.photos.length > 0) fields.photos++;
    if (place.regularOpeningHours?.weekdayDescriptions) fields.hours++;
    if (place.nationalPhoneNumber) fields.phone++;
    if (place.websiteUri) fields.website++;
    if (place.editorialSummary?.text) fields.description++;
    if (place.priceLevel) fields.priceLevel++;
    if (place.delivery !== undefined) fields.delivery++;
  }

  console.log("Field coverage (among matched stores):");
  for (const [field, count] of Object.entries(fields)) {
    const pct = matched.length > 0 ? Math.round((count / matched.length) * 100) : 0;
    const bar = "█".repeat(Math.round(pct / 5)) + "░".repeat(20 - Math.round(pct / 5));
    console.log(`  ${field.padEnd(14)} ${bar} ${pct}% (${count}/${matched.length})`);
  }

  // Average photos per store
  const totalPhotos = matched.reduce((sum, { place }) => sum + (place?.photos?.length ?? 0), 0);
  console.log(`\nAvg photos per matched store: ${matched.length > 0 ? (totalPhotos / matched.length).toFixed(1) : "N/A"}`);

  // Average rating
  const ratings = matched
    .map(({ place }) => place?.rating)
    .filter((r): r is number => r !== undefined);
  if (ratings.length > 0) {
    const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    console.log(`Avg Google rating: ${avg.toFixed(2)}/5`);
  }

  // Raw JSON dump for analysis
  console.log("\n━━━ RAW JSON (first match) ━━━\n");
  const firstMatch = matched[0]?.place;
  if (firstMatch) {
    console.log(JSON.stringify(firstMatch, null, 2));
  }
}

main().catch((err) => {
  console.error("❌ Exploration failed:", err);
  process.exit(1);
});
