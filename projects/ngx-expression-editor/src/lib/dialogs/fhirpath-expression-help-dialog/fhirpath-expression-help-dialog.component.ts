import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { SimpleStyle } from '../../expression-editor.service';

@Component({
  selector: 'lhc-fhirpath-expression-help-dialog',
  templateUrl: './fhirpath-expression-help-dialog.component.html',
  styleUrls: ['./fhirpath-expression-help-dialog.component.css'],
  imports: [BaseDialogComponent]
})

export class FhirpathExpressionHelpDialogComponent extends BaseDialogComponent {
  @Input() lhcStyle: SimpleStyle = {};
  @Output() onCloseHelp: EventEmitter<any> = new EventEmitter<any>();

  protected liveAnnouncer = inject(LiveAnnouncer);

  /**
   * Emits the 'onCloseHelp' event
   */
  onNo(): void {
    this.liveAnnouncer.announce("Help dialog closed.");
    setTimeout(() => {
      this.onCloseHelp.emit();
    }, 0);
  };
}

