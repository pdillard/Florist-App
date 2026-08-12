// Shared Tailwind class strings so every text input/select/textarea in the
// app - dashboard forms, driver actions, login - gets the same focus
// treatment (a visible rose ring, not just a color-shift border) instead
// of each form reinventing its own version.
export const INPUT_STYLES =
  'rounded-lg border border-gray-300 p-2.5 text-sm transition-all duration-150 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100'

export const CARD_STYLES = 'rounded-xl border bg-white shadow-sm'
