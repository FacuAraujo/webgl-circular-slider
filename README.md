# 🌟 WebGL Circular Slider

An interactive circular slider built with Three.js and GSAP, featuring uniformly distributed curved segments with smooth shader-controlled animations.

![WebGL Circular Slider Demo](https://img.shields.io/badge/WebGL-Circular%20Slider-blue?style=for-the-badge&logo=webgl)

## ✨ Features

- 🎨 **Customizable curved segments** with textures
- ⚙️ **Automatic distribution** with configurable gaps
- 🎬 **Smooth GSAP animations** with cinematic easing
- 🖥️ **Optimized shaders** for maximum performance
- 🔄 **Auto-radius adjustment** for different configurations

## 🚀 Live Demo

[View Demo](https://webgl-circular-slider.vercel.app)

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/your-username/webgl-circular-slider.git

# Navigate to directory
cd webgl-circular-slider

# Install dependencies
npm install

# Run in development mode
npm run dev
```

## 📦 Dependencies

- **Three.js** `^0.179.1` - 3D rendering engine
- **GSAP** `^3.13.0` - Animation library
- **Vite** `^7.1.2` - Build tool and dev server

## ⚙️ Configuration

The slider is highly configurable through the `CONFIG` object:

```javascript
const CONFIG = {
  segments: {
    count: 8,           // Number of segments
    width: 3,           // Angular width of each segment
    height: 1.25,       // Vertical height of segments
    gap: 0.15,          // Space between segments
    quality: { width: 20, height: 20 } // Mesh resolution
  },
  scene: {
    backgroundColor: 0x222222,  // Background color
    cameraDistance: 8           // Camera distance
  }
};
```

## 🏗️ Architecture

### File Structure
```
webgl-circular-slider/
├── src/
│   └── main.js          # Main application
├── public/
│   ├── ny-av.avif       # Example texture
│   └── vite.svg         # Favicon
├── index.html           # Main HTML
├── package.json         # Dependencies
└── README.md           # This file
```

### Main Components

#### `ShaderCircularSlider`
Main class that handles:
- Three.js scene configuration
- Texture and material loading
- Instanced geometry creation
- GSAP animations
- Interaction events

#### Vertex Shader
Handles geometry transformation:
- Circular segment distribution
- Spherical curvature application
- Gap calculation between segments
- Entrance animation effects

#### Fragment Shader
Processes final rendering:
- Texture application
- Temporal wave effects
- Transparency control

## 🔧 Development

### Available Scripts
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Build preview
```
