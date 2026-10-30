import React, { useState } from 'react'
import {
  Mail,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { PasswordInput } from './PasswordInput'
import { UserProfile } from '../../types/navigation'
import { loginApi, registerApi } from '../../services/api'

export interface LoginPageProps {
  onBackToFeed: () => void
  onSignInSuccess: (user: UserProfile) => void
  onOpenPolicyModal?: (tab: 'charter' | 'privacy' | 'terms') => void
  initialMode?: 'signin' | 'signup'
  className?: string
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onBackToFeed,
  onSignInSuccess,
  onOpenPolicyModal,
  initialMode = 'signin',
  className = '',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')

  const [errors, setErrors] = useState<{
    identifier?: string
    password?: string
    name?: string
    forgotEmail?: string
    form?: string
  }>({})

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [forgotSubmitted, setForgotSubmitted] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: {
      identifier?: string
      password?: string
      name?: string
      forgotEmail?: string
      form?: string
    } = {}

    if (mode === 'forgot') {
      if (!forgotEmail.trim()) {
        newErrors.forgotEmail = 'Please enter your email address.'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
        newErrors.forgotEmail = 'Please enter a valid email address.'
      }
      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    }

    if (mode === 'signup' && !name.trim()) {
      newErrors.name = 'Please enter your full name.'
    }

    if (!identifier.trim()) {
      newErrors.identifier = 'Please enter your email.'
    } else if (identifier.includes('@')) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())) {
        newErrors.identifier = 'Please enter a valid email address.'
      }
    } else if (identifier.trim().length < 3) {
      newErrors.identifier = 'Please enter a valid username or email.'
    }

    if (!password) {
      newErrors.password = 'Please enter your password.'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || isSubmitting) return

    setIsSubmitting(true)
    setErrors((prev) => ({ ...prev, form: undefined }))

    if (mode === 'forgot') {
      await new Promise((resolve) => setTimeout(resolve, 300))
      setIsSubmitting(false)
      setForgotSubmitted(true)
      return
    }

    const isEmail = identifier.includes('@')
    const derivedEmail = isEmail
      ? identifier.trim().toLowerCase()
      : `${identifier.trim().toLowerCase()}@upwise.hub`

    try {
      if (mode === 'signin') {
        const { user } = await loginApi({ email: derivedEmail, password })
        setIsSubmitting(false)
        onSignInSuccess(user)
      } else {
        const { user } = await registerApi({
          name: name.trim(),
          email: derivedEmail,
          password,
        })
        setIsSubmitting(false)
        onSignInSuccess(user)
      }
    } catch (err: any) {
      setIsSubmitting(false)
      const errorMsg =
        err.message ||
        (mode === 'signin'
          ? 'Invalid email or password. Please try again or sign up.'
          : 'Registration failed. Please check your details.')
      setErrors((prev) => ({ ...prev, form: errorMsg }))
    }
  }

  const handleGuestBriefing = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      const guestProfile: UserProfile = {
        id: 'usr-guest-briefing',
        name: 'Guest Reviewer',
        email: 'guest@upwise.hub',
        initials: 'GR',
      }
      setIsSubmitting(false)
      onSignInSuccess(guestProfile)
    }, 300)
  }

  return (
    <AuthLayout onLogoClick={onBackToFeed} className={className}>
      <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(20,20,18,0.04)] w-full">
        {/* Subtle Top Forest Green Accent */}
        <div className="h-1 bg-[#0F392B] w-full" />

        <div className="p-6 sm:p-8">
          {/* Form Header */}
          <div className="mb-6">
            <h1 className="font-serif text-2xl sm:text-[26px] font-bold text-[#141412] tracking-tight leading-tight">
              {mode === 'signin'
                ? 'Reader Sign In'
                : mode === 'signup'
                ? 'Create Reader Account'
                : 'Reset Password'}
            </h1>
            <p className="text-xs sm:text-[13px] text-[#6E6860] mt-1.5 leading-relaxed font-normal">
              {mode === 'signin'
                ? 'Enter your credentials to access your personalized newspaper edition'
                : mode === 'signup'
                ? 'Set up your profile to customize reporting desks and bookmarks'
                : 'Enter your email to receive secure recovery instructions'}
            </p>
          </div>

          {/* Segmented Mode Tabs (Sign In / Create Account) */}
          {mode !== 'forgot' && (
            <div className="grid grid-cols-2 p-1 bg-[#FAF7F2] border border-[#E8E2D8] rounded-lg mb-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setErrors({})
                }}
                className={`py-2 rounded-md transition-all ${
                  mode === 'signin'
                    ? 'bg-white text-[#141412] shadow-xs'
                    : 'text-[#6E6860] hover:text-[#141412]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup')
                  setErrors({})
                }}
                className={`py-2 rounded-md transition-all ${
                  mode === 'signup'
                    ? 'bg-white text-[#141412] shadow-xs'
                    : 'text-[#6E6860] hover:text-[#141412]'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Forgot Password View */}
          {mode === 'forgot' ? (
            <div>
              {forgotSubmitted ? (
                <div className="p-5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl space-y-4 font-sans text-center">
                  <div className="w-10 h-10 rounded-full bg-[#EBF3EF] text-[#0F392B] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#141412]">
                      Recovery link dispatched
                    </h2>
                    <p className="text-xs text-[#55504A] mt-1.5 leading-relaxed">
                      Instructions have been sent to <strong className="text-[#141412]">{forgotEmail}</strong>. Please check your inbox.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin')
                      setForgotSubmitted(false)
                      setErrors({})
                    }}
                    className="w-full py-2.5 bg-[#0F392B] hover:bg-[#184837] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-4 font-sans">
                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="block text-[11px] uppercase tracking-wider font-semibold text-[#55504A] mb-1.5"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A847C]">
                        <Mail className="w-4 h-4 stroke-[1.75]" />
                      </div>
                      <input
                        id="forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value)
                          if (errors.forgotEmail) {
                            setErrors((prev) => ({ ...prev, forgotEmail: undefined }))
                          }
                        }}
                        placeholder="name@example.com"
                        className={`w-full pl-10 pr-3.5 h-11 text-sm bg-[#FDFBF7] hover:bg-white focus:bg-white border rounded-lg text-[#141412] placeholder:text-[#9E978E] transition-all focus:outline-none focus:border-[#0F392B] focus:ring-1 focus:ring-[#0F392B] ${
                          errors.forgotEmail ? 'border-[#D95D39]' : 'border-[#E8E2D8]'
                        }`}
                      />
                    </div>
                    {errors.forgotEmail && (
                      <p role="alert" className="mt-1 text-xs text-[#D95D39] font-medium">
                        {errors.forgotEmail}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 px-4 bg-[#0F392B] hover:bg-[#184837] active:bg-[#0A261D] text-white text-xs font-semibold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Sending link...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin')
                        setErrors({})
                      }}
                      className="text-xs text-[#6E6860] hover:text-[#0F392B] font-medium transition-colors inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3 stroke-[2]" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div>
              {errors.form && (
                <div
                  role="alert"
                  className="mb-4 p-3 bg-[#FBF2EF] border border-[#F3D5CC] rounded-lg flex items-start gap-2.5 text-xs text-[#D95D39] font-medium"
                >
                  <AlertCircle className="w-4 h-4 text-[#D95D39] shrink-0 mt-0.5" />
                  <span>{errors.form}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4 font-sans">
                {mode === 'signup' && (
                  <div>
                    <label
                      htmlFor="auth-fullname"
                      className="block text-[11px] uppercase tracking-wider font-semibold text-[#55504A] mb-1.5"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A847C]">
                        <User className="w-4 h-4 stroke-[1.75]" />
                      </div>
                      <input
                        id="auth-fullname"
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value)
                          if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                        }}
                        placeholder="e.g. Arjun Sharma"
                        className={`w-full pl-10 pr-3.5 h-11 text-sm bg-[#FDFBF7] hover:bg-white focus:bg-white border rounded-lg text-[#141412] placeholder:text-[#9E978E] transition-all focus:outline-none focus:border-[#0F392B] focus:ring-1 focus:ring-[#0F392B] ${
                          errors.name ? 'border-[#D95D39]' : 'border-[#E8E2D8]'
                        }`}
                      />
                    </div>
                    {errors.name && (
                      <p role="alert" className="mt-1 text-xs text-[#D95D39] font-medium">
                        {errors.name}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="auth-email"
                    className="block text-[11px] uppercase tracking-wider font-semibold text-[#55504A] mb-1.5"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A847C]">
                      <Mail className="w-4 h-4 stroke-[1.75]" />
                    </div>
                    <input
                      id="auth-email"
                      type="text"
                      autoComplete="username email"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value)
                        if (errors.identifier) {
                          setErrors((prev) => ({ ...prev, identifier: undefined }))
                        }
                      }}
                      placeholder="name@example.com"
                      className={`w-full pl-10 pr-3.5 h-11 text-sm bg-[#FDFBF7] hover:bg-white focus:bg-white border rounded-lg text-[#141412] placeholder:text-[#9E978E] transition-all focus:outline-none focus:border-[#0F392B] focus:ring-1 focus:ring-[#0F392B] ${
                        errors.identifier ? 'border-[#D95D39]' : 'border-[#E8E2D8]'
                      }`}
                    />
                  </div>
                  {errors.identifier && (
                    <p role="alert" className="mt-1 text-xs text-[#D95D39] font-medium">
                      {errors.identifier}
                    </p>
                  )}
                </div>

                <PasswordInput
                  id="auth-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: undefined }))
                    }
                  }}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  error={errors.password}
                  rightElement={
                    mode === 'signin' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot')
                          setErrors({})
                        }}
                        className="text-xs text-[#6E6860] hover:text-[#0F392B] font-medium transition-colors"
                      >
                        Forgot password?
                      </button>
                    ) : null
                  }
                />

                {mode === 'signup' && onOpenPolicyModal && (
                  <p className="text-[11px] text-[#78716C] leading-relaxed pt-1">
                    By creating an account, you agree to our{' '}
                    <button
                      type="button"
                      onClick={() => onOpenPolicyModal('charter')}
                      className="text-[#141412] font-semibold hover:text-[#0F392B] hover:underline"
                    >
                      Editorial Charter
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={() => onOpenPolicyModal('privacy')}
                      className="text-[#141412] font-semibold hover:text-[#0F392B] hover:underline"
                    >
                      Privacy Policy
                    </button>
                    .
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 h-11 px-4 bg-[#0F392B] hover:bg-[#184837] active:bg-[#0A261D] text-white text-xs font-semibold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{mode === 'signin' ? 'Logging in...' : 'Creating account...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === 'signin' ? 'Log in to Edition' : 'Create Reader Account'}</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
                    </>
                  )}
                </button>
              </form>

              {mode === 'signin' && (
                <div className="mt-6 pt-5 border-t border-[#E8E2D8] text-center">
                  <button
                    type="button"
                    onClick={handleGuestBriefing}
                    disabled={isSubmitting}
                    className="text-xs text-[#6E6860] hover:text-[#0F392B] font-medium underline underline-offset-2 transition-colors disabled:opacity-50"
                  >
                    Reviewing as a guest? Continue with guest briefing →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
