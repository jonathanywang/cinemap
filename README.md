<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/jonathanywang/cinemap">
    <img src="stubby-fe/public/logo192.png" alt="CineMap Logo" width="80" height="80">
  </a>

  <h3 align="center">CineMap</h3>

  <p align="center">
    AI-powered story visualization for writers, screenwriters, and game narrative designers.
    <br />
    <a href="https://github.com/jonathanywang/cinemap"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://cinemap.vercel.app">View Live Demo</a>
    &middot;
    <a href="https://github.com/jonathanywang/cinemap/issues/new?labels=bug">Report Bug</a>
    &middot;
    <a href="https://github.com/jonathanywang/cinemap/issues/new?labels=enhancement">Request Feature</a>
  </p>
</div>

---

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

---

<!-- ABOUT THE PROJECT -->
## About The Project

CineMap is an AI-assisted story visualization tool designed for screenwriters, novelists, and game narrative designers. It turns ideas into structured, interactive flowcharts so you can see the shape of your story at a glance—while AI helps you develop it faster.

**What it does:**
- Provides an interactive, node-based canvas where each scene or plot beat lives as a draggable card
- Organizes your story into three acts (Act 1, 2, 3), each color-coded for instant structural clarity
- Lets you record a voice note and have it automatically transcribed and converted into story beats
- Manages characters with radar-chart trait profiles, so you never lose track of who does what and why
- Connects to a Google Gemini-powered backend that can generate branching narratives, expand scene ideas, and summarize story arcs

**Why CineMap?**
* Writing tools are usually either too simple (plain text) or too complex (full production software). CineMap sits in the middle—fast to start, powerful enough to grow with your story.
* Visual story structure reveals plot holes and pacing problems that are invisible in a linear document.
* Voice-first input lets ideas flow without interrupting the creative mindset.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

### Built With

**Frontend**

* [![React][React.js]][React-url]
* [![TypeScript][TypeScript]][TypeScript-url]
* [![TailwindCSS][TailwindCSS]][TailwindCSS-url]
* [![React Flow][ReactFlow]][ReactFlow-url]
* [![GSAP][GSAP]][GSAP-url]
* [![Framer Motion][FramerMotion]][FramerMotion-url]
* [![shadcn/ui][ShadcnUI]][ShadcnUI-url]

**Backend**

* [![Django][Django]][Django-url]
* [![DRF][DRF]][DRF-url]
* [![Google Gemini][Gemini]][Gemini-url]

**Deployment**

* [![Vercel][Vercel]][Vercel-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- GETTING STARTED -->
## Getting Started

The project has two independent sub-projects:

| Sub-project | Path | Purpose |
|---|---|---|
| `stubby-fe` | `stubby-fe/` | React + TypeScript frontend |
| `plot-ai` | `plot-ai/` | Django REST API + AI backend |

You can run **just the frontend** for UI development (it works with mock data), or spin up **both** for the full AI-powered experience.

### Prerequisites

* **Node.js** ≥ 16 and **npm** ≥ 8
  ```sh
  node --version   # should print v16.x or higher
  npm --version    # should print 8.x or higher
  ```
* **Python** ≥ 3.11 (backend only)
  ```sh
  python --version   # should print 3.11 or higher
  ```
* **uv** package manager (backend only) — [install guide](https://docs.astral.sh/uv/getting-started/installation/)
  ```sh
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```
* A **Google Gemini API key** — get one for free at [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation

#### Frontend only (quickest start)

1. Clone the repository:
   ```sh
   git clone https://github.com/jonathanywang/cinemap.git
   cd cinemap
   ```

2. Install dependencies:
   ```sh
   cd stubby-fe
   npm install
   ```

3. Start the development server:
   ```sh
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Full stack (frontend + AI backend)

1. **Clone** the repository (if you haven't already):
   ```sh
   git clone https://github.com/jonathanywang/cinemap.git
   cd cinemap
   ```

2. **Backend setup:**
   ```sh
   cd plot-ai/backend/plot-backend
   ```

   Create a `.env` file inside `plot-ai/backend/plot-backend/` and add your Gemini key:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

   Create and activate the virtual environment, install dependencies, and run migrations:
   ```sh
   uv sync
   source .venv/bin/activate        # Windows: .venv\Scripts\activate
   python manage.py migrate
   python manage.py createsuperuser  # optional – enables Django admin
   python manage.py runserver        # starts on http://127.0.0.1:8000
   ```

3. **Frontend setup** (in a new terminal):
   ```sh
   cd stubby-fe
   npm install
   ```

   Point the frontend at the local backend by creating `stubby-fe/.env.local`:
   ```env
   REACT_APP_API_BASE_URL=http://127.0.0.1:8000
   ```

   Start the dev server:
   ```sh
   npm start   # opens http://localhost:3000
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- USAGE -->
## Usage

### 1 · Create a project

Click **"Create Now"** on the landing page, then use the **"+ New Project"** button in the sidebar to name your story.

### 2 · Build your story map

- Click **"Add Node"** in the flowchart canvas to create a scene or plot beat.
- Assign it to **Act 1**, **Act 2**, or **Act 3** — nodes are color-coded blue, yellow, and red respectively.
- Drag nodes to rearrange them; draw edges by clicking the connector dots on each node.

### 3 · Import a Mermaid diagram

Already have a story outline in [Mermaid](https://mermaid.js.org/) format? Click **"Import Mermaid"** and paste it in — CineMap converts it to an interactive flowchart automatically.

### 4 · Let AI expand your story

Type a prompt (e.g. *"Write a tense confrontation between the hero and the mentor"*) into the chat panel in the sidebar and the AI returns new scene ideas, which are automatically wired into your map.

### 5 · Record a voice note

Hit the **microphone** button to record your thoughts out loud. CineMap transcribes the audio and adds it to your story's exchange history, ready to be turned into scene nodes.

### 6 · Manage characters

Open the **Character** section in the main panel to add characters with names, roles, and up to five trait scores. Each character gets a pentagon radar chart so you can compare protagonists, antagonists, and supporting cast at a glance.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- ROADMAP -->
## Roadmap

- [x] Interactive node-based flowchart canvas
- [x] Three-act color-coded story structure
- [x] Mermaid diagram import
- [x] AI-powered scene generation (Google Gemini)
- [x] Voice recording & audio transcription
- [x] Character management with radar-chart trait profiles
- [x] Vercel deployment
- [ ] User authentication & cloud story persistence
- [ ] Real-time collaboration (multi-user editing)
- [ ] Export to Final Draft / Fountain / PDF
- [ ] Mobile-responsive canvas
- [ ] Timeline view alongside the flowchart
- [ ] AI-generated character arc analysis

See the [open issues](https://github.com/jonathanywang/cinemap/issues) for the full list of proposed features and known issues.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make CineMap better, please fork the repo and create a pull request, or open an issue with the `enhancement` label. Don't forget to give the project a star ⭐ — thanks!

1. Fork the repository
2. Create your feature branch:
   ```sh
   git checkout -b feature/AmazingFeature
   ```
3. Commit your changes:
   ```sh
   git commit -m 'Add some AmazingFeature'
   ```
4. Push to the branch:
   ```sh
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- CONTACT -->
## Contact

Jonathan Wang — [@jonathanywang](https://github.com/jonathanywang)

Project Link: [https://github.com/jonathanywang/cinemap](https://github.com/jonathanywang/cinemap)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Best-README-Template](https://github.com/othneildrew/Best-README-Template) — the template this README is based on
* [React Flow](https://reactflow.dev) — the interactive node/edge canvas that powers the story map
* [shadcn/ui](https://ui.shadcn.com) — beautifully crafted, accessible UI components
* [GSAP](https://gsap.com) — animation library used for the landing page
* [Framer Motion](https://www.framer.com/motion/) — declarative React animations
* [Google Generative AI](https://ai.google.dev/) — the Gemini model that powers story generation
* [Shields.io](https://shields.io) — the badges at the top of this README
* [Vercel](https://vercel.com) — zero-config deployment for the frontend

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/jonathanywang/cinemap.svg?style=for-the-badge
[contributors-url]: https://github.com/jonathanywang/cinemap/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/jonathanywang/cinemap.svg?style=for-the-badge
[forks-url]: https://github.com/jonathanywang/cinemap/network/members
[stars-shield]: https://img.shields.io/github/stars/jonathanywang/cinemap.svg?style=for-the-badge
[stars-url]: https://github.com/jonathanywang/cinemap/stargazers
[issues-shield]: https://img.shields.io/github/issues/jonathanywang/cinemap.svg?style=for-the-badge
[issues-url]: https://github.com/jonathanywang/cinemap/issues

[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[TypeScript]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[TailwindCSS]: https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white
[TailwindCSS-url]: https://tailwindcss.com/
[ReactFlow]: https://img.shields.io/badge/React%20Flow-FF0072?style=for-the-badge&logo=reactflow&logoColor=white
[ReactFlow-url]: https://reactflow.dev/
[GSAP]: https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=white
[GSAP-url]: https://gsap.com/
[FramerMotion]: https://img.shields.io/badge/Framer%20Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white
[FramerMotion-url]: https://www.framer.com/motion/
[ShadcnUI]: https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white
[ShadcnUI-url]: https://ui.shadcn.com/

[Django]: https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white
[Django-url]: https://www.djangoproject.com/
[DRF]: https://img.shields.io/badge/Django%20REST%20Framework-FF1709?style=for-the-badge&logo=django&logoColor=white
[DRF-url]: https://www.django-rest-framework.org/
[Gemini]: https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white
[Gemini-url]: https://ai.google.dev/

[Vercel]: https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white
[Vercel-url]: https://vercel.com/
