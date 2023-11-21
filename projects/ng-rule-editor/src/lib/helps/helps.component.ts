import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'lhc-helps',
  templateUrl: './helps.component.html',
  styleUrls: ['./helps.component.css']
})
export class HelpsComponent implements OnInit {

  @Input() type: string;
  @Input() index;

  showHelp = false;
  matToolTip = "Easy Path Expression Help";

  constructor(private liveAnnouncer: LiveAnnouncer) {}

  /**
   * Angular lifecycle hook for initialization
   */
  ngOnInit(): void {
  }

  /**
   * Angular lifecycle hook called on input changes
   */
  ngOnChanges(changes): void {
    if (changes.type.currentValue === 'expression' || changes.type.currentValue === 'fhirpath')
      this.matToolTip = "FHIRPath Expression Help";
    else
      this.matToolTip = "Easy Path Expression Help";
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
