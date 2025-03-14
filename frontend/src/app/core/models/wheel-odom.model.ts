/**
 * Interface representing wheel odometry data from the /tb_control/wheel_odom topic
 */
export interface WheelOdometry {
  timestamp: number;  // Time of the measurement
  position: {
    x: number;
    y: number;
    z: number;
  };
  orientation: {
    // Quaternion representation
    x: number;
    y: number;
    z: number;
    w: number;
  };
  // Optional additional fields
  linearVelocity?: {
    x: number;
    y: number;
    z: number;
  };
  angularVelocity?: {
    x: number;
    y: number;
    z: number;
  };
}

/**
 * Interface for the transformed position data in THREE.js coordinate system
 */
export interface TransformedPosition {
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  timestamp: number;
}
