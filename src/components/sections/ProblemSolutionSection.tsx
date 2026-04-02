import { Clock, Heart, Shield, Sparkles, AlertCircle, CheckCircle2, ArrowRight, ChevronDown } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

const problems = [
  { icon: Clock, title: 'Falta de tempo', description: 'Correria do dia a dia dificulta cuidar do pet como ele merece', number: '01' },
  { icon: AlertCircle, title: 'Locais duvidosos', description: 'Medo de deixar o pet em lugares sem confiança e sem transparência', number: '02' },
  { icon: Shield, title: 'Agendamento difícil', description: 'Ligações, espera e falta de horários flexíveis no dia a dia', number: '03' },
];

const solutions = [
  { icon: Sparkles, title: 'Profissionais qualificados', description: 'Equipe treinada e apaixonada por pets, com anos de experiência', number: '01' },
  { icon: Heart, title: 'Ambiente acolhedor', description: 'Seu pet se sente em casa conosco — carinho e segurança garantidos', number: '02' },
  { icon: CheckCircle2, title: 'Agendamento rápido', description: 'Pelo WhatsApp em menos de 1 minuto, sem burocracia', number: '03' },
];

const EASE: [number, number, number, number] = [0.22, 0.03, 0.26, 1];

export function ProblemSolutionSection() {
  const reduceMotion = useReducedMotion();
  const dur = reduceMotion ? 0 : 0.5;

  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.12, delayChildren: reduceMotion ? 0 : 0.08 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: dur, ease: EASE } },
  };

  const scaleFade = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { opacity: 1, scale: 1, transition: { duration: reduceMotion ? 0 : 0.6, ease: EASE } },
  };

  return (
    <section className="relative py-16 md:py-20 lg:py-24 overflow-hidden">
      {/* ── Premium background ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-primary/[0.01]" />
      {/* Soft organic glow orbs */}
      <div className="absolute top-[10%] left-[15%] w-[600px] h-[600px] rounded-full bg-primary/[0.025] dark:bg-primary/[0.04] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-primary/[0.02] dark:bg-primary/[0.035] blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-background/80 dark:bg-background/40 blur-[100px] pointer-events-none" />
      {/* Organic curved accent lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M-100 450C200 350 400 550 720 420C1040 290 1200 500 1540 400" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.04" className="dark:opacity-[0.06]" />
        <path d="M-100 550C250 650 500 400 760 520C1020 640 1250 430 1540 530" stroke="hsl(var(--primary))" strokeWidth="0.8" opacity="0.03" className="dark:opacity-[0.05]" />
      </svg>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
        {/* ── Header ── */}
        <motion.div
          className="text-center mb-16 md:mb-20 lg:mb-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={stagger}
        >
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/[0.06] dark:bg-primary/[0.1] border border-primary/10 rounded-full text-primary text-[11px] font-semibold tracking-[0.15em] uppercase mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Por que nos escolher
            </span>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-foreground leading-[1.1] tracking-tight max-w-3xl mx-auto"
          >
            Entendemos os desafios de{' '}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              cuidar do seu pet
            </span>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mt-5 text-base md:text-lg text-muted-foreground/70 max-w-xl mx-auto leading-relaxed"
          >
            Sabemos como é difícil encontrar um lugar realmente confiável para cuidar de quem você ama.
          </motion.p>
        </motion.div>

        {/* ── Main content: 2 columns on desktop, stacked on mobile ── */}
        <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-0 items-start">

          {/* ── Problems column ── */}
          <motion.div
            className="space-y-5"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
          >
            <motion.div variants={fadeUp} className="flex items-center gap-2.5 mb-2 lg:mb-4">
              <div className="w-7 h-7 bg-destructive/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5 text-destructive/80" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-bold text-muted-foreground/60 tracking-[0.12em] uppercase">
                Os desafios
              </span>
            </motion.div>

            {problems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.number}
                  variants={fadeUp}
                  className="group relative bg-card/60 dark:bg-card/40 backdrop-blur-sm rounded-2xl border border-border/40 p-5 lg:p-6 hover:shadow-[0_8px_30px_-8px_hsl(var(--destructive)/0.08)] hover:-translate-y-1 transition-all duration-300 ease-out"
                >
                  {/* Number watermark */}
                  <span className="absolute top-3 right-4 text-[40px] font-black text-foreground/[0.03] leading-none select-none pointer-events-none">
                    {item.number}
                  </span>

                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-10 h-10 bg-destructive/[0.07] dark:bg-destructive/[0.12] rounded-xl flex items-center justify-center group-hover:bg-destructive/[0.12] dark:group-hover:bg-destructive/[0.18] transition-colors duration-300">
                      <Icon className="w-[18px] h-[18px] text-destructive/60 group-hover:text-destructive/80 transition-colors duration-300" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[15px] font-semibold text-foreground tracking-tight mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground/60 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ── Transformation element ── */}
          <motion.div
            className="flex lg:flex-col items-center justify-center py-4 lg:py-0 lg:px-8 xl:px-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={scaleFade}
          >
            {/* Mobile: horizontal arrow */}
            <div className="flex lg:hidden items-center gap-3">
              <div className="h-px w-12 bg-gradient-to-r from-destructive/20 to-transparent" />
              <div className="relative">
                <div className="absolute inset-0 w-12 h-12 rounded-full bg-primary/10 animate-[pulse_3s_ease-in-out_infinite]" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center border border-primary/15 shadow-[0_0_24px_-4px_hsl(var(--primary)/0.2)]">
                  <ChevronDown className="w-5 h-5 text-primary animate-[bounce_2s_ease-in-out_infinite]" />
                </div>
              </div>
              <div className="h-px w-12 bg-gradient-to-l from-[hsl(var(--success)/0.2)] to-transparent" />
            </div>

            {/* Desktop: vertical connector */}
            <div className="hidden lg:flex flex-col items-center gap-0 h-full min-h-[280px]">
              {/* Top line */}
              <div className="w-px flex-1 bg-gradient-to-b from-transparent via-destructive/15 to-destructive/20" />

              {/* Central orb */}
              <div className="relative my-3">
                <div className="absolute -inset-3 rounded-full bg-primary/[0.06] animate-[pulse_3s_ease-in-out_infinite]" />
                <div className="absolute -inset-6 rounded-full bg-primary/[0.03] animate-[pulse_3s_ease-in-out_infinite_0.5s]" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center border border-primary/15 shadow-[0_0_30px_-6px_hsl(var(--primary)/0.25)]">
                  <ArrowRight className="w-4.5 h-4.5 text-primary rotate-90" />
                </div>
              </div>

              {/* Bottom line */}
              <div className="w-px flex-1 bg-gradient-to-b from-[hsl(var(--success)/0.2)] via-[hsl(var(--success)/0.15)] to-transparent" />
            </div>
          </motion.div>

          {/* ── Solutions column ── */}
          <motion.div
            className="space-y-5"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
          >
            <motion.div variants={fadeUp} className="flex items-center gap-2.5 mb-2 lg:mb-4">
              <div className="w-7 h-7 bg-[hsl(var(--success)/0.10)] rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--success)/0.8)]" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-bold text-muted-foreground/60 tracking-[0.12em] uppercase">
                A solução PetCão
              </span>
            </motion.div>

            {solutions.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.number}
                  variants={fadeUp}
                  className="group relative bg-card/80 dark:bg-card/50 backdrop-blur-sm rounded-2xl border border-[hsl(var(--success)/0.10)] p-5 lg:p-6 hover:shadow-[0_8px_30px_-8px_hsl(var(--success)/0.10)] hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden"
                >
                  {/* Left accent bar */}
                  <div className="absolute left-0 top-5 bottom-5 w-[2.5px] rounded-full bg-[hsl(var(--success)/0.12)] group-hover:bg-[hsl(var(--success)/0.30)] transition-colors duration-300" />

                  {/* Number watermark */}
                  <span className="absolute top-3 right-4 text-[40px] font-black text-[hsl(var(--success)/0.04)] leading-none select-none pointer-events-none">
                    {item.number}
                  </span>

                  <div className="flex items-start gap-4 pl-2">
                    <div className="shrink-0 relative w-10 h-10 bg-[hsl(var(--success)/0.06)] dark:bg-[hsl(var(--success)/0.10)] rounded-xl flex items-center justify-center group-hover:bg-[hsl(var(--success)/0.12)] dark:group-hover:bg-[hsl(var(--success)/0.16)] transition-colors duration-300">
                      <div className="absolute inset-0 rounded-xl bg-[hsl(var(--success)/0.04)] blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <Icon className="relative w-[18px] h-[18px] text-[hsl(var(--success)/0.6)] group-hover:text-[hsl(var(--success)/0.85)] transition-colors duration-300" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[15px] font-semibold text-foreground tracking-tight mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground/60 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* ── Bottom accent line ── */}
        <motion.div
          className="mt-20 md:mt-28 max-w-[140px] mx-auto h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: EASE }}
        />
      </div>
    </section>
  );
}
