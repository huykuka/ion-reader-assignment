import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RobotInfoComponent } from './robot-info.component';

describe('RobotInfoComponent', () => {
  let component: RobotInfoComponent;
  let fixture: ComponentFixture<RobotInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RobotInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RobotInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
