import Link from "next/link";
import { events, overviewImages } from "@/data/portfolioData";
import styles from "./page.module.css";

export default function OverviewPage() {
  const coverImages = overviewImages.slice(0, 12);

  return (
    <main className={styles.overview} aria-label="The Flowing Green overview">
      <section className={styles.hero}>
        <div className={styles.titleBlock}>
          <p>THE FLOWING GREEN</p>
          <h1>Kansai of Japan</h1>
          <span>Be in Kyoto</span>
        </div>

        <div className={styles.zineGrid} aria-label="Selected zine pages">
          {coverImages.map((image, index) => (
            <Link
              className={`${styles.tile} ${styles[`tile${(index % 8) + 1}`]}`}
              href={`/works/${image.associatedEvent}`}
              key={image.id}
            >
              <img src={image.src} alt={image.alt} />
              <span>{String(index + 21).padStart(2, "0")}</span>
            </Link>
          ))}
        </div>

        <nav className={styles.projectLinks} aria-label="Projects">
          {events.map((event, index) => (
            <Link href={`/works/${event.slug}`} key={event.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {event.title}
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}
