import 'zone.js/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CalculateSumPromptComponent } from './calculate-sum-prompt.component';

describe('CalculateSumPromptComponent', () => {
  let component: CalculateSumPromptComponent;
  let fixture: ComponentFixture<CalculateSumPromptComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CalculateSumPromptComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalculateSumPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
