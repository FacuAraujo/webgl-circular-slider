import * as THREE from 'three';
import { gsap } from 'gsap';

import { OrbitControls } from 'three/examples/jsm/Addons.js';

// Vertex shader - transforms geometry to curved segments
const vertexShader = `
uniform float uSeparationFactor;
uniform float uSegmentCount;
uniform float uSegmentHeight;
uniform float uSegmentWidth;
uniform float uSegmentsGap;
uniform float uTime;
uniform float uProgress;

varying float vRadius;
varying vec2 vUv;
varying vec3 vPosition;

float random (vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233)))*43758.5453123);
}

void main() { 
  vUv = uv;

  // Calculate which segment this vertex belongs to based on instanceID
  float segmentId = float(gl_InstanceID);
  
  // Calculate segment parameters
  float anglePerSlot = (2.0 * 3.1416 / uSegmentCount); // Total angle space per segment
  vRadius = ((uSegmentWidth + uSegmentsGap) * uSegmentCount) / (2.0 * 3.1416); // Fixed radius for now
  
  // Transform position to curved segment
  vec3 pos = position;
  
  // Scale UV to segment angle and apply curvature
  float localAngle = pos.x * (3.1416 / uSegmentCount);
  pos.x = vRadius * cos(localAngle) + uSegmentsGap;
  pos.z = -vRadius * sin(localAngle);
  pos.y = pos.y * uSegmentHeight;
  
  // Rotate segment to its position around the circle
  float rotationAngle = anglePerSlot * segmentId;
  float cosRot = cos(rotationAngle);
  float sinRot = sin(rotationAngle);
  
  vec3 rotatedPos = vec3(
    (pos.x * cosRot - pos.z * sinRot),
    pos.y - uProgress * random(vec2(segmentId)) * 2.0,
    (pos.x * sinRot + pos.z * cosRot)
  );
  
  vPosition = rotatedPos;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(rotatedPos, 1.0);
}
`;

// Fragment shader - applies texture
const fragmentShader = `
uniform sampler2D uTexture;
uniform float uTime;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vec4 textureColor = texture2D(uTexture, vUv);
  
  // Optional: add subtle animation effects
  float wave = sin(vPosition.y * 2.0 + uTime * 0.1) * 0.1 + 1.0;
  
  gl_FragColor = vec4(textureColor.rgb, textureColor.a);
}
`;

const CONFIG = {
  segments: {
    count: 8,
    width: 3,
    height: 1.25,
    gap: 0.15,
    quality: { width: 20, height: 20 }, // Even lower for shader version
  },
  scene: {
    backgroundColor: 0x222222,
    cameraDistance: 8
  }
};

class ShaderCircularSlider {
  constructor() {
    this.time = 0;
    this.init();
  }

  init() {
    this.setupScene();
    this.loadTexture();
    this.startAnimation();
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(CONFIG.scene.backgroundColor);
    document.getElementById('app').appendChild(this.renderer.domElement);

    this.camera.position.z = CONFIG.scene.cameraDistance;

    window.addEventListener('resize', () => this.handleResize());
  }

  createBaseGeometry() {
    // Create a simple plane that will be transformed by shaders
    const { width, height } = CONFIG.segments.quality;
    const geometry = new THREE.PlaneGeometry(2, 1, width, height);
    return geometry;
  }

  loadTexture() {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(
      '/ny-av.avif',
      () => {
        console.log('Shader version: Texture loaded');
        this.onTextureLoaded();
      },
      undefined,
      (error) => console.error('Error loading texture:', error)
    );

    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    this.texture = texture;
  }

  onTextureLoaded() {
    this.createShaderMaterial();
    this.createInstancedMesh();
    this.setUpTimeline();
    this.setupEvents();
  }

  createShaderMaterial() {
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: this.texture },
        uSeparationFactor: { value: CONFIG.segments.separationFactor },
        uSegmentCount: { value: CONFIG.segments.count },
        uRadius: { value: CONFIG.segments.radius },
        uSegmentHeight: { value: CONFIG.segments.height },
        uSegmentWidth: { value: CONFIG.segments.width },
        uSegmentsGap: { value: CONFIG.segments.gap },
        uTime: { value: 0 },
        uProgress: { value: 1 }
      },
      side: THREE.DoubleSide,
    });
  }

  createInstancedMesh() {
    if (this.instancedMesh) {
      this.scene.remove(this.instancedMesh);
    }

    const geometry = this.createBaseGeometry();
    
    // Create instanced mesh - one instance per segment
    this.instancedMesh = new THREE.InstancedMesh(
      geometry, 
      this.material, 
      CONFIG.segments.count
    );

    // Set transform matrices for each instance (though shader handles positioning)
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < CONFIG.segments.count; i++) {
      matrix.makeScale(1, 1, 1);
      this.instancedMesh.setMatrixAt(i, matrix);
    }

    this.scene.add(this.instancedMesh);
    console.log(`Shader version: Created ${CONFIG.segments.count} instanced segments`);
  }

  updateSegmentCount(newCount) {
    CONFIG.segments.count = Math.max(1, newCount);
    this.material.uniforms.uSegmentCount.value = CONFIG.segments.count;
    this.createInstancedMesh(); // Need to recreate for instance count change
  }

  updateSeparation(newSeparation) {
    CONFIG.segments.gap = THREE.MathUtils.clamp(newSeparation, 0.0, 1.0);
    this.material.uniforms.uSegmentsGap.value = CONFIG.segments.gap;
  }

  startAnimation() {
    gsap.ticker.add(() => this.render());
  }

  setUpTimeline() {
    this.animationTimeline = gsap.timeline({paused: true});

    this.animationTimeline.fromTo(this.material.uniforms.uProgress, {
      value: 1,
      }, {
      value: 0,
      duration: 1,
      ease: 'power3.Out',
      onUpdate: () => {
        console.log(this.material.uniforms.uProgress.value);
      }
    });

    this.animationTimeline.fromTo(this.instancedMesh.rotation, {
      y: 0,
    }, {
      y: 1,
      duration: 1,
      ease: 'power3.Out',
    }, 0)
  }

  setupEvents() {
    window.addEventListener('click', (event) => {
      if (this.isAnimated) {
        this.animationTimeline.reverse();
        this.isAnimated = false;
      } else {
        this.animationTimeline.play();
        this.isAnimated = true;
      }
    });
  }

  render() {
    this.time += 16; // ~60fps
    if (this.material) {
      this.material.uniforms.uTime.value = this.time;
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
}

// Initialize shader version
new ShaderCircularSlider();
