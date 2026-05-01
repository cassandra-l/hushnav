import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  TreePine,
  Book,
  Church,
  Landmark,
  Building2,
  Settings2,
  Users,
  Check,
  Wrench,
} from "lucide-react";

// Types for styling and options
type Theme = "sage" | "tan";

interface FilterOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  theme: Theme;
}

type SelectionType = "multi" | "single";

const SAFE_SPACES_STORAGE_KEY = "hushnav:selectedSafeSpaces";
const SENSITIVITY_STORAGE_KEY = "hushnav:selectedSensitivity";

// Sub-component for individual Filter Cards
const FilterCard = ({
  option,
  isSelected,
  onToggle,
  selectionType = "multi",
}: {
  option: FilterOption;
  isSelected: boolean;
  onToggle: (id: string) => void;
  selectionType?: SelectionType;
}) => {
  const theme = {
    active: "border-[#F2E8DB] bg-[#F9F4EE]",
    inactive: "border-white bg-white",
    iconBg: "bg-[#EFE3D4]",
    iconStroke: "#D4A373",
    indicatorBg: "bg-[#DBBEA1]",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      onClick={() => onToggle(option.id)}
      className={`mb-3 flex w-full cursor-pointer items-center rounded-2xl border p-4 transition-all duration-200 text-left shadow-sm hover:shadow-md ${
        isSelected ? theme.active : theme.inactive
      }`}
    >
      <div
        className={`mr-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
          isSelected ? theme.iconBg : "bg-[#E9EDF0]"
        }`}
      >
        {React.cloneElement(option.icon as React.ReactElement, {
          stroke: isSelected ? theme.iconStroke : "#A0AAB3",
          size: 20,
        })}
      </div>

      <div className="flex-1">
        <h4
          className={`text-[16px] font-bold transition-colors ${isSelected ? "text-[#2D3142]" : "text-[#7B828A]"}`}
        >
          {option.title}
        </h4>
        <p className="text-[13px] leading-tight text-[#7B828A]">
          {option.description}
        </p>
      </div>

      {/* Visual Indicator */}
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all ${
          isSelected ? theme.indicatorBg : "border-2 border-slate-200 bg-white"
        }`}
      >
        {isSelected &&
          (selectionType === "multi" ? (
            <Check size={14} strokeWidth={4} className="text-white" />
          ) : (
            <div className="h-2.5 w-2.5 rounded-full bg-white shadow-sm" />
          ))}
      </div>
    </motion.button>
  );
};

//  Main Filter Screen Component
export default function FilterScreen() {
  const navigate = useNavigate();

  const safeSpaces: FilterOption[] = [
    {
      id: "parks",
      title: "Park",
      description: "Outdoor green spaces",
      icon: <TreePine />,
      theme: "sage",
    },
    {
      id: "libraries",
      title: "Library",
      description: "Quiet reading spaces",
      icon: <Book />,
      theme: "sage",
    },
    {
      id: "museum",
      title: "Museum",
      description: "Calm artistic environments",
      icon: <Landmark />,
      theme: "sage",
    },
    {
      id: "church",
      title: "Church",
      description: "Calm spiritual space",
      icon: <Church />,
      theme: "sage",
    },
    {
      id: "synagogue",
      title: "Synagogue",
      description: "Quiet spiritual space",
      icon: <Building2 />,
      theme: "sage",
    },
  ];

  const sensitivities: FilterOption[] = [
    {
      id: "standard",
      title: "Standard Sensitivity",
      description: "Considers both mechanical and social noise.",
      icon: <Settings2 />,
      theme: "tan",
    },
    {
      id: "mechanical",
      title: "Mechanical Sounds",
      description: "Reduces exposure to harsh sounds",
      icon: <Wrench />,
      theme: "tan",
    },
    {
      id: "social",
      title: "Social Noise",
      description: "Avoid busy areas and chatters.",
      icon: <Users />,
      theme: "tan",
    },
  ];

  const defaultSafeSpaceIds = [
    "parks",
    "libraries",
    "museum",
    "church",
    "synagogue",
  ];
  const [selectedSafeSpaces, setSelectedSafeSpaces] =
    useState<string[]>(defaultSafeSpaceIds);
  const [selectedSensitivity, setSelectedSensitivity] =
    useState<string>("standard");

  const toggleSafeSpace = (id: string) => {
    setSelectedSafeSpaces((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleApplyFilters = () => {
    localStorage.setItem(
      SAFE_SPACES_STORAGE_KEY,
      JSON.stringify(selectedSafeSpaces),
    );
    localStorage.setItem(SENSITIVITY_STORAGE_KEY, selectedSensitivity);
    navigate("/map", { state: { restoreRoutePreview: true } });
  };

  return (
    <motion.div
      // Slide-in animation
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 min-h-screen px-6 py-8 flex flex-col items-center lg:overflow-hidden lg:h-screen"
    >
      <div className="w-full max-w-5xl">
        {/* Header */}
        <header className="mb-10 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="cursor-pointer rounded-full bg-white p-3 shadow-sm ring-1 ring-slate-100 transition-all hover:bg-gray-50"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft size={24} className="text-[#2D3142]" />
          </motion.button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Filters
          </h1>
          <div className="w-12" />
        </header>

        {/* Top Section: Safe Space Types */}
        <section className="mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#2D3142]">
              Safe Space Types
            </h2>
            <p className="text-sm text-[#7B828A]">
              Choose which safe spaces to include in your map.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            {safeSpaces.map((opt) => (
              <FilterCard
                key={opt.id}
                option={opt}
                isSelected={selectedSafeSpaces.includes(opt.id)}
                onToggle={toggleSafeSpace}
                selectionType="multi"
              />
            ))}
          </div>
        </section>

        {/* Bottom Section: Sensitivity Preferences */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#2D3142]">
              Sensitivity Preferences
            </h2>
            <p className="text-sm text-[#7B828A]">
              Layer extra quietness in your journey.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
            {sensitivities.map((opt) => (
              <FilterCard
                key={opt.id}
                option={opt}
                isSelected={selectedSensitivity === opt.id}
                onToggle={(id) => setSelectedSensitivity(id)}
                selectionType="single"
              />
            ))}
          </div>
        </section>

        {/* Apply Filter Button */}
        <div className="mt-4 flex justify-center pb-12">
          <motion.button
            className="cursor-pointer w-full lg:w-fit lg:px-32 rounded-3xl bg-[#7DB0A6] py-3 text-lg font-medium text-white shadow-lg shadow-[#82AF9F]/20 transition-all hover:bg-[#7DB0A6]/90"
            onClick={handleApplyFilters}
          >
            Apply Filters
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
