"use client";

import { useEffect, useMemo, useState } from "react";
import type { OverviewImage } from "@/data/portfolioData";
import styles from "./OverviewGallery.module.css";

const SESSION_KEY = "overview-image";
const SESSION_FRAMES_KEY = "overview-image-frames";
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

function shuffleImages(images: OverviewImage[]) {
  return [...images].sort(() => Math.random() - 0.5);
}

function readSessionFrames(images: OverviewImage[]) {
  const byId = new Map(images.map((image) => [image.id, image]));
  const stored = window.sessionStorage.getItem(SESSION_FRAMES_KEY);

  if (stored) {
    const frames = stored
      .split(",")
      .map((id) => byId.get(id))
      .filter((image): image is OverviewImage => Boolean(image));
    if (frames.length) return frames;
  }

  const frames = shuffleImages(images).slice(0, Math.min(INTRO_FRAME_COUNT, images.length));
  window.sessionStorage.setItem(SESSION_FRAMES_KEY, frames.map((image) => image.id).join(","));
  return frames;
}

export function OverviewGallery({ images }: OverviewGalleryProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [selected, setSelected] = useState<OverviewImage | null>(null);
  const [displayed, setDisplayed] = useState<OverviewImage | null>(null);
  const [isIntroRunning, setIsIntroRunning] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const placeholder = useMemo(() => images[0], [images]);

  useEffect(() => {
    if (!hasStarted) return;

    const frames = readSessionFrames(images);
    const finalImage = frames[Math.floor(Math.random() * frames.length)] ?? readSessionImage(images);
    setSelected(finalImage);
    setDisplayed(finalImage);
    setIsFlipped(false);

    if (!finalImage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
  }, [hasStarted, images]);

  if (!hasStarted) {
    return (
      <section className={styles.start} aria-label="Start">
        <button className={styles.startButton} type="button" onClick={() => setHasStarted(true)}>
          <span>hello suki</span>
        </button>
      </section>
    );
  }

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
