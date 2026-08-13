'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import Link from 'next/link'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  variant?: Variant
  loading?: boolean
  children: ReactNode
  className?: string
  // Renders as a Next Link instead of a <button> when set - one component
  // for every call-to-action in the app (functional buttons AND marketing
  // links), so they all get the same hover/press feel instead of two
  // near-identical implementations drifting apart over time.
  href?: string
  target?: string
  rel?: string
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary: 'bg-black text-white shadow-sm hover:bg-gray-800 hover:shadow-md',
  secondary: 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm',
  danger: 'border border-red-600 text-red-600 hover:bg-red-50 hover:shadow-sm',
  ghost: 'text-gray-600 underline decoration-gray-300 underline-offset-2 hover:text-black hover:decoration-black',
  // Reserved for marketing CTAs (landing/features/pricing) - the rest of
  // the app stays on the plain black `primary` so the actual product
  // doesn't feel like it's trying to sell you something.
  accent:
    'btn-shine relative overflow-hidden bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-200 hover:shadow-lg hover:shadow-rose-300/70 hover:brightness-110',
}

// Every clickable thing in the app shares this base: a real lift + shadow
// growth on hover (not just a color swap), a press-down on click, and a
// visible focus ring for keyboard users - the small physical-feeling
// details that separate "a website" from "an internal tool."
const BASE_STYLES =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2'

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  href,
  target,
  rel,
  ...props
}: Props) {
  const classes = `${BASE_STYLES} ${VARIANT_STYLES[variant]} ${className}`

  if (href) {
    return (
      <Link href={href} target={target} rel={rel} className={classes}>
        {loading && <Spinner />}
        {children}
      </Link>
    )
  }

  return (
    <button disabled={disabled || loading} className={classes} {...props}>
      {loading && <Spinner />}
      {children}
    </button>
  )
}
