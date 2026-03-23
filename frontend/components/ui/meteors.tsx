"use client";

import { useEffect, useState, type CSSProperties } from "react";

interface MeteorsProps {
  number?: number;
  minDelay?: number;
  maxDelay?: number;
  minDuration?: number;
  maxDuration?: number;
  angle?: number;
  className?: string;
}

type MeteorStyle = CSSProperties & {
  "--meteor-angle"?: string;
};

export function Meteors({
  number = 24,
  minDelay = 0.2,
  maxDelay = 1.1,
  minDuration = 2,
  maxDuration = 8,
  angle = 215,
  className = "",
}: MeteorsProps) {
  const [meteorStyles, setMeteorStyles] = useState<MeteorStyle[]>([]);

  useEffect(() => {
    const styles: MeteorStyle[] = [...new Array(number)].map(() => ({
      "--meteor-angle": `${-angle}deg`,
      top: "-8%",
      left: `calc(0% + ${Math.floor(Math.random() * window.innerWidth)}px)`,
      animationDelay: `${Math.random() * (maxDelay - minDelay) + minDelay}s`,
      animationDuration: `${
        Math.floor(Math.random() * (maxDuration - minDuration) + minDuration)
      }s`,
    }));
    setMeteorStyles(styles);
  }, [number, minDelay, maxDelay, minDuration, maxDuration, angle]);

  return (
    <>
      {meteorStyles.map((style, idx) => (
        <span
          key={idx}
          style={style}
          className={`meteor absolute size-0.5 rounded-full ${className}`}
          aria-hidden="true"
        >
          <span className="meteor-tail absolute top-1/2 -z-10 h-px w-14 -translate-y-1/2" />
        </span>
      ))}
    </>
  );
}
