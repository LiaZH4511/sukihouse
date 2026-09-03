"use client";

import { useEffect, useMemo, useState } from "react";
import type { OverviewImage } from "@/data/portfolioData";
import styles from "./OverviewGallery.module.css";

const SESSION_KEY = "overview-image";
const INTRO_FRAME_COUNT = 10;
const INTRO_FRAME_DELAYS = [34, 38, 43, 50, 60, 74, 92, 114, 142, 176, 218, 268, 326, 392, 466, 540];

type OverviewGalleryProps = {
  images: OverviewImage[];
};

function readSessionImage(images: OverviewImage[]) {
  const byId = new Map(images.map((image) => [image.id, image]));
  const stored = window.sessionStorage.getItem(SESSION_KEY);

  if (stored) {
    const selected = byId.get(stored);
    if (selected) return selected;
    window.sessionStorage.removeItem(SESSION_KEY);
  }

  const selected = images[Math.floor(Math.random() * images.length)] ?? images[0];
  if (selected) window.sessionStorage.setItem(SESSION_KEY, selected.id);
  return selected;
}

export function OverviewGallery({ images }: OverviewGalleryProps) {
  const [selected, setSelected] = useState<OverviewImage | null>(null);
  const [displayed, setDisplayed] = useState<OverviewImage | null>(null);
  const [isIntroRunning, setIsIntroRunning] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const placeholder = useMemo(() => images[0], [images]);

  useEffect(() => {
    const finalImage = readSessionImage(images);
    setSelected(finalImage);
    setDisplayed(finalImage);
    setIsFlipped(false);

    if (!finalImage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const frames = Array.from(
      { length: Math.min(INTRO_FRAME_COUNT, images.length) },
      (_, index) => images[index],
    );
    let frameIndex = 0;
    let timer: number | undefined;
    setIsIntroRunning(true);
    setDisplayed(frames[frameIndex]);

    const showNextFrame = () => {
      frameIndex += 1;

      if (frameIndex >= frames.length) {
        setDisplayed(finalImage);
        setIsIntroRunning(false);
        return;
      }

      setDisplayed(frames[frameIndex]);
      timer = window.setTimeout(showNextFrame, INTRO_FRAME_DELAYS[frameIndex] ?? 540);
    };

    timer = window.setTimeout(showNextFrame, INTRO_FRAME_DELAYS[0]);

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [images]);

  const visibleImage = displayed ?? selected ?? placeholder;

  return (
    <section className={styles.gallery} aria-label="Curated overview photograph">
      {visibleImage ? (
        <button
          className={`${styles.photoButton} ${styles[visibleImage.orientation]} ${isFlipped ? styles.flipped : ""} ${
            isIntroRunning ? styles.introRunning : ""
          }`}
          type="button"
          aria-label={`${isFlipped ? "Hide" : "Reveal"} date and location for ${visibleImage.alt}`}
          aria-pressed={isFlipped}
          onClick={() => {
            if (!isIntroRunning) setIsFlipped((current) => !current);
          }}
        >
          <span className={styles.card}>
            <span className={styles.front}>
              <img src={visibleImage.src} alt={visibleImage.alt} />
            </span>
            <span className={styles.back}>
              <span>{visibleImage.date}</span>
              <span>{visibleImage.location}</span>
            </span>
          </span>
        </button>
      ) : null}
    </section>
  );
}
