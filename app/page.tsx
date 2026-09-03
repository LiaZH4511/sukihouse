import { OverviewGallery } from "@/components/OverviewGallery";
import { overviewImages } from "@/data/portfolioData";
import styles from "./page.module.css";

export default function OverviewPage() {
  return (
    <main className={styles.overview} aria-label="Overview">
      <OverviewGallery images={overviewImages} />
    </main>
  );
}
