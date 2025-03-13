import { Component, OnInit, AfterViewInit, inject, signal, ElementRef, ViewChild, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RobotStateService } from '../../../services/state/robot-state.service';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { ButtonModule } from 'primeng/button';
import * as pako from 'pako';

@Component({
  selector: 'app-threed-view',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './threed-view.component.html',
  styleUrls: ['./threed-view.component.scss']
})
export class ThreedViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('rendererContainer') rendererContainer!: ElementRef;

  private robotStateService = inject(RobotStateService);

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private model: THREE.Group | null = null;
  private animationFrameId: number | null = null;

  hasModel = signal(false);
  objData = signal<string | null>(null);

  constructor() {
    console.log('ThreedViewComponent constructor');
    // Watch for changes in the robot state
    effect(() => {
      const botModel = this.robotStateService.select('botModel')();
      console.log('Bot model from effect:', botModel);
      if (botModel?.data) {
        console.log('Bot model data length:', botModel.data.length);
        // Only load if we have data and the component is initialized
        if (this.scene && this.camera && this.renderer) {
          this.processModelData(botModel.data);
        }
      }
    });
  }

  ngOnInit() {
    console.log('ThreedViewComponent initialized');
    // Check if there's already model data in the state
    const currentState = this.robotStateService.state();
    console.log('Current robot state:', currentState);
    if (currentState.botModel?.data) {
      console.log('Initial bot model data length:', currentState.botModel.data.length);
    } else {
      console.log('No initial bot model data found');
    }
  }

  ngAfterViewInit() {
    console.log('ThreedViewComponent after view init');
    this.initThreeJs();

    // Check if there's already model data in the state after Three.js is initialized
    setTimeout(() => {
      const currentState = this.robotStateService.state();
      if (currentState.botModel?.data) {
        this.processModelData(currentState.botModel.data);
      }
    }, 500);
  }

  ngOnDestroy() {
    // Cancel animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Dispose of Three.js resources
    if (this.renderer) {
      this.renderer.dispose();
    }

    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }

  private initThreeJs() {
    console.log('Initializing Three.js');

    // Get container dimensions
    const container = this.rendererContainer.nativeElement;
    console.log('Renderer container:', container);
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 600;
    console.log(`Container dimensions: ${width}x${height}`);

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // Add a grid helper for reference
    const gridHelper = new THREE.GridHelper(10, 10);
    this.scene.add(gridHelper);

    // Add axes helper
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Add renderer to DOM
    const modelContainer = document.getElementById('model-container');
    if (modelContainer) {
      console.log('Found model container');
      // Clear any existing content
      while (modelContainer.firstChild) {
        modelContainer.removeChild(modelContainer.firstChild);
      }

      modelContainer.appendChild(this.renderer.domElement);

      // Add orbit controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.25;
      this.controls.enableZoom = true;
      this.controls.autoRotate = false;

      // Handle window resize
      window.addEventListener('resize', this.onWindowResize.bind(this));

      // Start animation loop
      this.animate();
    } else {
      console.error('Could not find model-container element');
    }
  }

  private processModelData(data: Uint8Array) {
    console.log('Processing model data, length:', data.length);
    if (!this.scene || !this.camera) {
      console.warn('Three.js not initialized yet');
      return;
    }

    try {
      // Try to decompress the data using pako (zlib/gzip)
      let decompressedData: Uint8Array;
      try {
        // Try gzip decompression first
        decompressedData = pako.inflate(data);
        console.log('Successfully decompressed with pako.inflate (gzip)');
      } catch (error) {
        console.warn('Failed to decompress with pako.inflate, trying pako.ungzip', error);
        try {
          // Try raw deflate
          decompressedData = pako.ungzip(data);
          console.log('Successfully decompressed with pako.ungzip');
        } catch (error2) {
          console.warn('Failed to decompress with pako.ungzip, using original data', error2);
          // If both decompression methods fail, use the original data
          decompressedData = data;
        }
      }

      console.log('Decompressed data length:', decompressedData.length);

      // Convert the decompressed data to a string
      const objString = this.uint8ArrayToString(decompressedData);

      // Store the OBJ data for download
      this.objData.set(objString);

      // Log the first part of the string to check format
      console.log('OBJ String (first 200 chars):', objString.substring(0, 200));

      // Check if it's a valid OBJ file by looking for common OBJ file markers
      if (objString.includes('v ') && (objString.includes('f ') || objString.includes('vn '))) {
        console.log('Valid OBJ format detected');
        this.loadObjModel(objString);
      } else {
        console.warn('The data does not appear to be in OBJ format');
        this.tryParseAlternativeFormat(decompressedData);
      }
    } catch (error) {
      console.error('Error processing model data:', error);
    }
  }

  private loadObjModel(objString: string) {
    // Remove existing model if any
    if (this.model) {
      this.scene.remove(this.model);
      this.model = null;
    }

    // Create a blob from the OBJ string
    const blob = new Blob([objString], { type: 'text/plain' });
    const objectUrl = URL.createObjectURL(blob);

    // Create OBJ loader
    const loader = new OBJLoader();

    // Load the model
    loader.load(
      objectUrl,
      (object) => {
        console.log('OBJ model loaded successfully', object);

        // Center the model
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Normalize and center
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 5 / maxDim;
        object.scale.set(scale, scale, scale);
        object.position.sub(center.multiplyScalar(scale));

        // Add to scene
        this.scene.add(object);
        this.model = object;

        // Update camera to view the model
        this.camera.lookAt(0, 0, 0);

        // Set model flag
        this.hasModel.set(true);

        // Clean up URL
        URL.revokeObjectURL(objectUrl);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      },
      (error) => {
        console.error('Error loading OBJ model:', error);
        URL.revokeObjectURL(objectUrl);
      }
    );
  }

  private tryParseAlternativeFormat(data: Uint8Array) {
    console.log('Trying to parse alternative format');
    // Try to detect if the data is in a different format
    const dataView = new DataView(data.buffer);

    // Check for binary format indicators
    try {
      // Check if it might be a binary format with a header
      // This is just a basic example - you may need to adapt based on your specific format
      const header = this.uint8ArrayToString(data.slice(0, 20));
      console.log('Possible header:', header);

      // If it's a binary format, try to parse it
      // For demonstration, let's try a simple vertex-face structure
      // Assuming the format is: [num_vertices(4 bytes)][num_faces(4 bytes)][vertices_data][faces_data]

      if (data.length > 8) {
        const numVertices = dataView.getUint32(0, true); // little-endian
        const numFaces = dataView.getUint32(4, true);

        console.log(`Detected possible binary format: ${numVertices} vertices, ${numFaces} faces`);

        // Check if these numbers make sense
        if (numVertices > 0 && numVertices < 1000000 && numFaces > 0 && numFaces < 1000000) {
          // Convert to OBJ format
          let objOutput = '# Converted from binary format\n';

          // Parse vertices (assuming each vertex is 3 floats = 12 bytes)
          const vertexOffset = 8; // After the header
          for (let i = 0; i < numVertices; i++) {
            const offset = vertexOffset + i * 12;
            if (offset + 12 <= data.length) {
              const x = dataView.getFloat32(offset, true);
              const y = dataView.getFloat32(offset + 4, true);
              const z = dataView.getFloat32(offset + 8, true);
              objOutput += `v ${x} ${y} ${z}\n`;
            }
          }

          // Parse faces (assuming each face is 3 indices = 12 bytes)
          const faceOffset = vertexOffset + numVertices * 12;
          for (let i = 0; i < numFaces; i++) {
            const offset = faceOffset + i * 12;
            if (offset + 12 <= data.length) {
              // OBJ indices are 1-based
              const a = dataView.getUint32(offset, true) + 1;
              const b = dataView.getUint32(offset + 4, true) + 1;
              const c = dataView.getUint32(offset + 8, true) + 1;
              objOutput += `f ${a} ${b} ${c}\n`;
            }
          }

          console.log('Successfully converted binary format to OBJ');
          this.objData.set(objOutput);
          this.loadObjModel(objOutput);
        } else {
          console.warn('Binary format detection failed - unreasonable vertex/face counts');
          this.loadFallbackModel();
        }
      } else {
        console.warn('Data too small for binary format');
        this.loadFallbackModel();
      }
    } catch (error) {
      console.error('Error parsing alternative format:', error);
      this.loadFallbackModel();
    }
  }

  private loadFallbackModel() {
    console.log('Loading fallback cube model');
    const objString = this.createBasicObjModel();
    this.objData.set(objString);
    this.loadObjModel(objString);
  }

  private uint8ArrayToString(data: Uint8Array): string {
    return new TextDecoder().decode(data);
  }

  private onWindowResize() {
    const container = this.rendererContainer.nativeElement;
    if (container) {
      const width = container.clientWidth;
      const height = container.clientHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  private animate() {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  downloadObjModel() {
    console.log('Downloading OBJ model');
    const currentState = this.robotStateService.state();

    if (!currentState.botModel?.data) {
      console.warn('No model data to download');
      return;
    }

    try {
      // Get the original data
      const originalData = currentState.botModel.data;
      console.log('Original data length:', originalData.length);

      // Try to decompress if needed
      let processedData: Uint8Array;
      let objString: string;

      try {
        // Try gzip decompression
        processedData = pako.inflate(originalData);
        console.log('Decompressed with pako.inflate');
      } catch (error) {
        try {
          // Try ungzip
          processedData = pako.ungzip(originalData);
          console.log('Decompressed with pako.ungzip');
        } catch (error2) {
          // Use original data if decompression fails
          console.log('Using original data (no decompression)');
          processedData = originalData;
        }
      }

      // Convert to string
      objString = this.uint8ArrayToString(processedData);

      // Check if it looks like an OBJ file
      if (!objString.includes('v ') && !(objString.includes('f ') || objString.includes('vn '))) {
        console.warn('Data does not appear to be in OBJ format, creating a basic OBJ file');
        // Create a simple cube as a fallback
        objString = this.createBasicObjModel();
      }

      // Create a blob from the OBJ string
      const blob = new Blob([objString], { type: 'text/plain' });

      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'robot_model.obj';

      // Trigger download
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

    } catch (error) {
      console.error('Error downloading model:', error);
    }
  }

  private createBasicObjModel(): string {
    // Create a simple cube as a fallback
    return `# Basic cube model
v -1.0 -1.0 -1.0
v -1.0 -1.0 1.0
v -1.0 1.0 -1.0
v -1.0 1.0 1.0
v 1.0 -1.0 -1.0
v 1.0 -1.0 1.0
v 1.0 1.0 -1.0
v 1.0 1.0 1.0
f 1 3 7 5
f 2 6 8 4
f 1 5 6 2
f 3 4 8 7
f 1 2 4 3
f 5 7 8 6
`;
  }
}
