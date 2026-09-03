import Link from "next/link";
import { events } from "@/data/portfolioData";
import styles from "./works.module.css";

export default function WorksPage() {
  return (
    <main className={styles.page}>
      <h1>Works</h1>
      <div className={styles.projectList}>
        {events.map((event) => (
          <Link className={styles.project} href={`/works/${event.slug}`} key={event.id}>
            <img src={event.cover} alt={event.title} />
            <span>{event.title}</span>
            {event.period ? <small>{event.period}</small> : null}
          </Link>
        ))}
      </div>
    </main>
  );
}
