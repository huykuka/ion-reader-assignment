export interface SessionInformation {
  sessionCode?: string;
  session_id?: string;
  start_time?: string;
  end_time?: string;
  duration?: number;
  local_start_time?: string;
  uptime?: number;
  apk_version?: string;
  amr_version?: string;
  rosbag_log_level?: string;
  operator_id?: string;
  operator_name?: string;
  map_id?: string;
  map_name?: string;
  is_old_map?: boolean;
  lidar_model?: string;
  lidar_fw?: string;
  lidar_scan_mode?: string;
  depthcam_fw?: string;
  depthcam_sdk?: string;
  depthcam_ros?: string;
  path_type?: string;
  motion_test?: boolean;
  one_spot_cleaning?: boolean;
  dosing_modifier?: number;
  estimated_time?: number;
  total_path_length?: number;
  result_id?: number;
  result?: string;
  total_keypoints?: number;
  reached_keypoints?: any[];
  missed_keypoints?: any[];
  kp_success_rate?: number;
  completeness?: number;
  semantic_result?: string;
  details?: SessionDetail[];
  events?: any[];
  sessionType?: string;
}

export interface SessionDetail {
  keypoint?: number;
  clean_time?: number;
  success?: boolean;
  abnormalities?: any[];
  debugs?: string[];
  pose?: Pose;
}

export interface Pose {
  position?: Position;
  orientation?: Orientation;
}

export interface Position {
  x?: number;
  y?: number;
  z?: number;
}

export interface Orientation {
  x?: number;
  y?: number;
  z?: number;
  w?: number;
}
