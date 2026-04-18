"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type RollingNumberProps = {
  value: number;
  className?: string;
  duration?: number;
  staggerDelay?: number;
  formatOptions?: Intl.NumberFormatOptions;
  locale?: string;
};

type DigitColumnProps = {
  targetDigit: number;
  delay: number;
  duration: number;
};

function StaticCharacter({ character }: { character: string }) {
  return <span className="inline-block">{character}</span>;
}

function DigitColumn({ targetDigit, delay, duration }: DigitColumnProps) {
  const columnRef = useRef<HTMLSpanElement>(null);
  const previousPositionRef = useRef<number | null>(null);

  useEffect(() => {
    const column = columnRef.current;

    if (!column) {
      return;
    }

    const basePosition = 10 + targetDigit;
    const previous = previousPositionRef.current;

    if (previous === null) {
      column.style.transition = "none";
      column.style.transform = `translateY(${-basePosition}em)`;
      previousPositionRef.current = basePosition;
      return;
    }

    const candidates = [basePosition - 10, basePosition, basePosition + 10];
    const nextPosition = candidates.reduce((closest, candidate) =>
      Math.abs(candidate - previous) < Math.abs(closest - previous)
        ? candidate
        : closest,
    );

    previousPositionRef.current = nextPosition;
    column.style.transition = `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;
    column.style.transform = `translateY(${-nextPosition}em)`;
  }, [targetDigit, delay, duration]);

  return (
    <span
      className="relative inline-flex overflow-hidden"
      style={{
        width: "0.6em",
        height: "1em",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
      }}
    >
      <span
        ref={columnRef}
        className="absolute inset-x-0 flex flex-col items-center will-change-transform"
      >
        {Array.from({ length: 30 }, (_, index) => (
          <span
            key={index}
            className="flex h-[1em] items-center justify-center tabular-nums"
          >
            {index % 10}
          </span>
        ))}
      </span>
    </span>
  );
}

export function RollingNumber({
  value,
  className,
  duration = 500,
  staggerDelay = 40,
  formatOptions,
  locale = "en-US",
}: RollingNumberProps) {
  const roundedValue = Math.round(value);
  const formatted = new Intl.NumberFormat(locale, formatOptions).format(
    roundedValue,
  );
  const characters = formatted.split("");
  const digitIndices = characters
    .map((character, index) => (/^\d$/.test(character) ? index : -1))
    .filter((index) => index !== -1);

  return (
    <span className={cn("inline-flex tabular-nums", className)}>
      {characters.map((character, index) => {
        const digitOrder = digitIndices.indexOf(index);

        if (digitOrder === -1) {
          return (
            <StaticCharacter
              key={`${character}-${index}`}
              character={character}
            />
          );
        }

        const targetDigit = Number(character);
        const delay = (digitIndices.length - digitOrder - 1) * staggerDelay;

        return (
          <DigitColumn
            key={index}
            targetDigit={targetDigit}
            delay={delay}
            duration={duration}
          />
        );
      })}
    </span>
  );
}
