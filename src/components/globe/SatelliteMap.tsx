import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  ZoomIn,
  ZoomOut,
  Compass,
  Maximize2,
  Minimize2,
  Layers,
  MapPin,
  Clock,
  ArrowRight,
  Bookmark,
  X,
} from 'lucide-react'
import { Article } from '../../types/news'
import { formatPublicationDate } from '../../utils/dateUtils'

export interface SatelliteMapProps {
  articles: Article[]
  selectedArticleId?: string | null
  onArticleClick: (article: Article) => void
  onArticleSelect?: (article: Article) => void
  onToggleSave?: (articleId: string, e: React.MouseEvent) => void
  savedArticleIds?: string[]
  mapMode?: 'india' | 'global'
  targetCoordinates?: [number, number] | null // [lat, lng]
  locationName?: string
  className?: string
}

// Category color mappings matching UPWISE design guidelines
export const CATEGORY_COLORS: Record<string, string> = {
  'india-politics': '#D95D39', // Rust / Terracotta
  'tech-science': '#0369A1', // Deep Sky Blue
  'business-economy': '#047857', // Emerald Green
  'sports': '#BE123C', // Rose
  'world-lifestyle': '#6D28D9', // Violet / Purple
}

const DEFAULT_COLOR = '#0F392B' // Dark Forest Green

// Preset Centers
const INDIA_CENTER: [number, number] = [78.9629, 22.5937]
const GLOBAL_CENTER: [number, number] = [20.0, 25.0]

interface ActivePopupState {
  coordinates: [number, number] // [lng, lat]
  article: Article
  stories: Article[]
  currentIndex: number
  container: HTMLDivElement
}

interface LocationMarkerGroup {
  key: string
  coordinates: [number, number] // [lat, lng]
  cityName: string
  articles: Article[]
  topCategory: string
}

export const SatelliteMap: React.FC<SatelliteMapProps> = ({
  articles,
  selectedArticleId,
  onArticleClick,
  onArticleSelect,
  onToggleSave,
  savedArticleIds = [],
  mapMode = 'india',
  targetCoordinates,
  locationName,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const activePopupRef = useRef<maplibregl.Popup | null>(null)
  const popupContainerRef = useRef<HTMLDivElement | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])

  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [showLabels, setShowLabels] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentZoom, setCurrentZoom] = useState<number>(mapMode === 'india' ? 4.3 : 1.8)
  const [activePopupData, setActivePopupData] = useState<ActivePopupState | null>(null)

  // Map of article id to article object for fast lookup
  const articleMap = useMemo(() => {
    const map = new Map<string, Article>()
    for (const a of articles) {
      map.set(String(a.id), a)
    }
    return map
  }, [articles])

  // Fresh refs for use inside asynchronous MapLibre callbacks
  const articleMapRef = useRef(articleMap)
  articleMapRef.current = articleMap

  const articlesRef = useRef(articles)
  articlesRef.current = articles

  const onArticleSelectRef = useRef(onArticleSelect)
  onArticleSelectRef.current = onArticleSelect

  // Show rich news popup directly over location
  const showPopupForArticle = useCallback(
    (article: Article, coords: [number, number], customStories?: Article[]) => {
      if (!mapRef.current) return

      if (!popupContainerRef.current) {
        popupContainerRef.current = document.createElement('div')
      }

      const [lng, lat] = coords

      let storiesList = customStories
      if (!storiesList || storiesList.length === 0) {
        const currentArticles = articlesRef.current
        storiesList = currentArticles.filter((a) => {
          if (!a.location?.coordinates) return false
          const [aLat, aLng] = a.location.coordinates
          if (
            a.location.city &&
            article.location?.city &&
            a.location.city.toLowerCase() === article.location.city.toLowerCase()
          ) {
            return true
          }
          return Math.abs(aLat - lat) < 0.25 && Math.abs(aLng - lng) < 0.25
        })
      }

      if (!storiesList || storiesList.length === 0) {
        storiesList = [article]
      }

      let initialIdx = storiesList.findIndex((s) => s.id === article.id)
      if (initialIdx === -1) initialIdx = 0

      // Re-anchor or initialize popup directly over location
      if (activePopupRef.current) {
        activePopupRef.current.remove()
      }

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: [0, -18],
        className: 'upwise-location-popup',
        maxWidth: '340px',
      })
        .setLngLat([lng, lat])
        .setDOMContent(popupContainerRef.current)
        .addTo(mapRef.current)

      popup.on('close', () => {
        setActivePopupData(null)
      })

      activePopupRef.current = popup
      setActivePopupData({
        coordinates: [lng, lat],
        article: storiesList[initialIdx],
        stories: storiesList,
        currentIndex: initialIdx,
        container: popupContainerRef.current,
      })
    },
    []
  )

  const handleClosePopup = useCallback(() => {
    if (activePopupRef.current) {
      activePopupRef.current.remove()
      activePopupRef.current = null
    }
    setActivePopupData(null)
  }, [])

  const handlePrevStory = useCallback(() => {
    setActivePopupData((prev) => {
      if (!prev || prev.currentIndex <= 0) return prev
      const nextIdx = prev.currentIndex - 1
      const nextStory = prev.stories[nextIdx]
      if (onArticleSelectRef.current) {
        onArticleSelectRef.current(nextStory)
      }
      return {
        ...prev,
        article: nextStory,
        currentIndex: nextIdx,
      }
    })
  }, [])

  const handleNextStory = useCallback(() => {
    setActivePopupData((prev) => {
      if (!prev || prev.currentIndex >= prev.stories.length - 1) return prev
      const nextIdx = prev.currentIndex + 1
      const nextStory = prev.stories[nextIdx]
      if (onArticleSelectRef.current) {
        onArticleSelectRef.current(nextStory)
      }
      return {
        ...prev,
        article: nextStory,
        currentIndex: nextIdx,
      }
    })
  }, [])

  // Construct MapLibre Style Specification with ESRI Satellite + ESRI Boundaries & Places + Carto Labels
  const getMapStyle = useCallback((): maplibregl.StyleSpecification => {
    const maptilerKey = (import.meta as any).env?.VITE_MAPTILER_KEY

    // If MapTiler key is configured in env, use its hybrid satellite style
    if (maptilerKey) {
      return {
        version: 8,
        sources: {
          'maptiler-hybrid': {
            type: 'raster',
            tiles: [
              `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${maptilerKey}`,
            ],
            tileSize: 512,
            attribution:
              '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
          },
        },
        layers: [
          {
            id: 'satellite-layer',
            type: 'raster',
            source: 'maptiler-hybrid',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      }
    }

    // Default: High-Resolution ESRI World Imagery + Official ESRI World Boundaries & Places + Carto Labels
    // This brings back country names, state names (Punjab, Haryana, Delhi, Karnataka, etc.), cities, and towns!
    return {
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution:
            'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        },
        'esri-places': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri &mdash; Boundaries & Places',
        },
        'carto-labels': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        },
      },
      layers: [
        {
          id: 'satellite-base',
          type: 'raster',
          source: 'esri-satellite',
          minzoom: 0,
          maxzoom: 19,
        },
        {
          id: 'esri-places-layer',
          type: 'raster',
          source: 'esri-places',
          minzoom: 0,
          maxzoom: 19,
          layout: {
            visibility: 'visible',
          },
          paint: {
            'raster-opacity': 1.0,
          },
        },
        {
          id: 'carto-labels-layer',
          type: 'raster',
          source: 'carto-labels',
          minzoom: 0,
          maxzoom: 19,
          layout: {
            visibility: 'visible',
          },
          paint: {
            'raster-opacity': 0.95,
          },
        },
      ],
    }
  }, [])

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const initialCenter = mapMode === 'india' ? INDIA_CENTER : GLOBAL_CENTER
    const initialZoom = mapMode === 'india' ? 4.3 : 1.8

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: getMapStyle(),
        center: initialCenter,
        zoom: initialZoom,
        minZoom: 1.5,
        maxZoom: 18,
        attributionControl: false,
      })

      mapRef.current = map

      map.on('load', () => {
        setMapLoaded(true)

        // General map click handler: If clicked on any terrain or location, pop up nearest news for that location
        map.on('click', (e: any) => {
          const clickLat = e.lngLat.lat
          const clickLng = e.lngLat.lng

          let closestArticle: Article | null = null
          let minDistance = Infinity

          for (const a of articlesRef.current) {
            if (!a.location?.coordinates) continue
            const [aLat, aLng] = a.location.coordinates
            const dist = Math.hypot(aLat - clickLat, aLng - clickLng)
            if (dist < minDistance) {
              minDistance = dist
              closestArticle = a
            }
          }

          // If there is a story within regional proximity (approx ~7.0 degrees lat/lng)
          if (closestArticle && closestArticle.location?.coordinates && minDistance < 7.0) {
            const [cLat, cLng] = closestArticle.location.coordinates
            showPopupForArticle(closestArticle, [cLng, cLat])
            if (onArticleSelectRef.current) {
              onArticleSelectRef.current(closestArticle)
            }
          }
        })

        map.on('zoom', () => {
          setCurrentZoom(Math.round(map.getZoom() * 10) / 10)
        })
      })

      map.on('error', (e: any) => {
        if (e.error && !e.error.message.includes('404')) {
          console.warn('[SatelliteMap] Notice:', e.error.message)
        }
      })
    } catch (err: any) {
      setMapError(err.message || 'Unable to initialize satellite map WebGL context')
    }

    return () => {
      if (activePopupRef.current) {
        activePopupRef.current.remove()
      }
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [getMapStyle, showPopupForArticle])

  // Render ALL news markers simultaneously across the map with Place Name labels
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    // Clean up existing markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    // Group articles by nearby coordinates (~0.08 degrees) to show count badge if multiple stories at same location
    const groups: LocationMarkerGroup[] = []

    for (const article of articles) {
      const coords = article.location?.coordinates
      if (!coords || !Array.isArray(coords) || coords.length < 2) continue
      const [lat, lng] = coords
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) continue

      let foundGroup = groups.find(
        (g) => Math.hypot(g.coordinates[0] - lat, g.coordinates[1] - lng) < 0.08
      )

      if (foundGroup) {
        foundGroup.articles.push(article)
      } else {
        const cityName =
          article.location?.city ||
          article.location?.state ||
          article.location?.country ||
          'Location'
        groups.push({
          key: `${lat.toFixed(3)},${lng.toFixed(3)}`,
          coordinates: [lat, lng],
          cityName,
          articles: [article],
          topCategory: article.categoryId,
        })
      }
    }

    // Add high-visibility markers with Place Name Pills for EVERY location
    for (const group of groups) {
      const [lat, lng] = group.coordinates
      const count = group.articles.length
      const countBadge = count > 1 ? ` (${count})` : ''
      const catColor = CATEGORY_COLORS[group.topCategory] || DEFAULT_COLOR

      const el = document.createElement('div')
      el.className = 'upwise-news-marker-wrapper'
      el.title = `${group.cityName}: ${count} news ${count > 1 ? 'stories' : 'story'}`

      el.innerHTML = `
        <div class="upwise-news-pin">
          <div class="pin-ring">
            <div class="pin-dot" style="background-color: ${catColor};"></div>
          </div>
          <div class="pin-label-pill">
            <span class="pin-city">${group.cityName}${countBadge}</span>
          </div>
        </div>
      `

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        showPopupForArticle(group.articles[0], [lng, lat], group.articles)
        if (onArticleSelectRef.current) {
          onArticleSelectRef.current(group.articles[0])
        }
      })

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat([lng, lat])
        .addTo(mapRef.current)

      markersRef.current.push(marker)
    }

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
    }
  }, [articles, mapLoaded, showPopupForArticle])

  // Update Labels layer visibility (ESRI Places + Carto Labels)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    const visibility = showLabels ? 'visible' : 'none'
    if (mapRef.current.getLayer('esri-places-layer')) {
      mapRef.current.setLayoutProperty('esri-places-layer', 'visibility', visibility)
    }
    if (mapRef.current.getLayer('carto-labels-layer')) {
      mapRef.current.setLayoutProperty('carto-labels-layer', 'visibility', visibility)
    }
  }, [showLabels, mapLoaded])

  // Pan / Fly when mapMode switches between India and Global
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    if (!targetCoordinates) {
      const targetCenter = mapMode === 'india' ? INDIA_CENTER : GLOBAL_CENTER
      const targetZoom = mapMode === 'india' ? 4.3 : 1.8

      mapRef.current.flyTo({
        center: targetCenter,
        zoom: targetZoom,
        essential: true,
        duration: 900,
      })
    }
  }, [mapMode, mapLoaded])

  // Fly to target coordinates when specified (e.g. from search, chip, or location selection)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !targetCoordinates) return

    const [lat, lng] = targetCoordinates
    if (typeof lat !== 'number' || typeof lng !== 'number') return
    if (isNaN(lat) || isNaN(lng)) return

    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 7.2,
      essential: true,
      duration: 1100,
    })
  }, [targetCoordinates, mapLoaded])

  // Sync and display popup over location when selectedArticleId changes externally
  useEffect(() => {
    if (!selectedArticleId || !mapRef.current) return

    const article = articleMapRef.current.get(selectedArticleId)
    if (article && article.location?.coordinates) {
      const [lat, lng] = article.location.coordinates
      showPopupForArticle(article, [lng, lat])
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: Math.max(mapRef.current.getZoom(), 7.2),
        essential: true,
        duration: 800,
      })
    }
  }, [selectedArticleId, showPopupForArticle])

  // Map Controls
  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn({ duration: 300 })
  }

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut({ duration: 300 })
  }

  const handleResetNorth = () => {
    if (mapRef.current) {
      mapRef.current.resetNorthPitch({ duration: 400 })
      const center = mapMode === 'india' ? INDIA_CENTER : GLOBAL_CENTER
      const zoom = mapMode === 'india' ? 4.3 : 1.8
      mapRef.current.flyTo({ center, zoom, duration: 600 })
    }
  }

  const handleToggleFullscreen = () => {
    if (!mapContainerRef.current) return

    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  return (
    <div
      className={`relative w-full h-full min-h-[420px] sm:min-h-[490px] rounded-xl overflow-hidden border border-[#E8E2D8] bg-[#0A1A12] shadow-2xs select-none ${className}`}
    >
      {/* MapLibre WebGL Canvas Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Custom Styles for Map Markers and Popups */}
      <style>{`
        .upwise-news-marker-wrapper {
          cursor: pointer;
          transform: translate3d(0, 0, 0);
          transition: transform 0.15s ease-out;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .upwise-news-marker-wrapper:hover {
          transform: scale(1.15) translateY(-3px);
          z-index: 40 !important;
        }
        .upwise-news-pin {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .upwise-news-pin .pin-ring {
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background-color: #FAF7F2;
          border: 2px solid #141412;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .upwise-news-pin .pin-dot {
          width: 10px;
          height: 10px;
          border-radius: 9999px;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        .upwise-news-pin .pin-label-pill {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 10px;
          font-weight: 700;
          color: #FFFFFF;
          background-color: rgba(15, 57, 43, 0.95);
          border: 1px solid rgba(232, 226, 216, 0.85);
          padding: 1.5px 6px;
          border-radius: 9999px;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
          pointer-events: none;
          letter-spacing: 0.02em;
        }
        .upwise-location-popup {
          z-index: 50 !important;
        }
        .upwise-location-popup .maplibregl-popup-content {
          padding: 0 !important;
          background: transparent !important;
          border: none !important;
          border-radius: 12px !important;
          box-shadow: 0 12px 28px -4px rgba(15, 23, 42, 0.35), 0 8px 10px -6px rgba(15, 23, 42, 0.2) !important;
        }
        .upwise-location-popup .maplibregl-popup-tip {
          border-top-color: #FAF7F2 !important;
          border-bottom-color: #FAF7F2 !important;
        }
        .upwise-location-popup.maplibregl-popup-anchor-top .maplibregl-popup-tip {
          border-bottom-color: #FAF7F2 !important;
          border-top-color: transparent !important;
        }
        .upwise-location-popup.maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
          border-top-color: #FAF7F2 !important;
          border-bottom-color: transparent !important;
        }
        .upwise-location-popup.maplibregl-popup-anchor-left .maplibregl-popup-tip {
          border-right-color: #FAF7F2 !important;
        }
        .upwise-location-popup.maplibregl-popup-anchor-right .maplibregl-popup-tip {
          border-left-color: #FAF7F2 !important;
        }
      `}</style>

      {/* Loading Overlay */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 z-20 bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
          <div className="w-10 h-10 rounded-full border-2 border-[#E8E2D8] border-t-[#0F392B] animate-spin mb-3" />
          <p className="font-serif font-bold text-sm text-[#141412]">
            Loading Satellite Telemetry...
          </p>
          <p className="text-[11px] text-[#78716C] mt-0.5">
            Calibrating global raster imagery and verified news dispatches
          </p>
        </div>
      )}

      {/* WebGL Error State */}
      {mapError && (
        <div className="absolute inset-0 z-20 bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-[#D95D39]/10 text-[#D95D39] flex items-center justify-center mb-3">
            <MapPin className="w-5 h-5" />
          </div>
          <h4 className="font-serif font-bold text-sm text-[#141412] mb-1">
            Map Rendering Unavailable
          </h4>
          <p className="text-xs text-[#55504A] max-w-sm mb-3">
            {mapError}. Please verify hardware acceleration is enabled in your browser settings.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 bg-[#0F392B] text-white text-xs rounded-md font-semibold hover:bg-[#184837]"
          >
            Reload Interface
          </button>
        </div>
      )}

      {/* Top Map Context Pill (Floating inside Map) */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-auto">
        <div className="bg-[#FAF7F2]/95 backdrop-blur-md border border-[#E8E2D8] rounded-full px-3 py-1.5 shadow-sm text-xs font-semibold text-[#141412] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#047857] animate-pulse" />
          <span className="capitalize">{mapMode === 'india' ? 'India Desks' : 'World Bureaus'}</span>
          {locationName && (
            <>
              <span className="text-[#A8A29E]">•</span>
              <span className="text-[#0F392B] font-medium">{locationName}</span>
            </>
          )}
          <span className="text-[10px] bg-[#E8E2D8]/80 text-[#55504A] px-1.5 py-0.2 rounded-full">
            {articles.length} news active
          </span>
        </div>
      </div>

      {/* Floating Map Controls (Top Right) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 pointer-events-auto">
        {/* Toggle Street & City Labels Layer */}
        <button
          type="button"
          onClick={() => setShowLabels((prev) => !prev)}
          title={showLabels ? 'Hide Street & City Labels' : 'Show Street & City Labels'}
          className={`w-8 h-8 rounded-lg border backdrop-blur-md shadow-sm flex items-center justify-center transition-all ${
            showLabels
              ? 'bg-[#0F392B] text-white border-[#0F392B]'
              : 'bg-[#FAF7F2]/95 text-[#141412] border-[#E8E2D8] hover:bg-white'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Zoom In */}
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-8 h-8 rounded-lg bg-[#FAF7F2]/95 hover:bg-white text-[#141412] border border-[#E8E2D8] backdrop-blur-md shadow-sm flex items-center justify-center transition-all"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-8 h-8 rounded-lg bg-[#FAF7F2]/95 hover:bg-white text-[#141412] border border-[#E8E2D8] backdrop-blur-md shadow-sm flex items-center justify-center transition-all"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Reset Compass & North Orientation */}
        <button
          type="button"
          onClick={handleResetNorth}
          title="Reset Orientation & Overview"
          className="w-8 h-8 rounded-lg bg-[#FAF7F2]/95 hover:bg-white text-[#141412] border border-[#E8E2D8] backdrop-blur-md shadow-sm flex items-center justify-center transition-all"
        >
          <Compass className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={handleToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
          className="w-8 h-8 rounded-lg bg-[#FAF7F2]/95 hover:bg-white text-[#141412] border border-[#E8E2D8] backdrop-blur-md shadow-sm flex items-center justify-center transition-all"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Left Legend & Attribution */}
      <div className="absolute bottom-2 left-2 z-10 flex flex-wrap items-center gap-1.5 pointer-events-auto">
        <div className="bg-[#FAF7F2]/90 backdrop-blur-md border border-[#E8E2D8] rounded-md px-2.5 py-1 text-[10px] text-[#55504A] shadow-xs flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#D95D39]" />
            <span>Politics</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#0369A1]" />
            <span>Tech</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#047857]" />
            <span>Business</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#BE123C]" />
            <span>Sports</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#6D28D9]" />
            <span>World</span>
          </div>
        </div>

        <div className="bg-[#FAF7F2]/80 backdrop-blur-md border border-[#E8E2D8] rounded-md px-2 py-1 text-[9px] text-[#78716C] shadow-xs">
          Imagery &copy; Esri, Maxar, OpenStreetMap
        </div>
      </div>

      {/* Render Anchored Popup Over Location via React Portal */}
      {activePopupData &&
        createPortal(
          <div className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl overflow-hidden shadow-2xl p-3 sm:p-3.5 w-[290px] sm:w-[320px] font-sans text-left animate-in fade-in zoom-in-95 duration-150">
            {/* Category & Location Header */}
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                  style={{
                    backgroundColor:
                      CATEGORY_COLORS[activePopupData.article.categoryId] || DEFAULT_COLOR,
                  }}
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#141412] truncate">
                  {activePopupData.article.categoryName}
                </span>
                {activePopupData.article.location?.city && (
                  <span className="text-[10px] font-semibold text-[#0F392B] bg-[#EBF3EF] px-1.5 py-0.5 rounded truncate max-w-[120px]">
                    {activePopupData.article.location.city}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleClosePopup}
                className="text-[#78716C] hover:text-[#141412] p-1 rounded-full hover:bg-[#E8E2D8]/60 transition-colors shrink-0"
                title="Close news popup"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Headline & Thumbnail */}
            <div className="flex gap-2.5 items-start mb-2">
              {activePopupData.article.imageUrl && (
                <img
                  src={activePopupData.article.imageUrl}
                  alt={activePopupData.article.title}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover shrink-0 border border-[#E8E2D8]"
                  loading="lazy"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-serif font-bold text-xs sm:text-[13px] text-[#141412] leading-snug line-clamp-2">
                  {activePopupData.article.title}
                </h4>
              </div>
            </div>

            {/* Summary Snippet */}
            <p className="text-[11px] text-[#55504A] line-clamp-2 leading-relaxed mb-2.5">
              {activePopupData.article.summary}
            </p>

            {/* Footer Info & Actions */}
            <div className="pt-2 border-t border-[#E8E2D8] flex items-center justify-between text-xs gap-1.5">
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-[11px] text-[#141412] truncate">
                  {activePopupData.article.source.name}
                </span>
                <span className="text-[10px] text-[#78716C]">
                  {formatPublicationDate(
                    activePopupData.article.publishedDate || activePopupData.article.publishedAt
                  )}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {activePopupData.stories.length > 1 && (
                  <div className="flex items-center gap-1 bg-[#E8E2D8]/60 rounded px-1.5 py-0.5 text-[10px] text-[#55504A] font-semibold">
                    <button
                      type="button"
                      onClick={handlePrevStory}
                      disabled={activePopupData.currentIndex === 0}
                      className="hover:text-[#141412] disabled:opacity-30 p-0.5"
                      title="Previous story at this location"
                    >
                      ◀
                    </button>
                    <span>
                      {activePopupData.currentIndex + 1}/{activePopupData.stories.length}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextStory}
                      disabled={activePopupData.currentIndex === activePopupData.stories.length - 1}
                      className="hover:text-[#141412] disabled:opacity-30 p-0.5"
                      title="Next story at this location"
                    >
                      ▶
                    </button>
                  </div>
                )}

                {onToggleSave && (
                  <button
                    type="button"
                    onClick={(e) => onToggleSave(activePopupData.article.id, e)}
                    className="p-1 text-[#78716C] hover:text-[#141412] rounded hover:bg-[#E8E2D8]/60 transition-colors"
                    title={
                      savedArticleIds.includes(activePopupData.article.id)
                        ? 'Remove bookmark'
                        : 'Bookmark story'
                    }
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${
                        savedArticleIds.includes(activePopupData.article.id)
                          ? 'fill-[#D95D39] text-[#D95D39]'
                          : ''
                      }`}
                    />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onArticleClick(activePopupData.article)}
                  className="px-2.5 py-1 bg-[#0F392B] hover:bg-[#184837] text-white text-[11px] font-semibold rounded-md flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <span>Read</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>,
          activePopupData.container
        )}
    </div>
  )
}
