import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { PopUp } from "./components/pop-up";

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
const RECOMMENDED_SENSITIVITY_STORAGE_KEY =
  "hushnav-recommended-sensitivity-filter";
const ROUTE_FILTER_WEIGHTS_STORAGE_KEY = "hushnav-route-filter-weights";

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
    active: "border-[#5A9A8E]/40 bg-[#5A9A8E]/15",
    inactive: "border-white bg-white",
    iconBg: "bg-[#5A9A8E]/15",
    iconStroke: "#5A9A8E",
    indicatorBg: "bg-[#5A9A8E]",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      onClick={() => onToggle(option.id)}
      className={`mb-3 flex w-full cursor-pointer items-center rounded-2xl border p-4 text-left shadow-sm transition-all duration-200 hover:shadow-md ${
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
          className={`text-[16px] font-bold transition-colors ${
            isSelected ? "text-[#2D3142]" : "text-[#7B828A]"
          }`}
        >
          {option.title}
        </h4>

        <p className="text-[13px] leading-tight text-[#7B828A]">
          {option.description}
        </p>
      </div>

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

export default function FilterScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  const forecastSensitivityLocked = Boolean(
    (location.state as { forecastSensitivityLocked?: boolean } | null)
      ?.forecastSensitivityLocked,
  );

  const safeSpaces: FilterOption[] = [
    {
      id: "park",
      title: "Park",
      description: "Outdoor green spaces",
      icon: <TreePine />,
      theme: "sage",
    },
    {
      id: "library",
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
      description: "Reduces exposure to harsh sounds.",
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
    "park",
    "library",
    "museum",
    "church",
    "synagogue",
  ];

  const [selectedSafeSpaces, setSelectedSafeSpaces] = useState<string[]>(() => {
    const storedSafeSpaces = localStorage.getItem(SAFE_SPACES_STORAGE_KEY);

    if (!storedSafeSpaces) {
      return defaultSafeSpaceIds;
    }

    try {
      return JSON.parse(storedSafeSpaces) as string[];
    } catch {
      return defaultSafeSpaceIds;
    }
  });

  const [selectedSensitivity, setSelectedSensitivity] = useState<string>(() => {
    const recommendedSensitivity = localStorage.getItem(
      RECOMMENDED_SENSITIVITY_STORAGE_KEY,
    );

    const previouslySelectedSensitivity = localStorage.getItem(
      SENSITIVITY_STORAGE_KEY,
    );

    return (
      recommendedSensitivity || previouslySelectedSensitivity || "standard"
    );
  });

  const [isSensitivityLockedPopupOpen, setIsSensitivityLockedPopupOpen] =
    useState(false);

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

    const filterWeights = {
      avoidMechanical: selectedSensitivity === "mechanical",
      avoidSocial: selectedSensitivity === "social",
      balanced: selectedSensitivity === "standard",
    };

    localStorage.setItem(
      ROUTE_FILTER_WEIGHTS_STORAGE_KEY,
      JSON.stringify(filterWeights),
    );

    localStorage.removeItem(RECOMMENDED_SENSITIVITY_STORAGE_KEY);

    navigate("/map", {
      state: {
        restoreRoutePreview: true,
        appliedSensitivity: selectedSensitivity,
      },
    });
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 120 }}
      className="fixed inset-0 flex min-h-screen flex-col items-center overflow-y-auto bg-linear-to-b from-[#F0F4F3] via-[#EDF2F1] to-[#EBF0EE] px-6 py-8"
    >
      <div className="w-full max-w-5xl">
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

        <section className="mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#2D3142]">
              Safe Space Types
            </h2>
            <p className="text-sm text-[#7B828A]">
              Choose which safe spaces to include in your map.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-2">
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

        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#2D3142]">
              Sensitivity Preferences
            </h2>
            <p className="text-sm text-[#7B828A]">
              Layer extra quietness in your journey.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-2 lg:grid-cols-3">
            {sensitivities.map((opt) => (
              <FilterCard
                key={opt.id}
                option={opt}
                isSelected={selectedSensitivity === opt.id}
                onToggle={(id) => {
                  if (forecastSensitivityLocked) {
                    setIsSensitivityLockedPopupOpen(true);
                    return;
                  }

                  setSelectedSensitivity(id);
                }}
                selectionType="single"
              />
            ))}
          </div>

          {forecastSensitivityLocked && (
            <p className="mt-2 text-xs text-[#7B828A]">
              Sensitivity preferences are locked while departure forecasting is
              active.
            </p>
          )}
        </section>

        <div className="mt-4 flex justify-center pb-12">
          <motion.button
            className="w-full cursor-pointer rounded-3xl bg-[#7DB0A6] py-3 text-lg font-medium text-white shadow-lg shadow-[#82AF9F]/20 transition-all hover:bg-[#7DB0A6]/90 lg:w-fit lg:px-32"
            onClick={handleApplyFilters}
          >
            Apply Filters
          </motion.button>
        </div>
      </div>

      <PopUp
        isOpen={isSensitivityLockedPopupOpen}
        onClose={() => setIsSensitivityLockedPopupOpen(false)}
        onConfirm={() => setIsSensitivityLockedPopupOpen(false)}
        title="Sensitivity Locked During Forecast"
        description="Safe space filters can still be changed. To edit sensitivity preferences, set departure back to Now first."
        buttonText="Got it"
        icon={<Settings2 size={24} />}
        iconBgColor="bg-[#C9A882]/60"
      />
    </motion.div>
  );
}
