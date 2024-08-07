import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelChangesConfirmationDialogComponent } from './cancel-changes-confirmation-dialog.component';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';

describe('CancelChangesConfirmationDialogComponent', () => {
  let component: CancelChangesConfirmationDialogComponent;
  let fixture: ComponentFixture<CancelChangesConfirmationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        CancelChangesConfirmationDialogComponent,
        BaseDialogComponent
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CancelChangesConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
