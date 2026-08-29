# AlignView 3D 🦷✨

> **Next-Generation 3D Dental STL Previewer & Clear Aligner Treatment Progression Viewer**

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r167-black?style=flat-square&logo=three.js)](https://threejs.org/)
[![React Three Fiber](https://img.shields.io/badge/R3F-8.16-blueviolet?style=flat-square)](https://docs.pmnd.rs/react-three-fiber/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**AlignView 3D** is a web application engineered for dental clinicians, orthodontic labs, and patients to inspect 3D dental scan models (`.stl`), simulate clear aligner orthodontic treatment sequences, analyze occlusion, calculate millimeter caliper distances, and cross-section anatomical arches in real time.

---

## 🌟 Key Features

### 1. 🦷 High-Fidelity 3D Dental Anatomy & Occlusion
- **Dual-Tissue Rendering**: Realistic pearlescent ivory enamel teeth with natural specular gloss and anatomical coral-pink gingiva (gum tissue).
- **Full Dental Occlusion**: Upper and lower horseshoe arches modeled in Class I occlusion with natural overbite/overjet.
- **Dynamic Arch Views**: Instant toggling between **Both Arches**, **Upper Only**, **Lower Only**, and **Split View** (dual side-by-side comparative inspection).

### 2. 🎬 32-Stage Aligner Treatment Progression Timeline
- **Orthodontic Tooth Movement**: Continuous, physically accurate rotation, torque, and translational morphing across 32 treatment stages.
- **Interactive Scrubber**: Discrete step tick marks, active progress fill, and direct stage scrubbing.
- **Playback Controls**: Step Back (`|◀`), Play / Pause (`▶` / `⏸`), Step Forward (`▶|`), variable playback speeds (`0.5x` to `2.5x`), and loop toggle.

### 3. 📐 Precision 3D Caliper & Cross-Section Slicing
- **Point-to-Point Measurement**: Click two anatomical landmarks on teeth or gums to calculate live millimeter Euclidean distance.
- **Dynamic Cross-Section Tool**: Slice through the dental model along the **X**, **Y**, or **Z** axis with an interactive slider (`-30mm` to `+30mm`) for internal root and crown inspection.

### 4. 🎨 Multi-Shader Diagnostic Modes
- **Shaded (PBR)**: Photorealistic studio dental material with subtle subsurface reflection.
- **Wireframe**: High-density geometric mesh visualization for polygon inspection.
- **Solid**: Matte studio clay shader for topological defect inspection.
- **X-Ray**: Semi-transparent holographic glass shader for seeing overlapping root structures.

### 5. 🧭 3D Orientation Gizmo & Camera Controls
- **Interactive View Cube**: Quick-snap directional buttons for `U` (Up/Top), `D` (Down/Bottom), `L` (Left), `R` (Right), and `F` (Front).
- **Smooth Camera Tweening**: Smooth interpolation between angles and **Reset View** framing.
- **Orbit Navigation**: 360° mouse drag orbit, right-click pan, and pinch/wheel zoom.

### 6. 📁 Dual Arch File Management & Custom STL Loader
- **Upper & Lower File Browsers**: 16 Upper Arch and 17 Lower Arch sequence files with rich 3D thumbnails, dates, and file sizes.
- **Live Search**: Fast filtering across model files.
- **Custom STL Upload**: Drag & drop custom user `.stl` files directly into the 3D canvas with automatic bounding box and vertex diagnostics.
- **High-Res Snapshot**: One-click PNG capture of the current 3D viewport.

---

## 🏗️ Architecture & Tech Stack

```mermaid
graph TD
    %% Global Application Architecture
    subgraph UI_Layer ["🖥️ Presentation & Routing Layer (Next.js 16 App Router)"]
        LandingPage["src/app/page.tsx (World-Class Landing Page)"]
        StudioPage["src/app/studio/page.tsx (3D STL Dental Studio)"]
        Header["Header (Brand, Reset, Screenshot, Fullscreen, Export)"]
        LeftSidebar["Upper Arch Sidebar (Search, File List, 3D Thumbs)"]
        RightSidebar["Lower Arch Sidebar (Search, File List, 3D Thumbs)"]
        Timeline["TimelinePlayback (32-Stage Scrubber, Speed, Loop)"]
        UploadModal["UploadModal (Drag-and-Drop STL Parser)"]
    end

    subgraph State_Layer ["⚡ Reactive State Store (Zustand)"]
        Store[("useViewerStore")]
        Store --- S1["Model Files & Active Selection (Upper / Lower)"]
        Store --- S2["View Modes (Both / Upper / Lower / Split)"]
        Store --- S3["Render Shaders (Shaded / Wire / Solid / X-Ray)"]
        Store --- S4["Active Tools (Move / Rotate / Zoom / Pan / Measure / Section)"]
        Store --- S5["Timeline Playback (Stage 1..32, Speed, Loop)"]
        Store --- S6["Camera Controls (Snap Targets & Tweens)"]
        Store --- S7["Telemetry Data (Vertices, Triangles, Dimensions)"]
    end

    subgraph Viewport_Layer ["🌐 3D Viewport & Overlays (React Three Fiber)"]
        Canvas["DentalCanvas (R3F Canvas, Studio Lights, Contact Shadows)"]
        ViewCube["ViewCubeGizmo (U / D / L / R / F Snap Controls)"]
        ToolPalette["FloatingToolPalette (Tool Switcher)"]
        StatsCard["ModelStatsCard (Live Geometry Telemetry)"]
        RenderPill["RenderModePill (Shader Selector)"]
        ViewPill["ViewModePill (Arch View Selector)"]
        MeasureOverlay["MeasurementOverlay (Real-time Caliper Distance)"]
        SectionSlider["SectionSlider (Dynamic X/Y/Z Slice Offset)"]
    end

    subgraph Core_3D_Engine ["⚙️ 3D Geometry & Simulation Pipeline (Three.js)"]
        ModelRenderer["DentalArchModel (Dual-Arch Mesh Renderer)"]
        GeomGen["DentalGeometryGenerator (Tooth Morphology & Aligner Morpher)"]
        STLLoader["STLLoader (Custom Binary/ASCII Mesh Parser)"]
        Shaders["Dental Shaders (Pearlescent Enamel PBR & Coral Gingiva)"]
        ClipEngine["Local Clipping Plane Engine (Cross-Section Inspection)"]
        CaliperRaycast["Point-to-Point Raycaster (3D Distance Measurement)"]
    end

    %% Component Data Flows
    Page --> Header & LeftSidebar & RightSidebar & Timeline & UploadModal & Canvas
    Canvas --> ViewCube & ToolPalette & StatsCard & RenderPill & ViewPill & MeasureOverlay & SectionSlider & ModelRenderer
    ModelRenderer --> GeomGen & STLLoader & Shaders & ClipEngine & CaliperRaycast

    %% Reactive State Bindings
    LeftSidebar & RightSidebar & Timeline & Header & ViewCube & ToolPalette & SectionSlider <--> Store
    Store <--> ModelRenderer
```

```
AlignView 3D Tech Stack
├── Framework: Next.js 14 (App Router)
├── Language: TypeScript (Strict mode)
├── 3D Engine: Three.js r167 + @react-three/fiber + @react-three/drei
├── State Management: Zustand
├── Styling: Tailwind CSS + PostCSS + Glassmorphism UI
├── Icons: Lucide React
└── Parsers: STLLoader (three-stdlib)
```

---

## 📂 Project Structure

```
AlignView 3D/
├── src/
│   ├── app/
│   │   ├── globals.css              # Glassmorphism, range sliders, scrollbars
│   │   ├── layout.tsx               # Root metadata & Inter typography
│   │   └── page.tsx                 # Main 3-column layout & dynamic 3D viewport
│   ├── components/
│   │   ├── header/
│   │   │   └── Header.tsx           # Brand, Reset View, Screenshot, Export
│   │   ├── sidebar/
│   │   │   └── ArchSidebar.tsx      # Upper/Lower arch lists, thumbnails, search
│   │   ├── viewport/
│   │   │   ├── DentalCanvas.tsx     # Three.js Canvas, lighting, shadows, camera
│   │   │   ├── DentalArchModel.tsx  # Dual arch mesh, shaders, clipping planes
│   │   │   ├── DentalGeometryGenerator.ts # Tooth morphology & aligner movement
│   │   │   ├── ViewCubeGizmo.tsx    # U/D/L/R/F 3D orientation widget
│   │   │   ├── FloatingToolPalette.tsx # Move, Rotate, Zoom, Pan, Measure, Section
│   │   │   ├── ViewModePill.tsx     # Both, Upper, Lower, Split View
│   │   │   ├── RenderModePill.tsx   # Shaded, Wireframe, Solid, X-Ray
│   │   │   ├── ModelStatsCard.tsx   # Vertices, Triangles, Dimensions telemetry
│   │   │   ├── MeasurementOverlay.tsx # Live millimeter caliper banner
│   │   │   └── SectionSlider.tsx    # X/Y/Z clipping plane slider
│   │   ├── timeline/
│   │   │   └── TimelinePlayback.tsx # 32-stage sequence scrubber & player
│   │   └── modals/
│   │       └── UploadModal.tsx      # STL file drag-and-drop parser
│   ├── store/
│   │   └── useViewerStore.ts        # Central Zustand application state
│   └── types/
│       └── dental.ts                # TypeScript interfaces & types
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.17.0` or later
- **npm**: `v9.0.0` or later

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Sonu-Thomas-001/AlignView-3D.git
   cd AlignView-3D
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm run start
```

---

## 🖱️ Navigation & Controls

| Action | Mouse / Gesture | Description |
| :--- | :--- | :--- |
| **Orbit / Rotate** | Left Click + Drag | Rotate camera around center of dental arch |
| **Pan** | Right Click + Drag *(or Two-Finger Drag)* | Pan viewport horizontally and vertically |
| **Zoom** | Mouse Wheel *(or Pinch)* | Zoom in/out with bounded limits (20mm - 180mm) |
| **Snap Camera** | Click `U` / `D` / `L` / `R` / `F` | Smoothly lerps camera to Top, Bottom, Left, Right, Front |
| **Measure** | Select `Measure` Tool & Click 2 Points | Places 3D markers and renders distance in mm |
| **Cross-Section** | Select `Section` Tool & Drag Slider | Dynamically slices model along chosen X/Y/Z axis |

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
