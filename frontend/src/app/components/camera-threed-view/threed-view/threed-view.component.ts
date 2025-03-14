import { Component, AfterViewInit, inject, signal, ElementRef, ViewChild, effect, OnDestroy } from '@angular/core';
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
export class ThreedViewComponent implements AfterViewInit, OnDestroy {
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
    // Watch for changes in the robot state
    effect(() => {
      const botModel = this.robotStateService.select('botModel')();
      if (botModel?.data) {
        console.log('Bot model data length:', botModel.data.length);
        // Only load if we have data and the component is initialized
        if (this.scene && this.camera && this.renderer) {
          this.processModelData(botModel.data);
        }
      }
    });
  }



  ngAfterViewInit() {
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

    // Get container dimensions
    const container = this.rendererContainer.nativeElement;
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 600;

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
      } catch (error) {
        console.warn('Failed to decompress with pako.inflate, trying pako.ungzip', error);
        try {
          // Try raw deflate
          decompressedData = pako.ungzip(data);
        } catch (error2) {
          console.warn('Failed to decompress with pako.ungzip, using original data', error2);
          // If both decompression methods fail, use the original data
          decompressedData = data;
        }
      }
      // Convert the decompressed data to a string
      const objString = this.uint8ArrayToString(decompressedData);

      // Store the OBJ data for download
      this.objData.set(objString);

      // Log the first part of the string to check format
      console.log('OBJ String (first 200 chars):', objString.substring(0, 200));

      // Check if it's a valid OBJ file by looking for common OBJ file markers
      if (objString.includes('v ') && (objString.includes('f ') || objString.includes('vn '))) {
        this.loadObjModel(objString);
      } else {
        console.warn('The data does not appear to be in OBJ format');
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
      (error) => {
        console.error('Error loading OBJ model:', error);
        URL.revokeObjectURL(objectUrl);
      }
    );
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

}
