import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CameraThreedViewComponent } from './camera-threed-view.component';

describe('CameraThreedViewComponent', () => {
  let component: CameraThreedViewComponent;
  let fixture: ComponentFixture<CameraThreedViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CameraThreedViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CameraThreedViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
