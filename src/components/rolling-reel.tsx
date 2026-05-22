import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";

interface RollingReelProps {
  target: string | number;
}

export function RollingReel({ target }: RollingReelProps) {
  const [displayValue, setDisplayValue] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (isInView) {
      const targetStr = String(target);
      // If it's not a number (like symbols or text), immediately display it flat
      if (isNaN(Number(targetStr))) {
        setDisplayValue(targetStr);
        return;
      }

      const finalDigit = Number(targetStr);
      let step = 0;
      const totalSpins = 12; // How many times it cycles through digits before stopping
      const intervalTime = 50; // Fast spin updates every 50ms

      const timer = setInterval(() => {
        step++;

        if (step >= totalSpins) {
          clearInterval(timer);
          setDisplayValue(String(finalDigit)); // Snap directly to your final number
        } else {
          // Cycle rapidly through 0-9 random or sequential digits
          const fakeDigit = Math.floor(Math.random() * 10);
          setDisplayValue(String(fakeDigit));
        }
      }, intervalTime);

      return () => clearInterval(timer);
    }
  }, [isInView, target]);

  return (
    <span
      ref={ref}
      className="tabular-nums font-bold text-4xl lg:text-5xl text-[#5A9A8E]"
    >
      {displayValue}
    </span>
  );
}
