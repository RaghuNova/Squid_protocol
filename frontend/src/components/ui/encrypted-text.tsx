import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";

export type EncryptedTextSegment = {
  text: string;
  className?: string;
  revealedClassName?: string;
  encryptedClassName?: string;
};

export type EncryptedTextProps = {
  /** Single string text to encrypt and reveal */
  text?: string;
  /** Optional array of styled segments for multi-color or gradient text */
  segments?: EncryptedTextSegment[];
  className?: string;
  /**
   * Time in milliseconds between revealing each subsequent real character.
   * Lower is faster. Defaults to 60ms per character.
   */
  revealDelayMs?: number;
  /** Optional custom character set to use for the cipher effect. */
  charset?: string;
  /**
   * Time in milliseconds between cipher flips for unrevealed characters.
   * Lower is more jittery. Defaults to 45ms.
   */
  flipDelayMs?: number;
  /** CSS class for styling the encrypted/scrambled characters */
  encryptedClassName?: string;
  /** CSS class for styling the revealed characters */
  revealedClassName?: string;
  /** Optional callback fired when the encrypted text finishes resolving */
  onComplete?: () => void;
};

// High-tech cryptographic cipher character set fitting Squid Game & cyber aesthetics
const CIPHER_CHARSET =
  "0123456789ABCDEF#$§%&ΞΨΩΔΦX#*<>+~";

function generateRandomCharacter(charset: string): string {
  const index = Math.floor(Math.random() * charset.length);
  return charset.charAt(index);
}

function generateGibberishPreservingSpaces(
  original: string,
  charset: string,
): string {
  if (!original) return "";
  let result = "";
  for (let i = 0; i < original.length; i += 1) {
    const ch = original[i];
    result += ch === " " ? " " : generateRandomCharacter(charset);
  }
  return result;
}

export const EncryptedText: React.FC<EncryptedTextProps> = ({
  text,
  segments,
  className,
  revealDelayMs = 60,
  charset = CIPHER_CHARSET,
  flipDelayMs = 45,
  encryptedClassName,
  revealedClassName,
  onComplete,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  // Derive resolved segments and full text
  const resolvedSegments: EncryptedTextSegment[] = React.useMemo(() => {
    if (segments && segments.length > 0) {
      return segments;
    }
    return [{ text: text ?? "" }];
  }, [segments, text]);

  const fullText = React.useMemo(
    () => resolvedSegments.map((s) => s.text).join(""),
    [resolvedSegments],
  );

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [revealCount, setRevealCount] = useState<number>(() =>
    prefersReducedMotion ? fullText.length : 0,
  );
  const [isResolved, setIsResolved] = useState<boolean>(() => Boolean(prefersReducedMotion));

  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastFlipTimeRef = useRef<number>(0);
  const scrambleCharsRef = useRef<string[]>(
    fullText
      ? generateGibberishPreservingSpaces(fullText, charset).split("")
      : [],
  );

  useEffect(() => {
    if (!isInView) return;

    if (prefersReducedMotion) {
      setRevealCount(fullText.length);
      setIsResolved(true);
      onComplete?.();
      return;
    }

    const totalLength = fullText.length;
    const initial = fullText
      ? generateGibberishPreservingSpaces(fullText, charset)
      : "";
    scrambleCharsRef.current = initial.split("");
    startTimeRef.current = performance.now();
    lastFlipTimeRef.current = startTimeRef.current;
    setRevealCount(0);
    setIsResolved(false);

    let isCancelled = false;

    const update = (now: number) => {
      if (isCancelled) return;

      const elapsedMs = now - startTimeRef.current;
      const currentRevealCount = Math.min(
        totalLength,
        Math.floor(elapsedMs / Math.max(1, revealDelayMs)),
      );

      setRevealCount(currentRevealCount);

      if (currentRevealCount >= totalLength) {
        setIsResolved(true);
        onComplete?.();
        return;
      }

      // Re-randomize unrevealed scramble characters on a controlled interval
      const timeSinceLastFlip = now - lastFlipTimeRef.current;
      if (timeSinceLastFlip >= Math.max(0, flipDelayMs)) {
        for (let index = 0; index < totalLength; index += 1) {
          if (index >= currentRevealCount) {
            if (fullText[index] !== " ") {
              scrambleCharsRef.current[index] =
                generateRandomCharacter(charset);
            } else {
              scrambleCharsRef.current[index] = " ";
            }
          }
        }
        lastFlipTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);

    return () => {
      isCancelled = true;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    isInView,
    fullText,
    revealDelayMs,
    charset,
    flipDelayMs,
    prefersReducedMotion,
    onComplete,
  ]);

  if (!fullText) return null;

  // Once fully resolved, render the exact original static layout directly
  if (isResolved) {
    return (
      <span
        ref={ref}
        className={cn("inline-block", className)}
        aria-label={fullText}
        role="text"
      >
        {resolvedSegments.map((segment, segIdx) => (
          <span
            key={segIdx}
            className={cn(segment.className, segment.revealedClassName)}
          >
            {segment.text}
          </span>
        ))}
      </span>
    );
  }

  // During animation: Use Fixed-Width Character Slot Architecture
  // This guarantees 100.0% zero layout shift, preserving document flow dimensions
  let runningCharIndex = 0;

  return (
    <motion.span
      ref={ref}
      className={cn("inline-block", className)}
      aria-label={fullText}
      role="text"
    >
      {resolvedSegments.map((segment, segIdx) => {
        const segStart = runningCharIndex;
        runningCharIndex += segment.text.length;

        return (
          <span key={segIdx} className={cn(segment.className)}>
            {segment.text.split("").map((char, charIdx) => {
              const globalIndex = segStart + charIdx;
              const isRevealed = globalIndex < revealCount;

              // Space character: preserve exact layout space without slots
              if (char === " ") {
                return (
                  <span key={charIdx} className="inline-block whitespace-pre">
                    {" "}
                  </span>
                );
              }

              const displayChar = isRevealed
                ? char
                : (scrambleCharsRef.current[globalIndex] ??
                  generateRandomCharacter(charset));

              // Character Slot Architecture:
              // - Invisible ghost character reserves EXACT glyph bounding box, width, height, line-height & baseline
              // - Animated character overlay is positioned absolutely inside the rigid slot
              return (
                <span
                  key={charIdx}
                  className="relative inline-block overflow-visible align-baseline select-none"
                  aria-hidden="true"
                >
                  {/* Ghost real character: pins slot dimensions */}
                  <span className="invisible select-none pointer-events-none" aria-hidden="true">
                    {char}
                  </span>
                  {/* Active animated character overlay */}
                  <span
                    className={cn(
                      "absolute inset-0 flex items-center justify-center pointer-events-none",
                      isRevealed
                        ? (segment.revealedClassName ?? revealedClassName)
                        : (segment.encryptedClassName ?? encryptedClassName),
                    )}
                    aria-hidden="true"
                  >
                    {displayChar}
                  </span>
                </span>
              );
            })}
          </span>
        );
      })}
    </motion.span>
  );
};
