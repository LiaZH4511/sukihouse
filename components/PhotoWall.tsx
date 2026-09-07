"use client";

import { useEffect, useState } from "react";
import type { Photograph } from "@/data/portfolioData";
import styles from "./PhotoWall.module.css";

type PhotoWallProps = {
  photographs: Photograph[];
};

export function PhotoWall({ photographs }: PhotoWallProps) {
  const [activePhoto, setActivePhoto] = useState<Photograph | null>(null);

  useEffect(() => {
    if (!activePhoto) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setActivePhoto(null);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [activePhoto]);

  return (
    <>
      <div className={styles.wall}>
        {photographs.map((photo, index) => (
          <figure className={`${styles.figure} ${styles[`figure${(index % 8) + 1}`]}`} key={photo.id}>
            <button className={styles.photoFrame} type="button" onClick={() => setActivePhoto(photo)}>
              <img src={photo.src} alt={photo.alt} />
            </button>
          </figure>
        ))}
      </div>

      {activePhoto ? (
        <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={activePhoto.alt}>
          <button className={styles.backdrop} type="button" aria-label="Close image" onClick={() => setActivePhoto(null)} />
          <figure className={styles.lightboxFigure}>
            <img src={activePhoto.src} alt={activePhoto.alt} />
            <figcaption>
              <button type="button" onClick={() => setActivePhoto(null)}>
                Close
              </button>
            </figcaption>
          </figure>
        </div>
      ) : null}
    </>
  );
}
