import {
  motion,
  useScroll,
  useTransform,
  Variants,
  useInView,
} from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, ArrowDown, Menu } from "lucide-react";
// import { Logo } from "./components/logo";
import { FeatureCard } from "./components/feature-card";
import hero_image from "./assets/hero_image.png";
import { useState, useRef } from "react";
import { MobileMenu } from "./components/hamburger-menu";
// import { useLocation } from "react-router-dom";
import { Navbar } from "./components/nav-bar";
import { RollingReel } from "./components/rolling-reel";
import safe_spaces_demo from "./assets/safe_spaces_demo.mp4";
import red_roads_demo from "./assets/red_roads_demo.mp4";
import noise_monitoring_demo from "./assets/noise_monitoring_demo.mp4";
import safe_spaces_demo_mobile from "./assets/safe_spaces_demo_mobile.mp4";
import red_roads_demo_mobile from "./assets/red_roads_demo_mobile.mp4";
import noise_monitoring_demo_mobile from "./assets/noise_monitoring_demo_mobile.mp4";

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

// Rolling Number Component for Animated Statistics
// function RollingNumber({
//   value,
//   suffix = "",
// }: {
//   value: number;
//   suffix?: string;
// }) {
//   const [count, setCount] = useState(0);
//   const ref = useRef(null);
//   const isInView = useInView(ref, { once: true, amount: 0.5 });

//   useEffect(() => {
//     if (isInView) {
//       let start = 0;
//       const end = value;
//       if (start === end) return;

//       const duration = 2; // Duration of animation in seconds
//       const totalMiliseconds = duration * 1000;
//       const intervalTime = 30; // Update every 30ms
//       const totalSteps = Math.ceil(totalMiliseconds / intervalTime);
//       const increment = end / totalSteps;

//       const timer = setInterval(() => {
//         start += increment;
//         if (start >= end) {
//           clearInterval(timer);
//           setCount(end);
//         } else {
//           setCount(Math.floor(start));
//         }
//       }, intervalTime);

//       return () => clearInterval(timer);
//     }
//   }, [isInView, value]);

//   return (
//     <span ref={ref} className="tabular-nums">
//       {count}
//       {suffix}
//     </span>
//   );
// }

export function Home() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // const [activeTab, setActiveTab] = useState("safespaces");
  const statsRef = useRef<HTMLDivElement>(null);
  const isStatsInView = useInView(statsRef, { once: true, amount: 0.3 });
  // Track scroll progress to fade the logo
  const { scrollY } = useScroll();
  // Logo is 100% visible at top, and fades to 0% after 150px of scrolling
  const logoOpacity = useTransform(scrollY, [0, 150], [1, 0]);
  const stackContainerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: stackContainerRef,
    offset: ["start start", "end end"],
  });

  const featureCards = [
    {
      tag: "01 / Safe Spaces",
      tagClass: "bg-[#D7EEE8] text-[#3B7F73]",
      title: "Take a Break Along the Way",
      description:
        "Quickly discover quieter public spaces such as libraries, churches and more along your journey whenever you need a moment to reset.",
      bgColor: "#EAF6F3",
      borderColor: "#B7DDD3",
      videoSrc: safe_spaces_demo,
      mobileVideoSrc: safe_spaces_demo_mobile,
      actionText: "Explore on Map",
      onAction: () => navigate("/map"),
    },
    {
      tag: "02 / Noise Monitoring",
      tagClass: "bg-[#E0F2FE] text-[#0369A1]",
      title: "Stay Aware of Noise Around You",
      description:
        "Monitor live noise levels around your surroundings to help you feel more prepared and in control while navigating the city.",
      bgColor: "#F0F9FF",
      borderColor: "#BAE6FD",
      videoSrc: noise_monitoring_demo,
      mobileVideoSrc: noise_monitoring_demo_mobile,
      actionText: "Explore on Map",
      onAction: () => navigate("/map"),
    },
    {
      tag: "03 / Red Roads",
      tagClass: "bg-[#FCE7F3] text-[#9D174D]",
      title: "Bypass Chaos with Red Roads Warnings",
      description:
        "Highlighted red roads indicate areas with high pedestrian activity, helping you avoid overcrowded paths during your journey.",
      bgColor: "#FDF2F8",
      borderColor: "#FBCFE8",
      videoSrc: red_roads_demo,
      mobileVideoSrc: red_roads_demo_mobile,
      actionText: "Explore on Map",
      onAction: () => navigate("/map"),
    },
  ];

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
          <div className="flex gap-3 items-center">
            <button
              className="p-4 bg-white/40 backdrop-blur-md rounded-full border border-white/20 text-[#1E2939] shadow-sm"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            {/* Mobile-only Logo that also fades */}
            <motion.div
              style={{ opacity: logoOpacity }}
              className="flex items-center gap-3"
            >
              {/* <Logo /> */}
              <span className="text-sm text-[#5A9A8E] font-bold tracking-[0.3em] uppercase whitespace-nowrap">
                HushNav
              </span>
            </motion.div>
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
                    <span>Breath Work</span>

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
        viewport={{ once: false, amount: 0.1 }}
        className="bg-white pt-24 px-6 lg:px-12 border-t border-[#E8EEEC]"
      >
        <div className="max-w-[1440px] mx-auto">
          {/* Main Title and Explanation */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center text-center mb-20"
          >
            <span className="bg-[#E8F3F1] text-[#5A9A8E] px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6">
              What We Offer
            </span>
            <h2 className="text-4xl lg:text-6xl font-bold max-w-3xl leading-[1.1] mb-6">
              Navigating CBD Chaos Through Sensory Clarity
            </h2>
            <p className="text-base lg:text-lg text-[#1E2939]/70 max-w-2xl leading-relaxed">
              The city can be overwhelming. HushNav helps you reclaim your peace
              of mind by bypassing loud construction zones, high-traffic
              corridors, and sudden heavy acoustic disruptions with
              customizable, low-decibel sensory routing.
            </p>
          </motion.div>

          {/* Stats Rolling Subsection */}
          <motion.div
            ref={statsRef}
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-3 gap-16 sm:gap-8 max-w-5xl mx-auto mb-2 text-center border-y border-[#E8EEEC] py-14 px-4"
          >
            {/* Stat 1: 1 in 5 */}
            <div className="flex flex-col items-center justify-center">
              <div className="mb-4 flex items-center justify-center gap-2">
                <RollingReel target="1" />
                <span className="text-4xl lg:text-5xl font-bold text-[#5A9A8E] tracking-tight select-none">
                  in
                </span>
                <RollingReel target="5" />
              </div>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={
                  isStatsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
                }
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                className="text-[11px] font-bold uppercase tracking-wider text-[#1E2939]/60 max-w-[180px] leading-relaxed"
              >
                People Experience Noise Sensitivity
              </motion.span>
            </div>

            {/* Stat 2: Personalized */}
            <div className="flex flex-col items-center justify-center sm:border-x sm:border-[#E8EEEC]/60 px-4">
              <div className="mb-4 flex items-center justify-center">
                <motion.span
                  initial={{ opacity: 0, y: 12 }}
                  animate={
                    isStatsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }
                  }
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  className="text-4xl lg:text-5xl font-bold text-[#5A9A8E] tracking-tight select-none"
                >
                  Personalized
                </motion.span>
              </div>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={
                  isStatsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
                }
                transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                className="text-[11px] font-bold uppercase tracking-wider text-[#1E2939]/60 max-w-[200px] leading-relaxed"
              >
                Routing Based on Sensory Needs
              </motion.span>
            </div>

            {/* Stat 3: 4+ Support Features */}
            <div className="flex flex-col items-center justify-center">
              <div className="mb-4 flex items-center justify-center gap-1">
                <RollingReel target="4" />
                <span className="text-4xl lg:text-5xl font-bold text-[#5A9A8E] tracking-tight select-none">
                  +
                </span>
              </div>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={
                  isStatsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
                }
                transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                className="text-[11px] font-bold uppercase tracking-wider text-[#1E2939]/60 max-w-[180px] leading-relaxed"
              >
                Sensory Support Features Integrated
              </motion.span>
            </div>
          </motion.div>

          {/* Feature Highlight */}
          <section>
            {/* Section Introduction Header */}
            <div className="max-w-360 mx-auto pt-16 lg:pt-24 px-6 text-center flex flex-col items-center">
              <span className="bg-[#E8F3F1] text-[#5A9A8E] px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 lg:mb-6">
                Explore the Experience
              </span>
              <h3 className="text-3xl lg:text-6xl font-bold leading-[1.05] max-w-3xl text-[#1E2939] mb-4">
                Built-In Features Designed for Everyday Navigation
              </h3>
              <p className="text-sm lg:text-lg text-[#1E2939]/60 max-w-2xl leading-relaxed">
                Discover interactive tools designed to support you throughout
                your journey
              </p>
            </div>

            <div
              ref={stackContainerRef}
              className="lg:-mt-18 relative h-auto lg:h-[300vh] px-4 lg:px-12 pt-8 pb-16 lg:pb-24 flex flex-col gap-8 lg:block"
            >
              {featureCards.map((card, index) => (
                <FeatureCard
                  key={index}
                  card={card}
                  index={index}
                  progress={scrollYProgress}
                />
              ))}
            </div>
          </section>
        </div>
      </motion.section>
    </main>
  );
}
