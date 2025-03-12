export interface RobotInfo {
  botID?: string;
  botName?: string;
  enterpriseName?: string;
  enterpriseID?: string;
  siteID?: any;
  mapID?: string;
  mapVersionID?: any;
  releaseTrack?: string;
  amrVersion?: string;
  apkVersion?: string;
  server?: string;
  autonomyServer?: any;
}

export interface RobotConfig {
  BOTTYPE?: string;
  LIDAR_MODEL?: string;
  LIDAR_ON_BASE?: boolean;
  ENABLE_IMU?: boolean;
  TBCONTROL_DEVICE?: string;
  LIDAR_DEVICE?: string;
  RGB_PORT?: string;
  RFIDREADER_PORT?: string;
  IMU_DEVICE?: string;
  WAPP_CLIENT_PORT?: number;
  WAPP_API_PORT?: number;
  ENABLE_ROSBAG?: boolean;
  ROSBAG_LOG_LEVEL?: string;
  ENABLE_WEBVIZ?: boolean;
  ENABLE_SNAPSHOT?: boolean;
  ENABLE_ADJTIMEX_FREQUENCY_QUERY?: boolean;
  ENABLE_TEB_FEEDBACK?: boolean;
  SYSTEM_STATS_FREQ?: number;
  SD_STATUS_PUBLISH_INTERVAL_MS?: number;
  ADJTIMEX_FREQUENCY_QUERY_INTERVAL_MS?: number;
  ENABLE_CLEAR_NOISE_ON_PATH?: boolean;
  ENABLE_NARROW_GAP_CHECK?: boolean;
  ENABLE_MAPPING_ASSIST?: boolean;
  PATH_TYPE?: string;
  ENABLE_FUSION?: boolean;
  ENABLE_AMCL_ENLARGE_SEARCH?: boolean;
  IMU_MODE?: string;
  IMU_ODOM?: boolean;
  IMU_TILT_DETECT?: boolean;
  WARMUP_TIME?: number;
  FOLLOW_SPEED?: number;
  CLEAN_PROXIMITY?: boolean;
  DEPTHCAM_TIME_CHECK?: number;
  ENABLE_SIM?: boolean;
  ENABLE_TB_AUTONOMY?: boolean;
  ENABLE_TB_COLLISION_DETECTION?: boolean;
  ENABLE_UV_ENGINE_DEV?: boolean;
  ROS_DEBUG?: boolean;
}

export interface BotModel {
  format?: string;
  filename?: string;
  data?: Uint8Array;
}

export interface MapModel {
  format?: string;
  data?: Uint8Array;
}
