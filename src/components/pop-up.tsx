import { X } from "lucide-react";
import { ReactNode } from "react";

type PopUpProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string | ReactNode;
  buttonText?: string;
  icon?: ReactNode;
  iconBgColor?: string;
};

export function PopUp({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  buttonText,
  icon,
  iconBgColor,
}: PopUpProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-md px-7">
      <div className="relative w-full max-w-md rounded-3xl bg-white/70 border border-white/80 p-6 shadow-2xl">
        <div className="flex justify-between mb-3">
          {/* Icon slot */}
          {icon && (
            <div
              className={`flex justify-center items-center border border-white/60 ${iconBgColor} w-12 h-12 rounded-full text-white`}
            >
              {icon}
            </div>
          )}
          {/* 'X' button */}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto z-100 text-[#4A5565] hover:text-[#1E2939] cursor-pointer"
            aria-label="Close popup"
          >
            <X size={22} />
          </button>
        </div>
        {/* Title and description slot */}
        <div>
          <h2 className="text-[24px] font-medium text-[#1E2939]">{title}</h2>
          <div className="mt-3 text-sm leading-6 text-[#4A5565]">
            {description}
          </div>
        </div>
        {/* Confirm button slot */}
        <button
          type="button"
          onClick={onConfirm}
          className="cursor-pointer mt-6 w-full rounded-full bg-[#7DB0A6] px-4 py-3 text-md font-medium text-white shadow-lg transition hover:opacity-95"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
