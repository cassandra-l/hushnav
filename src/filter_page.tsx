import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TreePine, Book, Church, Landmark, Building2, Settings2, Users, Check } from 'lucide-react';

// theme types for consistent styling across filter cards
type Theme = 'sage' | 'tan';

interface FilterOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  theme: Theme;
}

type SelectionType = 'multi' | 'single';
const SAFE_SPACES_STORAGE_KEY = 'hushnav:selectedSafeSpaces';
const SENSITIVITY_STORAGE_KEY = 'hushnav:selectedSensitivity';

// filter card component that represents each filter option with its own styling based on the theme and selection state
const FilterCard = ({ 
  option, 
  isSelected, 
  onToggle,
  selectionType = 'multi'
}: { 
  option: FilterOption; 
  isSelected: boolean; 
  onToggle: (id: string) => void;
  selectionType?: SelectionType;
}) => {
  const themes = {
    sage: {
      active: 'border-[#D5E6E1] bg-[#E8F2F0]',
      inactive: 'border-white bg-white',
      iconBg: 'bg-[#D5E6E1]',
      iconStroke: '#7BA89C',
      checkBg: 'bg-[#7BA89C]'
    },
    tan: {
      active: 'border-[#F2E8DB] bg-[#F9F4EE]',
      inactive: 'border-white bg-white',
      iconBg: 'bg-[#EFE3D4]',
      iconStroke: '#D4A373',
      checkBg: 'bg-[#DBBEA1]'
    }
  };

  const currentTheme = themes[option.theme];

  return (
    <button
      onClick={() => onToggle(option.id)}
      className={`mb-2 flex w-full items-center rounded-2xl border p-3 transition-all duration-200 text-left shadow-sm ${
        isSelected ? currentTheme.active : currentTheme.inactive
      }`}
    >
      <div className={`mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
        isSelected ? currentTheme.iconBg : 'bg-[#E9EDF0]'
      }`}>
        {React.cloneElement(option.icon as React.ReactElement, { 
          stroke: isSelected ? currentTheme.iconStroke : '#A0AAB3',
          size: 18
        })}
      </div>
      
      <div className="flex-1">
        <h4 className={`text-[16px] font-semibold transition-colors ${isSelected ? 'text-[#2D3142]' : 'text-[#7B828A]'}`}>
          {option.title}
        </h4>
        <p className="text-[13px] leading-tight text-[#7B828A]">
          {option.description}
        </p>
      </div>

      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all ${
        isSelected ? currentTheme.checkBg : 'border border-[#D1D5DB]'
      }`}>
        {isSelected ? (
          <Check size={14} strokeWidth={4} className="text-white" />
        ) : (
          selectionType === 'single' && <div className="h-2.5 w-2.5 rounded-full bg-transparent" />
        )}
      </div>
    </button>
  );
};

// main filter screen component that manages the state of selected filters and renders the UI for both safe space types and sensitivity preferences, along with a header and a bottom CTA button to apply the filters
export default function FilterScreen() {
  const navigate = useNavigate();

  const safeSpaces: FilterOption[] = [
    { id: 'parks', title: 'Park', description: 'Outdoor green spaces', icon: <TreePine />, theme: 'sage' },
    { id: 'libraries', title: 'Library', description: 'Quiet reading spaces', icon: <Book />, theme: 'sage' },
    { id: 'museum', title: 'Museum', description: 'Calm artistic environments', icon: <Landmark />, theme: 'sage' },
    { id: 'church', title: 'Church', description: 'Calm spiritual space', icon: <Church />, theme: 'sage' },
    { id: 'synagogue', title: 'Synagogue', description: 'Quiet spiritual space', icon: <Building2 />, theme: 'sage' },
  ];

  const sensitivities: FilterOption[] = [
    { id: 'standard', title: 'Standard Sensitivity', description: 'Considers both mechanical and social noise.', icon: <Settings2 />, theme: 'tan' },
    { id: 'mechanical', title: 'Mechanical Sounds', description: 'Reduces exposure to harsh sounds', icon: <Settings2 />, theme: 'tan' },
    { id: 'social', title: 'Social Noise', description: 'Avoid busy areas and chatters.', icon: <Users />, theme: 'tan' },
  ];

  const defaultSafeSpaceIds = ['parks', 'libraries', 'museum', 'church', 'synagogue'];
  const validSafeSpaceIds = safeSpaces.map((option) => option.id);
  const validSensitivityIds = sensitivities.map((option) => option.id);

  const [selectedSafeSpaces, setSelectedSafeSpaces] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(SAFE_SPACES_STORAGE_KEY);
      if (!raw) return defaultSafeSpaceIds;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return defaultSafeSpaceIds;

      const cleaned = parsed.filter(
        (id: unknown): id is string => typeof id === 'string' && validSafeSpaceIds.includes(id)
      );
      return cleaned.length > 0 ? cleaned : defaultSafeSpaceIds;
    } catch {
      return defaultSafeSpaceIds;
    }
  });

  const [selectedSensitivity, setSelectedSensitivity] = useState<string>(() => {
    try {
      const raw = localStorage.getItem(SENSITIVITY_STORAGE_KEY);
      if (!raw) return 'standard';
      return validSensitivityIds.includes(raw) ? raw : 'standard';
    } catch {
      return 'standard';
    }
  });

  const toggleSafeSpace = (id: string) => {
    setSelectedSafeSpaces((prev: string[]) =>
      prev.includes(id) ? prev.filter((item: string) => item !== id) : [...prev, id]
    );
  };

  const selectSensitivity = (id: string) => {
    setSelectedSensitivity(id);
  };

  const handleApplyFilters = () => {
    localStorage.setItem(SAFE_SPACES_STORAGE_KEY, JSON.stringify(selectedSafeSpaces));
    localStorage.setItem(SENSITIVITY_STORAGE_KEY, selectedSensitivity);
    navigate("/map", { state: { restoreRoutePreview: true } });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans text-[#2D3142] flex flex-col">
      <div className="mx-auto max-w-md w-full">
        
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <button
            className="rounded-full bg-white p-3 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all hover:bg-gray-50 active:scale-95"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft size={24} className="text-[#2D3142]" />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">Filters</h1>
          <div className="w-10" />
        </header>

        {/* Safe Spaces Section */}
        <section className="mb-5">
          <h2 className="mb-1 text-[19px] font-bold text-[#2D3142]">Safe Space Types</h2>
          <p className="mb-4 text-[#7B828A]">Choose which safe spaces to include in your map.</p>
          {safeSpaces.map(opt => (
            <FilterCard 
              key={opt.id} 
              option={opt} 
              isSelected={selectedSafeSpaces.includes(opt.id)} 
              onToggle={toggleSafeSpace} 
            />
          ))}
        </section>

        {/* Sensitivity Section */}
        <section className="mb-4">
          <h2 className="mb-1 text-[19px] font-bold text-[#2D3142]">Sensitivity Preferences</h2>
          <p className="mb-4 text-[#7B828A]">Layer extra quietness in your journey.</p>
          {sensitivities.map(opt => (
            <FilterCard 
              key={opt.id} 
              option={opt} 
              isSelected={selectedSensitivity === opt.id}
              onToggle={selectSensitivity}
              selectionType="single"
            />
          ))}
        </section>

        {/* Bottom CTA */}
        <div className="mt-2 pb-2">
          <button 
            className="w-full rounded-[28px] bg-[#82AF9F] py-[18px] text-lg font-bold text-white shadow-[0_8px_20px_rgba(130,175,159,0.3)] transition-all active:scale-[0.98] hover:bg-[#749f90]"
            onClick={handleApplyFilters}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}