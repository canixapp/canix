import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { InfoTip } from './InfoTip';
import { cardVariants } from '@/lib/animations';

interface PremiumCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  accentClass: string;
  bgClass: string;
  tooltip: string;
  sub?: string;
  delta?: string;
  index?: number;
}

export function PremiumCard({ label, value, icon, accentClass, bgClass, tooltip, sub, delta, index = 0 }: PremiumCardProps) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="group relative rounded-[14px] border border-border/60 bg-card p-4 md:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden will-change-transform"
    >
      <div className="absolute inset-0 rounded-[14px] bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-start justify-between gap-2">
        <div className={`p-2 md:p-2.5 rounded-xl ${bgClass} shrink-0`}>
          {icon}
        </div>
        <InfoTip title={label} text={tooltip} />
      </div>
      
      <div className="relative mt-3">
        <p className="text-[11px] md:text-xs text-muted-foreground font-medium tracking-wide uppercase">{label}</p>
        <p className={`text-2xl md:text-3xl font-bold mt-0.5 tracking-tight ${accentClass}`}>{value}</p>
        {delta && <p className="text-[10px] md:text-xs text-muted-foreground mt-1">{delta}</p>}
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

interface PremiumCardCompactProps {
  label: string;
  value: string;
  icon: ReactNode;
  accentClass: string;
  bgClass: string;
  tooltip: string;
  sub?: string;
  index?: number;
}

export function PremiumCardCompact({ label, value, icon, accentClass, bgClass, tooltip, sub, index = 0 }: PremiumCardCompactProps) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="group rounded-[14px] border border-border/60 bg-card p-3 md:p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 will-change-transform"
    >
      <div className="flex items-center gap-3">
        <div className={`p-1.5 md:p-2 rounded-xl shrink-0 ${bgClass}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] md:text-xs text-muted-foreground font-medium truncate">{label}</p>
            <InfoTip title={label} text={tooltip} />
          </div>
          <p className={`text-sm md:text-base font-bold truncate ${accentClass}`}>{value}</p>
          {sub && <p className="text-[10px] md:text-xs text-muted-foreground">{sub}</p>}
        </div>
      </div>
    </motion.div>
  );
}
