import 'zone.js/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CancelChangesConfirmationDialogComponent } from './cancel-changes-confirmation-dialog.component';

describe('CancelChangesConfirmationDialogComponent', () => {
  let component: CancelChangesConfirmationDialogComponent;
  let fixture: ComponentFixture<CancelChangesConfirmationDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ CancelChangesConfirmationDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CancelChangesConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
