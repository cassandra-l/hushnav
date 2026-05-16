import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Logo } from "./logo";
import { motion, MotionValue, AnimatePresence } from "framer-motion";
import {
  Wind,
  ChevronDown,
  ChevronRight,
  UserCircle,
  Trophy,
  Headphones,
} from "lucide-react";

interface NavbarProps {
  showLogo?: boolean;
  className?: string;
  logoOpacity?: MotionValue<number> | number;
}

export function Navbar({
  showLogo = false,
  className = "",
  logoOpacity = 1,
}: NavbarProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      className={`fixed top-8 left-0 w-full z-50 px-6 lg:px-12 ${className}`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex-1 flex justify-start">
          {showLogo && (
            <motion.div
              className="flex flex-1 items-center gap-3 z-10"
              style={{ opacity: logoOpacity }}
            >
              <Logo />
              <span className="text-sm text-[#5A9A8E] font-bold tracking-[0.3em] uppercase whitespace-nowrap">
                HushNav
              </span>
            </motion.div>
          )}
        </div>

        <nav className="flex items-center gap-10 bg-white/40 backdrop-blur-md px-10 py-4 rounded-full border border-white/20 shadow-sm pointer-events-auto">
          <NavLink to="/" label="Home" active={isActive("/")} />
          <NavLink to="/map" label="Quiet Routes" active={isActive("/map")} />

          {/* Calming Tools Dropdown */}
          <DropdownNav
            label="Calming Tools"
            active={
              location.pathname === "/support" ||
              location.pathname === "/soundscape"
            }
          >
            <DropdownItem
              Icon={Wind}
              title="Breath Work"
              desc="Regulate your nervous system with guided exercises."
              to="/support"
            />
            <DropdownItem
              Icon={Headphones}
              title="Soundscapes"
              desc="Immersive audio to drown out urban noise."
              to="/soundscape"
            />
          </DropdownNav>

          {/* Profile Dropdown (Quiz + Achievements) */}
          <DropdownNav
            label="Profile"
            active={
              location.pathname === "/self-discovery" ||
              location.pathname.startsWith("/achievements")
            }
          >
            <DropdownItem
              Icon={UserCircle}
              title="Sensory Profile"
              desc="Discover how you experience the city sounds."
              to="/self-discovery"
            />
            <DropdownItem
              Icon={Trophy}
              title="Achievements"
              desc="Track your journey and earned badges."
              to="/achievements"
            />
          </DropdownNav>
        </nav>

        <div className="flex-1 hidden lg:flex justify-end" />
      </div>
    </div>
  );
}

function DropdownNav({
  label,
  active,
  children,
}: {
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={`cursor-pointer relative text-[11px] font-bold uppercase tracking-[0.2em] transition-colors flex items-center gap-1 outline-none ${
          active ? "text-[#1E2939]" : "text-[#1E2939]/70 hover:text-[#1E2939]"
        }`}
      >
        <span className="relative">
          {label}
          {active && (
            <motion.span
              layoutId="active-pill"
              className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#5A9A8E] rounded-full"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </span>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3 h-3" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full pt-5 z-50"
          >
            <div
              className="w-80 bg-white rounded-3xl p-2 shadow-xl border border-white/20"
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DropdownItem({
  Icon,
  title,
  desc,
  to,
}: {
  Icon: any;
  title: string;
  desc: string;
  to: string;
}) {
  return (
    <Link to={to} className="block group">
      <div className="flex items-center gap-4 p-4 rounded-[18px] hover:bg-[#F0F7F4] transition-colors relative">
        <motion.div
          className="flex items-center gap-4 w-full"
          whileHover={{ x: 8 }}
          transition={{
            type: "spring",
            stiffness: 250,
            damping: 25,
            mass: 0.5,
          }}
        >
          <div className="bg-white/50 w-10 h-10 flex items-center justify-center rounded-xl text-[#5A9A8E] shrink-0 shadow-sm">
            <Icon size={20} strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#1E2939]">
              {title}
            </h4>
            <p className="text-[10px] text-[#1E2939]/50 leading-tight mt-1 lowercase first-letter:uppercase">
              {desc}
            </p>
          </div>
          <ChevronRight
            size={14}
            className="text-[#5A9A8E] opacity-0 group-hover:opacity-100 transition-opacity mr-2"
          />
        </motion.div>
      </div>
    </Link>
  );
}

function NavLink({
  to,
  label,
  active,
}: {
  to: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`relative text-[11px] font-bold uppercase tracking-[0.2em] transition-colors flex flex-col items-center ${
        active ? "text-[#1E2939]" : "text-[#1E2939]/70 hover:text-[#1E2939]"
      }`}
    >
      {label}
      {active && (
        <motion.span
          layoutId="active-pill"
          className="absolute -bottom-2.5 w-1.5 h-1.5 bg-[#5A9A8E] rounded-full"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  );
}
