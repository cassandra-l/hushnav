import { easeInOut, motion } from "framer-motion";

export function Logo() {
  //   const customEase = [0.4, 0, 0.2, 1] as const;
  return (
    <div className="relative flex items-center justify-center w-28.5 h-28.5 bg-white/40 border border-white backdrop-blur-xl rounded-4xl shadow-xl">
      {/* First Oval (Inner Ripple) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.6, 0.2, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: easeInOut,
        }}
      >
        <div className="w-12 h-16 rounded-full border-2 border-[#7db0a6]/40" />
      </motion.div>

      {/* Second Oval (Outer Ripple) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.4, 0.1, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: easeInOut,
          delay: 0.3,
        }}
      >
        <div className="w-12 h-16 rounded-full border-2 border-[#7db0a6]/30" />
      </motion.div>

      {/* Center dot */}
      <div className="relative z-10 flex items-center justify-center">
        <div className="size-3 rounded-full bg-[#7db0a6]" />
      </div>
    </div>
  );
}
