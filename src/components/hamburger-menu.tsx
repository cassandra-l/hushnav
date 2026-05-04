import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Wind, Trophy, Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const navigate = useNavigate();
  // Get current location
  const location = useLocation();

  const menuItems = [
    { label: "Home", icon: <Home size={20} />, path: "/" },
    { label: "Find Quiet Route", icon: <MapPin size={20} />, path: "/map" },
    { label: "Calming Tools", icon: <Wind size={20} />, path: "/support" },
    {
      label: "Achievements",
      icon: <Trophy size={20} />,
      path: "/achievements",
    },
  ];

  // Locks background scroll
  useEffect(() => {
    if (isOpen) {
      // Disable scrolling on the body
      document.body.style.overflow = "hidden";
    } else {
      // Re-enable scrolling when menu is closed
      document.body.style.overflow = "";
    }

    // Ensures scroll is restored if the component is removed
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-60"
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-[85%] max-w-[320px] bg-white z-70 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <span className="font-bold text-[#1E2939] text-xl">Menu</span>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 px-4 py-8">
              <ul className="space-y-6">
                {menuItems.map((item) => {
                  // Check if this is the current active path
                  const isActive = location.pathname === item.path;

                  return (
                    <li key={item.path}>
                      <button
                        onClick={() => {
                          navigate(item.path);
                          onClose();
                        }}
                        /* Styling for active page */
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                          isActive
                            ? "bg-[#5A9A8E]/10 text-[#5A9A8E]"
                            : "text-[#1E2939] hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`${isActive ? "text-[#5A9A8E]" : "text-[#1E2939]/60"} transition-colors`}
                        >
                          {item.icon}
                        </span>
                        <span className="font-bold text-sm">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Footer */}
            <div className="p-8 text-center">
              <span className="text-[10px] text-[#1E2939]/40 font-bold uppercase tracking-widest">
                HushNav • Version 1.0
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
