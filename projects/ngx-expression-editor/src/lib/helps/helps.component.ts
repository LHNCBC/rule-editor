import { Component, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { SimpleStyle } from '../expression-editor.service';
import { FhirpathExpressionHelpDialogComponent } from '../dialogs/fhirpath-expression-help-dialog/fhirpath-expression-help-dialog.component';
import { EasyPathExpressionHelpDialogComponent } from '../dialogs/easy-path-expression-help-dialog/easy-path-expression-help-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'lhc-helps',
  templateUrl: './helps.component.html',
  styleUrls: ['./helps.component.css'],
  imports: [ MatTooltipModule, FhirpathExpressionHelpDialogComponent, EasyPathExpressionHelpDialogComponent ]
})
export class HelpsComponent implements OnChanges{

  @Input() type: string;
  @Input() index;
  @Input() lhcStyle: SimpleStyle = {};
  @Output() helpDialogClose: EventEmitter<any> = new EventEmitter<any>();

  showHelp = false;
  matToolTip = "Easy Path Expression Help";

  private liveAnnouncer = inject(LiveAnnouncer);

  /**
   * Angular lifecycle hook called on input changes
   */
  ngOnChanges(changes): void {
    if (changes.type) {
      if (changes.type.currentValue === 'expression' || changes.type.currentValue === 'fhirpath')
        this.matToolTip = "FHIRPath Expression Help";
      else
        this.matToolTip = "Easy Path Expression Help";
    }
  }

  /**
   * Open Help Modal
   */
  openHelp(): void {
    this.showHelp = true;
  }

  /**
   * Close Help Modal
   */
  closeHelp(): void {
    this.liveAnnouncer.announce('Help dialog closed');
    this.showHelp = false;
  }
}
