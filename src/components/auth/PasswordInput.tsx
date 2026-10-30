import React, { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'

export interface PasswordInputProps {
  id?: string
  name?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  label?: string
  placeholder?: string
  autoComplete?: string
  error?: string
  required?: boolean
  disabled?: boolean
  rightElement?: React.ReactNode
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id = 'auth-password',
  name = 'password',
  value,
  onChange,
  label = 'Password',
  placeholder = '••••••••',
  autoComplete = 'current-password',
  error,
  required = true,
  disabled = false,
  rightElement,
}) => {
  const [showPassword, setShowPassword] = useState(false)

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev)
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="block text-[11px] uppercase tracking-wider font-semibold text-[#55504A] font-sans">
          {label}
        </label>
        {rightElement}
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A847C]">
          <Lock className="w-4 h-4 stroke-[1.75]" />
        </div>

        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full pl-10 pr-10 h-11 text-sm bg-[#FDFBF7] hover:bg-white focus:bg-white border rounded-lg text-[#141412] placeholder:text-[#9E978E] transition-all focus:outline-none focus:border-[#0F392B] focus:ring-1 focus:ring-[#0F392B] disabled:opacity-60 disabled:cursor-not-allowed ${
            error ? 'border-[#D95D39] text-[#141412] focus:border-[#D95D39] focus:ring-[#D95D39]' : 'border-[#E8E2D8]'
          }`}
        />

        <button
          type="button"
          onClick={toggleShowPassword}
          disabled={disabled}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-controls={id}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8A847C] hover:text-[#141412] focus:outline-none transition-colors"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 stroke-[1.75]" />
          ) : (
            <Eye className="w-4 h-4 stroke-[1.75]" />
          )}
        </button>
      </div>

      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-[#D95D39] font-medium">
          {error}
        </p>
      )}
    </div>
  )
}
