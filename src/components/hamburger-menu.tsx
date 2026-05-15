import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Wind,
  Trophy,
  Headphones,
  UserCircle,
  ChevronRight,
  ChevronDown,
  LucideIcon,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  icon?: LucideIcon;
  path: string;
  desc?: string;
}

interface NavGroup {
  title: string;
  path?: string;
  items?: NavItem[];
  isCollapsible?: boolean;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Calming Tools": false,
    Profile: false,
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navGroups: NavGroup[] = [
    { title: "Home", path: "/" },
    { title: "Find Quiet Route", path: "/map" },
    {
      title: "Calming Tools",
      isCollapsible: true,
      items: [
        {
          label: "Breath Work",
          icon: Wind,
          path: "/support",
          desc: "Regulate your nervous system",
        },
        {
          label: "Soundscapes",
          icon: Headphones,
          path: "/soundscape",
          desc: "Immersive audio experience",
        },
      ],
    },
    {
      title: "Profile",
      isCollapsible: true,
      items: [
        {
          label: "Sensory Profile",
          icon: UserCircle,
          path: "/self-discovery",
          desc: "Discover your hearing",
        },
        {
          label: "Achievements",
          icon: Trophy,
          path: "/achievements",
          desc: "Track your badges",
        },
      ],
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#EAF5F2]/80 backdrop-blur-md z-[60]"
          />

          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-[85%] max-w-[320px] bg-white/90 backdrop-blur-xl z-[70] shadow-2xl flex flex-col border-r border-white/20"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 pb-4">
              <span className="text-[12px] font-black uppercase tracking-[0.3em] text-[#5A9A8E]">
                HushNav
              </span>
              <button
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <X size={20} className="text-[#1E2939]" />
              </button>
            </div>

            {/* Grey line after Title */}
            <div className="mx-8 h-[1px] bg-black/5 mb-4" />

            <nav className="flex-1 px-6 overflow-y-auto pb-10">
              {navGroups.map((group, gIdx) => {
                const isGroupActive = group.path
                  ? location.pathname === group.path
                  : group.items?.some(
                      (item) => location.pathname === item.path,
                    );

                const isExpanded =
                  !group.isCollapsible || openSections[group.title];

                return (
                  <div key={gIdx}>
                    {/* Main Category Header */}
                    <button
                      onClick={() => {
                        if (group.isCollapsible) {
                          toggleSection(group.title);
                        } else if (group.path) {
                          navigate(group.path);
                          onClose();
                        }
                      }}
                      className="w-full flex items-center justify-between px-2 py-4 group/header mt-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 flex items-center justify-center">
                          {isGroupActive && (
                            <motion.div
                              layoutId="activeDot"
                              className="w-1.5 h-1.5 bg-[#5A9A8E] rounded-full"
                            />
                          )}
                        </div>
                        <h3
                          className={`text-[12px] font-bold uppercase tracking-[0.2em] transition-colors ${isGroupActive ? "text-[#1E2939]" : "text-[#1E2939]/40"}`}
                        >
                          {group.title}
                        </h3>
                      </div>
                      {group.isCollapsible && (
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-300 text-[#1E2939]/30 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      )}
                    </button>

                    {/* Sub-Items (Dropdown) */}
                    <AnimatePresence initial={false}>
                      {isExpanded && group.items && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-2 mb-4 ml-4"
                        >
                          {group.items.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                              <li key={item.path}>
                                <button
                                  onClick={() => {
                                    navigate(item.path);
                                    onClose();
                                  }}
                                  className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${
                                    isActive
                                      ? "bg-[#F0F7F4] border border-[#5A9A8E]/10"
                                      : "hover:bg-gray-50/50"
                                  }`}
                                >
                                  {item.icon && (
                                    <div className="bg-white w-10 h-10 flex items-center justify-center rounded-xl text-[#5A9A8E] shadow-sm border border-black/5 shrink-0">
                                      <item.icon size={18} strokeWidth={1.5} />
                                    </div>
                                  )}

                                  <div className="flex-1 text-left pl-1">
                                    <span
                                      className={`block text-[13px] font-bold ${isActive ? "text-[#1E2939]" : "text-[#1E2939]/80"}`}
                                    >
                                      {item.label}
                                    </span>
                                    {item.desc && (
                                      <span className="text-[10px] text-[#1E2939]/40 leading-tight block mt-0.5">
                                        {item.desc}
                                      </span>
                                    )}
                                  </div>
                                  <ChevronRight
                                    size={14}
                                    className={`text-[#5A9A8E] transition-opacity ${isActive ? "opacity-40" : "opacity-0"}`}
                                  />
                                </button>
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>

            <div className="p-8 text-center">
              <span className="text-[9px] text-[#1E2939]/30 font-bold uppercase tracking-widest">
                HushNav • Version 3.0
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
