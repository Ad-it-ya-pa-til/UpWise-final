import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCategoryTranslation } from '../../utils/categoryTranslation'
import { Bookmark, Share2, ExternalLink, ArrowRight, CheckCircle2, Newspaper } from 'lucide-react'
import { Article, LanguageMode } from '../../types/news'

interface InShortsCardProps {
  article: Article
  language?: LanguageMode
  onArticleClick: (article: Article) => void
  isSaved?: boolean
  onToggleSave?: (articleId: string, e: React.MouseEvent) => void
  onShare?: (article: Article, e: React.MouseEvent) => void
  className?: string
}

export const InShortsCard: React.FC<InShortsCardProps> = ({
  article,
  language = 'en',
  onArticleClick,
  isSaved = false,
  onToggleSave,
  onShare,
  className = '',
}) => {
  const { t } = useTranslation();
  const translateCategory = useCategoryTranslation();
  const [imageError, setImageError] = useState(false)
  const isHindi = language === 'hi'
  const displayTitle = isHindi && article.titleHi ? article.titleHi : article.title
  const displaySummary = isHindi && article.summaryHi ? article.summaryHi : article.summary
  const isTranslationAvailable = !isHindi || Boolean(article.summaryHi)

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onShare) {
      onShare(article, e)
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(article.originalUrl || window.location.href)
    }
  }

  const handleSourceClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleSave?.(article.id, e)
  }

  return (
    <article
      onClick={() => onArticleClick(article)}
      className={`group cursor-pointer bg-white border border-[#E5E0D5] hover:border-[#D4CDBF] transition-all duration-150 overflow-hidden select-none font-sans ${className}`}
      aria-label={displayTitle}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 p-5 sm:p-6">
        <div className="order-2 md:order-1 md:col-span-7 lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C84B31]">
                {translateCategory(article.categoryName)}
              </span>
              <span className="text-[#D4CDBF]">•</span>
              <span className="text-xs font-semibold text-[#171715] flex items-center gap-1">
                {article.source.name}
                {article.source.verified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#171715] inline stroke-[2]" aria-label="Verified publisher" />
                )}
              </span>
              <span className="text-[#D4CDBF]">•</span>
              <span className="text-xs text-[#78716C]">{article.publishedAt}</span>
              {!isTranslationAvailable && (
                <>
                  <span className="text-[#D4CDBF]">•</span>
                  <span className="text-[11px] text-[#C84B31] font-medium">English only</span>
                </>
              )}
            </div>

            <h2 className="font-serif font-medium text-xl sm:text-2xl text-[#171715] group-hover:text-[#0F0F0D] transition-colors leading-[1.28] mb-2.5 tracking-[-0.01em]">
              {displayTitle}
            </h2>

            <p className="text-[14px] sm:text-[15px] text-[#5C5852] line-clamp-3 leading-relaxed mb-4 font-normal">
              {displaySummary}
            </p>
          </div>

          <div className="mt-auto pt-3 border-t border-[#E5E0D5] flex items-center justify-between text-xs text-[#78716C]">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#171715] group-hover:text-[#C84B31] transition-colors">
                <span>Read Story</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>

              {article.readTime && (
                <>
                  <span className="text-[#D4CDBF]">•</span>
                  <span className="text-[#78716C]">{article.readTime}</span>
                </>
              )}

              {article.originalUrl && (
                <>
                  <span className="text-[#D4CDBF]">•</span>
                  <a
                    href={article.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleSourceClick}
                    className="text-[#78716C] hover:text-[#C84B31] inline-flex items-center gap-1 transition-colors"
                    title={`Source: ${article.source.name}`}
                  >
                    <span>Original Source</span>
                    <ExternalLink className="w-3 h-3 text-[#78716C]" />
                  </a>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              {onToggleSave && (
                <button
                  type="button"
                  onClick={handleBookmarkClick}
                  aria-label={isSaved ? 'Remove bookmark' : 'Bookmark story'}
                  title={isSaved ? 'Bookmarked' : 'Bookmark story'}
                  className={`p-1.5 rounded transition-colors ${
                    isSaved
                      ? 'text-[#C84B31] bg-[#FBF2EF]'
                      : 'text-[#78716C] hover:text-[#171715] hover:bg-[#FAF8F3]'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 stroke-[1.75] ${isSaved ? 'fill-current' : ''}`} />
                </button>
              )}

              <button
                type="button"
                onClick={handleShareClick}
                aria-label="Share story"
                title="Share story"
                className="p-1.5 rounded text-[#78716C] hover:text-[#171715] hover:bg-[#FAF8F3] transition-colors"
              >
                <Share2 className="w-4 h-4 stroke-[1.75]" />
              </button>
            </div>
          </div>
        </div>

        <div className="order-1 md:order-2 md:col-span-5 lg:col-span-4 flex items-center justify-center">
          {article.imageUrl && !imageError ? (
            <div className="w-full aspect-[16/10] overflow-hidden bg-[#FAF8F3] border border-[#E5E0D5]">
              <img
                src={article.imageUrl}
                alt={article.imageCaption || displayTitle}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-full aspect-[16/10] bg-[#FAF8F3] border border-[#E5E0D5] flex flex-col items-center justify-center gap-1.5 text-[#78716C] p-4 text-center">
              <Newspaper className="w-6 h-6 stroke-[1.5] text-[#A8A29E]" />
              <span className="text-xs font-semibold text-[#171715]">{article.source.name}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
