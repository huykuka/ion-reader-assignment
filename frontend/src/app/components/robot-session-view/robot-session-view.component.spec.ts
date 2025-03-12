import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RobotSessionViewComponent } from './robot-session-view.component';

describe('RobotSessionViewComponent', () => {
  let component: RobotSessionViewComponent;
  let fixture: ComponentFixture<RobotSessionViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RobotSessionViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RobotSessionViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
