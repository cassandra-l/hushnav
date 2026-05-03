import { motion, useScroll, useTransform, Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, ArrowDown, Shield, Mic, Wind, Menu } from "lucide-react";
import { Logo } from "./components/logo";
import { FeatureCard } from "./components/feature-card";
import hero_image from "./assets/hero_image.png";
import { useState } from "react";
import { MobileMenu } from "./components/hamburger-menu";
// import { useLocation } from "react-router-dom";
import { Navbar } from "./components/nav-bar";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // const location = useLocation();
  // const isActive = (path: string) => location.pathname === path;

  // Track scroll progress to fade the logo
  const { scrollY } = useScroll();
  // Logo is 100% visible at top, and fades to 0% after 150px of scrolling
  const logoOpacity = useTransform(scrollY, [0, 150], [1, 0]);

  return (
    <main className="min-h-screen font-sans text-[#1E2939] flex flex-col">
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <div className="min-h-svh flex flex-col bg-linear-to-b from-[#ffffff] via-[#d5e8e5] to-[#cfe3df]">
        <Navbar
          showLogo={true}
          logoOpacity={logoOpacity}
          className="hidden lg:flex"
        />

        <div className="lg:hidden fixed top-6 left-0 w-full z-50 px-6">
          <div className="flex justify-between items-center">
            {/* Mobile-only Logo that also fades */}
            <motion.div
              style={{ opacity: logoOpacity }}
              className="flex items-center gap-3"
            >
              <Logo />
            </motion.div>

            <button
              className="p-4 bg-white/40 backdrop-blur-md rounded-full border border-white/20 text-[#1E2939] shadow-sm"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Main Viewport Container */}
        <div className="h-screen flex flex-col">
          {/* Hero Section */}
          <section className="flex flex-1 flex-col items-center justify-center px-6 pt-28 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="max-w-[1200px] w-full flex flex-col items-center"
            >
              <div className="flex flex-col items-center lg:flex-row lg:flex-wrap lg:justify-center lg:gap-x-8">
                <h1 className="text-[72px] md:text-[100px] lg:text-[180px] font-bold leading-[0.85] tracking-tight">
                  Find <span className="lg:hidden">Your</span>
                </h1>

                <div className="-my-2 lg:my-0 w-[280px] h-[160px] sm:w-[350px] sm:h-[200px] lg:w-[320px] lg:h-[180px] rounded-full overflow-hidden shadow-xl rotate-[-2deg] lg:rotate-0 border-[10px] border-white z-10">
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

              <h1 className="text-[72px] sm:text-[100px] lg:text-[180px] font-bold leading-[0.85] tracking-tight lg:mt-[-40px]">
                Quiet Path
              </h1>

              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
                {/* Left Button */}
                <button
                  onClick={() => navigate("/map")}
                  className="w-full sm:w-fit px-8 py-4 bg-[#7DB0A6] text-white rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all duration-300 shadow-lg cursor-pointer"
                >
                  Find Quiet Route
                </button>

                {/* Right Button */}
                <div className="w-full sm:w-fit group border border-[#1E2939] rounded-full relative flex items-center justify-center">
                  <button
                    onClick={() => navigate("/support")}
                    className="relative pl-6 pr-12 py-4 flex items-center justify-center text-xs font-bold uppercase tracking-widest cursor-pointer whitespace-nowrap"
                  >
                    <span>Calming Tool</span>

                    {/* Arrow Icon */}
                    <span className="absolute right-2 p-2 rounded-full group-hover:bg-[#1E2939] group-hover:text-white transition-all duration-300">
                      <ArrowUpRight size={18} />
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Footer Area */}
          <footer className="w-full py-8 shrink-0 border-t border-[#E8EEEC] relative">
            <div className="max-w-[1440px] mx-auto px-6 lg:px-8 flex gap-6 items-center overflow-hidden">
              <div className="flex-1 overflow-hidden relative">
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
      </div>

      {/* Feature Panels Section */}
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

// function NavLink({
//   href,
//   label,
//   active,
// }: {
//   href: string;
//   label: string;
//   active: boolean;
// }) {
//   return (
//     <a
//       href={href}
//       className={`relative text-[11px] font-bold uppercase tracking-[0.2em] transition-colors flex flex-col items-center ${
//         active ? "text-[#1E2939]" : "text-[#1E2939]/70 hover:text-[#1E2939]"
//       }`}
//     >
//       {label}
//       {/* Active Indicator Dot */}
//       {active && (
//         <span className="absolute -bottom-2 w-1 h-1 bg-[#5A9A8E] rounded-full" />
//       )}
//     </a>
//   );
// }
