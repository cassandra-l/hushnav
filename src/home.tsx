import { motion, Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, ArrowDown, Shield, Mic, Wind } from "lucide-react";
import { Logo } from "./components/logo";
import { FeatureCard } from "./components/feature-card";
import hero_image from "./assets/hero_image.png";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      // delay between each element group
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.21, 0.47, 0.32, 0.98],
    },
  },
};

export function Home() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen font-sans text-[#1E2939] flex flex-col">
      <div className="h-screen flex flex-col">
        {/* Navigation Bar */}
        <nav className="fixed top-0 flex items-center justify-between bg-white px-6 py-6 lg:px-8 mx-auto w-full z-20">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-sm text-[#5A9A8E] font-bold tracking-widest uppercase">
              HushNav
            </span>
          </div>

          <div className="flex items-center gap-10">
            <div className="hidden lg:flex items-center gap-10 text-[11px] font-bold uppercase tracking-[0.2em] text-[#1E2939]/60">
              <a href="/map" className="hover:text-[#1E2939] transition-colors">
                Quiet Routes
              </a>
              <a
                href="/support"
                className="hover:text-[#1E2939] transition-colors"
              >
                Calming Tool
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="max-w-[1200px] w-full flex flex-col items-center"
          >
            <div className="flex flex-col items-center lg:flex-row lg:flex-wrap lg:justify-center lg:gap-x-8">
              <h1 className="text-[72px] sm:text-[100px] lg:text-[180px] font-bold leading-[0.85] tracking-tight">
                Find <span className="lg:hidden">Your</span>
              </h1>

              <div className="my-6 lg:my-0 w-[280px] h-[160px] sm:w-[350px] sm:h-[200px] lg:w-[320px] lg:h-[180px] rounded-full overflow-hidden shadow-xl rotate-[-2deg] lg:rotate-0 border-[10px] border-white z-10">
                <img
                  src={hero_image}
                  alt="Navigating"
                  className="h-full w-full object-cover"
                />
              </div>

              <h1 className="hidden lg:block text-[180px] font-bold leading-[0.85] tracking-tight">
                Your
              </h1>
            </div>

            <h1 className="text-[72px] sm:text-[100px] lg:text-[180px] font-bold leading-[0.85] tracking-tight mt-2 lg:mt-[-40px]">
              Quiet Path
            </h1>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={() => navigate("/map")}
                className="w-fit px-8 py-4 bg-[#7DB0A6] text-white rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all duration-300 shadow-lg cursor-pointer"
              >
                Find Quiet Route
              </button>
              <button
                onClick={() => navigate("/support")}
                className="group flex items-center gap-3 text-xs font-bold uppercase tracking-widest"
              >
                Just Breathe
                <span className="p-2 border border-[#1E2939] rounded-full group-hover:bg-[#1E2939] group-hover:text-white transition-all duration-300">
                  <ArrowUpRight size={18} />
                </span>
              </button>
            </div>
          </motion.div>
        </section>

        {/* Divider Line */}
        <div className="w-full h-px bg-[#E8EEEC]" />

        {/* Bottom Bar  */}
        <footer className="w-full py-8 shrink-0">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-8 flex items-center justify-between overflow-hidden">
            {/* Conveyor Belt */}
            <div className="flex-1 overflow-hidden relative mr-8">
              <motion.div
                className="flex gap-16 lg:gap-32 whitespace-nowrap"
                animate={{ x: [0, -800] }}
                transition={{
                  x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 25,
                    ease: "linear",
                  },
                }}
              >
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-16 lg:gap-32 grayscale opacity-50 text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.2em]"
                  >
                    <span>LOW-DECIBEL ROUTES</span>
                    <span className="italic font-medium normal-case tracking-tight text-lg">
                      Safe Space Directory
                    </span>
                    <span>GUIDED CALM TOOLS</span>
                    <span className="italic font-medium normal-case tracking-tight text-lg">
                      Live Noise Monitoring
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Scroll Down Indicator */}
            <div className="hidden sm:flex items-center gap-3 shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              <span>Scroll</span>
              <div className="w-9 h-9 rounded-full border border-[#E8EEEC] flex items-center justify-center">
                <motion.div
                  animate={{ y: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <ArrowDown size={14} />
                </motion.div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Feature Panels */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        className="bg-white py-24 px-6 lg:px-12 border-t border-[#E8EEEC]"
      >
        <div className="max-w-[1440px] mx-auto">
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center text-center mb-16"
          >
            <span className="bg-[#E8F3F1] text-[#5A9A8E] px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6">
              What We Offer
            </span>
            <h2 className="text-4xl lg:text-6xl font-bold max-w-3xl leading-[1.1]">
              Navigating CBD Chaos Through Sensory Clarity
            </h2>
          </motion.div>

          {/* Feature Card */}
          <div className="flex flex-wrap justify-center gap-8">
            <FeatureCard
              variants={itemVariants}
              title="Safe Spaces"
              description="Find quiet cafes, libraries, and parks along your route for sensory comfort"
              icon={<Shield size={28} />}
              href="/map"
            />
            <FeatureCard
              variants={itemVariants}
              title="Noise Monitor"
              description="Track surrounding noise levels as you navigate through the city environment"
              icon={<Mic size={28} />}
              href="/map"
            />
            <FeatureCard
              variants={itemVariants}
              title="Grounding Tools"
              description="Quick access to guided breathing exercises when things get loud"
              icon={<Wind size={28} />}
              href="/support"
            />
          </div>
        </div>
      </motion.section>
    </main>
  );
}
