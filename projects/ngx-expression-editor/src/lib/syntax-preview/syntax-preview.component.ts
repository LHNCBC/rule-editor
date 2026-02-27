import { Component, inject, Input } from '@angular/core';
import { SimpleStyle } from '../expression-editor.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lhc-syntax-preview',
  templateUrl: './syntax-preview.component.html',
  styleUrls: ['../expression-editor.component.css', './syntax-preview.component.css'],
  imports: [CommonModule, MatTooltipModule, ClipboardModule]
})
export class SyntaxPreviewComponent {
  @Input() syntax;
  @Input() lhcStyle: SimpleStyle;
  @Input() showWhenEmpty = false;
  @Input() hasError = false;

  private snackBar = inject(MatSnackBar);

  /**
   * Show an ephemeral notification that the value was copied.
   */
  copyNotification(): void {
    this.snackBar.open('Copied to clipboard', null, {
      duration: 2000
    });
  }
}
