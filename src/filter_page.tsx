import React, { useState } from 'react';
import { ChevronLeft, Trees, Library, Church, Building2, Settings2, Users, Check } from 'lucide-react';

// theme types for consistent styling across filter cards
type Theme = 'sage' | 'tan';

interface FilterOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  theme: Theme;
}

// filter card component that represents each filter option with its own styling based on the theme and selection state
const FilterCard = ({ 
  option, 
  isSelected, 
  onToggle 
}: { 
  option: FilterOption; 
  isSelected: boolean; 
  onToggle: (id: string) => void 
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
      className={`mb-3 flex w-full items-center rounded-2xl border p-4 transition-all duration-200 text-left shadow-sm ${
        isSelected ? currentTheme.active : currentTheme.inactive
      }`}
    >
      <div className={`mr-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
        isSelected ? currentTheme.iconBg : 'bg-[#E9EDF0]'
      }`}>
        {React.cloneElement(option.icon as React.ReactElement, { 
          stroke: isSelected ? currentTheme.iconStroke : '#A0AAB3',
          size: 20 
        })}
      </div>
      
      <div className="flex-1">
        <h4 className={`text-[17px] font-semibold transition-colors ${isSelected ? 'text-[#2D3142]' : 'text-[#7B828A]'}`}>
          {option.title}
        </h4>
        <p className="text-[14px] leading-tight text-[#7B828A]">
          {option.description}
        </p>
      </div>

      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all ${
        isSelected ? currentTheme.checkBg : 'border border-[#D1D5DB]'
      }`}>
        {isSelected && <Check size={14} strokeWidth={4} className="text-white" />}
      </div>
    </button>
  );
};

// main filter screen component that manages the state of selected filters and renders the UI for both safe space types and sensitivity preferences, along with a header and a bottom CTA button to apply the filters
export default function FilterScreen() {

  const safeSpaces: FilterOption[] = [
    { id: 'parks', title: 'Parks', description: 'Outdoor green spaces', icon: <Trees />, theme: 'sage' },
    { id: 'libraries', title: 'Libraries', description: 'Quiet reading spaces', icon: <Library />, theme: 'sage' },
    { id: 'church', title: 'Church', description: 'Calm Spiritual Areas', icon: <Church />, theme: 'sage' },
    { id: 'art-gallery', title: 'Art Gallery/Museum', description: 'Calm Artistic Environments', icon: <Building2 />, theme: 'sage' },
  ];

  const sensitivities: FilterOption[] = [
    { id: 'mechanical', title: 'Mechanical Sounds', description: 'Reduces exposure to harsh sounds', icon: <Settings2 />, theme: 'tan' },
    { id: 'social', title: 'Social Noise', description: 'Avoid busy areas and chatters.', icon: <Users />, theme: 'tan' },
  ];

  // initially all filters are selected, but this can be adjusted based on user preferences or defaults
  const [selectedIds, setSelectedIds] = useState<string[]>([
    'parks', 'libraries', 'church', 'art-gallery', 'mechanical', 'social'
  ]);

  const toggleFilter = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans text-[#2D3142]">
      <div className="mx-auto max-w-md">
        
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <button className="rounded-full bg-white p-3 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all hover:bg-gray-50 active:scale-95">
            <ChevronLeft size={24} className="text-[#2D3142]" />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">Filters</h1>
          <div className="w-10" />
        </header>

        {/* Safe Spaces Section */}
        <section className="mb-8">
          <h2 className="mb-1 text-[19px] font-bold text-[#2D3142]">Safe Space Types</h2>
          <p className="mb-6 text-[#7B828A]">Choose which safe spaces to include in your map.</p>
          {safeSpaces.map(opt => (
            <FilterCard 
              key={opt.id} 
              option={opt} 
              isSelected={selectedIds.includes(opt.id)} 
              onToggle={toggleFilter} 
            />
          ))}
        </section>

        {/* Sensitivity Section */}
        <section className="mb-24">
          <h2 className="mb-1 text-[19px] font-bold text-[#2D3142]">Sensitivity Preferences</h2>
          <p className="mb-6 text-[#7B828A]">Layer extra quietness in your journey.</p>
          {sensitivities.map(opt => (
            <FilterCard 
              key={opt.id} 
              option={opt} 
              isSelected={selectedIds.includes(opt.id)} 
              onToggle={toggleFilter} 
            />
          ))}
        </section>

        {/* Bottom CTA */}
        <div className="fixed bottom-8 left-0 right-0 mx-auto max-w-md px-6">
          <button 
            className="w-full rounded-[28px] bg-[#82AF9F] py-[22px] text-lg font-bold text-white shadow-[0_8px_20px_rgba(130,175,159,0.3)] transition-all active:scale-[0.98] hover:bg-[#749f90]"
            onClick={() => console.log("Applied:", selectedIds)}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}