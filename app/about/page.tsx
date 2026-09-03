import { aboutContent } from "@/data/portfolioData";
import styles from "./about.module.css";

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <img className={styles.portrait} src={aboutContent.portrait.src} alt={aboutContent.portrait.alt} />
      <section className={styles.copy}>
        <h1>About</h1>
        {aboutContent.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>
    </main>
  );
}
