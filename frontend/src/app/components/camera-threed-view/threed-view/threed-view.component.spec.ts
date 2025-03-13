import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreedViewComponent } from './threed-view.component';

describe('ThreedViewComponent', () => {
  let component: ThreedViewComponent;
  let fixture: ComponentFixture<ThreedViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreedViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThreedViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
