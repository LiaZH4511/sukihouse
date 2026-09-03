"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { events, siteInfo } from "@/data/portfolioData";
import styles from "./Header.module.css";

export function Header() {
  const [isWorksOpen, setIsWorksOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openWorks() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setIsWorksOpen(true);
  }

  function delayCloseWorks() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setIsWorksOpen(false), 180);
  }

  return (
    <header className={styles.header}>
      <Link className={styles.title} href="/" aria-label="Return to overview">
        {siteInfo.name}
      </Link>

      <nav className={styles.nav} aria-label="Primary navigation">
        <div className={styles.worksWrap} onMouseEnter={openWorks} onMouseLeave={delayCloseWorks}>
          <button
            className={styles.navButton}
            type="button"
            aria-expanded={isWorksOpen}
            aria-controls="works-menu"
            onClick={() => setIsWorksOpen((current) => !current)}
            onFocus={openWorks}
            onKeyDown={(event) => {
              if (event.key === "Escape") setIsWorksOpen(false);
            }}
          >
            Works
          </button>

          <div className={`${styles.worksMenu} ${isWorksOpen ? styles.open : ""}`} id="works-menu">
            {events.map((event) => (
              <Link href={`/works/${event.slug}`} key={event.id} onClick={() => setIsWorksOpen(false)}>
                {event.title}
              </Link>
            ))}
          </div>
        </div>

        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
      </nav>

      <a className={styles.instagram} href={siteInfo.instagramUrl} target="_blank" rel="noreferrer">
        Instagram ↗
      </a>
    </header>
  );
}
