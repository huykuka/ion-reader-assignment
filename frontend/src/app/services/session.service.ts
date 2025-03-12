import { Injectable } from '@angular/core';
import { SignalsSimpleStoreService } from '../core/services';
import { SessionInformation } from '../core/models';

export interface SessionState {
  session: SessionInformation;
}

@Injectable({
  providedIn: 'root',
})
export class SessionService extends SignalsSimpleStoreService<SessionState> {
  constructor() {
    super();
  }

  setSession(session: SessionInformation) {
    this.setState({
      ...this.state,
      session,
    });
  }

  getSession() {
    return this.state().session;
  }
}
