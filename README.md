# Photography Portfolio Prototype

Next.js + TypeScript + CSS Modules front-end prototype based on the photography portfolio PRD.

## 运行

```bash
pnpm install
pnpm dev
```

打开：

```text
http://localhost:3000
```

## 可替换内容

- `data/portfolioData.ts` contains the site name, Instagram URL, overview image pool, events, photographs, About text, and contact information.
- `components/OverviewGallery.tsx` keeps the centered random Overview photograph stable in `sessionStorage`.
- `components/Header.tsx` contains the hover/tap Works event menu.
- `components/PhotoWall.tsx` handles image-level date and location metadata on event pages.
