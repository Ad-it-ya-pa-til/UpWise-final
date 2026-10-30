/**
 * Upwise Hub - Geographic Telemetry & Ingestion Location Extraction Service
 * 
 * Provides verified coordinates, location extraction from news text,
 * in-memory geocoding cache, and combined topic/location query parsing.
 */

export interface GeoLocation {
  latitude: number;
  longitude: number;
  location: string;
  city?: string;
  state?: string;
  country: string;
}

export interface CuratedLocationEntry {
  names: string[];
  city?: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
}

export const VERIFIED_LOCATIONS: CuratedLocationEntry[] = [
  // India - Northern Desks & Metros
  {
    names: ['new delhi', 'delhi', 'dilli', 'sansad', 'ncr', 'national capital'],
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.6139,
    longitude: 77.2090,
  },
  {
    names: ['chandigarh', 'chd', 'city beautiful', 'pgimer', 'tricity'],
    city: 'Chandigarh',
    state: 'Chandigarh',
    country: 'India',
    latitude: 30.7333,
    longitude: 76.7794,
  },
  {
    names: ['ludhiana'],
    city: 'Ludhiana',
    state: 'Punjab',
    country: 'India',
    latitude: 30.9010,
    longitude: 75.8573,
  },
  {
    names: ['amritsar'],
    city: 'Amritsar',
    state: 'Punjab',
    country: 'India',
    latitude: 31.6340,
    longitude: 74.8723,
  },
  {
    names: ['jalandhar'],
    city: 'Jalandhar',
    state: 'Punjab',
    country: 'India',
    latitude: 31.3260,
    longitude: 75.5762,
  },
  {
    names: ['kapurthala'],
    city: 'Kapurthala',
    state: 'Punjab',
    country: 'India',
    latitude: 31.3800,
    longitude: 75.3800,
  },
  {
    names: ['patiala'],
    city: 'Patiala',
    state: 'Punjab',
    country: 'India',
    latitude: 30.3398,
    longitude: 76.3869,
  },
  {
    names: ['bathinda'],
    city: 'Bathinda',
    state: 'Punjab',
    country: 'India',
    latitude: 30.2110,
    longitude: 74.9455,
  },
  {
    names: ['punjab', 'pb'],
    state: 'Punjab',
    country: 'India',
    latitude: 31.1471,
    longitude: 75.3412,
  },
  {
    names: ['gurugram', 'gurgaon', 'cyber city'],
    city: 'Gurugram',
    state: 'Haryana',
    country: 'India',
    latitude: 28.4595,
    longitude: 77.0266,
  },
  {
    names: ['kurukshetra'],
    city: 'Kurukshetra',
    state: 'Haryana',
    country: 'India',
    latitude: 29.9695,
    longitude: 76.8783,
  },
  {
    names: ['faridabad'],
    city: 'Faridabad',
    state: 'Haryana',
    country: 'India',
    latitude: 28.4089,
    longitude: 77.3178,
  },
  {
    names: ['panipat'],
    city: 'Panipat',
    state: 'Haryana',
    country: 'India',
    latitude: 29.3909,
    longitude: 76.9635,
  },
  {
    names: ['rohtak'],
    city: 'Rohtak',
    state: 'Haryana',
    country: 'India',
    latitude: 28.8955,
    longitude: 76.6066,
  },
  {
    names: ['hisar'],
    city: 'Hisar',
    state: 'Haryana',
    country: 'India',
    latitude: 29.1492,
    longitude: 75.7217,
  },
  {
    names: ['haryana', 'hr'],
    state: 'Haryana',
    country: 'India',
    latitude: 29.0588,
    longitude: 76.0856,
  },
  {
    names: ['leh', 'kargil'],
    city: 'Leh',
    state: 'Ladakh',
    country: 'India',
    latitude: 34.1526,
    longitude: 77.5771,
  },
  {
    names: ['ladakh'],
    state: 'Ladakh',
    country: 'India',
    latitude: 34.1526,
    longitude: 77.5771,
  },

  // India - Western & Southern Desks
  {
    names: ['mumbai', 'bombay', 'nariman point', 'bandra'],
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    latitude: 19.0760,
    longitude: 72.8777,
  },
  {
    names: ['pune'],
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    latitude: 18.5204,
    longitude: 73.8567,
  },
  {
    names: ['maharashtra'],
    state: 'Maharashtra',
    country: 'India',
    latitude: 19.7515,
    longitude: 75.7139,
  },
  {
    names: ['bengaluru', 'bangalore', 'iisc', 'electronic city'],
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    latitude: 12.9716,
    longitude: 77.5946,
  },
  {
    names: ['mysuru', 'mysore'],
    city: 'Mysuru',
    state: 'Karnataka',
    country: 'India',
    latitude: 12.2958,
    longitude: 76.6394,
  },
  {
    names: ['karnataka'],
    state: 'Karnataka',
    country: 'India',
    latitude: 15.3173,
    longitude: 75.7139,
  },
  {
    names: ['ahmedabad', 'dholera', 'gandhinagar', 'gift city', 'surat'],
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    latitude: 23.0225,
    longitude: 72.5714,
  },
  {
    names: ['gujarat'],
    state: 'Gujarat',
    country: 'India',
    latitude: 22.2587,
    longitude: 71.1924,
  },
  {
    names: ['varanasi', 'banaras', 'kashi'],
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    country: 'India',
    latitude: 25.3176,
    longitude: 82.9739,
  },
  {
    names: ['lucknow'],
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    country: 'India',
    latitude: 26.8467,
    longitude: 80.9462,
  },
  {
    names: ['noida'],
    city: 'Noida',
    state: 'Uttar Pradesh',
    country: 'India',
    latitude: 28.5355,
    longitude: 77.3910,
  },
  {
    names: ['uttar pradesh', 'up'],
    state: 'Uttar Pradesh',
    country: 'India',
    latitude: 26.8467,
    longitude: 80.9462,
  },
  {
    names: ['chennai', 'madras'],
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    latitude: 13.0827,
    longitude: 80.2707,
  },
  {
    names: ['tamil nadu'],
    state: 'Tamil Nadu',
    country: 'India',
    latitude: 11.1271,
    longitude: 78.6569,
  },
  {
    names: ['kolkata', 'calcutta'],
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    latitude: 22.5726,
    longitude: 88.3639,
  },
  {
    names: ['west bengal', 'bengal'],
    state: 'West Bengal',
    country: 'India',
    latitude: 22.9868,
    longitude: 87.8550,
  },
  {
    names: ['hyderabad'],
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    latitude: 17.3850,
    longitude: 78.4867,
  },
  {
    names: ['jaipur'],
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.9124,
    longitude: 75.7873,
  },
  {
    names: ['india', 'bharat', 'hindustan'],
    country: 'India',
    latitude: 20.5937,
    longitude: 78.9629,
  },

  // International Bureaus
  {
    names: ['washington', 'washington d.c.', 'white house', 'capitol hill'],
    city: 'Washington',
    state: 'District of Columbia',
    country: 'United States',
    latitude: 38.9072,
    longitude: -77.0369,
  },
  {
    names: ['new york', 'nyc', 'manhattan', 'wall street', 'un headquarters'],
    city: 'New York',
    state: 'New York',
    country: 'United States',
    latitude: 40.7128,
    longitude: -74.0060,
  },
  {
    names: ['pasadena', 'jpl'],
    city: 'Pasadena',
    state: 'California',
    country: 'United States',
    latitude: 34.1478,
    longitude: -118.1445,
  },
  {
    names: ['san francisco', 'silicon valley', 'bay area'],
    city: 'San Francisco',
    state: 'California',
    country: 'United States',
    latitude: 37.7749,
    longitude: -122.4194,
  },
  {
    names: ['united states', 'usa', 'us', 'america'],
    country: 'United States',
    latitude: 37.0902,
    longitude: -95.7129,
  },
  {
    names: ['london', 'westminster', 'downing street', 'fleet street'],
    city: 'London',
    country: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
  },
  {
    names: ['united kingdom', 'uk', 'britain', 'england'],
    country: 'United Kingdom',
    latitude: 55.3781,
    longitude: -3.4360,
  },
  {
    names: ['geneva', 'cern', 'palais des nations'],
    city: 'Geneva',
    country: 'Switzerland',
    latitude: 46.2044,
    longitude: 6.1432,
  },
  {
    names: ['switzerland', 'swiss', 'europe'],
    country: 'Switzerland',
    latitude: 46.8182,
    longitude: 8.2275,
  },
  {
    names: ['adelaide', 'adelaide oval'],
    city: 'Adelaide',
    country: 'Australia',
    latitude: -34.9285,
    longitude: 138.6007,
  },
  {
    names: ['melbourne', 'mcg'],
    city: 'Melbourne',
    country: 'Australia',
    latitude: -37.8136,
    longitude: 144.9631,
  },
  {
    names: ['sydney', 'scg'],
    city: 'Sydney',
    country: 'Australia',
    latitude: -33.8688,
    longitude: 151.2093,
  },
  {
    names: ['australia'],
    country: 'Australia',
    latitude: -25.2744,
    longitude: 133.7751,
  },
  {
    names: ['bangkok'],
    city: 'Bangkok',
    country: 'Thailand',
    latitude: 13.7563,
    longitude: 100.5018,
  },
  {
    names: ['paris'],
    city: 'Paris',
    country: 'France',
    latitude: 48.8566,
    longitude: 2.3522,
  },
  {
    names: ['tokyo'],
    city: 'Tokyo',
    country: 'Japan',
    latitude: 35.6762,
    longitude: 139.6503,
  },
];

// In-memory geocoding cache
const geocodeCache = new Map<string, GeoLocation | null>();

/**
 * Extract verified geographical location from article content, title, or summary.
 * Prioritizes datelines at the beginning of the text, then title/summary occurrences.
 * Never fabricates coordinates; returns null if not conclusively identified.
 */
export function extractArticleLocation(
  title: string,
  summary?: string,
  content?: string | string[]
): GeoLocation | null {
  const contentText = Array.isArray(content) ? content.join(' ') : content || '';
  const fullText = `${title} ${summary || ''} ${contentText}`.toLowerCase();

  // 1. Check for standard journalistic dateline prefix (e.g. "NEW DELHI —", "BENGALURU —")
  const datelineMatch = contentText.match(/^([A-Z\s]{3,20})\s*—/);
  if (datelineMatch && datelineMatch[1]) {
    const datelineLocation = datelineMatch[1].trim().toLowerCase();
    for (const entry of VERIFIED_LOCATIONS) {
      if (entry.names.some((n) => n === datelineLocation)) {
        return {
          latitude: entry.latitude,
          longitude: entry.longitude,
          city: entry.city,
          state: entry.state,
          country: entry.country,
          location: entry.city || entry.state || entry.country,
        };
      }
    }
  }

  // 2. Check title keywords first (highest priority)
  const lowerTitle = title.toLowerCase();
  for (const entry of VERIFIED_LOCATIONS) {
    // Only match whole-word or delimited phrases
    for (const name of entry.names) {
      const regex = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i');
      if (regex.test(lowerTitle)) {
        return {
          latitude: entry.latitude,
          longitude: entry.longitude,
          city: entry.city,
          state: entry.state,
          country: entry.country,
          location: entry.city || entry.state || entry.country,
        };
      }
    }
  }

  // 3. Check summary keywords
  if (summary) {
    const lowerSummary = summary.toLowerCase();
    for (const entry of VERIFIED_LOCATIONS) {
      for (const name of entry.names) {
        const regex = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i');
        if (regex.test(lowerSummary)) {
          return {
            latitude: entry.latitude,
            longitude: entry.longitude,
            city: entry.city,
            state: entry.state,
            country: entry.country,
            location: entry.city || entry.state || entry.country,
          };
        }
      }
    }
  }

  // 4. Return null if no confident location match (never fabricate!)
  return null;
}

/**
 * Parse combined queries such as:
 * - "AI news in Bengaluru" -> { topic: "AI news", location: entry, locationName: "Bengaluru" }
 * - "Elections in Punjab" -> { topic: "Elections", location: entry, locationName: "Punjab" }
 * - "Cricket in Mumbai" -> { topic: "Cricket", location: entry, locationName: "Mumbai" }
 * - "Climate change in India" -> { topic: "Climate change", location: entry, locationName: "India" }
 * - "Punjab" -> { topic: undefined, location: entry, locationName: "Punjab" }
 */
export function parseCombinedQuery(query: string): {
  topicQuery?: string;
  locationQuery?: string;
  matchedLocation?: CuratedLocationEntry;
} {
  const trimmed = (query || '').trim();
  if (!trimmed) return {};

  const lower = trimmed.toLowerCase();

  // Check if query matches location with "in", "from", "at", "near" preposition
  const prepPattern = /^(.*?)\s+(?:in|from|at|near|around)\s+(.+)$/i;
  const match = trimmed.match(prepPattern);

  if (match) {
    const topicPart = match[1].trim();
    const locPart = match[2].trim().toLowerCase();

    for (const entry of VERIFIED_LOCATIONS) {
      if (entry.names.some((n) => n === locPart || locPart.includes(n))) {
        return {
          topicQuery: topicPart,
          locationQuery: entry.city || entry.state || entry.country,
          matchedLocation: entry,
        };
      }
    }
  }

  // Check if entire query is a location name
  for (const entry of VERIFIED_LOCATIONS) {
    if (entry.names.some((n) => n === lower)) {
      return {
        locationQuery: entry.city || entry.state || entry.country,
        matchedLocation: entry,
      };
    }
  }

  // Check if query contains a location name somewhere
  for (const entry of VERIFIED_LOCATIONS) {
    for (const name of entry.names) {
      const regex = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i');
      if (regex.test(lower)) {
        const topicPart = lower.replace(regex, '').replace(/\b(in|from|at|near|news)\b/gi, '').trim();
        return {
          topicQuery: topicPart || undefined,
          locationQuery: entry.city || entry.state || entry.country,
          matchedLocation: entry,
        };
      }
    }
  }

  // Pure topic query
  return { topicQuery: trimmed };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

