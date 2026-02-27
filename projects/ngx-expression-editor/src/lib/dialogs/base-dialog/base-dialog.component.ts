import { Component, EventEmitter, OnInit, Input, Output, ViewChild, ElementRef, HostListener, inject } from '@angular/core';
import { DialogStyle, DialogTypes, SimpleStyle } from '../../expression-editor.service';
import copy from 'fast-copy';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { ExpressionEditorService } from '../../expression-editor.service';
import { CommonModule } from '@angular/common';

const confirmationDialogStyle = {
  dialogContentDiv: {
    'padding': '0px 0px 20px 0px',
    'width': '50%',
    'border-radius': '10px'
  },
  dialogTitleBar: {
    'padding': '10px 20px 10px 20px',
    'height': '20px',
    'background-color': '#3166e3',
    'color': 'white',
    'vertical-align': 'middle'
  },
  dialogHeaderDiv: {
    'margin': '20px 20px 0px 20px',
    'text-align': 'center'
  },
  dialogBodyDiv: {
    'margin': '20px',
    'text-align': 'center'
  },
  dialogFooterDiv: {
    'margin': '0px 10px',
    'text-align': 'center'
  },
  buttonPrimary: {
    'background-color': 'navy',
    'color': 'white'
  }
};

const helpDialogStyle = {
  dialogContentDiv: {
    'padding': '0px 0px 20px 0px',
    'width': '70%',
    'border-radius': '10px',
    'max-height': '90%'
  },
  dialogTitleBar: {
    'padding': '10px 20px 10px 20px',
    'height': '20px',
    'background-color': '#3166e3',
    'color': 'white',
    'vertical-align': 'middle'
  },
  dialogHeaderDiv: {
    'text-align': 'left'
  },
  dialogBodyDiv: {
    'margin': '0px 20px',
    'text-align': 'left',
    'max-height': '60vh',
    'overflow-y': 'auto'
  }
};

const expressionEditorDialogStyle = {
  dialogContentDiv: {
    'width': '90%',
    'border-radius': '10px',
    'max-height': '85vh',
    'overflow': 'hidden'
  },
  dialogTitleBar: {
    'padding': '10px 20px 10px 20px',
    'height': '20px',
    'background-color': '#3166e3',
    'color': 'white',
    'vertical-align': 'middle'
  },
  dialogHeaderDiv: {
    'margin': '20px 20px 0px 20px',
    'font-size': '24px',
    'text-align': 'left'},
  dialogBodyDiv: {
    'text-align': 'left',
    'max-height': '75vh',
    'overflow-y': 'auto'
  }
};

@Component({
  selector: 'lhc-base-dialog',
  templateUrl: './base-dialog.component.html',
  styleUrls: ['./base-dialog.component.css'],
  imports: [A11yModule, CommonModule]
})
export class BaseDialogComponent implements OnInit {
  @Input() customDialogStyle: DialogStyle = {};
  @Input() lhcStyle: SimpleStyle = {};
  @Input() dialogType: DialogTypes;
  @Input() displayTitleBar = true;
  @Input() titleBarLabel = '';
  @Input() headerLabel = '';
  @Input() yesButtonLabel = 'Yes';
  @Input() noButtonLabel = 'No';
  @Input() yesButtonId = 'yes-button';
  @Input() noButtonId = 'no-button';
  @Input() enableOverlayClick = true;
  @Input() name = '';

  @Output() yes: EventEmitter<any> = new EventEmitter<any>();
  @Output() no: EventEmitter<any> = new EventEmitter<any>();
  @Output() dialogClose: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('overlay') overlayRef: ElementRef;
  @ViewChild('modal') modal: ElementRef;

  dialogStyle = {
    'dialogTitleBar': {},
    'dialogContentDiv': {},
    'dialogHeaderDiv': {},
    'dialogBodyDiv': {},
    'dialogFooterDiv': {},
    'buttonPrimary': {},
    'buttonSecondary': {}
  };

  timeout = 0;
  dialogName = "";
  isHovered = false;

  protected liveAnnouncer = inject(LiveAnnouncer);
  protected expressionEditorService = inject(ExpressionEditorService);

  /**
   * Angular lifecycle hook called when the component is initialized
   */
  ngOnInit(): void {
    let tmpDialogStyle;
    if (this.dialogType === DialogTypes.Confirmation) {
      tmpDialogStyle = copy(confirmationDialogStyle);
    } else if (this.dialogType === DialogTypes.Help) {
      tmpDialogStyle = copy(helpDialogStyle);
    } else {
      tmpDialogStyle = copy(expressionEditorDialogStyle);
    }

    this.dialogStyle = this.applyCustomDialogStyle(tmpDialogStyle, this.customDialogStyle);

    if (!this.name)
      this.name = (this.dialogType) ? this.dialogType : "expression-editor";

    this.dialogName = `#${this.name}-base-dialog > div`;

    if (this.expressionEditorService &&
        !this.expressionEditorService.dialogStack.contains(this.dialogName)) {
      this.expressionEditorService.dialogStack.push(this.dialogName);
    }
  }

  /**
   * If provide, apply custom css styles to the default css styles
   * @param sourceDialogStyle - default css styles for the selected type
   * @param customDialogStyle - custom css to override the default style
   * @returns updated css styles
   */
  applyCustomDialogStyle(sourceDialogStyle, customDialogStyle) {
    if (!this.customDialogStyle.dialogContentDiv)
      this.customDialogStyle.dialogContentDiv = {};
    if (!this.customDialogStyle.dialogHeaderDiv)
      this.customDialogStyle.dialogHeaderDiv = {};
    if (!this.customDialogStyle.dialogFooterDiv)
      this.customDialogStyle.dialogFooterDiv = {};

    if (this.lhcStyle?.body?.backgroundColor) {
      this.customDialogStyle.dialogContentDiv['backgroundColor'] = this.lhcStyle.body.backgroundColor;
      this.customDialogStyle.dialogHeaderDiv['backgroundColor'] = this.lhcStyle.body.backgroundColo;
      this.customDialogStyle.dialogFooterDiv['backgroundColor'] = this.lhcStyle.body.backgroundColor;
    }
    if (this.lhcStyle?.body?.color) {
      this.customDialogStyle.dialogContentDiv['color'] = this.lhcStyle.body.color;
      this.customDialogStyle.dialogHeaderDiv['color'] = this.lhcStyle.body.color;
      this.customDialogStyle.dialogFooterDiv['color'] = this.lhcStyle.body.color;
    }

    Object.keys(customDialogStyle).forEach((key) => {
      const val = customDialogStyle[key];
      Object.keys(val).forEach((propKey) => {
        const propVal = val[propKey];
        const dashedPropKey = propKey.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
        if (key in sourceDialogStyle)
        sourceDialogStyle[key][dashedPropKey] = propVal;
      });
    });

    return sourceDialogStyle;
  };


  /**
   * Emits the 'yes' event
   */
  onYes(): void {
    if(this.expressionEditorService.dialogStack.peek() === '#cancel-changes-base-dialog > div') {
      this.expressionEditorService.dialogStack.pop();
    }

    setTimeout(() => {
      this.yes.emit();
    }, this.timeout);
  }

  /**
   * Emits the 'no' event
   */
  onNo(): void {
    if (this.dialogName !== "#expression-editor-base-dialog > div")
      this.expressionEditorService.dialogStack.pop();

    setTimeout(() => {
      this.no.emit();
    }, this.timeout);
  }

  /**
   * Emits the 'dialogClose' event
   */
  onDialogClose(): void {
    if (this.dialogName !== "#expression-editor-base-dialog > div")
      this.expressionEditorService.dialogStack.pop();

    setTimeout(() => {
      this.dialogClose.emit();
    }, this.timeout);
  }

  /**
   * Close Modal from the Overlay - allowed the modal to be closed
   * if clicking outside of the modal
   * @param event - mouse click event
   */
  @HostListener('document:click', ['$event'])
  overlayClose(event) {
    if (this.enableOverlayClick) {
      if (event.target && event.target instanceof HTMLDivElement) {
        if (this.expressionEditorService && this.expressionEditorService.dialogStack.size() === 0) {
          this.expressionEditorService.dialogStack.push(this.dialogName);
        }

        if (!event.target.closest(this.dialogName) &&
            (this.expressionEditorService && this.expressionEditorService.dialogStack.peek() === this.dialogName)) {
          this.onDialogClose();
          event.stopPropagation();

          if (this.dialogName !== "#expression-editor-base-dialog > div")
            this.expressionEditorService.dialogStack.pop();
        }
      }
    }
  }

  /**
   * Indicates whether the `yes` EventEmitter has any active observers.
   *
   * Used to determine if the parent component is listening for the
   * `yes` event before emitting or conditionally rendering UI.
   */
  get yesHasObservers(): boolean {
    return (this.yes as any).observers?.length > 0;
  }

  /**
   * Indicates whether the `no` EventEmitter has any active observers.
   *
   * Used to determine if the parent component is listening for the
   * `no` event before emitting or conditionally rendering UI.
   */
  get noHasObservers(): boolean {
    return (this.no as any).observers?.length > 0;
  }
}
