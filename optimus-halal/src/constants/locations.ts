/**
 * Locations Constants
 * 
 * Liste des villes françaises principales pour le sélecteur de localisation
 */

export interface City {
  name: string;
  region: string;
  postalCode: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Principales villes françaises triées par population
 */
export const FRENCH_CITIES: City[] = [
  // Île-de-France
  { name: "Paris", region: "Île-de-France", postalCode: "75000", coordinates: { latitude: 48.8566, longitude: 2.3522 } },
  { name: "Boulogne-Billancourt", region: "Île-de-France", postalCode: "92100", coordinates: { latitude: 48.8396, longitude: 2.2399 } },
  { name: "Saint-Denis", region: "Île-de-France", postalCode: "93200", coordinates: { latitude: 48.9362, longitude: 2.3574 } },
  { name: "Argenteuil", region: "Île-de-France", postalCode: "95100", coordinates: { latitude: 48.9478, longitude: 2.2474 } },
  { name: "Montreuil", region: "Île-de-France", postalCode: "93100", coordinates: { latitude: 48.8635, longitude: 2.4485 } },
  { name: "Nanterre", region: "Île-de-France", postalCode: "92000", coordinates: { latitude: 48.8924, longitude: 2.2066 } },
  { name: "Créteil", region: "Île-de-France", postalCode: "94000", coordinates: { latitude: 48.7904, longitude: 2.4553 } },
  { name: "Versailles", region: "Île-de-France", postalCode: "78000", coordinates: { latitude: 48.8014, longitude: 2.1301 } },
  { name: "Vitry-sur-Seine", region: "Île-de-France", postalCode: "94400", coordinates: { latitude: 48.7876, longitude: 2.3927 } },
  { name: "Colombes", region: "Île-de-France", postalCode: "92700", coordinates: { latitude: 48.9225, longitude: 2.2527 } },
  { name: "Aubervilliers", region: "Île-de-France", postalCode: "93300", coordinates: { latitude: 48.9145, longitude: 2.3820 } },
  { name: "Asnières-sur-Seine", region: "Île-de-France", postalCode: "92600", coordinates: { latitude: 48.9148, longitude: 2.2853 } },
  { name: "Aulnay-sous-Bois", region: "Île-de-France", postalCode: "93600", coordinates: { latitude: 48.9389, longitude: 2.4957 } },
  { name: "Courbevoie", region: "Île-de-France", postalCode: "92400", coordinates: { latitude: 48.8967, longitude: 2.2528 } },
  
  // Auvergne-Rhône-Alpes
  { name: "Lyon", region: "Auvergne-Rhône-Alpes", postalCode: "69000", coordinates: { latitude: 45.7640, longitude: 4.8357 } },
  { name: "Saint-Étienne", region: "Auvergne-Rhône-Alpes", postalCode: "42000", coordinates: { latitude: 45.4397, longitude: 4.3872 } },
  { name: "Grenoble", region: "Auvergne-Rhône-Alpes", postalCode: "38000", coordinates: { latitude: 45.1885, longitude: 5.7245 } },
  { name: "Villeurbanne", region: "Auvergne-Rhône-Alpes", postalCode: "69100", coordinates: { latitude: 45.7676, longitude: 4.8792 } },
  { name: "Clermont-Ferrand", region: "Auvergne-Rhône-Alpes", postalCode: "63000", coordinates: { latitude: 45.7772, longitude: 3.0870 } },
  { name: "Vénissieux", region: "Auvergne-Rhône-Alpes", postalCode: "69200", coordinates: { latitude: 45.7000, longitude: 4.8860 } },
  { name: "Valence", region: "Auvergne-Rhône-Alpes", postalCode: "26000", coordinates: { latitude: 44.9334, longitude: 4.8924 } },
  { name: "Annecy", region: "Auvergne-Rhône-Alpes", postalCode: "74000", coordinates: { latitude: 45.8992, longitude: 6.1294 } },
  
  // Nouvelle-Aquitaine
  { name: "Bordeaux", region: "Nouvelle-Aquitaine", postalCode: "33000", coordinates: { latitude: 44.8378, longitude: -0.5792 } },
  { name: "Limoges", region: "Nouvelle-Aquitaine", postalCode: "87000", coordinates: { latitude: 45.8336, longitude: 1.2611 } },
  { name: "Poitiers", region: "Nouvelle-Aquitaine", postalCode: "86000", coordinates: { latitude: 46.5802, longitude: 0.3404 } },
  { name: "Pau", region: "Nouvelle-Aquitaine", postalCode: "64000", coordinates: { latitude: 43.2951, longitude: -0.3708 } },
  { name: "Mérignac", region: "Nouvelle-Aquitaine", postalCode: "33700", coordinates: { latitude: 44.8387, longitude: -0.6437 } },
  { name: "La Rochelle", region: "Nouvelle-Aquitaine", postalCode: "17000", coordinates: { latitude: 46.1603, longitude: -1.1511 } },
  
  // Occitanie
  { name: "Toulouse", region: "Occitanie", postalCode: "31000", coordinates: { latitude: 43.6047, longitude: 1.4442 } },
  { name: "Montpellier", region: "Occitanie", postalCode: "34000", coordinates: { latitude: 43.6108, longitude: 3.8767 } },
  { name: "Nîmes", region: "Occitanie", postalCode: "30000", coordinates: { latitude: 43.8367, longitude: 4.3601 } },
  { name: "Perpignan", region: "Occitanie", postalCode: "66000", coordinates: { latitude: 42.6887, longitude: 2.8948 } },
  { name: "Béziers", region: "Occitanie", postalCode: "34500", coordinates: { latitude: 43.3440, longitude: 3.2151 } },
  { name: "Narbonne", region: "Occitanie", postalCode: "11100", coordinates: { latitude: 43.1836, longitude: 3.0028 } },
  
  // Provence-Alpes-Côte d'Azur
  { name: "Marseille", region: "Provence-Alpes-Côte d'Azur", postalCode: "13000", coordinates: { latitude: 43.2965, longitude: 5.3698 } },
  { name: "Nice", region: "Provence-Alpes-Côte d'Azur", postalCode: "06000", coordinates: { latitude: 43.7102, longitude: 7.2620 } },
  { name: "Toulon", region: "Provence-Alpes-Côte d'Azur", postalCode: "83000", coordinates: { latitude: 43.1242, longitude: 5.9280 } },
  { name: "Aix-en-Provence", region: "Provence-Alpes-Côte d'Azur", postalCode: "13100", coordinates: { latitude: 43.5297, longitude: 5.4474 } },
  { name: "Avignon", region: "Provence-Alpes-Côte d'Azur", postalCode: "84000", coordinates: { latitude: 43.9493, longitude: 4.8055 } },
  { name: "Cannes", region: "Provence-Alpes-Côte d'Azur", postalCode: "06400", coordinates: { latitude: 43.5528, longitude: 7.0174 } },
  { name: "Antibes", region: "Provence-Alpes-Côte d'Azur", postalCode: "06600", coordinates: { latitude: 43.5804, longitude: 7.1251 } },
  
  // Hauts-de-France
  { name: "Lille", region: "Hauts-de-France", postalCode: "59000", coordinates: { latitude: 50.6292, longitude: 3.0573 } },
  { name: "Amiens", region: "Hauts-de-France", postalCode: "80000", coordinates: { latitude: 49.8941, longitude: 2.2958 } },
  { name: "Roubaix", region: "Hauts-de-France", postalCode: "59100", coordinates: { latitude: 50.6942, longitude: 3.1746 } },
  { name: "Tourcoing", region: "Hauts-de-France", postalCode: "59200", coordinates: { latitude: 50.7237, longitude: 3.1613 } },
  { name: "Dunkerque", region: "Hauts-de-France", postalCode: "59140", coordinates: { latitude: 51.0343, longitude: 2.3768 } },
  { name: "Calais", region: "Hauts-de-France", postalCode: "62100", coordinates: { latitude: 50.9513, longitude: 1.8587 } },
  
  // Grand Est
  { name: "Strasbourg", region: "Grand Est", postalCode: "67000", coordinates: { latitude: 48.5734, longitude: 7.7521 } },
  { name: "Reims", region: "Grand Est", postalCode: "51100", coordinates: { latitude: 49.2583, longitude: 4.0317 } },
  { name: "Metz", region: "Grand Est", postalCode: "57000", coordinates: { latitude: 49.1193, longitude: 6.1757 } },
  { name: "Mulhouse", region: "Grand Est", postalCode: "68100", coordinates: { latitude: 47.7508, longitude: 7.3359 } },
  { name: "Nancy", region: "Grand Est", postalCode: "54000", coordinates: { latitude: 48.6921, longitude: 6.1844 } },
  { name: "Colmar", region: "Grand Est", postalCode: "68000", coordinates: { latitude: 48.0793, longitude: 7.3586 } },
  
  // Pays de la Loire
  { name: "Nantes", region: "Pays de la Loire", postalCode: "44000", coordinates: { latitude: 47.2184, longitude: -1.5536 } },
  { name: "Le Mans", region: "Pays de la Loire", postalCode: "72000", coordinates: { latitude: 47.9959, longitude: 0.1996 } },
  { name: "Angers", region: "Pays de la Loire", postalCode: "49000", coordinates: { latitude: 47.4784, longitude: -0.5632 } },
  { name: "Saint-Nazaire", region: "Pays de la Loire", postalCode: "44600", coordinates: { latitude: 47.2736, longitude: -2.2129 } },
  { name: "La Roche-sur-Yon", region: "Pays de la Loire", postalCode: "85000", coordinates: { latitude: 46.6706, longitude: -1.4264 } },
  
  // Bretagne
  { name: "Rennes", region: "Bretagne", postalCode: "35000", coordinates: { latitude: 48.1173, longitude: -1.6778 } },
  { name: "Brest", region: "Bretagne", postalCode: "29200", coordinates: { latitude: 48.3904, longitude: -4.4861 } },
  { name: "Quimper", region: "Bretagne", postalCode: "29000", coordinates: { latitude: 47.9960, longitude: -4.1024 } },
  { name: "Lorient", region: "Bretagne", postalCode: "56100", coordinates: { latitude: 47.7482, longitude: -3.3666 } },
  { name: "Vannes", region: "Bretagne", postalCode: "56000", coordinates: { latitude: 47.6559, longitude: -2.7603 } },
  { name: "Saint-Brieuc", region: "Bretagne", postalCode: "22000", coordinates: { latitude: 48.5139, longitude: -2.7600 } },
  
  // Normandie
  { name: "Le Havre", region: "Normandie", postalCode: "76600", coordinates: { latitude: 49.4944, longitude: 0.1079 } },
  { name: "Rouen", region: "Normandie", postalCode: "76000", coordinates: { latitude: 49.4432, longitude: 1.0999 } },
  { name: "Caen", region: "Normandie", postalCode: "14000", coordinates: { latitude: 49.1829, longitude: -0.3707 } },
  { name: "Cherbourg-en-Cotentin", region: "Normandie", postalCode: "50100", coordinates: { latitude: 49.6337, longitude: -1.6222 } },
  { name: "Évreux", region: "Normandie", postalCode: "27000", coordinates: { latitude: 49.0270, longitude: 1.1510 } },
  
  // Centre-Val de Loire
  { name: "Tours", region: "Centre-Val de Loire", postalCode: "37000", coordinates: { latitude: 47.3941, longitude: 0.6848 } },
  { name: "Orléans", region: "Centre-Val de Loire", postalCode: "45000", coordinates: { latitude: 47.9029, longitude: 1.9039 } },
  { name: "Bourges", region: "Centre-Val de Loire", postalCode: "18000", coordinates: { latitude: 47.0833, longitude: 2.4000 } },
  { name: "Blois", region: "Centre-Val de Loire", postalCode: "41000", coordinates: { latitude: 47.5861, longitude: 1.3359 } },
  { name: "Chartres", region: "Centre-Val de Loire", postalCode: "28000", coordinates: { latitude: 48.4439, longitude: 1.4890 } },
  
  // Bourgogne-Franche-Comté
  { name: "Dijon", region: "Bourgogne-Franche-Comté", postalCode: "21000", coordinates: { latitude: 47.3220, longitude: 5.0415 } },
  { name: "Besançon", region: "Bourgogne-Franche-Comté", postalCode: "25000", coordinates: { latitude: 47.2378, longitude: 6.0241 } },
  { name: "Belfort", region: "Bourgogne-Franche-Comté", postalCode: "90000", coordinates: { latitude: 47.6383, longitude: 6.8628 } },
  { name: "Chalon-sur-Saône", region: "Bourgogne-Franche-Comté", postalCode: "71100", coordinates: { latitude: 46.7833, longitude: 4.8500 } },
  
  // Corse
  { name: "Ajaccio", region: "Corse", postalCode: "20000", coordinates: { latitude: 41.9192, longitude: 8.7386 } },
  { name: "Bastia", region: "Corse", postalCode: "20200", coordinates: { latitude: 42.6970, longitude: 9.4503 } },
];

/**
 * Régions françaises
 */
export const FRENCH_REGIONS = [
  "Île-de-France",
  "Auvergne-Rhône-Alpes",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Provence-Alpes-Côte d'Azur",
  "Hauts-de-France",
  "Grand Est",
  "Pays de la Loire",
  "Bretagne",
  "Normandie",
  "Centre-Val de Loire",
  "Bourgogne-Franche-Comté",
  "Corse",
] as const;

export type FrenchRegion = typeof FRENCH_REGIONS[number];

/**
 * Recherche de villes par nom (insensible à la casse, accent-tolerant)
 */
export function searchCities(query: string): City[] {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  
  return FRENCH_CITIES.filter((city) => {
    const normalizedName = city.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    
    return normalizedName.includes(normalizedQuery);
  }).slice(0, 10); // Limite à 10 résultats
}

/**
 * Trouve la ville la plus proche des coordonnées GPS
 */
export function findNearestCity(
  latitude: number,
  longitude: number
): City | null {
  if (!latitude || !longitude) return null;
  
  let nearestCity: City | null = null;
  let minDistance = Infinity;
  
  for (const city of FRENCH_CITIES) {
    const distance = calculateDistance(
      latitude,
      longitude,
      city.coordinates.latitude,
      city.coordinates.longitude
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city;
    }
  }
  
  return nearestCity;
}

/**
 * Calcule la distance entre deux points GPS (formule de Haversine)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
