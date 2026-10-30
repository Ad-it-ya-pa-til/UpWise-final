import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Palette,
  Bookmark,
  Share2,
  MessageCircle,
  ThumbsUp,
  Send,
  CheckCircle2,
  Maximize2,
  X,
  ExternalLink,
} from 'lucide-react'

export interface ComicCaption {
  id: string
  author: string
  text: string
  votes: number
}

export interface EditorialComicItem {
  id: string
  title: string
  artist: string
  publication: string
  date: string
  category: 'Tech Satire' | 'Economy & Markets' | 'Editorial Cartoon' | 'Caption Challenge'
  description: string
  svgType: 'photonics' | 'transit' | 'blackbox' | 'cbdc'
  hasCaptionContest?: boolean
  captions?: ComicCaption[]
}

const SEED_COMICS: EditorialComicItem[] = [
  {
    id: 'comic-1',
    title: 'Ambient Temperature Photonics',
    artist: 'R. Sen',
    publication: 'Upwise Editorial Desk',
    date: 'October 28, 2026',
    category: 'Tech Satire',
    description: 'Hardware engineers celebrate ambient silicon photonics operating without liquid cryogenic chillers, only to discover the data center thermostat was set to 16°C by facilities.',
    svgType: 'photonics',
  },
  {
    id: 'comic-2',
    title: 'The Intermodal Transfer',
    artist: 'Manish Verma',
    publication: 'The National Broadside',
    date: 'October 27, 2026',
    category: 'Editorial Cartoon',
    description: 'A 100-km/h dedicated freight express and an inland river cargo barge attempt to coordinate arrival schedules at the multi-modal junction.',
    svgType: 'transit',
  },
  {
    id: 'comic-3',
    title: 'The Model Transparency Audit',
    artist: 'K. Alok',
    publication: 'Editorial Desk Syndicate',
    date: 'October 26, 2026',
    category: 'Caption Challenge',
    description: 'Statutory compliance officers inspecting a literal black box with magnifiers while an automated system prints out an unreadable 5,000-page disclosure.',
    svgType: 'blackbox',
    hasCaptionContest: true,
    captions: [
      {
        id: 'cap-1',
        author: 'Nikhil R.',
        text: '"If you stare into the weights long enough, the weights begin to hallucinate back."',
        votes: 12,
      },
      {
        id: 'cap-2',
        author: 'Sunita V.',
        text: '"Page 4,200 specifies that the algorithm is legally considered a creative contractor."',
        votes: 8,
      },
    ],
  },
  {
    id: 'comic-4',
    title: 'Offline Digital Currency',
    artist: 'Devika Rao',
    publication: 'Mint Cartoons Archive',
    date: 'October 25, 2026',
    category: 'Economy & Markets',
    description: 'A neighborhood merchant safely tucking offline central bank digital tokens inside a repurposed vintage tin for overnight storage.',
    svgType: 'cbdc',
  },
]

export const EditorialComicsHub: React.FC = () => {
  const [comics, setComics] = useState<EditorialComicItem[]>(() => {
    try {
      const stored = localStorage.getItem('upwise_editorial_comics_v1')
      return stored ? JSON.parse(stored) : SEED_COMICS
    } catch {
      return SEED_COMICS
    }
  })

  const [savedComicIds, setSavedComicIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('upwise_saved_comics')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [captionInput, setCaptionInput] = useState<{ [comicId: string]: string }>({})
  const [votedCaptionIds, setVotedCaptionIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('upwise_voted_captions')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [activeModalComic, setActiveModalComic] = useState<EditorialComicItem | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const saveComics = (updated: EditorialComicItem[]) => {
    setComics(updated)
    try {
      localStorage.setItem('upwise_editorial_comics_v1', JSON.stringify(updated))
    } catch {
      // Storage fallback
    }
  }

  const handleToggleSave = (comicId: string) => {
    const isSaved = savedComicIds.includes(comicId)
    const newSaved = isSaved
      ? savedComicIds.filter((id) => id !== comicId)
      : [...savedComicIds, comicId]

    setSavedComicIds(newSaved)
    try {
      localStorage.setItem('upwise_saved_comics', JSON.stringify(newSaved))
    } catch {
      // Storage fallback
    }
  }

  const handleShare = (comic: EditorialComicItem) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setNotice(`Link to "${comic.title}" copied to clipboard.`)
      setTimeout(() => setNotice(null), 2500)
    }
  }

  const handleAddCaption = (comicId: string, e: React.FormEvent) => {
    e.preventDefault()
    const text = captionInput[comicId]?.trim()
    if (!text) return

    const newCap: ComicCaption = {
      id: `cap-${Date.now()}`,
      author: 'Reader',
      text: text.startsWith('"') ? text : `"${text}"`,
      votes: 1,
    }

    const updated = comics.map((c) => {
      if (c.id === comicId) {
        return {
          ...c,
          captions: [...(c.captions || []), newCap],
        }
      }
      return c
    })

    saveComics(updated)
    setCaptionInput((prev) => ({ ...prev, [comicId]: '' }))
    setNotice('Your caption submission has been added to the challenge.')
    setTimeout(() => setNotice(null), 3000)
  }

  const handleVoteCaption = (comicId: string, captionId: string) => {
    if (votedCaptionIds.includes(captionId)) return

    const newVoted = [...votedCaptionIds, captionId]
    setVotedCaptionIds(newVoted)
    try {
      localStorage.setItem('upwise_voted_captions', JSON.stringify(newVoted))
    } catch {
      // Storage fallback
    }

    const updated = comics.map((c) => {
      if (c.id === comicId && c.captions) {
        return {
          ...c,
          captions: c.captions.map((cap) =>
            cap.id === captionId ? { ...cap, votes: cap.votes + 1 } : cap
          ),
        }
      }
      return c
    })

    saveComics(updated)
  }

  const filtered = comics.filter((c) => {
    if (selectedCategory === 'All') return true
    if (selectedCategory === 'Caption Contest') return Boolean(c.hasCaptionContest)
    return c.category === selectedCategory
  })

  const renderEditorialIllustration = (type: EditorialComicItem['svgType']) => {
    switch (type) {
      case 'photonics':
        return (
          <svg viewBox="0 0 400 240" className="w-full h-full bg-[#FAF8F3]" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="240" fill="#FAF8F3" />
            <line x1="20" y1="210" x2="380" y2="210" stroke="#171715" strokeWidth="2.5" />
            <rect x="50" y="70" width="130" height="130" fill="#FFFFFF" stroke="#171715" strokeWidth="2" />
            <rect x="65" y="85" width="100" height="15" fill="#E5E0D5" stroke="#171715" strokeWidth="1.2" />
            <line x1="75" y1="92" x2="155" y2="92" stroke="#C84B31" strokeWidth="2" strokeDasharray="4 2" />
            <rect x="65" y="115" width="100" height="15" fill="#E5E0D5" stroke="#171715" strokeWidth="1.2" />
            <line x1="75" y1="122" x2="155" y2="122" stroke="#C84B31" strokeWidth="2" strokeDasharray="4 2" />
            <rect x="65" y="145" width="100" height="15" fill="#E5E0D5" stroke="#171715" strokeWidth="1.2" />
            <line x1="75" y1="152" x2="155" y2="152" stroke="#C84B31" strokeWidth="2" strokeDasharray="4 2" />
            <circle cx="270" cy="110" r="16" fill="#FFFFFF" stroke="#171715" strokeWidth="2" />
            <line x1="270" y1="126" x2="270" y2="175" stroke="#171715" strokeWidth="2" />
            <line x1="270" y1="140" x2="245" y2="125" stroke="#171715" strokeWidth="2" />
            <line x1="270" y1="140" x2="295" y2="150" stroke="#171715" strokeWidth="2" />
            <line x1="270" y1="175" x2="255" y2="210" stroke="#171715" strokeWidth="2" />
            <line x1="270" y1="175" x2="285" y2="210" stroke="#171715" strokeWidth="2" />
            <rect x="305" y="75" width="65" height="40" rx="3" fill="#FFFFFF" stroke="#171715" strokeWidth="1.5" />
            <text x="337" y="94" textAnchor="middle" fontSize="12" fontFamily="monospace" fill="#171715">16.0°C</text>
            <text x="337" y="107" textAnchor="middle" fontSize="8" fontFamily="sans-serif" fill="#78716C">AC LOCKED</text>
            <text x="115" y="55" textAnchor="middle" fontSize="11" fontStyle="italic" fontFamily="serif" fill="#171715">"Ambient Silicon Interconnect"</text>
          </svg>
        )
      case 'transit':
        return (
          <svg viewBox="0 0 400 240" className="w-full h-full bg-[#FAF8F3]" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="240" fill="#FAF8F3" />
            <line x1="20" y1="170" x2="380" y2="170" stroke="#171715" strokeWidth="2.5" />
            <rect x="40" y="100" width="130" height="60" fill="#FFFFFF" stroke="#171715" strokeWidth="2" />
            <circle cx="65" cy="165" r="9" fill="#E5E0D5" stroke="#171715" strokeWidth="1.5" />
            <circle cx="95" cy="165" r="9" fill="#E5E0D5" stroke="#171715" strokeWidth="1.5" />
            <circle cx="125" cy="165" r="9" fill="#E5E0D5" stroke="#171715" strokeWidth="1.5" />
            <circle cx="150" cy="165" r="9" fill="#E5E0D5" stroke="#171715" strokeWidth="1.5" />
            <text x="105" y="135" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="sans-serif" fill="#171715">SPEED FREIGHT</text>
            <path d="M 230,165 L 350,165 L 340,195 L 240,195 Z" fill="#FFFFFF" stroke="#171715" strokeWidth="2" />
            <rect x="255" y="125" width="70" height="35" fill="#E5E0D5" stroke="#171715" strokeWidth="1.5" />
            <text x="290" y="146" textAnchor="middle" fontSize="9" fontFamily="sans-serif" fill="#171715">GANGA CARGO</text>
            <path d="M 20,205 Q 100,195 200,205 T 380,205" fill="none" stroke="#C84B31" strokeWidth="1.5" />
            <text x="200" y="55" textAnchor="middle" fontSize="11" fontStyle="italic" fontFamily="serif" fill="#171715">"Synchronizing arrivals at the terminal"</text>
          </svg>
        )
      case 'blackbox':
        return (
          <svg viewBox="0 0 400 240" className="w-full h-full bg-[#FAF9F6]" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="240" fill="#FAF9F6" />
            <line x1="20" y1="210" x2="380" y2="210" stroke="#1C1917" strokeWidth="2.5" />
            <rect x="150" y="80" width="100" height="110" fill="#1C1917" stroke="#1C1917" strokeWidth="2" />
            <text x="200" y="140" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#FFFFFF">MODEL [ ? ]</text>
            <circle cx="90" cy="120" r="15" fill="#FFFFFF" stroke="#1C1917" strokeWidth="2" />
            <line x1="90" y1="135" x2="90" y2="180" stroke="#1C1917" strokeWidth="2" />
            <line x1="90" y1="145" x2="135" y2="130" stroke="#1C1917" strokeWidth="2" />
            <circle cx="138" cy="128" r="8" fill="none" stroke="#1C1917" strokeWidth="2" />
            <line x1="90" y1="180" x2="75" y2="210" stroke="#1C1917" strokeWidth="2" />
            <line x1="90" y1="180" x2="105" y2="210" stroke="#1C1917" strokeWidth="2" />
            <path d="M 250,110 L 330,110 L 330,200 L 290,205 L 290,120 L 250,120 Z" fill="#FFFFFF" stroke="#1C1917" strokeWidth="1.2" />
            <text x="310" y="145" textAnchor="middle" fontSize="7" fontFamily="sans-serif" fill="#78716C">T.O.S. p.4200</text>
            <text x="200" y="45" textAnchor="middle" fontSize="11" fontStyle="italic" fontFamily="serif" fill="#1C1917">"Auditing for Statutory Transparency"</text>
          </svg>
        )
      case 'cbdc':
        return (
          <svg viewBox="0 0 400 240" className="w-full h-full bg-[#FAF9F6]" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="240" fill="#FAF9F6" />
            <line x1="20" y1="200" x2="380" y2="200" stroke="#1C1917" strokeWidth="2.5" />
            <rect x="120" y="100" width="160" height="90" rx="6" fill="#FFFFFF" stroke="#1C1917" strokeWidth="2" />
            <circle cx="200" cy="145" r="28" fill="#FAF9F6" stroke="#1C1917" strokeWidth="1.5" />
            <text x="200" y="153" textAnchor="middle" fontSize="22" fontWeight="bold" fontFamily="sans-serif" fill="#1C1917">₹</text>
            <text x="200" y="85" textAnchor="middle" fontSize="10" fontFamily="sans-serif" fill="#78716C">OFFLINE LEDGER BOX</text>
            <circle cx="60" cy="115" r="14" fill="#FFFFFF" stroke="#1C1917" strokeWidth="2" />
            <line x1="60" y1="129" x2="60" y2="175" stroke="#1C1917" strokeWidth="2" />
            <line x1="60" y1="140" x2="115" y2="135" stroke="#1C1917" strokeWidth="2" />
            <line x1="60" y1="175" x2="45" y2="200" stroke="#1C1917" strokeWidth="2" />
            <line x1="60" y1="175" x2="75" y2="200" stroke="#1C1917" strokeWidth="2" />
            <text x="200" y="45" textAnchor="middle" fontSize="11" fontStyle="italic" fontFamily="serif" fill="#1C1917">"Zero-battery cash settlement"</text>
          </svg>
        )
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto font-sans">
      {notice && (
        <div className="mb-4 p-3 bg-stone-900 text-white text-xs font-medium rounded-lg flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-stone-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="mb-6 pb-5 border-b border-[#E5E0D5]">
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#C84B31] block mb-1">
          Visual Commentary Desk
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-medium text-[#171715] tracking-tight">
          Editorial Comics & Satire
        </h1>
        <p className="text-xs sm:text-sm text-[#5C5852] mt-1 font-sans">
          Syndicated editorial cartoons, political satire, and reader caption challenges from the broadsheet art desk.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-1.5">
        {['All', 'Tech Satire', 'Editorial Cartoon', 'Economy & Markets', 'Caption Contest'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded text-xs transition-colors ${
              selectedCategory === cat
                ? 'bg-[#171715] text-[#F5F1E8] font-semibold shadow-xs'
                : 'bg-white border border-[#E5E0D5] text-[#5C5852] hover:text-[#171715] hover:bg-[#FAF8F3]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {filtered.map((comic) => {
          const isSaved = savedComicIds.includes(comic.id)

          return (
            <article
              key={comic.id}
              className="bg-white border border-stone-200/90 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
            >
              <div className="p-5 sm:p-6 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                    <span className="font-semibold text-stone-800">{comic.artist}</span>
                    <span className="text-stone-300">•</span>
                    <span className="text-stone-500">{comic.publication}</span>
                    <span className="text-stone-300">•</span>
                    <span className="text-stone-400">{comic.date}</span>
                  </div>
                  <h2 className="font-serif text-2xl font-normal text-stone-900 tracking-[-0.02em]">
                    {comic.title}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleSave(comic.id)}
                    aria-label={isSaved ? 'Remove bookmark' : 'Bookmark comic'}
                    className={`p-1.5 rounded transition-colors ${
                      isSaved ? 'text-indigo-600 bg-indigo-50' : 'text-stone-400 hover:text-stone-800'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 stroke-[1.75] ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare(comic)}
                    aria-label="Share cartoon"
                    className="p-1.5 rounded text-stone-400 hover:text-stone-800 transition-colors"
                  >
                    <Share2 className="w-4 h-4 stroke-[1.75]" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 bg-stone-50/60 border-b border-stone-100 flex items-center justify-center">
                <div className="w-full max-w-xl aspect-[16/10] border border-stone-200/80 rounded-lg overflow-hidden bg-white shadow-xs relative group">
                  {renderEditorialIllustration(comic.svgType)}
                  <button
                    type="button"
                    onClick={() => setActiveModalComic(comic)}
                    className="absolute bottom-3 right-3 p-1.5 rounded-md bg-white/90 border border-stone-200 text-stone-600 hover:text-stone-900 opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                    title="Expand panel"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <p className="text-sm text-stone-700 leading-relaxed font-sans mb-4">
                  {comic.description}
                </p>

                {comic.hasCaptionContest && (
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider font-semibold bg-stone-100 text-stone-800 px-2 py-0.5 rounded border border-stone-200">
                          Reader Caption Contest
                        </span>
                        <span className="text-xs text-stone-500">
                          Vote for your favorite satire caption or add yours
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {comic.captions?.map((cap) => {
                        const hasVoted = votedCaptionIds.includes(cap.id)

                        return (
                          <div
                            key={cap.id}
                            className="bg-stone-50 border border-stone-200/70 p-3 rounded-lg flex items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <p className="font-serif text-sm text-stone-900 italic mb-0.5">
                                {cap.text}
                              </p>
                              <span className="text-[10px] text-stone-400">
                                Submitted by {cap.author}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleVoteCaption(comic.id, cap.id)}
                              disabled={hasVoted}
                              className={`px-2.5 py-1 rounded border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                                hasVoted
                                  ? 'bg-stone-900 border-stone-900 text-white'
                                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3 stroke-[1.75]" />
                              <span>{cap.votes}</span>
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    <form
                      onSubmit={(e) => handleAddCaption(comic.id, e)}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={captionInput[comic.id] || ''}
                        onChange={(e) =>
                          setCaptionInput((prev) => ({
                            ...prev,
                            [comic.id]: e.target.value,
                          }))
                        }
                        placeholder="Submit a witty editorial caption for this illustration..."
                        className="flex-1 px-3.5 h-10 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-stone-800"
                      />
                      <button
                        type="submit"
                        disabled={!captionInput[comic.id]?.trim()}
                        className="px-4 h-10 bg-[#1C1917] hover:bg-stone-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <Send className="w-3 h-3" />
                        <span>Submit</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {activeModalComic && (
        <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-stone-300 max-w-2xl w-full p-6 shadow-modal animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div>
                <h3 className="font-serif text-2xl text-stone-900">{activeModalComic.title}</h3>
                <p className="text-xs text-stone-500">
                  {activeModalComic.artist} • {activeModalComic.publication}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalComic(null)}
                className="p-1 rounded text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-[16/10] border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
              {renderEditorialIllustration(activeModalComic.svgType)}
            </div>
            <p className="mt-4 text-xs text-stone-600 leading-relaxed font-sans">
              {activeModalComic.description}
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-[11px] text-stone-400 border-t border-stone-200/70 pt-4">
        Syndicated Satire Desk • Archival editorial panel reproductions and daily commentary.
      </div>
    </div>
  )
}
