import { X } from "lucide-react";

type PopUpProps = {
  onClose: () => void;
  onAllow: () => void | Promise<void>;
};

export function PopUp({ onClose, onAllow }: PopUpProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-[#4A5565] hover:text-[#1E2939]"
          aria-label="Close popup"
        >
          <X size={22} />
        </button>

        <div className="pr-8">
          <h2 className="text-xl font-semibold text-[#1E2939]">
            Enable microphone access
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#4A5565]">
            HushNav uses your microphone to measure surrounding noise levels and
            support quieter navigation.
          </p>
        </div>

        <button
          type="button"
          onClick={onAllow}
          className="mt-6 w-full rounded-2xl bg-[#7DB0A6] px-4 py-3 text-sm font-medium text-white transition hover:opacity-95"
        >
          Allow Microphone
        </button>
      </div>
    </div>
  );
}