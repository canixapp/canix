import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

/* ─── CSS-only floating keyframes (injected once) ─── */
const floatStyleId = 'orbital-float-styles';
if (typeof document !== 'undefined' && !document.getElementById(floatStyleId)) {
  const style = document.createElement('style');
  style.id = floatStyleId;
  style.textContent = `
    @keyframes orbital-float-1 {
      0%, 100% { transform: translateY(0px) }
      50% { transform: translateY(-6px) }
    }
    @keyframes orbital-float-2 {
      0%, 100% { transform: translateY(0px) }
      50% { transform: translateY(-8px) }
    }
    @keyframes orbital-float-3 {
      0%, 100% { transform: translateY(0px) translateX(0px) }
      50% { transform: translateY(-5px) translateX(3px) }
    }
    @keyframes orbital-glow-pulse {
      0%, 100% { transform: scale(1); opacity: 0.06 }
      50% { transform: scale(1.04); opacity: 0.1 }
    }
    @keyframes orbital-bubble-pop {
      0% { opacity: 0; transform: scale(0.6) translateY(6px) }
      60% { transform: scale(1.05) translateY(-1px) }
      100% { opacity: 1; transform: scale(1) translateY(0) }
    }
    .orbital-float-1 { animation: orbital-float-1 7s ease-in-out infinite; }
    .orbital-float-2 { animation: orbital-float-2 8s ease-in-out infinite 1s; }
    .orbital-float-3 { animation: orbital-float-3 9s ease-in-out infinite 2s; }
    .orbital-glow-pulse { animation: orbital-glow-pulse 5s ease-in-out infinite; }
    .orbital-bubble-pop { animation: orbital-bubble-pop 0.4s ease-out 0.7s both; }

    @media (prefers-reduced-motion: reduce) {
      .orbital-float-1, .orbital-float-2, .orbital-float-3,
      .orbital-glow-pulse { animation: none; }
    }
  `;
  document.head.appendChild(style);
}

/* ─── Floating orbital image ─── */
function OrbitalImage({
  src,
  alt,
  size = 100,
  onClick,
  delay = 0,
  floatClass = 'orbital-float-1',
}: {
  src: string;
  alt: string;
  size?: number;
  onClick?: () => void;
  delay?: number;
  floatClass?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) return null;

  return (
    <div className={floatClass}>
      <motion.button
        type="button"
        onClick={onClick}
        className="group relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: delay * 0.3 + 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ width: size, height: size }}
      >
        {/* Outer glow ring */}
        <div
          className="absolute -inset-1 rounded-full bg-primary/[0.06] opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"
        />
        <div
          className="relative rounded-full border-[3px] border-background shadow-lg shadow-primary/10 overflow-hidden bg-background
                     group-hover:shadow-xl group-hover:shadow-primary/20 group-hover:scale-105
                     transition-all duration-300 ease-out"
          style={{ width: size, height: size }}
        >
          <OptimizedImage
            src={src}
            alt={alt}
            showSkeleton={true}
            className="w-full h-full rounded-full"
            onLoadError={() => setFailed(true)}
          />
        </div>
      </motion.button>
    </div>
  );
}

/* ─── Decorative ring ─── */
function OrbitRing({ size, opacity = 0.05, dashed = false }: { size: number; opacity?: number; dashed?: boolean }) {
  return (
    <div
      className="absolute pointer-events-none rounded-full"
      style={{
        width: size,
        height: size,
        top: '50%',
        left: '50%',
        marginTop: -size / 2,
        marginLeft: -size / 2,
        border: `1px ${dashed ? 'dashed' : 'solid'} hsl(var(--primary) / ${opacity})`,
      }}
    />
  );
}

/* ─── Main orbital visual ─── */
interface OrbitalVisualProps {
  mascot: string;
  img1: string;
  img2: string;
  img3: string;
  onClickImage?: (index: 1 | 2 | 3) => void;
  className?: string;
}

export function OrbitalVisual({ mascot, img1, img2, img3, onClickImage, className = '' }: OrbitalVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // Very subtle parallax — max ±8px
    setParallax({
      x: ((e.clientX - cx) / rect.width) * 8,
      y: ((e.clientY - cy) / rect.height) * 8,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setParallax({ x: 0, y: 0 });
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* ── Desktop layout ── */}
      <div
        ref={containerRef}
        className="hidden lg:flex items-center justify-center"
        style={{ width: 520, height: 520 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Radial glow background */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.07)_0%,hsl(var(--primary)/0.02)_45%,transparent_70%)]" />

        {/* Pulsing center glow */}
        <div className="absolute w-72 h-72 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.08)_0%,transparent_70%)] orbital-glow-pulse"
          style={{ top: '50%', left: '50%', marginTop: -144, marginLeft: -144 }}
        />

        {/* Orbit rings */}
        <OrbitRing size={460} opacity={0.04} />
        <OrbitRing size={360} opacity={0.06} />
        <OrbitRing size={260} opacity={0.03} dashed />

        {/* Central mascot */}
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            transform: `translate(${parallax.x * 0.3}px, ${parallax.y * 0.3}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        >
          <div className="w-60 h-60 rounded-full bg-gradient-to-br from-primary/[0.08] to-primary/[0.03] flex items-center justify-center shadow-2xl shadow-primary/[0.08] border border-primary/[0.08]">
            {/* Inner glow behind mascot */}
            <div className="absolute inset-4 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.06)_0%,transparent_60%)]" />
            <img
              src={mascot}
              alt="Mascote PetCão"
              className="w-48 h-48 object-contain relative z-10"
              loading="eager"
            />
          </div>
        </motion.div>

        {/* Orbital 1 — top right */}
        <div
          className="absolute z-20"
          style={{
            top: 30, right: 40,
            transform: `translate(${parallax.x * 0.6}px, ${parallax.y * 0.6}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        >
          <OrbitalImage src={img1} alt="Galeria" size={185} delay={0.15} floatClass="orbital-float-1" onClick={() => onClickImage?.(1)} />
        </div>

        {/* Orbital 2 — bottom left */}
        <div
          className="absolute z-20"
          style={{
            bottom: 50, left: 25,
            transform: `translate(${parallax.x * 0.8}px, ${parallax.y * 0.8}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        >
          <OrbitalImage src={img2} alt="Serviços" size={155} delay={0.25} floatClass="orbital-float-2" onClick={() => onClickImage?.(2)} />
        </div>

        {/* Orbital 3 — bottom right */}
        <div
          className="absolute z-20"
          style={{
            bottom: 30, right: 60,
            transform: `translate(${parallax.x * 0.5}px, ${parallax.y * 0.5}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        >
          <OrbitalImage src={img3} alt="Antes e Depois" size={135} delay={0.35} floatClass="orbital-float-3" onClick={() => onClickImage?.(3)} />
        </div>

        {/* Speech bubble — premium style */}
        <div
          className="absolute z-30 orbital-bubble-pop"
          style={{ top: 160, right: 25 }}
        >
          <div className="relative bg-primary text-primary-foreground px-5 py-2.5 rounded-2xl rounded-bl-sm shadow-xl shadow-primary/25">
            <span className="text-sm font-bold tracking-wide">Au au! 🐕</span>
            {/* Subtle shine */}
            <div className="absolute inset-0 rounded-2xl rounded-bl-sm bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Decorative outer rings */}
        <div className="absolute inset-0 rounded-full border border-primary/[0.03] pointer-events-none" />
      </div>

      {/* ── Mobile layout ── */}
      <div className="lg:hidden flex items-center justify-center">
        <div className="relative" style={{ width: 320, height: 320 }}>
          {/* Radial glow */}
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.07)_0%,hsl(var(--primary)/0.02)_50%,transparent_70%)]" />

          {/* Orbit ring */}
          <OrbitRing size={280} opacity={0.05} />
          <OrbitRing size={200} opacity={0.03} dashed />

          {/* Central mascot */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="w-44 h-44 rounded-full bg-gradient-to-br from-primary/[0.06] to-primary/[0.03] flex items-center justify-center shadow-xl shadow-primary/[0.08] border border-primary/[0.06]">
              <div className="absolute inset-3 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.05)_0%,transparent_60%)]" />
              <img
                src={mascot}
                alt="Mascote PetCão"
                loading="lazy"
                className="w-36 h-36 object-contain relative z-10"
              />
            </div>
          </motion.div>

          {/* Orbital 1 — top right (gentle float only) */}
          <div className="absolute z-20 orbital-float-1" style={{ top: -10, right: 10 }}>
            <OrbitalImage src={img1} alt="Galeria" size={120} delay={0.1} floatClass="" onClick={() => onClickImage?.(1)} />
          </div>

          {/* Orbital 2 — bottom left */}
          <div className="absolute z-20 orbital-float-2" style={{ bottom: 0, left: 5 }}>
            <OrbitalImage src={img2} alt="Serviços" size={100} delay={0.2} floatClass="" onClick={() => onClickImage?.(2)} />
          </div>

          {/* Orbital 3 — bottom right */}
          <div className="absolute z-20 orbital-float-3" style={{ bottom: 0, right: 0 }}>
            <OrbitalImage src={img3} alt="Antes e Depois" size={80} delay={0.3} floatClass="" onClick={() => onClickImage?.(3)} />
          </div>

          {/* Speech bubble mobile — premium */}
          <div
            className="absolute z-30 orbital-bubble-pop"
            style={{ top: 15, left: 0 }}
          >
            <div className="relative bg-primary text-primary-foreground px-4 py-2 rounded-2xl rounded-bl-sm shadow-lg shadow-primary/20">
              <span className="text-xs font-bold">Au au! 🐕</span>
              <div className="absolute inset-0 rounded-2xl rounded-bl-sm bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Decorative ring */}
          <div className="absolute inset-0 rounded-full border border-primary/[0.03] pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
