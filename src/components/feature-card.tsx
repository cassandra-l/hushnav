import { motion, Variants } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  icon: React.ReactNode;
  title: string;
  description: string;
  tags?: string[];
  variants?: Variants;
  href: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  tags,
  variants,
  href,
}: Props) {
  return (
    <motion.div
      variants={variants}
      className="group relative overflow-hidden bg-white border border-[#E8EEEC] rounded-[40px] p-8 h-[360px] w-full lg:w-[380px] transition-all duration-500"
    >
      {/* Gradient overlay during hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, #cfe3dfB3 0%,#ffffff 90%)",
        }}
      />

      {/* Card Content*/}
      <div className="relative z-20 h-full flex flex-col justify-between">
        <div>
          {/* Icon */}
          <div className="flex justify-center items-center bg-white rounded-2xl w-14 h-14 mb-8 shadow-sm">
            <div className="text-[#5A9A8E]">{icon}</div>
          </div>

          <h3 className="font-bold text-[26px] mb-4 text-[#1E2939] leading-tight">
            {title}
          </h3>
          <p className="text-[#4A5565] text-[16px] leading-relaxed">
            {description}
          </p>
        </div>

        {/* Footer Area */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex gap-3">
            {tags?.map((tag) => (
              <span
                key={tag}
                className="text-[12px] font-bold text-[#1E2939]/40 uppercase tracking-wider"
              >
                # {tag}
              </span>
            ))}
          </div>

          {/* Arrow Button */}
          <Link
            to={href}
            className="w-12 h-12 rounded-full bg-[#E8EEEC] group-hover:bg-[#1E2939] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <ArrowUpRight
              size={20}
              className="text-[#1E2939] group-hover:text-white transition-colors"
            />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
