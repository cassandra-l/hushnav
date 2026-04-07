import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

interface XButtonProps {
  className?: string;
}

export function XButton({ className = "" }: XButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/")}
      type="button"
      className={`
        fixed top-6 right-6 z-50 
        flex h-12 w-12 items-center justify-center 
        rounded-full shadow-sm backdrop-blur-sm transition-all 
        bg-white/60 border border-white/50 
        text-[#5A9A8E] 
        hover:bg-white/80 active:scale-95 
        ${className}
      `}
      aria-label="Back to home"
    >
      <X size={24} strokeWidth={2.5} />
    </button>
  );
}