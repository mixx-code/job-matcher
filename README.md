This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.


```
job-matcher
├─ eslint.config.mjs
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ public
│  ├─ favicon.ico
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
├─ README.md
├─ src
│  ├─ components
│  │  ├─ AIChat.tsx
│  │  ├─ AlertCard.tsx
│  │  ├─ AlertForm.tsx
│  │  ├─ AuthForm.tsx
│  │  ├─ CardJobs.tsx
│  │  ├─ CustomAuth.tsx
│  │  ├─ CVAnalysisComponent.tsx
│  │  ├─ Dashboard
│  │  │  └─ Header.tsx
│  │  ├─ email-template.tsx
│  │  ├─ Fileupload.tsx
│  │  ├─ JobCard.tsx
│  │  ├─ JobCardAll.tsx
│  │  ├─ JobFilters.tsx
│  │  ├─ Layout.tsx
│  │  ├─ matched-jobs.tsx
│  │  ├─ MatchedJobsList.tsx
│  │  └─ SaveJobCard.tsx
│  ├─ contexts
│  │  └─ AuthContext.tsx
│  ├─ data
│  │  └─ mockData.ts
│  ├─ hooks
│  │  ├─ useAuthSession.ts
│  │  ├─ useCVManagement.ts
│  │  ├─ useFileUpload.ts
│  │  └─ usePDFExtraction.ts
│  ├─ lib
│  │  ├─ analysisService.ts
│  │  ├─ checkDataCv.ts
│  │  ├─ cron-manager.ts
│  │  ├─ cv-text-extractor.ts
│  │  ├─ getSession.ts
│  │  ├─ google-genai.ts
│  │  ├─ init-cron.ts
│  │  ├─ saveJob.ts
│  │  ├─ serverAuth.ts
│  │  ├─ supabase-server-cron.ts
│  │  ├─ supabaseClient.ts
│  │  └─ supabaseServer.ts
│  ├─ pages
│  │  ├─ ai-demo.tsx
│  │  ├─ alerts
│  │  │  ├─ create.tsx
│  │  │  ├─ edit
│  │  │  │  └─ [id].tsx
│  │  │  └─ index.tsx
│  │  ├─ api
│  │  │  ├─ alerts
│  │  │  │  ├─ index.ts
│  │  │  │  └─ [id].ts
│  │  │  ├─ analyze-cv.ts
│  │  │  ├─ auth
│  │  │  │  ├─ login.ts
│  │  │  │  ├─ logout.ts
│  │  │  │  ├─ signup.ts
│  │  │  │  └─ user.ts
│  │  │  ├─ cron
│  │  │  │  ├─ alerts.ts
│  │  │  │  ├─ start.ts
│  │  │  │  └─ stop.ts
│  │  │  ├─ extract-pdf.ts
│  │  │  ├─ find-jobs.ts
│  │  │  ├─ generate.ts
│  │  │  ├─ hello.ts
│  │  │  ├─ jobs
│  │  │  │  ├─ index.ts
│  │  │  │  └─ jobs-terbaru.ts
│  │  │  ├─ protected
│  │  │  │  └─ profile.ts
│  │  │  ├─ public
│  │  │  │  └─ jobs
│  │  │  │     └─ index.ts
│  │  │  ├─ rekomendasi-jobs.ts
│  │  │  ├─ send-to-username.ts
│  │  │  ├─ send.ts
│  │  │  ├─ upload-cv.ts
│  │  │  └─ webhook.ts
│  │  ├─ auth
│  │  │  └─ callback.tsx
│  │  ├─ dashboard.tsx
│  │  ├─ index.tsx
│  │  ├─ jobs
│  │  │  └─ index.tsx
│  │  ├─ login.tsx
│  │  ├─ saved
│  │  │  └─ index.tsx
│  │  ├─ _app.tsx
│  │  └─ _document.tsx
│  ├─ scripts
│  │  └─ setup-webhook.ts
│  ├─ services
│  │  ├─ cvService.ts
│  │  ├─ fileUploadService.ts
│  │  ├─ pdfExtractionService.ts
│  │  └─ saveJobService.ts
│  ├─ styles
│  │  └─ globals.css
│  ├─ types
│  │  ├─ alert.ts
│  │  ├─ cv-analysis.ts
│  │  ├─ google-genai.d.ts
│  │  ├─ job-indo.ts
│  │  ├─ job.ts
│  │  ├─ saveJob.ts
│  │  └─ supabase.ts
│  └─ utils
│     └─ fetchJobs.ts
└─ tsconfig.json

```