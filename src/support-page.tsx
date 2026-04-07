import { XButton } from './XButton';

export function SupportPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 font-sans">
      <XButton />

  <div className="w-full max-w-sm rounded-[2.5rem] bg-white p-8 shadow-2xl shadow-gray-200/50">
    <div className="flex flex-col items-start gap-4">

      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-[#5A9A8E]">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Breathing Techniques</h2>
          <p className="text-sm text-slate-500">Calm your mind and reduce stress</p>
        </div>
      </div>

      <p className="mt-2 text-[0.95rem] leading-relaxed text-slate-600">
        Use guided breathing exercises to help manage overstimulation and find your calm center.
      </p>

      <button className="mt-4 w-full rounded-2xl bg-[#5A9A8E] py-4 text-lg font-medium text-[#FFFFFF] shadow-lg shadow-[#5A9A8E]/20 transition-all hover:bg-[#4d857a] active:scale-95">
        Start Breathing Exercise
      </button>

    </div>
  </div>
</div>
  );
}
