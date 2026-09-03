import { contactInfo, siteInfo } from "@/data/portfolioData";
import styles from "./contact.module.css";

export default function ContactPage() {
  return (
    <main className={styles.page}>
      <section className={styles.copy}>
        <h1>Contact</h1>
        <span>{contactInfo.name}</span>
        <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
        <a href={siteInfo.instagramUrl} target="_blank" rel="noreferrer">
          Instagram ↗
        </a>
        <span>{contactInfo.location}</span>
        <p>{contactInfo.availability}</p>
      </section>
      <img className={styles.image} src={contactInfo.image.src} alt={contactInfo.image.alt} />
    </main>
  );
}
