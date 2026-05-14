import { CheckCircle2, Download, UserRound } from "lucide-react";

type QuizIntroProps = {
  onStart: () => void;
};

export default function QuizIntro({ onStart }: QuizIntroProps) {
  return (
    <div className="min-h-screen bg-[#EAF5F2] px-5 py-10 text-slate-800">
      <div className="mx-auto flex max-w-md flex-col items-center">
        {/* Large circular profile icon shown at the top of the Figma screen */}
        <div className="mb-8 mt-10 flex h-28 w-28 items-center justify-center rounded-full bg-[#72AEA5] shadow-xl">
          <UserRound className="h-14 w-14 text-white" strokeWidth={2.5} />
        </div>

        {/* Main intro card */}
        <section className="w-full rounded-[28px] bg-white/90 p-6 shadow-2xl">
          <h1 className="mb-5 text-2xl font-semibold leading-tight text-slate-800">
            Discover Your Sensitivity Profile
          </h1>

          <h2 className="mb-4 text-base font-semibold text-slate-800">What you’ll get:</h2>

          <div className="space-y-4">
            <FeatureRow
              icon={<CheckCircle2 className="h-5 w-5 text-[#5A9A8E]" />}
              title="Personalized Profile"
              description="Understand your sensitivity type and what it means"
            />

            <FeatureRow
              icon={<CheckCircle2 className="h-5 w-5 text-[#5A9A8E]" />}
              title="Smart Filter Recommendations"
              description="Suggested settings tailored to your needs"
            />

            <FeatureRow
              icon={<Download className="h-5 w-5 text-[#5A9A8E]" />}
              title="Downloadable Results"
              description="Share your profile with friends or healthcare providers"
            />
          </div>

          {/* Small statistics cards */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-2xl font-medium text-[#5A9A8E]">5</p>
              <p className="mt-1 text-sm text-slate-600">Questions</p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-2xl font-medium text-[#5A9A8E]">2 min</p>
              <p className="mt-1 text-sm text-slate-600">To complete</p>
            </div>
          </div>

          {/* Privacy note from the Figma */}
          <div className="mt-5 rounded-2xl border border-[#B9DCD6] bg-[#EAF5F2] p-4 text-sm text-slate-600">
            <strong className="text-slate-700">Your privacy matters.</strong> All responses are processed locally and
            never stored or shared.
          </div>
        </section>

        <button
          type="button"
          onClick={onStart}
          className="mt-6 w-full rounded-2xl bg-[#5A9A8E] px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-[#4E8B80]"
        >
          Start Self Discovery
        </button>
      </div>
    </div>
  );
}

type FeatureRowProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function FeatureRow({ icon, title, description }: FeatureRowProps) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DDF0EC]">{icon}</div>

      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-sm leading-snug text-slate-600">{description}</p>
      </div>
    </div>
  );
}