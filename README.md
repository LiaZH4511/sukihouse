# sukihouse

Personal photography portfolio by Yuhan Zhang.

[sukiyourown.com](https://www.sukiyourown.com/)

## Overview

`sukihouse` is a quiet web zine built from selected photographs across three movements:

- **The Rise** - An island in March, early spring in April, before leaving had a name.
- **The Bloom** - Graduation season, spring light, and the soft noise of almost goodbye.
- **The Summer** - July, green and bright, already slipping into memory.

The site is designed as a compact editorial portfolio: a first-entry welcome screen, a random homepage photograph, a Works index, individual project photo walls, and About / Contact pages.

## Live Site

- Website: [https://www.sukiyourown.com/](https://www.sukiyourown.com/)
- Instagram: [@ikus_nuo.jpeg](https://www.instagram.com/ikus_nuo.jpeg/)
- Contact: [liaynzhang@gmail.com](mailto:liaynzhang@gmail.com)

## Tech Stack

- Next.js
- React
- TypeScript
- CSS Modules
- Static export

## Project Structure

```text
app/                    Route pages and page-level styles
components/             Shared navigation, homepage gallery, and photo wall
data/                   Portfolio metadata and selected photo manifest
public/portfolio/       Web-ready portfolio images
.openai/hosting.json    Sites deployment configuration
```

## Local Development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

To create a production static build:

```bash
pnpm build
```

## Content Notes

Original photographs are not stored here. This repository contains web-ready display copies for the portfolio site.

All photographs, writing, and visual sequencing are by Yuhan Zhang. Please do not reuse images or text without permission.
