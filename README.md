# TabBlast — Multi-Tab Opener

A clean, modern tool to open any URL in multiple browser tabs with smart random delays to prevent crashes.

**[Live Demo →](https://your-username.github.io/tabblast)**

---

## Features

- 🔗 Paste any URL and open it in up to **20 tabs**
- ⏱ **Random 1–5 second delay** between tabs to prevent browser overload
- 📊 **Live progress bar** — "Opening 5/20 tabs"
- ⏹ **Stop button** — cancel mid-sequence instantly
- ✅ URL validation with helpful error messages
- 📋 Clipboard paste button
- 📱 Fully **mobile responsive**
- 🌑 Modern dark UI

## Ad Placeholders

Three ad zones are included (easy to swap with real ad code):
- **Top Banner** — 728×90 leaderboard
- **Middle Ad** — 468×60 between inputs and button
- **Sticky Bottom** — 320×50 fixed footer

To activate Google AdSense, replace the placeholder `<div class="ad-placeholder">` blocks in `index.html` with your `<ins class="adsbygoogle">` tags.

## Deploy to GitHub Pages

1. Fork or clone this repo
2. Push to your GitHub account
3. Go to **Settings → Pages**
4. Set source to **`/ (root)`** on the `main` branch
5. Visit `https://your-username.github.io/repo-name`

## Project Structure

```
├── index.html   # Markup + ad placeholders
├── style.css    # Dark theme, animations, responsive layout
├── script.js    # Tab opening logic, validation, progress tracking
└── README.md
```

## Important Notes

- This tool only opens tabs **in the user's own browser** — no bots, no proxies, no fake traffic.
- Pop-up blockers may interfere; users should allow pop-ups for the site.
- Tab limit is capped at **20** for browser safety.

## License

MIT — free to use and modify.
