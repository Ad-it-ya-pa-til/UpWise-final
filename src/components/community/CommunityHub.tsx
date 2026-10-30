import React, { useState, useEffect } from 'react'
import {
  MessageSquare,
  ThumbsUp,
  Share2,
  ExternalLink,
  Plus,
  X,
  Filter,
  CheckCircle2,
  Send,
  CornerDownRight,
  Bookmark,
  Flag,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { UserProfile } from '../../types/navigation'
import {
  fetchCommunityPostsApi,
  createCommunityPostApi,
  togglePostReactionApi,
  addCommentApi,
  reportCommunityPostApi,
  moderateCommunityPostApi,
} from '../../services/api'
import {
  CommunityComment,
  CommunityPost,
  COMMUNITY_CATEGORIES,
  SEED_COMMUNITY_POSTS as SEED_POSTS,
} from '../../data/communityData'
export type { CommunityComment, CommunityPost }

interface CommunityHubProps {
  currentUser: UserProfile | null
  openComposerDirectly?: boolean
  onComposerClosed?: () => void
  onRequireLogin?: () => void
}

export const CommunityHub: React.FC<CommunityHubProps> = ({
  currentUser,
  openComposerDirectly = false,
  onComposerClosed,
  onRequireLogin,
}) => {
  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    try {
      const stored = localStorage.getItem('upwise_community_posts_v1')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {
      // Storage fallback
    }
    return SEED_POSTS
  })

  const [votedPostIds, setVotedPostIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('upwise_community_voted_post_ids')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [savedPostIds, setSavedPostIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('upwise_community_saved_post_ids')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [selectedCategory, setSelectedCategory] = useState<string>('All Dispatches')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isComposerOpen, setIsComposerOpen] = useState(openComposerDirectly)
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null)
  const [commentInput, setCommentInput] = useState<{ [postId: string]: string }>({})
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null)

  const [titleInput, setTitleInput] = useState('')
  const [categoryInput, setCategoryInput] = useState('Infrastructure & Economy')
  const [cityInput, setCityInput] = useState('New Delhi')
  const [contentInput, setContentInput] = useState('')
  const [sourceLinkInput, setSourceLinkInput] = useState('')
  const [disclaimerAgreed, setDisclaimerAgreed] = useState(false)
  const [isSubmittingPost, setIsSubmittingPost] = useState(false)
  const [composerErrors, setComposerErrors] = useState<{ title?: string; content?: string; disclaimer?: string }>({})

  // Reporting & Moderation State
  const [reportingPostId, setReportingPostId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState<string>('Factually Inaccurate / Misleading Claims')
  const [reportDetails, setReportDetails] = useState<string>('')
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false)

  // Authorized Reviewer / Staff Verification Flag
  const isReviewer = currentUser?.role === 'reviewer' || currentUser?.role === 'admin'

  useEffect(() => {
    if (openComposerDirectly) {
      setIsComposerOpen(true)
    }
  }, [openComposerDirectly])

  useEffect(() => {
    let isCurrent = true
    fetchCommunityPostsApi({})
      .then((res) => {
        if (!isCurrent || !res?.data || res.data.length === 0) return
        setPosts(res.data)
      })
      .catch(() => {})
    return () => {
      isCurrent = false
    }
  }, [])

  const savePostsToStorage = (updatedPosts: CommunityPost[]) => {
    setPosts(updatedPosts)
    try {
      localStorage.setItem('upwise_community_posts_v1', JSON.stringify(updatedPosts))
    } catch {
      // Storage fallback
    }
  }

  const handleCloseComposer = () => {
    setIsComposerOpen(false)
    setComposerErrors({})
    onComposerClosed?.()
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) {
      onRequireLogin?.()
      return
    }

    const errors: { title?: string; content?: string; disclaimer?: string } = {}
    if (!titleInput.trim() || titleInput.trim().length < 6) {
      errors.title = 'Headline must be at least 6 characters.'
    }
    if (!contentInput.trim() || contentInput.trim().length < 15) {
      errors.content = 'Dispatch body must be at least 15 characters.'
    }
    if (!disclaimerAgreed) {
      errors.disclaimer = 'You must acknowledge the verification disclaimer.'
    }

    if (Object.keys(errors).length > 0) {
      setComposerErrors(errors)
      return
    }

    setIsSubmittingPost(true)
    try {
      const created = await createCommunityPostApi({
        title: titleInput.trim(),
        description: contentInput.trim(),
        city: cityInput.trim() || 'New Delhi',
        category: categoryInput,
        sourceUrl: sourceLinkInput.trim() || undefined,
        disclaimerAgreed: true,
      })

      setPosts((prev) => [created, ...prev.filter((p) => p.id !== created.id)])
      setTitleInput('')
      setContentInput('')
      setSourceLinkInput('')
      setDisclaimerAgreed(false)
      setIsComposerOpen(false)
      onComposerClosed?.()

      setNoticeMessage('Your dispatch has been submitted to the community feed.')
    } catch (err: any) {
      setComposerErrors({ content: err.message || 'Failed to publish dispatch' })
    } finally {
      setIsSubmittingPost(false)
      setTimeout(() => setNoticeMessage(null), 3000)
    }
  }

  const handleToggleUpvote = (postId: string) => {
    const hasVoted = votedPostIds.includes(postId)
    const newVoted = hasVoted
      ? votedPostIds.filter((id) => id !== postId)
      : [...votedPostIds, postId]

    setVotedPostIds(newVoted)
    try {
      localStorage.setItem('upwise_community_voted_post_ids', JSON.stringify(newVoted))
    } catch {
      // Storage fallback
    }

    const updated = posts.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          upvotes: hasVoted ? Math.max(0, post.upvotes - 1) : post.upvotes + 1,
        }
      }
      return post
    })

    savePostsToStorage(updated)
    togglePostReactionApi(postId).catch(() => {})
  }

  const handleOpenReport = (postId: string) => {
    setReportingPostId(postId)
    setReportReason('Factually Inaccurate / Misleading Claims')
    setReportDetails('')
  }

  const handleConfirmReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportingPostId) return

    setIsSubmittingReport(true)
    try {
      const res = await reportCommunityPostApi(reportingPostId, reportReason, reportDetails)
      setNoticeMessage(res.message || 'Report submitted to editorial moderators.')
      setReportingPostId(null)
      setReportDetails('')
    } catch (err: any) {
      setNoticeMessage(err.message || 'Failed to submit report')
    } finally {
      setIsSubmittingReport(false)
      setTimeout(() => setNoticeMessage(null), 3000)
    }
  }

  const handleModerate = async (
    postId: string,
    status: 'approved' | 'rejected',
    verificationLevel?: 'unverified' | 'verified'
  ) => {
    if (!isReviewer) {
      setNoticeMessage('Unauthorized. Only editorial reviewers can moderate posts.')
      setTimeout(() => setNoticeMessage(null), 2500)
      return
    }

    try {
      const res = await moderateCommunityPostApi(postId, status, verificationLevel)
      if (res.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, status, ...(verificationLevel ? { verificationLevel } : {}) }
              : p
          )
        )
        setNoticeMessage(res.message)
      } else {
        setNoticeMessage(res.message || 'Moderation rejected')
      }
    } catch (err: any) {
      setNoticeMessage(err.message || 'Moderation error')
    } finally {
      setTimeout(() => setNoticeMessage(null), 3000)
    }
  }

  const handleToggleSavePost = (postId: string) => {
    const isSaved = savedPostIds.includes(postId)
    const newSaved = isSaved
      ? savedPostIds.filter((id) => id !== postId)
      : [...savedPostIds, postId]

    setSavedPostIds(newSaved)
    try {
      localStorage.setItem('upwise_community_saved_post_ids', JSON.stringify(newSaved))
    } catch {
      // Storage fallback
    }
  }

  const handleAddComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault()
    const text = commentInput[postId]?.trim()
    if (!text) return

    const authorName = currentUser?.name || 'Reader'
    const authorInitials = currentUser?.initials || 'RD'

    const newComment: CommunityComment = {
      id: `comment-${Date.now()}`,
      authorName,
      authorInitials,
      content: text,
      createdAt: 'Just now',
    }

    const updated = posts.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, newComment],
        }
      }
      return post
    })

    savePostsToStorage(updated)
    addCommentApi(postId, text).catch(() => {})
    setCommentInput((prev) => ({ ...prev, [postId]: '' }))
  }

  const filteredPosts = posts.filter((post) => {
    if (selectedCategory !== 'All Dispatches' && post.category !== selectedCategory) {
      return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        post.title.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q) ||
        post.authorName.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="w-full max-w-4xl mx-auto font-sans">
      {noticeMessage && (
        <div className="mb-4 p-3.5 bg-stone-900 text-white text-xs font-medium rounded-lg flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setNoticeMessage(null)}
            className="text-stone-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="mb-6 pb-5 border-b border-[#E5E0D5] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#C84B31] block mb-1">
            Reader Forum & Commentary
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-medium text-[#171715] tracking-tight">
            Community Dispatches
          </h1>
          <p className="text-xs sm:text-sm text-[#5C5852] mt-1 font-sans">
            Independent reader perspectives, civic analyses, and verified commentary on today's reporting.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsComposerOpen(true)}
          className="self-start sm:self-auto px-4 py-2 bg-[#171715] hover:bg-[#2C2B27] text-[#F5F1E8] rounded text-xs font-semibold tracking-wide transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2] text-[#C84B31]" />
          <span>Write Dispatch</span>
        </button>
      </div>

      {isComposerOpen && (
        <div className="mb-8 p-6 bg-white border border-stone-200/90 rounded-xl shadow-subtle animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
            <div>
              <h2 className="font-sans text-xl font-bold text-stone-900">
                Compose Dispatch
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Publishing as <strong className="text-stone-700">{currentUser?.name || 'Reader Correspondent'}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseComposer}
              className="p-1 rounded text-stone-400 hover:text-stone-700 transition-colors"
              aria-label="Close composer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreatePost} className="space-y-4">
            <div>
              <label
                htmlFor="dispatch-title"
                className="block text-[11px] uppercase tracking-wider font-medium text-stone-600 mb-1.5"
              >
                Dispatch Headline
              </label>
              <input
                id="dispatch-title"
                type="text"
                value={titleInput}
                onChange={(e) => {
                  setTitleInput(e.target.value)
                  if (composerErrors.title) {
                    setComposerErrors((prev) => ({ ...prev, title: undefined }))
                  }
                }}
                placeholder="e.g. Analysis: Regional power grid adaptations following solar expansion"
                className={`w-full px-3.5 h-11 text-sm bg-[#FAF9F6] border rounded-lg text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-[#1C1917] focus:ring-1 focus:ring-[#1C1917] transition-all ${
                  composerErrors.title ? 'border-red-500' : 'border-stone-300'
                }`}
              />
              {composerErrors.title && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {composerErrors.title}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="dispatch-category"
                  className="block text-[11px] uppercase tracking-wider font-medium text-stone-600 mb-1.5"
                >
                  Topic Category
                </label>
                <select
                  id="dispatch-category"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  className="w-full px-3 h-11 text-sm bg-[#FAF9F6] border border-stone-300 rounded-lg text-stone-900 focus:bg-white focus:outline-none focus:border-[#1C1917] focus:ring-1 focus:ring-[#1C1917]"
                >
                  {COMMUNITY_CATEGORIES.filter((c) => c !== 'All Dispatches').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="dispatch-city"
                  className="block text-[11px] uppercase tracking-wider font-medium text-stone-600 mb-1.5"
                >
                  City or Campus
                </label>
                <input
                  id="dispatch-city"
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="e.g. New Delhi, Bengaluru, Chandigarh"
                  className="w-full px-3.5 h-11 text-sm bg-[#FAF9F6] border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-[#1C1917] focus:ring-1 focus:ring-[#1C1917]"
                />
              </div>

              <div>
                <label
                  htmlFor="dispatch-source"
                  className="block text-[11px] uppercase tracking-wider font-medium text-stone-600 mb-1.5"
                >
                  Source Link (Optional)
                </label>
                <input
                  id="dispatch-source"
                  type="url"
                  value={sourceLinkInput}
                  onChange={(e) => setSourceLinkInput(e.target.value)}
                  placeholder="https://example.com/reporting"
                  className="w-full px-3.5 h-11 text-sm bg-[#FAF9F6] border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-[#1C1917] focus:ring-1 focus:ring-[#1C1917]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="dispatch-body"
                className="block text-[11px] uppercase tracking-wider font-medium text-stone-600 mb-1.5"
              >
                Dispatch Body & Commentary
              </label>
              <textarea
                id="dispatch-body"
                rows={4}
                value={contentInput}
                onChange={(e) => {
                  setContentInput(e.target.value)
                  if (composerErrors.content) {
                    setComposerErrors((prev) => ({ ...prev, content: undefined }))
                  }
                }}
                placeholder="Share your structured analysis, relevant context, or firsthand insights on this issue..."
                className={`w-full p-3.5 text-sm bg-[#FAF9F6] border rounded-lg text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-[#1C1917] focus:ring-1 focus:ring-[#1C1917] transition-all ${
                  composerErrors.content ? 'border-red-500' : 'border-stone-300'
                }`}
              />
              {composerErrors.content && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {composerErrors.content}
                </p>
              )}
            </div>

            {/* Editorial Standards Disclaimer */}
            <div className="p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-lg">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={disclaimerAgreed}
                  onChange={(e) => {
                    setDisclaimerAgreed(e.target.checked)
                    if (composerErrors.disclaimer) {
                      setComposerErrors((prev) => ({ ...prev, disclaimer: undefined }))
                    }
                  }}
                  className="mt-0.5 rounded border-stone-300 text-[#0F392B] focus:ring-[#0F392B]"
                />
                <span className="text-xs text-[#55504A] leading-relaxed">
                  I confirm this submission reflects firsthand observation or verifiable source evidence. I agree to Upwise Hub Community Standards.
                </span>
              </label>
              {composerErrors.disclaimer && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {composerErrors.disclaimer}
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseComposer}
                disabled={isSubmittingPost}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPost}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
              >
                {isSubmittingPost && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSubmittingPost ? 'Submitting...' : 'Publish Dispatch'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {COMMUNITY_CATEGORIES.map((cat) => (
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

        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter dispatches..."
          className="px-3 py-1.5 text-xs bg-white border border-[#E5E0D5] rounded text-[#171715] placeholder:text-[#78716C] focus:outline-none focus:border-[#171715] w-full sm:w-48"
        />
      </div>

      {filteredPosts.length === 0 ? (
        <div className="py-16 text-center bg-white border border-[#E5E0D5] rounded p-8">
          <div className="w-12 h-12 rounded-full bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-center mx-auto mb-3 text-[#78716C]">
            <Filter className="w-5 h-5 stroke-[1.5]" />
          </div>
          <h3 className="font-serif font-medium text-2xl text-[#171715] mb-1">
            No community dispatches found
          </h3>
          <p className="text-xs text-[#5C5852] max-w-sm mx-auto mb-5">
            Be the first reader to publish commentary in this category.
          </p>
          <button
            type="button"
            onClick={() => setIsComposerOpen(true)}
            className="px-4 py-2 bg-[#171715] hover:bg-[#2C2B27] text-[#F5F1E8] text-xs font-semibold rounded transition-colors"
          >
            Start a Dispatch
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredPosts.map((post) => {
            const hasUpvoted = votedPostIds.includes(post.id)
            const isSaved = savedPostIds.includes(post.id)
            const isCommentsExpanded = activeCommentPostId === post.id

            return (
              <article
                key={post.id}
                className="bg-white border border-[#E5E0D5] rounded p-5 sm:p-6 shadow-xs transition-all hover:border-[#D4CDBF]"
              >
                <div className="flex items-center justify-between text-xs text-[#78716C] mb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-6 h-6 rounded bg-[#FAF8F3] border border-[#E5E0D5] text-[#171715] font-semibold text-[10px] flex items-center justify-center font-mono">
                      {post.authorInitials}
                    </span>
                    <span className="font-semibold text-[#171715]">
                      {post.authorName}
                    </span>
                    <span className="text-[#D4CDBF]">•</span>
                    <span className="text-[#C84B31] font-semibold">
                      {post.category}
                    </span>
                    <span className="text-[#D4CDBF]">•</span>
                    <span className="text-[#78716C]">{post.createdAt}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleSavePost(post.id)}
                    aria-label={isSaved ? 'Remove bookmark' : 'Bookmark dispatch'}
                    className={`p-1.5 rounded transition-colors ${
                      isSaved ? 'text-[#C84B31] bg-[#FBF2EF]' : 'text-[#78716C] hover:text-[#171715]'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 stroke-[1.75] ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Verification & Location Strip */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {post.verificationLevel === 'verified' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#0F392B]/10 text-[#0F392B] border border-[#0F392B]/20">
                      <CheckCircle2 className="w-3 h-3 stroke-[2]" />
                      <span>Verified by Editorial Staff</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#78716C]/10 text-[#78716C] border border-[#E8E2D8]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D95D39]" />
                      <span>Community Submission (Unverified)</span>
                    </span>
                  )}
                  {post.city && (
                    <span className="text-[10px] text-[#78716C] font-medium">
                      📍 {post.city}
                    </span>
                  )}
                </div>

                <h2 className="font-serif font-medium text-xl sm:text-2xl text-[#171715] tracking-[-0.015em] leading-snug mb-3">
                  {post.title}
                </h2>

                <p className="text-sm text-stone-700 leading-relaxed mb-4 whitespace-pre-line font-sans">
                  {post.content}
                </p>

                {post.sourceLink && (
                  <div className="mb-4">
                    <a
                      href={post.sourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors bg-stone-50 border border-stone-200/80 px-2.5 py-1 rounded"
                    >
                      <ExternalLink className="w-3 h-3 text-stone-400" />
                      <span className="truncate max-w-xs">{post.sourceLink}</span>
                    </a>
                  </div>
                )}

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleUpvote(post.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                        hasUpvoted
                          ? 'bg-stone-900 border-stone-900 text-white font-medium'
                          : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5 stroke-[1.75]" />
                      <span>{post.upvotes}</span>
                      <span className="hidden sm:inline">Upvotes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveCommentPostId(isCommentsExpanded ? null : post.id)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 stroke-[1.75]" />
                      <span>{post.comments.length}</span>
                      <span className="hidden sm:inline">Comments</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenReport(post.id)}
                      className="p-1.5 rounded text-stone-400 hover:text-[#B91C1C] transition-colors"
                      title="Flag or report dispatch"
                    >
                      <Flag className="w-4 h-4 stroke-[1.75]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(window.location.href)
                          setNoticeMessage('Link copied to clipboard.')
                          setTimeout(() => setNoticeMessage(null), 2500)
                        }
                      }}
                      className="p-1.5 rounded text-stone-400 hover:text-stone-700 transition-colors"
                      title="Share dispatch link"
                    >
                      <Share2 className="w-4 h-4 stroke-[1.75]" />
                    </button>
                  </div>
                </div>

                {/* Reviewer Moderation Controls (Authorized Reviewer/Admin only) */}
                {isReviewer && (
                  <div className="mt-3.5 pt-2.5 border-t border-[#E8E2D8] flex flex-wrap items-center justify-between gap-2 bg-[#FAF7F2] p-2.5 rounded-lg text-xs">
                    <div className="flex items-center gap-1.5 text-[#0F392B] font-semibold text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 stroke-[2]" />
                      <span>Reviewer Controls:</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleModerate(post.id, 'approved', 'verified')}
                        type="button"
                        className="px-2.5 py-1 rounded bg-[#0F392B] text-white text-[11px] font-semibold hover:bg-[#184837] transition-colors"
                      >
                        Mark Verified
                      </button>
                      <button
                        onClick={() => handleModerate(post.id, 'approved', 'unverified')}
                        type="button"
                        className="px-2.5 py-1 rounded bg-stone-200 text-stone-800 text-[11px] font-semibold hover:bg-stone-300 transition-colors"
                      >
                        Approve Unverified
                      </button>
                      <button
                        onClick={() => handleModerate(post.id, 'rejected')}
                        type="button"
                        className="px-2.5 py-1 rounded bg-[#B91C1C] text-white text-[11px] font-semibold hover:bg-[#991B1B] transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {isCommentsExpanded && (
                  <div className="mt-4 pt-4 border-t border-stone-100 space-y-3 animate-in fade-in duration-150">
                    <div className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Discussion ({post.comments.length})
                    </div>

                    {post.comments.length === 0 ? (
                      <p className="text-xs text-stone-400 italic py-1">
                        No responses yet. Share your thoughts below.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {post.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="bg-stone-50/80 border border-stone-200/70 p-3 rounded-lg text-xs"
                          >
                            <div className="flex items-center justify-between text-stone-500 mb-1">
                              <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-stone-200 text-[9px] flex items-center justify-center font-mono">
                                  {comment.authorInitials}
                                </span>
                                {comment.authorName}
                              </span>
                              <span className="text-[10px] text-stone-400">{comment.createdAt}</span>
                            </div>
                            <p className="text-stone-700 leading-relaxed whitespace-pre-line pl-5">
                              {comment.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <form
                      onSubmit={(e) => handleAddComment(post.id, e)}
                      className="pt-2 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={commentInput[post.id] || ''}
                        onChange={(e) =>
                          setCommentInput((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        placeholder="Add your constructive perspective..."
                        className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-stone-800"
                      />
                      <button
                        type="submit"
                        disabled={!commentInput[post.id]?.trim()}
                        className="px-3.5 py-2 bg-[#1C1917] hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Send className="w-3 h-3" />
                        <span>Reply</span>
                      </button>
                    </form>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      <div className="mt-8 text-center text-[11px] text-stone-400 border-t border-stone-200/70 pt-4">
        Upwise Hub Community Dispatches • Verified citizen journalism and student commentary.
      </div>

      {/* Flag / Report Modal */}
      {reportingPostId && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setReportingPostId(null)}
          />
          <div className="relative w-full max-w-md bg-white border border-[#E5E0D5] rounded-xl shadow-2xl p-6 z-50 font-sans animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8E2D8]">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-[#B91C1C]" />
                <h3 className="font-serif font-bold text-base text-[#141412]">
                  Report Community Dispatch
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReportingPostId(null)}
                className="p-1 rounded text-[#78716C] hover:text-[#141412]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReport} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#55504A] mb-1.5">
                  Reason for Reporting
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8E2D8] rounded-lg text-[#141412] focus:outline-none focus:border-[#0F392B]"
                >
                  <option value="Factually Inaccurate / Misleading Claims">Factually Inaccurate / Misleading Claims</option>
                  <option value="Plagiarism / Unattributed Source">Plagiarism / Unattributed Source</option>
                  <option value="Spam or Commercial Promotion">Spam or Commercial Promotion</option>
                  <option value="Harassment or Inappropriate Content">Harassment or Inappropriate Content</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#55504A] mb-1.5">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide context or links demonstrating the inaccuracy..."
                  className="w-full p-2.5 text-xs bg-[#FAF7F2] border border-[#E8E2D8] rounded-lg text-[#141412] focus:outline-none focus:border-[#0F392B]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReportingPostId(null)}
                  disabled={isSubmittingReport}
                  className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  {isSubmittingReport && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Submit Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
