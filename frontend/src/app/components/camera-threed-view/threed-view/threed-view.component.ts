import { Component, AfterViewInit, inject, signal, ElementRef, ViewChild, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RobotStateService } from '../../../services/state/robot-state.service';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ButtonModule } from 'primeng/button';
import { ModelProcessorService, ModelProcessingState } from '../../../core/services/model-processor.service';
import { TopicService } from '../../../services/state/topic.service';
import { PlaybackService } from '../../../services/actions/playback.service';
import { SessionService } from '../../../services/state/session.service';
import { Subscription } from 'rxjs';
import dayjs from 'dayjs';
import { robotPoseTopic } from '../../../core/constants/constant';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

interface RobotPose {
  pose: {
    position: {
      x: number;
      y: number;
      z: number;
    };
    orientation: {
      x: number;
      y: number;
      z: number;
      w: number;
    };
  }
  timestamp: number;
}

@UntilDestroy()
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
  private topicService = inject(TopicService);
  private playbackService = inject(PlaybackService);
  private sessionService = inject(SessionService);

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private model: THREE.Group | null = null;
  private animationFrameId: number | null = null;
  private playbackSubscription: Subscription | null = null;
  private robotPoses: RobotPose[] = [];

  hasModel = signal(false);
  objData = signal<string | null>(null);
  modelState = this.modelProcessor.state;
  currentPose = signal<RobotPose | null>(null);

  constructor() {
    // Watch for changes in the robot state
    effect(() => {
      const botModel = this.robotStateService.select('botModel')();
      if (botModel?.data) {
        // Only load if we have data and the component is initialized
        if (this.scene && this.camera && this.renderer) {
          this.handleModelData(botModel.data);
        }
      }
    });

    // Subscribe to playback changes
    this.playbackSubscription = this.playbackService.$playbackValue.pipe(untilDestroyed(this)).subscribe(
      (playbackValue) => this.updateRobotPoseOnPlayback(playbackValue)
    );

    // Load robot poses when topics change
    effect(() => {
      const topics = this.topicService.getValue('topics');
      if (topics) {
        this.loadRobotPoses();
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

      // Load robot poses if topics are available
      this.loadRobotPoses();
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

    // Unsubscribe from playback
    if (this.playbackSubscription) {
      this.playbackSubscription.unsubscribe();
    }

  }

  /**
   * Reset error state in the model processor
   */
  resetError() {
    // Create a new state object with error set to null but keeping other properties
    const newState: Partial<ModelProcessingState> = {
      error: null
    };

    // Access the private method through a workaround
    (this.modelProcessor as any)['updateState'](newState);
  }

  /**
   * Load robot poses from the wheel odometry topic
   */
  private loadRobotPoses() {
    const topics = this.topicService.getValue('topics');
    if (!topics) return;

    const odometryTopic = topics.find(topic => topic.topicName === robotPoseTopic);
    if (!odometryTopic || !odometryTopic.messages || odometryTopic.messages.length === 0) {
      console.log('No wheel odometry data found');
      return;
    }

    this.robotPoses = odometryTopic.messages
      .filter(({ data }) => data?.pose?.pose)
      .map(({ data: { pose: { pose } }, timestamp }) => ({
        pose: {
          position: pose.position as { x: number; y: number; z: number },
          orientation: pose.orientation as { x: number; y: number; z: number; w: number }
        },
        timestamp: timestamp as number
      }));

    // Sort poses by timestamp
    this.robotPoses.sort((a, b) => a.timestamp - b.timestamp);


    // Set robot to initial position if model is already loaded
    if (this.model && this.robotPoses.length > 0) {
      this.updateModelPosition(this.robotPoses[0]);
    }
  }

  /**
   * Update robot position based on playback value
   */
  updateRobotPoseOnPlayback(playbackValue: number) {
    if (this.robotPoses.length === 0 || !this.model) {
      return;
    }

    // Calculate target timestamp based on playback value and session start time
    const targetTimestamp =
      playbackValue * 1000 +
      dayjs.utc(this.sessionService.getSession()?.start_time).valueOf();

    // Find the closest pose to the target timestamp
    let closestPose: RobotPose | null = null;
    let minDifference = Number.MAX_VALUE;

    for (const pose of this.robotPoses) {
      const difference = Math.abs(pose.timestamp - targetTimestamp);
      if (difference < minDifference) {
        minDifference = difference;
        closestPose = pose;
      }
    }

    if (closestPose) {
      // Update the current pose signal
      this.currentPose.set(closestPose);

      // Update the model position
      this.updateModelPosition(closestPose);
    }
  }

  /**
   * Update the model position based on the robot pose
   */
  private updateModelPosition(movementDate: RobotPose) {
    const { pose } = movementDate;
    if (!this.model) return

    // Apply a single transformation to convert from ROS to THREE.js coordinate system
    // ROS: X forward, Y left, Z up
    // THREE.js: X right, Y up, Z out of screen (toward viewer)

    // We need to consider both:
    // 1. The transformation from ROS to THREE.js coordinates
    // 2. The initial orientation of the OBJ model

    // Position transformation
    const position = new THREE.Vector3(
      pose.position.x,  // ROS X → THREE.js X
      pose.position.z,  // ROS Z → THREE.js Y
      -pose.position.y  // ROS -Y → THREE.js Z
    );

    // Get the quaternion from the pose
    const rosQuaternion = new THREE.Quaternion(
      pose.orientation.x,
      pose.orientation.y,
      pose.orientation.z,
      pose.orientation.w
    );

    // Convert the quaternion to Euler angles to make it easier to work with
    const euler = new THREE.Euler().setFromQuaternion(rosQuaternion, 'XYZ');

    // Extract the yaw (rotation around Z-axis in ROS)
    // This is the main rotation for a ground robot
    const yaw = euler.z;

    // In THREE.js, we need to rotate around the Y-axis to match the yaw rotation
    // We also need to adjust for the initial orientation of the model

    // Apply position
    this.model.position.copy(position);

    // Reset rotation first
    this.model.rotation.set(0, 0, 0);


    this.model.rotateY(yaw)
  }

  /**
   * Format the current position text for display
   */
  currentPositionText(): string {
    const pose = this.currentPose();
    if (!pose) return 'No position data';

    const { x, y, z } = pose.pose.position;
    return `X: ${x.toFixed(2)}, Y: ${y.toFixed(2)}, Z: ${z.toFixed(2)}`;
  }

  /**
   * Check if movement data is available
   */
  hasMovementData(): boolean {
    return this.robotPoses.length > 0;
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
    this.modelProcessor.processModelData(data)
      .then(objString => {
        // Store the OBJ data
        this.objData.set(objString);

        // Remove existing model if any
        if (this.model) {
          this.scene.remove(this.model);
          this.model = null;
        }

        // Load the model
        return this.modelProcessor.loadObjModel(objString, this.scene);
      })
      .then(object => {
        // Store reference to the model
        this.model = object;

        // Update camera to view the model
        this.camera.lookAt(0, 0, 0);

        // Set model flag
        this.hasModel.set(true);

        // If we have robot poses data, set the initial position
        if (this.robotPoses.length > 0) {
          this.updateModelPosition(this.robotPoses[0]);
        }
        // If we have a current pose, update the model position
        else if (this.currentPose()) {
          this.updateModelPosition(this.currentPose()!);
        }
      })
      .catch(error => {
        console.error('Failed to load model:', error);
      });
  }


  private animate() {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }
}
