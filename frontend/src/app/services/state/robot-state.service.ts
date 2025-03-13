import { Injectable } from '@angular/core';
import { RobotConfig, RobotInfo } from '../../core/models';
import { SignalsSimpleStoreService } from '../../core/services';

export interface RobotState {
  robotConfig: any;
  robotInfo: any;
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
      ...this.state,
      robotConfig: config,
    });
  }

  setRobotInfo(info: RobotInfo) {
    this.setState({
      ...this.state,
      robotInfo: info,
    });
  }

  getRobotConfig() {
    return this.state().robotConfig;
  }

  getRobotInfo() {
    return this.state().robotInfo;
  }
}
