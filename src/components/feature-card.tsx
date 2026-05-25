import { motion, useTransform, MotionValue } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

interface CardData {
  tag: string;
  tagClass: string;
  title: string;
  description: string;
  bgColor: string;
  borderColor: string;
  videoSrc: string;
  mobileVideoSrc?: string;
  actionText: string;
  onAction: () => void;
}

interface FeatureCardProps {
  card: CardData;
  index: number;
  progress: MotionValue<number>;
}

export function FeatureCard({ card, index, progress }: FeatureCardProps) {
  const start = index * 0.25 + 0.08;
  const end = start + 0.22;

  // Stacking transformations for screen widths that support scrolling physics
  const scale = useTransform(progress, [start, end], [1, 0.96]);
  const opacity = useTransform(progress, [start, end], [1, 0.9]);

  return (
    <div
      className="h-auto lg:h-screen w-full flex items-center justify-center sticky top-4 lg:top-0"
      style={{
        zIndex: index + 1,
      }}
    >
      <motion.div
        style={{
          scale: index === 2 ? 1 : scale,
          opacity: index === 2 ? 1 : opacity,
          backgroundColor: card.bgColor,
          borderColor: card.borderColor,
        }}
        // Added solid bg fallbacks ('bg-white') to make sure text or elements from cards below never clip or show through
        className="w-full max-w-9xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border rounded-[32px] p-6 md:p-8 lg:p-12 shadow-xl relative min-h-fit lg:h-[75vh] bg-white"
      >
        {/* Left Column: Text Content */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <span
            className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 lg:mb-6 w-fit ${card.tagClass}`}
          >
            {card.tag}
          </span>
          <h3 className="text-3xl lg:text-5xl font-bold tracking-tight text-[#1E2939] mb-4 lg:mb-6 leading-tight">
            {card.title}
          </h3>
          <p className="text-sm lg:text-base text-[#1E2939]/70 leading-relaxed mb-6 lg:mb-8">
            {card.description}
          </p>

          <button
            onClick={card.onAction}
            className="group w-fit px-6 py-3 bg-[#1E2939] text-white rounded-full font-bold text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center gap-4 shadow-md cursor-pointer"
          >
            <span>{card.actionText}</span>

            <span className="group-hover:scale-110 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-white">
              <ArrowUpRight
                size={14}
                className="transition-all duration-300 group-hover:text-[#1E2939]"
              />
            </span>
          </button>
        </div>

        {/* Right Column: Video Showcase Frame - Configured for Portrait Layouts */}
        <div className="lg:col-span-7 w-full flex items-center justify-center mt-4 lg:mt-0">
          {/* Constrained layout width max-w-[320px] on mobile to match natural smartphone form factor proportions */}
          <div className="w-full max-w-[320px] sm:max-w-[340px] lg:max-w-none bg-white/90 border border-[#E8EEEC] rounded-[24px] p-2.5 lg:p-3 shadow-md overflow-hidden">
            {/* Dynamic Aspect Ratio Box: aspect-[9/16] for mobile vertical clarity, aspect-video for desktop width */}
            <div className="rounded-[14px] overflow-hidden bg-slate-50 border border-[#E8EEEC] w-full relative aspect-[9/16] lg:aspect-video">
              {/* Desktop Horizontal Video Asset Stream */}
              <video
                className="hidden lg:block w-full h-full object-cover"
                src={card.videoSrc}
                autoPlay
                loop
                muted
                playsInline
              />

              {/* Mobile Portrait Video Asset Stream */}
              <video
                className="block lg:hidden w-full h-full object-cover"
                src={card.mobileVideoSrc || card.videoSrc}
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
