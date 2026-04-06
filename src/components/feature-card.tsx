interface Props {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureCard(props: Props) {
  return (
    <div className="flex gap-2 bg-white/60 border border-white/50 rounded-2xl p-5 mt-4 w-80">
      {/* Icon Container */}
      <div className="shrink-0 flex justify-center items-center bg-[#E8F3F1] rounded-xl w-11 h-11">
        {props.icon}
      </div>

      {/* Text */}
      <div className="flex flex-col">
        <h3 className="font-medium text-[16px]">{props.title}</h3>
        <p className="text-[#4A5565] text-[14px]">{props.description}</p>
      </div>
    </div>
  );
}
