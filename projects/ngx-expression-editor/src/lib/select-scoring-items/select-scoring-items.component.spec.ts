import 'zone.js/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SelectScoringItemsComponent } from './select-scoring-items.component';

describe('SelectScoringItemsComponent', () => {
  let component: SelectScoringItemsComponent;
  let fixture: ComponentFixture<SelectScoringItemsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SelectScoringItemsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectScoringItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
