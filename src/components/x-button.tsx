import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

interface XButtonProps {
  className?: string;
  onClose?: () => void;
}

export function XButton({ className = "", onClose }: XButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClose) {
      onClose();
    } else {
      // navigate to the previous page
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
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
      aria-label="Close"
    >
      <X size={24} strokeWidth={2.5} />
    </button>
  );
}
