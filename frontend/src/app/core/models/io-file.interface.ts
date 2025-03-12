import { BotModel, MapModel, RobotConfig, RobotInfo } from './robot.model';
import { SessionInformation } from './session.model';

export interface IoFile {
  metadata: {
    compressionMethod?: string;
    compressedTypes?: string[];
    botInfo?: RobotInfo;
    sessionInfo?: SessionInformation;
    botConfig?: RobotConfig;
    botModel?: BotModel;
    mapData?: MapModel;
  };
  topics: any[];
}
