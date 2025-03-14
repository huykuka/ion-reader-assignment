import { Component, AfterViewInit, inject, signal, ElementRef, ViewChild, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RobotStateService } from '../../../services/state/robot-state.service';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ButtonModule } from 'primeng/button';
import { ModelProcessorService } from '../../../core/services/model-processor.service';

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
  private modelProcessor = inject(ModelProcessorService);

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
          this.handleModelData(botModel.data);
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
        this.handleModelData(currentState.botModel.data);
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

  /**
   * Handles the model data by processing it and loading it into the scene
   */
  private handleModelData(data: Uint8Array) {
    if (!this.scene || !this.camera) {
      console.warn('Three.js not initialized yet');
      return;
    }

    // Process the model data using the service
    const objString = this.modelProcessor.processModelData(data);

    if (objString) {
      // Store the OBJ data
      this.objData.set(objString);

      // Remove existing model if any
      if (this.model) {
        this.scene.remove(this.model);
        this.model = null;
      }

      // Load the model
      this.modelProcessor.loadObjModel(objString, this.scene)
        .then(object => {
          // Store reference to the model
          this.model = object;

          // Update camera to view the model
          this.camera.lookAt(0, 0, 0);

          // Set model flag
          this.hasModel.set(true);
        })
        .catch(error => {
          console.error('Failed to load model:', error);
        });
    }
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
