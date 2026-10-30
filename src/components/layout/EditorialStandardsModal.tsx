import { useTranslation } from 'react-i18next'
import React, { useEffect } from 'react'
import { X, ShieldCheck, FileText, Scale } from 'lucide-react'

export type PolicyTab = 'charter' | 'privacy' | 'terms'

interface EditorialStandardsModalProps {
  isOpen: boolean
  initialTab?: PolicyTab
  onClose: () => void
}

export const EditorialStandardsModal: React.FC<EditorialStandardsModalProps> = ({
  isOpen,
  initialTab = 'charter',
  onClose,
}) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = React.useState<PolicyTab>(initialTab)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab, isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="min-h-full flex items-center justify-center p-4 font-sans">
        <div className="relative w-full max-w-2xl bg-white border border-[#E5E0D5] rounded shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D5] bg-[#FAF8F3]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C84B31]" />
              <h2 className="text-xs font-bold text-[#171715] tracking-widest uppercase">
                Upwise Hub • Governance & Standards
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-[#78716C] hover:text-[#171715] hover:bg-[#F5F1E8] transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex border-b border-[#E5E0D5] px-6 bg-[#FAF8F3] gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('charter')}
              className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'charter'
                  ? 'border-[#C84B31] text-[#C84B31]'
                  : 'border-transparent text-[#78716C] hover:text-[#171715]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Editorial Charter</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'privacy'
                  ? 'border-[#C84B31] text-[#C84B31]'
                  : 'border-transparent text-[#78716C] hover:text-[#171715]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'terms'
                  ? 'border-[#C84B31] text-[#C84B31]'
                  : 'border-transparent text-[#78716C] hover:text-[#171715]'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Terms & Attribution</span>
            </button>
          </div>

          <div className="p-6 text-xs text-[#5C5852] leading-relaxed max-h-[60vh] overflow-y-auto space-y-4">
            {activeTab === 'charter' && (
              <>
                <h3 className="font-serif text-lg font-medium text-[#171715]">
                  Editorial Independence & Sourcing Principles
                </h3>
                <p>
                  Upwise Hub operates as an independent discovery layer and civic broadsheet. Our primary objective is to deliver objective, concise news summaries while honoring publisher attribution.
                </p>
                <div className="p-3.5 bg-[#FAF8F3] border border-[#E5E0D5] rounded space-y-2">
                  <h4 className="font-semibold text-[#171715]">Core Commitments:</h4>
                  <ul className="list-disc list-inside space-y-1 text-[#5C5852]">
                    <li><strong>Source Transparency:</strong> Every summary explicitly cites the verified publisher and provides direct access to the original reporting.</li>
                    <li><strong>Neutral Synthesis:</strong> Summaries do not invent facts, speculative opinions, or fabricated quotations.</li>
                    <li><strong>Fact-First Distillation:</strong> Bullet points and key takeaways are extracted directly from official briefs, court rulings, central bank decrees, or published dispatches.</li>
                  </ul>
                </div>
              </>
            )}

            {activeTab === 'privacy' && (
              <>
                <h3 className="font-serif text-lg font-medium text-[#171715]">
                  Reader Privacy Policy
                </h3>
                <p>
                  Upwise Hub is engineered with a strict privacy-first architecture:
                </p>
                <div className="p-3.5 bg-[#FAF8F3] border border-[#E5E0D5] rounded space-y-2">
                  <ul className="list-disc list-inside space-y-1 text-[#5C5852]">
                    <li><strong>Client-Side Storage:</strong> Your bookmarks, reading progress, and feed topic preferences are stored strictly in your browser's local storage.</li>
                    <li><strong>No Invasive Trackers:</strong> We do not deploy third-party advertising cookies, cross-site trackers, or commercial telemetry scripts.</li>
                    <li><strong>Session Security:</strong> Mock authentication credentials remain in client-scoped storage and are cleared upon signing out.</li>
                  </ul>
                </div>
              </>
            )}

            {activeTab === 'terms' && (
              <>
                <h3 className="font-serif text-lg font-medium text-[#171715]">
                  Terms of Service & Syndication Attribution
                </h3>
                <p>
                  Articles curated on Upwise Hub remain the intellectual property of their respective publishers, correspondents, and wire agencies.
                </p>
                <div className="p-3.5 bg-[#FAF8F3] border border-[#E5E0D5] rounded space-y-2">
                  <ul className="list-disc list-inside space-y-1 text-[#5C5852]">
                    <li><strong>Fair Use Summarization:</strong> Brief excerpts (~60 words) are provided for discovery purposes under fair dealing principles.</li>
                    <li><strong>Direct Traffic:</strong> Users are actively encouraged to read full investigative articles directly on the original publisher's platform.</li>
                    <li><strong>Corrections:</strong> Notice of factual dispute or retraction by an original publisher is reflected immediately across the indexing layer.</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          <div className="px-6 py-3 border-t border-[#E5E0D5] bg-[#FAF8F3] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#171715] text-[#F5F1E8] rounded text-xs font-semibold hover:bg-[#2C2B27] transition-colors"
            >
              Done
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
