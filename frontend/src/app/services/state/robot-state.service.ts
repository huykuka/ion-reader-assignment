import { Injectable } from '@angular/core';
import { RobotConfig, RobotInfo } from '../../core/models';
import { SignalsSimpleStoreService } from '../../core/services';
import { WheelOdometry } from '../../core/models/wheel-odom.model';

export interface RobotState {
  robotConfig: any;
  robotInfo: any;
  botModel: any;
  wheelOdometry?: WheelOdometry[];
}

@Injectable({
  providedIn: 'root',
})
export class RobotStateService extends SignalsSimpleStoreService<RobotState> {
  constructor() {
    super();
  }

  setRobotConfig(config: RobotConfig) {
    this.setState({
      ...this.state(),
      robotConfig: config,
    });
  }

  setRobotInfo(info: RobotInfo) {
    this.setState({
      ...this.state(),
      robotInfo: info,
    });
  }

  setWheelOdometry(data: WheelOdometry[]) {
    this.setState({
      ...this.state(),
      wheelOdometry: data,
    });
  }

  getRobotConfig() {
    return this.state().robotConfig;
  }

  getRobotInfo() {
    return this.state().robotInfo;
  }

  getWheelOdometry() {
    return this.state().wheelOdometry || [];
  }
}
