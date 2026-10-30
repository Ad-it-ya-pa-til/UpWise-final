import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  BookOpen,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  ArrowRight,
  Sparkles,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Article } from '../../types/news.js';
import { askAiAssistantApi, checkClaimEvidenceApi } from '../../services/api.js';

export interface AiChatWidgetProps {
  currentArticle?: Article | null;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  isError?: boolean;
}

// ----------------------------------------------------------------------
// Helper to parse and format markdown for editorial presentation
// ----------------------------------------------------------------------
function renderFormattedContent(content: string): React.ReactNode {
  const lines = content.split('\n');
  const nodes: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="my-2 space-y-1 pl-0.5">
          {currentList.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-xs sm:text-[13px] text-[#292524] leading-relaxed"
            >
              <span className="text-[#D95D39] font-bold mt-0.5 select-none shrink-0">•</span>
              <span className="flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      flushList();
      continue;
    }

    if (line.startsWith('### ')) {
      flushList();
      nodes.push(
        <h4
          key={`h4-${i}`}
          className="font-serif font-bold text-sm sm:text-[14px] text-[#141412] mt-3.5 mb-1 tracking-tight"
        >
          {renderInline(line.replace('### ', ''))}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      flushList();
      nodes.push(
        <h3
          key={`h3-${i}`}
          className="font-serif font-bold text-base sm:text-[16px] text-[#141412] mt-4 mb-1.5 tracking-tight"
        >
          {renderInline(line.replace('## ', ''))}
        </h3>
      );
    } else if (line.startsWith('> ')) {
      flushList();
      nodes.push(
        <blockquote
          key={`bq-${i}`}
          className="border-l-2 border-[#D95D39] bg-[#FAF8F5] px-3 py-1.5 my-2.5 rounded-r text-xs sm:text-[13px] text-[#44403C] italic leading-relaxed"
        >
          {renderInline(line.replace(/^>\s*/, ''))}
        </blockquote>
      );
    } else if (line.startsWith('---')) {
      flushList();
      nodes.push(<hr key={`hr-${i}`} className="my-3 border-t border-[#E8E2D8]" />);
    } else if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
      currentList.push(line.replace(/^[•\-*]\s+/, ''));
    } else if (/^\d+\.\s+/.test(line)) {
      flushList();
      const numMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        nodes.push(
          <div
            key={`num-${i}`}
            className="flex items-start gap-2 my-1 text-xs sm:text-[13px] text-[#292524] leading-relaxed"
          >
            <span className="font-serif font-bold text-[#D95D39] text-xs mt-0.5 shrink-0">
              {numMatch[1]}.
            </span>
            <span className="flex-1">{renderInline(numMatch[2])}</span>
          </div>
        );
      }
    } else {
      flushList();
      nodes.push(
        <p key={`p-${i}`} className="my-1.5 text-xs sm:text-[13px] text-[#292524] leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
  }

  flushList();
  return nodes;
}

// Inline token parser for bold, links, code, and italics
function renderInline(text: string): React.ReactNode {
  // Matches markdown links: [text](url), bold: **text**, italic: *text*, code: `text`
  const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        return (
          <a
            key={index}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0F392B] hover:text-[#D95D39] underline decoration-[#0F392B]/40 hover:decoration-[#D95D39] font-medium inline-flex items-center gap-0.5 transition-colors"
          >
            <span>{match[1]}</span>
            <ExternalLink className="w-2.5 h-2.5 inline stroke-[2]" />
          </a>
        );
      }
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-[#141412]">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic text-[#44403C]">
          {part.slice(1, -1)}
        </em>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="bg-[#F5EFEB] px-1 py-0.5 rounded text-[11px] font-mono text-[#1C1917]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}

// ----------------------------------------------------------------------
// Primary Suggested Prompts required by specification
// ----------------------------------------------------------------------
const CORE_SUGGESTED_PROMPTS = [
  {
    id: 'tech-today',
    title: "Explain today's important tech news.",
    shortLabel: 'Tech highlights',
    description: 'Break down major technology, AI, and computing developments.',
    prompt: "Explain today's important tech news in clear, structured points.",
  },
  {
    id: 'simple-terms',
    title: 'Summarize this article in simple language.',
    shortLabel: 'Simple summary',
    description: 'Plain-English translation of complex reporting without jargon.',
    prompt: 'Summarize this article in simple language with the core facts.',
  },
  {
    id: 'student-impact',
    title: 'Why does this matter to students?',
    shortLabel: 'Student impact',
    description: 'Academic relevance, career takeaways, and competitive exam context.',
    prompt: 'Why does this development matter to students and early-career researchers?',
  },
  {
    id: 'hindi-explain',
    title: 'Explain this topic in Hindi.',
    shortLabel: 'हिंदी संस्करण',
    description: 'देवनागरी लिपि में संपूर्ण संदर्भ और सरल संपादकीय विवरण।',
    prompt: 'इस विषय को सरल और स्पष्ट हिंदी में मुख्य बिंदुओं के साथ समझाइए।',
  },
  {
    id: 'evidence-lens',
    title: 'Evidence Lens: Verify claims & retrieve web citations.',
    shortLabel: 'Evidence Lens',
    description: 'Retrieve real external search citations to evaluate supporting vs contradicting evidence.',
    prompt: 'Verify the claims in this reporting against accredited web evidence sources.',
  },
];

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({
  currentArticle,
  isOpen,
  onClose,
  onOpen,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputValue).trim();
    if (!textToSend || loading) return;

    setLastSubmittedPrompt(textToSend);

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputValue('');
    setLoading(true);

    try {
      const isEvidenceLensQuery =
        textToSend.toLowerCase().includes('evidence lens') ||
        textToSend.toLowerCase().includes('verify claim') ||
        textToSend.toLowerCase().includes('fact check') ||
        textToSend.toLowerCase().includes('web evidence') ||
        textToSend.toLowerCase().includes('verify the claim')

      if (isEvidenceLensQuery) {
        const claimToVerify = currentArticle
          ? `${currentArticle.title}: ${currentArticle.summary}`
          : textToSend.replace(/(evidence lens:?|verify claims?:?|fact check:?|web evidence:?)/gi, '').trim() || textToSend

        const lensRes = await checkClaimEvidenceApi({
          claim: claimToVerify,
          articleContext: currentArticle
            ? {
                title: currentArticle.title,
                publisher: currentArticle.source?.name,
                url: currentArticle.originalUrl,
                summary: currentArticle.summary,
                content: Array.isArray(currentArticle.content)
                  ? currentArticle.content.join('\n\n')
                  : currentArticle.summary,
                category: currentArticle.categoryName,
                publishedAt: currentArticle.publishedAt,
              }
            : undefined,
        })

        let formatted = `### Evidence Lens: Fact & Citation Evaluation\n\n`
        formatted += `**Claim Evaluated:** *"${lensRes.claim}"*\n\n`

        const verdictLabels: Record<string, string> = {
          supported: '🟢 **Verdict: Supported by Evidence**',
          contradicted: '🔴 **Verdict: Contradicted by Evidence**',
          inconclusive: '🟡 **Verdict: Inconclusive / Mixed Evidence**',
          unverified: '⚪ **Verdict: Unverified (Search Sources Unavailable)**',
        }
        formatted += `${verdictLabels[lensRes.verdict] || verdictLabels.unverified}\n\n`
        formatted += `> ${lensRes.summary}\n\n`

        if (lensRes.evidence.supporting.length > 0) {
          formatted += `#### Supporting Evidence (${lensRes.evidence.supporting.length})\n`
          lensRes.evidence.supporting.forEach((ev) => {
            formatted += `• **[${ev.sourceTitle}](${ev.sourceUrl})** ${ev.date ? `*(${ev.date})*` : ''}\n  ${ev.quote}\n`
          })
          formatted += `\n`
        }

        if (lensRes.evidence.contradicting.length > 0) {
          formatted += `#### Contradicting Evidence (${lensRes.evidence.contradicting.length})\n`
          lensRes.evidence.contradicting.forEach((ev) => {
            formatted += `• **[${ev.sourceTitle}](${ev.sourceUrl})** ${ev.date ? `*(${ev.date})*` : ''}\n  ${ev.quote}\n`
          })
          formatted += `\n`
        }

        if (lensRes.evidence.inconclusive.length > 0) {
          formatted += `#### Contextual / Inconclusive Evidence (${lensRes.evidence.inconclusive.length})\n`
          lensRes.evidence.inconclusive.forEach((ev) => {
            formatted += `• **[${ev.sourceTitle}](${ev.sourceUrl})** ${ev.date ? `*(${ev.date})*` : ''}\n  ${ev.quote}\n`
          })
          formatted += `\n`
        }

        if (lensRes.sources.length > 0) {
          formatted += `#### Retrieved Web Sources (${lensRes.sources.length})\n`
          lensRes.sources.forEach((s) => {
            formatted += `• [${s.title}](${s.url}) ${s.date ? `*(${s.date})*` : ''}\n`
          })
          formatted += `\n`
        }

        formatted += `#### Editorial AI Interpretation\n${lensRes.aiInterpretation}\n\n`
        formatted += `---\n*ℹ️ Standard: Never accept AI claims as verified without reviewing primary source links above. Search Provider: ${lensRes.searchProvider || (lensRes.searchAvailable ? 'Tavily Search API' : 'External Search Unconfigured')}*`

        const assistantMsg: ChatMessage = {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          content: formatted,
          timestamp: new Date(),
          model: lensRes.searchAvailable ? 'Evidence Lens (Live Search Grounded)' : 'Evidence Lens (Strict Article Grounding)',
        }

        setMessages((prev) => [...prev, assistantMsg])
        setLoading(false)
        return
      }

      const history = messages
        .filter((m) => (m.role === 'user' || m.role === 'assistant') && !m.isError)
        .slice(-6)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const res = await askAiAssistantApi({
        message: textToSend,
        articleContext: currentArticle
          ? {
              title: currentArticle.title,
              publisher: currentArticle.source?.name,
              url: currentArticle.originalUrl,
              summary: currentArticle.summary,
              content: Array.isArray(currentArticle.content)
                ? currentArticle.content.join('\n\n')
                : currentArticle.summary,
              category: currentArticle.categoryName,
            }
          : undefined,
        history,
      });

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date(),
        model: res.model,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          'Our editorial service encountered a connection issue. Please verify your connection or retry your inquiry.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastSubmittedPrompt) {
      handleSend(lastSubmittedPrompt);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetConversation = () => {
    setMessages([]);
    setInputValue('');
  };

  // ----------------------------------------------------------------------
  // Closed State: Minimal Editorial Floating Pill
  // ----------------------------------------------------------------------
  if (!isOpen) {
    return (
      <button
        onClick={onOpen}
        type="button"
        className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-40 bg-[#FAF7F2] hover:bg-white text-[#141412] px-3.5 py-2.5 rounded-full shadow-sm hover:shadow border border-[#E8E2D8] flex items-center gap-2.5 transition-all font-sans text-xs font-semibold select-none group focus:outline-none focus:ring-2 focus:ring-[#D95D39]/30"
        title="Open Upwise AI Assistant"
        aria-label="Open Upwise AI Assistant"
      >
        <div className="w-5 h-5 rounded-full bg-[#0F392B] text-white flex items-center justify-center shrink-0">
          <BookOpen className="w-3 h-3 stroke-[2.2]" />
        </div>
        <span className="text-[#141412] font-medium tracking-tight">AI Reading Companion</span>
        {currentArticle && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#D95D39] shrink-0"
            title="Article context attached"
          />
        )}
      </button>
    );
  }

  // ----------------------------------------------------------------------
  // Open State: Editorial Drawer / Assistant View
  // ----------------------------------------------------------------------
  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-label="Upwise AI Reading Companion"
      className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-[440px] max-w-[100vw] h-[82vh] sm:h-[620px] max-h-[90vh] bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl shadow-xl flex flex-col overflow-hidden font-sans animate-in slide-in-from-bottom-4 duration-150"
    >
      {/* 1. Masthead Header */}
      <div className="bg-[#FAF7F2] text-[#141412] px-4 py-3 flex items-center justify-between border-b border-[#E8E2D8] shrink-0 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-md bg-[#0F392B] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <BookOpen className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-sm text-[#141412] tracking-tight truncate">
                Upwise Reading Companion
              </h3>
            </div>
            <p className="text-[11px] text-[#78716C] font-normal truncate">
              Editorial synthesis & student inquiry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {messages.length > 0 && (
            <button
              onClick={handleResetConversation}
              type="button"
              className="text-[#78716C] hover:text-[#141412] p-1.5 rounded-md hover:bg-white border border-transparent hover:border-[#E8E2D8] transition-colors text-[11px] flex items-center gap-1"
              title="Reset conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
          <button
            onClick={onClose}
            type="button"
            className="text-[#78716C] hover:text-[#141412] p-1.5 rounded-md hover:bg-white border border-transparent hover:border-[#E8E2D8] transition-colors"
            title="Close companion"
            aria-label="Close assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Article Context Strip (If an article is selected) */}
      {currentArticle && (
        <div className="bg-[#F5EFEB] border-b border-[#E8E2D8] px-3.5 py-2 flex items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-3.5 h-3.5 text-[#D95D39] shrink-0" />
            <span className="text-[11px] text-[#57534E] shrink-0 font-medium">Context:</span>
            <span className="text-[11px] font-semibold text-[#141412] truncate">
              "{currentArticle.title}"
            </span>
          </div>
          <span className="text-[10px] text-[#78716C] uppercase font-bold shrink-0 tracking-wider">
            {currentArticle.source?.name}
          </span>
        </div>
      )}

      {/* 3. Conversation & Welcome Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#FAF8F5]">
        {/* Welcome Area (Visible when conversation is starting) */}
        {messages.length === 0 ? (
          <div className="py-2 animate-in fade-in duration-200">
            <div className="mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D95D39] block mb-1">
                Editorial Scholar
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#141412] tracking-tight mb-1.5">
                Understand what matters.
              </h2>
              <p className="font-sans text-xs sm:text-[13px] text-[#57534E] leading-relaxed">
                Read between the headlines, explore policy and economic impact, and ask follow-up
                questions grounded directly in credible reporting.
              </p>
            </div>

            <div className="border-t border-[#E8E2D8] pt-3.5 mb-2">
              <span className="text-[11px] font-semibold text-[#141412] uppercase tracking-wider block mb-2.5">
                Suggested Inquiries
              </span>
              <div className="grid grid-cols-1 gap-2">
                {CORE_SUGGESTED_PROMPTS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSend(item.prompt)}
                    disabled={loading}
                    type="button"
                    className="w-full text-left p-2.5 bg-white hover:bg-[#FDFBF7] border border-[#E8E2D8] hover:border-[#D95D39]/50 rounded-lg transition-all group flex items-start justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#141412] group-hover:text-[#D95D39] transition-colors leading-snug">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-[#78716C] mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#D95D39] group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[85%] rounded-lg px-3.5 py-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[#1C1917] text-[#FAF7F2] rounded-br-xs shadow-2xs'
                      : msg.isError
                      ? 'bg-[#FFF5F5] text-[#991B1B] border border-[#FECACA] rounded-bl-xs'
                      : 'bg-white text-[#1C1917] border border-[#E8E2D8] rounded-bl-xs shadow-2xs'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] leading-relaxed">
                      {msg.content}
                    </div>
                  ) : (
                    <div>
                      {/* Response Meta Header */}
                      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[#E8E2D8]/70 text-[10px] text-[#78716C]">
                        <span className="font-semibold text-[#141412] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0F392B]" />
                          <span>{msg.model || 'Upwise Editorial Analysis'}</span>
                        </span>
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          type="button"
                          className="hover:text-[#141412] flex items-center gap-1 transition-colors"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-[#0F392B]" />
                              <span className="text-[#0F392B] font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Render Formatted Response */}
                      <div className="font-sans text-xs sm:text-[13px] leading-relaxed text-[#1C1917]">
                        {renderFormattedContent(msg.content)}
                      </div>

                      {/* Error State with Retry Button */}
                      {msg.isError && (
                        <div className="mt-3 pt-2 border-t border-[#FECACA] flex items-center justify-between">
                          <span className="text-[11px] text-[#B91C1C] flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Inquiry interrupted</span>
                          </span>
                          <button
                            onClick={handleRetry}
                            type="button"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#B91C1C] text-white rounded text-[11px] font-semibold hover:bg-[#991B1B] transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Retry</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-[#A8A29E] px-1 select-none">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-start gap-1">
            <div className="bg-white border border-[#E8E2D8] rounded-lg rounded-bl-xs px-3.5 py-3 text-xs text-[#57534E] shadow-2xs flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#D95D39] animate-pulse" />
              <span className="text-xs font-medium text-[#44403C]">
                Reviewing dispatches & synthesizing source facts...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Compact Quick Suggestions Carousel (when in active conversation) */}
      {messages.length > 0 && (
        <div className="px-3 py-1.5 bg-[#FAF7F2] border-t border-[#E8E2D8] flex gap-1.5 overflow-x-auto no-scrollbar">
          {CORE_SUGGESTED_PROMPTS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSend(item.prompt)}
              disabled={loading}
              type="button"
              className="text-[11px] whitespace-nowrap bg-white hover:bg-[#FDFBF7] text-[#292524] px-2.5 py-1 rounded border border-[#E8E2D8] transition-colors shrink-0 disabled:opacity-50 shadow-2xs"
            >
              {item.shortLabel}
            </button>
          ))}
        </div>
      )}

      {/* 5. Message Composer */}
      <div className="p-3 bg-white border-t border-[#E8E2D8] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              currentArticle
                ? 'Ask a question about this story...'
                : 'Ask about today’s headlines, policy, or concepts...'
            }
            disabled={loading}
            className="flex-1 bg-[#FAF7F2] border border-[#E8E2D8] focus:border-[#D95D39] focus:bg-white rounded-md px-3 py-2 text-xs sm:text-[13px] text-[#1C1917] placeholder-[#78716C] focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="bg-[#1C1917] hover:bg-[#292524] disabled:opacity-30 disabled:hover:bg-[#1C1917] text-[#FAF7F2] px-3 py-2 rounded-md transition-colors shrink-0 font-medium flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#D95D39]/40"
            title="Send inquiry"
            aria-label="Send inquiry"
          >
            <Send className="w-3.5 h-3.5 text-[#D95D39]" />
          </button>
        </form>
      </div>
    </aside>
  );
};
