# ⚡ Electromagnetic Theory — Interactive Textbook

[![Deploy to GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-blue?logo=github)]([https://pages.github.com/](https://dineth14.github.io/EE-320-Electromagnetic-Theory/))
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Pure HTML/CSS/JS](https://img.shields.io/badge/stack-HTML%2FCSS%2FJS-orange)](#)

A **complete, visually rich, interactive web-based textbook** covering Electromagnetic Theory — from electrostatics to plane waves. Self-contained with no build tools required, deployable directly via **GitHub Pages**.

---

## 📖 Table of Contents

| Chapter | Topics | Simulations |
|---------|--------|-------------|
| **1 — Electrostatics** | Coulomb's law, E field, Gauss's law, potential, Poisson/Laplace, energy, materials, capacitance | Coulomb force, field lines, Gaussian surfaces, 3D potential surface |
| **2 — Magnetostatics** | Lorentz force, Biot-Savart, Ampère's law, div B = 0, vector potential, magnetic dipole, materials, inductance | Biot-Savart fields, 3D magnetic dipole, charged particle in E + B |
| **3 — Maxwell's Equations** | Four equations, Faraday's law, displacement current, equations in matter, wave equation, Poynting's theorem, phasors, boundary conditions | Maxwell dashboard, Faraday induction, Poynting vector flow |
| **4 — Plane Waves** | Plane wave solutions, lossless/lossy media, skin effect, polarization, Poynting for waves, normal incidence, radiation pressure | Wave propagation, polarization, skin effect, normal incidence |

---

## ✨ Features

- **Dark-first aesthetic** with full light-mode toggle
- **KaTeX** math rendering — all equations rendered beautifully
- **15+ interactive simulations** — Canvas 2D & Three.js 3D
- **Collapsible derivations** for every major result
- **Quick reference cards** per chapter
- **Progress tracking** with localStorage persistence
- **Fully responsive** — works on mobile, tablet, and desktop
- **Zero build tools** — pure HTML, CSS, JavaScript
- **Accessible** — semantic HTML, ARIA labels, keyboard navigation

---

## 🚀 Getting Started

### Local Development

```bash
# Clone the repository
git clone https://github.com/<your-username>/electromagnetic-theory.git
cd electromagnetic-theory

# Open index.html in your browser — that's it!
# No npm install, no build step required.
```

Or use any local server:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .

# VS Code Live Server extension also works
```

### Deploy to GitHub Pages

1. Push the repository to GitHub
2. Go to **Settings → Pages**
3. Set source to **GitHub Actions**
4. The included workflow (`.github/workflows/deploy.yml`) will auto-deploy on push to `main`

---

## 📁 Project Structure

```
electromagnetic-theory/
├── index.html                         # Landing page
├── assets/
│   ├── css/
│   │   ├── main.css                   # Global styles & themes
│   │   └── math.css                   # KaTeX overrides
│   └── js/
│       ├── theme.js                   # Dark/light toggle
│       ├── nav.js                     # Sidebar & scroll spy
│       └── simulations.js             # Shared sim utilities
├── chapters/
│   ├── 01-electrostatics/
│   │   ├── index.html
│   │   └── sim/
│   │       ├── coulomb.js
│   │       ├── field-lines.js
│   │       ├── gauss.js
│   │       └── potential-3d.js
│   ├── 02-magnetostatics/
│   │   ├── index.html
│   │   └── sim/
│   │       ├── biot-savart.js
│   │       ├── magnetic-dipole.js
│   │       └── charged-particle.js
│   ├── 03-maxwells-equations/
│   │   ├── index.html
│   │   └── sim/
│   │       ├── faraday.js
│   │       └── em-coupling.js
│   └── 04-plane-waves/
│       ├── index.html
│       └── sim/
│           ├── wave-propagation.js
│           ├── polarization.js
│           ├── skin-effect.js
│           └── normal-incidence.js
├── .github/
│   └── workflows/
│       └── deploy.yml
└── README.md
```

---

## 🛠 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **HTML5** | Structure & semantic markup |
| **CSS3** | Theming (custom properties), layout (flexbox/grid), animations |
| **JavaScript (ES5+)** | Simulations, interactivity, theme/nav |
| **KaTeX 0.16.9** | LaTeX equation rendering |
| **Three.js r128** | 3D visualizations (potential surface, magnetic dipole) |
| **Canvas 2D API** | 2D simulations (field lines, waves, particles) |

All dependencies loaded via CDN — no `package.json` or `node_modules` needed.

---

## 📚 References

- D.J. Griffiths, *Introduction to Electrodynamics*, 4th Edition
- M.N.O. Sadiku, *Elements of Electromagnetics*, 7th Edition
- J.D. Jackson, *Classical Electrodynamics*, 3rd Edition
- Hayt & Buck, *Engineering Electromagnetics*, 9th Edition

---

## 📄 License

MIT License — free to use, modify, and distribute.
