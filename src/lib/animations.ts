/**
 * PetCão — Centralized animation presets
 * 
 * All card/section entrance animations use only `opacity` and `transform`
 * (translateY) for GPU-composited, jank-free rendering.
 *
 * Guidelines:
 *  - duration: 200–260ms  (fast & snappy)
 *  - easing:   [0.25, 0.1, 0.25, 1]  (CSS ease equivalent, very smooth)
 *  - translateY: 8px max  (subtle, modern)
 *  - NO blur, NO scale, NO box-shadow animations
 *  - stagger: 30ms max between items
 */

// Shared easing — smooth deceleration curve
const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

// ─── Card / Item animations (variants pattern) ───
export const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.22, ease: EASE },
  }),
};

// ─── Section container animation ───
export const sectionAnim = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE } },
};

// ─── Stagger container (for wrapping lists of cards) ───
export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03, delayChildren: 0.02 } },
};

// ─── Item inside a stagger container ───
export const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE } },
};

// ─── Inline spread props (for non-variants usage) ───
export const cardAnimProps = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.2, ease: EASE },
};

// ─── Page-level fade (for whileInView sections on public site) ───
export const fadeInView = {
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' } as const,
  transition: { duration: 0.26, ease: EASE },
};

// ─── Hero-specific (slightly more dramatic but still fast) ───
export const heroFadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE },
  },
};

export const heroStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

// ─── Hover / Tap for interactive cards ───
export const cardHover = { y: -2, transition: { duration: 0.15, ease: 'easeOut' as const } };
export const cardTap = { scale: 0.985 };
