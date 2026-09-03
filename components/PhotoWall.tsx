import type { Photograph } from "@/data/portfolioData";
import styles from "./PhotoWall.module.css";

type PhotoWallProps = {
  photographs: Photograph[];
};

export function PhotoWall({ photographs }: PhotoWallProps) {
  return (
    <div className={styles.wall}>
      {photographs.map((photo, index) => (
        <figure className={`${styles.figure} ${styles[`figure${(index % 8) + 1}`]}`} key={photo.id}>
          <div className={styles.photoFrame}>
            <img src={photo.src} alt={photo.alt} />
            <figcaption className={styles.meta}>
              <span>{photo.date}</span>
              <span>{photo.location}</span>
              {photo.note ? <span>{photo.note}</span> : null}
            </figcaption>
          </div>
        </figure>
      ))}
    </div>
  );
}
