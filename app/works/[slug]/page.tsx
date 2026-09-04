import { notFound } from "next/navigation";
import { PhotoWall } from "@/components/PhotoWall";
import { events } from "@/data/portfolioData";
import styles from "./project.module.css";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return events.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params;
  const event = events.find((item) => item.slug === slug);
  return {
    title: event ? `${event.title} | sukihouse` : "Work | sukihouse",
    description: event?.description,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const event = events.find((item) => item.slug === slug);

  if (!event) {
    notFound();
  }

  return (
    <main className={styles.page}>
      <section className={styles.intro}>
        <p className={styles.kicker}>SUKIHOUSE</p>
        <h1>{event.title}</h1>
        {event.period ? <p>{event.period}</p> : null}
        {event.description ? <p className={styles.description}>{event.description}</p> : null}
      </section>

      <PhotoWall photographs={event.photographs} />
    </main>
  );
}
