# BHIM UPI - Product Tour Demo

A pixel-perfect recreation of the BHIM UPI fintech app dashboard with an interactive product tour built using [Driver.js](https://driverjs.com/).

## Live Demo

**https://unico-connect.github.io/bhim-poc/**

If you see **404**: In the repo go to **Settings → Pages**. Set **Source** to **"GitHub Actions"** (so the workflow deploys the site), then push a commit or re-run the "Deploy to GitHub Pages" workflow from the Actions tab.

## Features

- **Mobile-first UI** (390px) faithfully matching the Figma design
- **Hindi/Devanagari** text throughout the interface
- **Curved bottom navigation** with floating QR scanner button
- **4-step interactive tour** using Driver.js with custom-styled popovers
- **Fully static** — no build tools, no frameworks, just HTML/CSS/JS

## Tour Steps

| Step | Target | Description |
|------|--------|-------------|
| 1 | QR Scanner Button | Scan & Pay introduction |
| 2 | Bank Account Card | Link Your Bank prompt |
| 3 | Send to Mobile | UPI transfer highlight |
| 4 | Suggested Features | Feature discovery |

## Project Structure

```
bhim-upi/
├── index.html          # Main app (HTML + CSS + JS)
├── driver.js.iife.js   # Driver.js v1.0.1 (local)
├── driver.css           # Driver.js styles (local)
└── README.md
```

## How to Extend the Tour

Open `index.html` and scroll to the `tourSteps` array at the bottom of the `<script>` block. Add a new step object:

```js
{
  element: '#your-element-id',
  popover: {
    title: 'Step Title',
    description: 'Step description.' + buildPopoverFooter(stepIndex),
    side: 'bottom',
    align: 'center',
    popoverClass: 'bhim-driver-popover',
  },
}
```

Then update `const totalSteps = ...` to match the new count.

## Tech Stack

- HTML5 / CSS3 (custom properties, flexbox, grid)
- Vanilla JavaScript
- [Driver.js v1.0.1](https://driverjs.com/) for the product tour
- [Figtree](https://fonts.google.com/specimen/Figtree) + [Noto Sans Devanagari](https://fonts.google.com/noto/specimen/Noto+Sans+Devanagari) fonts

## Local Development

No build step needed. Just open in a browser:

```bash
# Option 1: Python server
python3 -m http.server 8765
# Then open http://localhost:8765

# Option 2: Direct file open (fonts may not load)
open index.html
```

## License

MIT
