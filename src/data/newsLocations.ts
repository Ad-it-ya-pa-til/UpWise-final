/**
 * Upwise Hub - Geographic Taxonomy & Location Metadata
 * 
 * Provides structured classification for interactive map and location-based news discovery.
 * Supports Indian states, union territories, major metropolitan cities, and international hubs.
 */

export interface LocationDefinition {
  id: string
  name: string
  displayName: string
  heading: string
  tagline: string
  type: 'state' | 'city' | 'country' | 'region' | 'global'
  country: string
  countryCode?: string
  state?: string
  city?: string
  coordinates: [number, number] // [lat, lng]
  mapView: 'india' | 'global'
  svgCoords: { x: number; y: number } // Percentage on the map SVG (0-100)
  aliases: string[]
  isMajorHub?: boolean
}

export const SUPPORTED_LOCATIONS: LocationDefinition[] = [
  // ---------------------------------------------------------
  // Global Overview
  // ---------------------------------------------------------
  {
    id: 'global',
    name: 'Global',
    displayName: 'Global News Overview',
    heading: 'World Overview: Global News',
    tagline: 'International treaties, cross-border technology, planetary science, and global markets.',
    type: 'global',
    country: 'Global',
    countryCode: 'GLOBAL',
    coordinates: [20, 0],
    mapView: 'global',
    svgCoords: { x: 50, y: 50 },
    aliases: ['global', 'world', 'international', 'earth', 'all', 'worldwide'],
    isMajorHub: true,
  },

  // ---------------------------------------------------------
  // India - Northern States & Union Territories
  // ---------------------------------------------------------
  {
    id: 'india',
    name: 'All India',
    displayName: 'All India News Desks',
    heading: 'National Overview: All India News',
    tagline: 'Comprehensive coverage across Northern Desks, Southern Hubs, and National Affairs.',
    type: 'country',
    country: 'India',
    countryCode: 'IN',
    coordinates: [22.5937, 78.9629],
    mapView: 'india',
    svgCoords: { x: 50, y: 50 },
    aliases: ['india', 'all india', 'bharat', 'national', 'all desks', 'all'],
    isMajorHub: true,
  },
  {
    id: 'punjab',
    name: 'Punjab',
    displayName: 'Punjab',
    heading: 'Regional Dispatch: Punjab',
    tagline: 'Agricultural telemetry, industrial manufacturing, regional universities, and civic development.',
    type: 'state',
    country: 'India',
    countryCode: 'IN',
    state: 'Punjab',
    coordinates: [31.1471, 75.3412],
    mapView: 'india',
    svgCoords: { x: 30, y: 22 },
    aliases: ['punjab', 'pb', 'ludhiana', 'amritsar', 'jalandhar', 'kapurthala', 'patiala', 'bathinda'],
    isMajorHub: true,
  },
  {
    id: 'haryana',
    name: 'Haryana',
    displayName: 'Haryana',
    heading: 'Regional Dispatch: Haryana',
    tagline: 'Technology corridors, EV logistics corridors, university research, and agricultural innovation.',
    type: 'state',
    country: 'India',
    countryCode: 'IN',
    state: 'Haryana',
    coordinates: [29.0588, 76.0856],
    mapView: 'india',
    svgCoords: { x: 33, y: 27 },
    aliases: ['haryana', 'hr', 'gurugram', 'gurgaon', 'hisar', 'kurukshetra', 'faridabad', 'panipat', 'rohtak'],
    isMajorHub: true,
  },
  {
    id: 'delhi',
    name: 'Delhi',
    displayName: 'Delhi NCR',
    heading: 'National Bureau: Delhi NCR',
    tagline: 'Central governance, statutory legislation, supreme court guardrails, and metropolitan transit.',
    type: 'city',
    country: 'India',
    countryCode: 'IN',
    state: 'Delhi',
    city: 'New Delhi',
    coordinates: [28.6139, 77.2090],
    mapView: 'india',
    svgCoords: { x: 36, y: 30 },
    aliases: ['delhi', 'new delhi', 'ncr', 'national capital', 'dilli', 'sansad'],
    isMajorHub: true,
  },
  {
    id: 'chandigarh',
    name: 'Chandigarh',
    displayName: 'Chandigarh',
    heading: 'Union Territory Dispatch: Chandigarh',
    tagline: 'Medical telemetry innovation, green transit initiatives, and regional administrative hub.',
    type: 'city',
    country: 'India',
    countryCode: 'IN',
    state: 'Chandigarh',
    city: 'Chandigarh',
    coordinates: [30.7333, 76.7794],
    mapView: 'india',
    svgCoords: { x: 33, y: 23 },
    aliases: ['chandigarh', 'chd', 'city beautiful', 'pgimer', 'tricity', 'mohali', 'panchkula'],
    isMajorHub: true,
  },
  {
    id: 'ladakh',
    name: 'Ladakh',
    displayName: 'Ladakh',
    heading: 'Frontier Dispatch: Ladakh',
    tagline: 'High-altitude renewable field trials, ecological telemetry, and trans-Himalayan research.',
    type: 'state',
    country: 'India',
    countryCode: 'IN',
    state: 'Ladakh',
    city: 'Leh',
    coordinates: [34.1526, 77.5771],
    mapView: 'india',
    svgCoords: { x: 36, y: 12 },
    aliases: ['ladakh', 'leh', 'kargil', 'himalayas', 'high-altitude'],
    isMajorHub: false,
  },

  // ---------------------------------------------------------
  // India - Southern & Western States
  // ---------------------------------------------------------
  {
    id: 'karnataka',
    name: 'Karnataka',
    displayName: 'Karnataka / Bengaluru',
    heading: 'Innovation Hub: Karnataka',
    tagline: 'Semiconductor silicon photonics, aerospace R&D, venture capital, and deep-tech innovation.',
    type: 'state',
    country: 'India',
    countryCode: 'IN',
    state: 'Karnataka',
    city: 'Bengaluru',
    coordinates: [12.9716, 77.5946],
    mapView: 'india',
    svgCoords: { x: 38, y: 72 },
    aliases: ['karnataka', 'bengaluru', 'bangalore', 'mysuru', 'mysore', 'iisc', 'silicon valley of india'],
    isMajorHub: true,
  },
  {
    id: 'maharashtra',
    name: 'Maharashtra',
    displayName: 'Maharashtra / Mumbai',
    heading: 'Financial Capital: Maharashtra',
    tagline: 'Monetary policy directives, capital markets, automotive tech breakthroughs, and maritime corridors.',
    type: 'state',
    country: 'India',
    countryCode: 'IN',
    state: 'Maharashtra',
    city: 'Mumbai',
    coordinates: [19.0760, 72.8777],
    mapView: 'india',
    svgCoords: { x: 28, y: 55 },
    aliases: ['maharashtra', 'mumbai', 'bombay', 'pune', 'nagpur', 'nashik', 'rbi'],
    isMajorHub: true,
  },
  {
    id: 'uttar-pradesh',
    name: 'Uttar Pradesh',
    displayName: 'Uttar Pradesh',
    heading: 'Regional Dispatch: Uttar Pradesh',
    tagline: 'Ganga riverfront solar grids, historical water conservation engineering, and urban corridors.',
    type: 'state',
    country: 'India',
    countryCode: 'IN',
    state: 'Uttar Pradesh',
    city: 'Varanasi',
    coordinates: [26.8467, 80.9462],
    mapView: 'india',
    svgCoords: { x: 48, y: 35 },
    aliases: ['uttar pradesh', 'up', 'varanasi', 'bundelkhand', 'lucknow', 'kanpur', 'prayagraj', 'noida'],
    isMajorHub: true,
  },
  {
    id: 'gujarat',
    name: 'Gujarat',
    displayName: 'Gujarat',
    heading: 'Manufacturing & Semiconductor Hub: Gujarat',
    tagline: 'Dholera semiconductor fabrication, green hydrogen ports, and industrial logistics.',
    type: 'state',
    country: 'India',
    countryCode: 'IN',
    state: 'Gujarat',
    city: 'Ahmedabad',
    coordinates: [22.2587, 71.1924],
    mapView: 'india',
    svgCoords: { x: 20, y: 44 },
    aliases: ['gujarat', 'ahmedabad', 'gandhinagar', 'dholera', 'surat', 'vadodara', 'gift city'],
    isMajorHub: false,
  },
  {
    id: 'tamil-nadu',
    name: 'Tamil Nadu',
    displayName: 'Tamil Nadu',
    heading: 'Industrial Corridor: Tamil Nadu',
    tagline: 'Renewable manufacturing, automotive engineering, space component clusters, and higher education.',
    type: 'state',
    country: 'India',
    countryCode: 'IN',
    state: 'Tamil Nadu',
    city: 'Chennai',
    coordinates: [13.0827, 80.2707],
    mapView: 'india',
    svgCoords: { x: 44, y: 80 },
    aliases: ['tamil nadu', 'chennai', 'madras', 'coimbatore', 'madurai', 'iit madras'],
    isMajorHub: false,
  },
  {
    id: 'west-bengal',
    name: 'West Bengal',
    displayName: 'West Bengal',
    heading: 'Eastern Hub: West Bengal',
    tagline: 'Inland river freight navigation, bio-informatics research, and eastern commercial terminals.',
    type: 'state',
    country: 'India',
    countryCode: 'IN',
    state: 'West Bengal',
    city: 'Kolkata',
    coordinates: [22.9868, 87.8550],
    mapView: 'india',
    svgCoords: { x: 65, y: 46 },
    aliases: ['west bengal', 'bengal', 'kolkata', 'calcutta', 'howrah', 'siliguri'],
    isMajorHub: false,
  },

  // ---------------------------------------------------------
  // Global Bureaus & International Countries
  // ---------------------------------------------------------
  {
    id: 'united-states',
    name: 'United States',
    displayName: 'United States',
    heading: 'International Bureau: United States',
    tagline: 'NASA lunar space collaborations, bilateral computing IP, frontier AI, and global macroeconomic policy.',
    type: 'country',
    country: 'United States',
    countryCode: 'US',
    coordinates: [37.0902, -95.7129],
    mapView: 'global',
    svgCoords: { x: 22, y: 38 },
    aliases: ['united states', 'usa', 'us', 'america', 'washington', 'silicon valley', 'california', 'nasa'],
    isMajorHub: true,
  },
  {
    id: 'united-kingdom',
    name: 'United Kingdom',
    displayName: 'United Kingdom',
    heading: 'International Bureau: United Kingdom',
    tagline: 'Genomic therapeutics, global financial regulation, and bilateral university research initiatives.',
    type: 'country',
    country: 'United Kingdom',
    countryCode: 'GB',
    city: 'London',
    coordinates: [55.3781, -3.4360],
    mapView: 'global',
    svgCoords: { x: 47, y: 28 },
    aliases: ['united kingdom', 'uk', 'britain', 'london', 'england', 'oxford', 'cambridge'],
    isMajorHub: true,
  },
  {
    id: 'switzerland',
    name: 'Switzerland',
    displayName: 'Switzerland / Europe',
    heading: 'European Bureau: Geneva',
    tagline: 'Multilateral clean grid accords, international diplomatic summits, and global health treaties.',
    type: 'country',
    country: 'Switzerland',
    countryCode: 'CH',
    city: 'Geneva',
    coordinates: [46.8182, 8.2275],
    mapView: 'global',
    svgCoords: { x: 51, y: 33 },
    aliases: ['switzerland', 'swiss', 'geneva', 'europe', 'zurich', 'un', 'cern'],
    isMajorHub: false,
  },
  {
    id: 'australia',
    name: 'Australia',
    displayName: 'Australia',
    heading: 'Asia-Pacific Bureau: Australia',
    tagline: 'Border-Gavaskar Trophy series, critical minerals trade, and Pacific research alliances.',
    type: 'country',
    country: 'Australia',
    countryCode: 'AU',
    city: 'Adelaide',
    coordinates: [-25.2744, 133.7751],
    mapView: 'global',
    svgCoords: { x: 82, y: 75 },
    aliases: ['australia', 'adelaide', 'melbourne', 'sydney', 'canberra', 'cricket australia'],
    isMajorHub: false,
  },
]

/**
 * Filter and rank locations based on search query
 */
export function searchLocations(query: string): LocationDefinition[] {
  if (!query || !query.trim()) return SUPPORTED_LOCATIONS

  const q = query.toLowerCase().trim()
  return SUPPORTED_LOCATIONS.filter((loc) => {
    if (loc.name.toLowerCase().includes(q)) return true
    if (loc.displayName.toLowerCase().includes(q)) return true
    if (loc.heading.toLowerCase().includes(q)) return true
    if (loc.country.toLowerCase().includes(q)) return true
    if (loc.state && loc.state.toLowerCase().includes(q)) return true
    if (loc.city && loc.city.toLowerCase().includes(q)) return true
    return loc.aliases.some((alias) => alias.includes(q))
  })
}

/**
 * Get location definition by id
 */
export function getLocationById(id: string): LocationDefinition {
  const match = SUPPORTED_LOCATIONS.find((loc) => loc.id === id)
  return match || SUPPORTED_LOCATIONS[0] // fallback to global
}
