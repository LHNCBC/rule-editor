import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';
import { SimpleStyle } from '../../expression-editor.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'lhc-cancel-changes-confirmation-dialog',
  templateUrl: './cancel-changes-confirmation-dialog.component.html',
  imports: [BaseDialogComponent]
})
export class CancelChangesConfirmationDialogComponent extends BaseDialogComponent {
  @Input() lhcStyle: SimpleStyle = {};
  @Output() confirmationYes: EventEmitter<any> = new EventEmitter<any>();
  @Output() confirmationNo: EventEmitter<any> = new EventEmitter<any>();
  @Output() dialogClose: EventEmitter<any> = new EventEmitter<any>();

  protected liveAnnouncer = inject(LiveAnnouncer);

  /**
   * Emits the 'confirmationYes' event
   */
  onYes(): void {
    this.liveAnnouncer.announce("Yes is selected.");
    setTimeout(() => {
      this.confirmationYes.emit();
    }, 0);
  };

  /**
   * Emits the 'confirmationNo' event
   */
  onNo(): void {
    this.liveAnnouncer.announce("No is selected.");
    setTimeout(() => {
      this.confirmationNo.emit();
    }, 0);
  };

  /**
   * Emits the 'dialogClose' event
   */
  onDialogClose(): void {
    this.liveAnnouncer.announce("Cancel Changes dialog close.");
    setTimeout(() => {
      this.dialogClose.emit();
    }, 0);
  };
}
