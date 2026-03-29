# Finance Dashboard

A client-side React dashboard for exploring bank CSV files, reviewing income and expenses, and teaching the app custom categorization rules.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages

This project is configured for static hosting with Vite using a relative asset base, which works well on GitHub Pages.

### Simple deployment

```bash
npm install
npm run deploy
```

### Manual deployment

1. Build the site with `npm run build`.
2. Push the contents of `dist/` to your GitHub Pages branch or publish from GitHub Actions.

### Automatic deployment with GitHub Actions

This repo includes a workflow at `.github/workflows/deploy.yml` that deploys on pushes to `main`.

1. Push the repo to GitHub.
2. In GitHub, open `Settings` -> `Pages`.
3. Set the source to `GitHub Actions`.
4. Push to `main` to publish updates.

## Notes

- All CSV parsing happens in the browser.
- Learned category rules are stored in the browser with `localStorage`.
- Imported transaction files are not uploaded to a server.
