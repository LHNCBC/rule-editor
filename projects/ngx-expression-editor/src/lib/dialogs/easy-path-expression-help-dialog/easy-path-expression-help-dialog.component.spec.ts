import 'zone.js/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EasyPathExpressionHelpDialogComponent } from './easy-path-expression-help-dialog.component';

describe('EasyPathExpressionHelpDialogComponent', () => {
  let component: EasyPathExpressionHelpDialogComponent;
  let fixture: ComponentFixture<EasyPathExpressionHelpDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ EasyPathExpressionHelpDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EasyPathExpressionHelpDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
