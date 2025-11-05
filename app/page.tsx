"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function HeroPrism() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-black text-white overflow-hidden">
      {/* Ambient gradient glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        className="absolute inset-0 bg-gradient-to-tr from-black via-slate-800/20 to-amber-500/10 blur-3xl"
      />

      {/* Incoming white light beam */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 0.8, scaleX: 1 }}
        transition={{ duration: 3, ease: 'easeOut', delay: 0.5 }}
        className="absolute top-1/2 left-0 w-1/2 h-[2px] bg-gradient-to-r from-white via-white/90 to-transparent blur-[1px]"
        style={{ transformOrigin: "left" }}
      />

      {/* Prism core */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="relative flex items-center justify-center mb-10"
      >
        {/* Triangular prism */}
        <motion.div
          animate={{ rotateY: [0, 180, 360] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="w-64 h-64 bg-gradient-to-tr from-zinc-900 to-slate-300/20 rounded-[2rem] blur-[1px] shadow-[0_0_80px_rgba(255,255,255,0.15)]"
          style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
        />
      </motion.div>

      {/* Outgoing refracted beams */}
      <motion.div
        className="absolute top-[52%] left-[52%] w-[40vw] h-[1.5px] bg-gradient-to-r from-amber-400 via-orange-400/70 to-transparent origin-left blur-sm"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-[48%] left-[52%] w-[38vw] h-[1.5px] bg-gradient-to-r from-sky-400 via-cyan-300/80 to-transparent origin-left blur-sm"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
      />
      <motion.div
        className="absolute top-[56%] left-[52%] w-[36vw] h-[1.5px] bg-gradient-to-r from-pink-400 via-fuchsia-400/70 to-transparent origin-left blur-sm"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 5.5, repeat: Infinity, delay: 2 }}
      />

      {/* Headline & CTA */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="text-center max-w-3xl px-8"
      >
        <h1 className="text-5xl md:text-6xl font-serif tracking-tight mb-4">
          The Prism of Power
        </h1>
        <p className="text-lg text-slate-300 mb-8">
          Turning filings, protests, and regulations into foresight.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/instrument")}
          className="text-sm uppercase tracking-widest px-6 py-3 border border-slate-500/50 rounded-full hover:bg-white hover:text-black transition-all"
        >
          Enter the Instrument →
        </motion.button>
      </motion.div>

      {/* Footer tagline */}
      <motion.div
        className="absolute bottom-6 text-xs text-slate-500 tracking-widest uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
      >
        rareearthminerals.ai — a Veracity & Provenance Instrument
      </motion.div>
    </div>
  );
}

