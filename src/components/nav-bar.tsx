import { useLocation, Link } from "react-router-dom";
import { Logo } from "./logo"; // Adjust path as needed
import { motion, MotionValue } from "framer-motion";

// Inside your Navbar component file
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
        {/* Logo Container */}
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

        {/* Navigation Pill */}
        <nav className="flex items-center gap-10 bg-white/40 backdrop-blur-md px-10 py-4 rounded-full border border-white/20 shadow-sm pointer-events-auto">
          <NavLink to="/" label="Home" active={isActive("/")} />
          <NavLink to="/map" label="Quiet Routes" active={isActive("/map")} />
          <NavLink
            to="/support"
            label="Calming Tool"
            active={isActive("/support")}
          />
          <NavLink
            to="/achievements"
            label="Achievements"
            active={isActive("/achievements")}
          />
        </nav>

        <div className="flex-1 hidden lg:flex justify-end" />
      </div>
    </div>
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
        /* 
           1. Use motion.span instead of a regular span.
           2. Add layoutId="active-pill" to identify this element.
           3. Framer Motion will see this ID and "slide" the dot between links.
        */
        <motion.span
          layoutId="active-pill"
          className="absolute -bottom-2.5 w-1.5 h-1.5 bg-[#5A9A8E] rounded-full"
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 30,
          }}
        />
      )}
    </Link>
  );
}
