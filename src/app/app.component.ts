import { ChangeDetectorRef, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import Def from 'autocomplete-lhc';
import { environment } from '../environments/environment';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { createDisplayOption } from '../assets/js/common-utils.js';
import { ExpressionEditorComponent } from 'ngx-expression-editor';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ExpressionEditorComponent]
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('autoComplete', {static: false}) autoCompleteElement: ElementRef;
  autoComplete;
  appName = ('appName' in environment) ? environment.appName : '';
  appTitle = ('appTitle' in environment) ? environment.appTitle : '';

  formAppearedAnnouncement = `The ${this.appName} questionnaire has been loaded`;
  formReloadAnnouncement = `The ${this.appName} questionnaire has been reloaded`;
  openExpressionEditorLabel = `Open ${this.appName} button.`;
  openExpressionEditorTooltip = `Open the ${this.appName}`;

  calculatedExpression = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression';
  originalLinkId = '/39156-5';
  expressionTypes = [
    {
      name: 'Answer Expression',
      uri: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-answerExpression'
    },
    {
      name: 'Calculated Expression',
      uri: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression',
      selected: true
    },
    {
      name: 'Calculated/Initial Expression (user editable)',
      uri: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression',
      userExpressionChoices: [
        { name: 'Computed continuously', uri: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression' },
        { name: 'Only computed when the form loads', uri: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-initialExpression' }
      ]
    },
    {
      name: 'Enable When Expression',
      uri: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression',
    },
    {
      name: 'Initial Expression',
      uri: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-initialExpression'
    }
  ];

  display = {};
  fhirPreview: string;
  linkId = '';
  linkIds;
  rootLevel = false;
  defaultItemText;
  expressionUri = this.calculatedExpression;
  userExpressionChoices = null;
  customExpressionUri = false;
  fhirQuestionnaire = null;
  questionnaire = 'bmisimple';
  file = '';
  error = '';
  doNotAskToCalculateScore = false;

  displayExpressionEditor = false;
  displayExpressionEditorResult = false;

  private http = inject(HttpClient);
  private liveAnnouncer = inject(LiveAnnouncer);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private activatedRoute = inject(ActivatedRoute);
  private titleService = inject(Title);

  /**
   * Angular lifecycle hook called when the component is initialized
   */
  ngOnInit(): void {
    this.onChange(false);

    this.titleService.setTitle(environment.appName);
    this.activatedRoute.queryParams.subscribe(params => {
      if ("hide" in params) {
        const hideStr = params['hide'];
        this.display = createDisplayOption(hideStr);
      }
    });
  }

  /**
   * Used when changing the questionnaire dropdown
   * @param reload - reload the questionnaire
   */
  onChange(reload=false): void {
    // Clear out preview when changing forms
    this.fhirPreview = '';
    this.error = '';
    this.doNotAskToCalculateScore = false;
    this.rootLevel = false;

    if (this.questionnaire === '' || this.questionnaire === 'upload') {
      this.liveAnnouncer.announce(`Additional settings must be entered below to load the ${this.appName}.`);
      this.fhirQuestionnaire = null;
      this.file = '';
      this.linkId = '';
      this.rootLevel = true;
    } else {
      this.liveAnnouncer.announce(this.formAppearedAnnouncement);
      this.linkId = this.originalLinkId;
      this.expressionUri = this.calculatedExpression;

      this.http.get(`./${this.questionnaire}.json`)
        .subscribe(data => {
          this.fhirQuestionnaire = data;
          this.liveAnnouncer.announce((reload) ? this.formReloadAnnouncement : this.formAppearedAnnouncement);

          if (this.fhirQuestionnaire && this.fhirQuestionnaire.item instanceof Array) {
            this.linkIds = this.getQuestionnaireLinkIds(this.fhirQuestionnaire.item);

            this.defaultItemText = this.linkIds.find((item) => {
              return item.linkId === this.linkId;
            }).text.trim();

            this.composeAutocomplete();

            this.autoComplete.setFieldToListValue(this.defaultItemText);
          }
      });
    }
  }

  /**
   * Toggle between Root/Item section
   */
  toggleRootLevel(): void {
    if (this.rootLevel) {
      this.linkId = '';
      this.autoComplete.setFieldToListValue('');
    } else {
      if (this.questionnaire !== '' && this.questionnaire !== 'upload') {
        this.linkId = this.originalLinkId;
        this.autoComplete.setFieldToListValue(this.defaultItemText);
      }
    }

    this.changeDetectorRef.detectChanges();
  }

  /**
   * Show a preview of the output questionnaire under the expression editor
   * @param fhirResult - questionnaire JSON structure
   */
  onSave(fhirResult): void {
    if (fhirResult) {
      this.displayExpressionEditor = false;
      this.displayExpressionEditorResult = true;
      this.fhirPreview = JSON.stringify(fhirResult, null, 2);
    }
  }

  /**
   * Cancel changes made to the Expression Editor.
   */
  onCancel(): void {
    // Reset it back to the 'bmisimple' questionnaire
    this.questionnaire = 'bmisimple';
    this.onChange(true);
  }


  /**
   * Import a questionnaire from a file using the linkId and expression URI
   * @param fileInput - input file change event
   */
  prepareForImport(fileInput): void {
    if (fileInput.target.files && fileInput.target.files[0]) {
      const fileReader = new FileReader();

      fileReader.onload = (e) => {
        if (typeof e.target.result === 'string') {
          this.doNotAskToCalculateScore = false;
          this.linkId = '';
          try {
            this.fhirQuestionnaire = JSON.parse(e.target.result);
            this.error = '';
            if (this.fhirQuestionnaire && this.fhirQuestionnaire.item instanceof Array) {
              this.linkIds = this.getQuestionnaireLinkIds(this.fhirQuestionnaire.item);

              this.composeAutocomplete();
            }
            this.liveAnnouncer.announce(this.formAppearedAnnouncement);

            if (this.questionnaire === '' || this.questionnaire === 'upload') {
              this.autoComplete.setFieldToListValue('');
              this.rootLevel = true;
            }
          } catch (e) {
            this.fhirQuestionnaire = '';
            this.error = `Could not parse file: ${e}`;
            this.liveAnnouncer.announce(this.error);
          }
        } else {
          this.fhirQuestionnaire = '';
          this.error = 'Could not read file';
          this.liveAnnouncer.announce(this.error);
        }
      };

      fileReader.readAsText(fileInput.target.files[0]);
    }
  }

  /**
   * Generate the autocomplete list
   */
  composeAutocomplete(): void {
    const keys = this.linkIds.map(e => e.text);
    const vals = this.linkIds.map(v => v.linkId);

    const opts = {
      tableFormat: false,
      codes: vals
    }

    this.changeDetectorRef.detectChanges();

    this.autoComplete = new Def.Autocompleter.Prefetch(
      this.autoCompleteElement.nativeElement, keys, opts);

    Def.Autocompleter.Event.observeListSelections('question', (res) => {
      if (((res.input_method === "clicked" || res.input_method === "arrows" ) && res.val_typed_in !== res.final_val && res?.item_code) ||
          (res.input_method === "typed")) {
        this.linkId = res.item_code;

        if (res.input_method === "typed" && !res.item_code)
          this.rootLevel = true;
        else
          this.rootLevel = false;
      }
    });
  }


  /**
   * Get the list of item link IDs in the questionnaire
   * @param items - FHIR questionnaire item array
   * @param level - Depth of item nesting, starting at 0
   * @return Array of link IDs.
   */
  getQuestionnaireLinkIds(items, level = 0): string[] {
    let linkIds = [];

    items.forEach((item) => {
      if (item.linkId) {
        if (item.text) {
          const indent = `${'—'.repeat(level)} `;
          linkIds.push({
            linkId: item.linkId,
            text: `${indent} ${item.text} (${item.linkId})`
          });
        } else {
          linkIds.push({
            linkId: item.linkId,
            text: item.linkId
          });
        }
      }

      if (item.item instanceof Array) {
        linkIds = linkIds.concat(this.getQuestionnaireLinkIds(item.item, level + 1));
      }
    });

    return linkIds;
  }

  /**
   * Trigger a file download of the provided data.
   * @param data - Content of the file which will be downloaded
   * @param name - Name the user sees for the file
   */
  downloadJson(data: string, name?: string): void {
    const datePipe = new DatePipe('en-US');
    const blob = new Blob([data]);

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = datePipe.transform(Date.now(), 'yyyyMMdd-hhmmss');

    a.setAttribute('style', 'display: none');
    a.href = url;
    a.download = name ? `${name}.json` : `fhirpath-${date}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Called when the expression type changes
   * @param $event - Event
   */
  expressionChange($event): void {
    const newValue = $event.target.value;

    if (newValue === '') {
      this.customExpressionUri = false;
      this.expressionUri = newValue;
    } else if (newValue === 'custom') {
      this.userExpressionChoices = null;
      this.customExpressionUri = true;
      this.expressionUri = '';
    } else {
      const currentExpression = this.expressionTypes[newValue];
      this.userExpressionChoices = currentExpression.userExpressionChoices;
      this.customExpressionUri = false;
      this.expressionUri = currentExpression.uri;
    }
  }

  /**
   * Angular lifecycle hook
   */
  ngOnDestroy(): void {
    if (this.autoComplete !== undefined) {
      this.autoComplete.destroy();
    }
  }

  /**
   * Close the Expression Editor dialog
   */
  closeExpressionEditorDialog(): void {
    this.displayExpressionEditor = false;
  }

  /**
   * Open the Expression Editor dialog to edit the expression for the
   * selected item/question
   */
  openExpressionEditorDialog(): void {
    if (this.canOpenExpressionEditor()) {
      this.displayExpressionEditor = true;
      this.displayExpressionEditorResult = false;

      // The lhc-expression-editor component is not presented before the
      // 'Open Expression Editor' button is clicked due to the use of *ngIf.
      // The attributes for the lhc-expression-editor component are not
      // getting updated as a result. The below steps are used to
      // trigger changes to those attributes.
      const tmpUserExpressionChoices = this.userExpressionChoices;
      const tmpCustomExpressionUri = this.customExpressionUri;

      this.userExpressionChoices = null;
      this.customExpressionUri = null;

      this.changeDetectorRef.detectChanges();

      this.userExpressionChoices = tmpUserExpressionChoices;
      this.customExpressionUri = tmpCustomExpressionUri;
    }
  }

  /**
   * Check if the Expression Editor can be opened to edit the expression.
   * @return true if the questionnaire is selected and either the
   * 'Root level' checkbox or a question is selected.
   */
  canOpenExpressionEditor(): boolean {
    return this.fhirQuestionnaire && (this.rootLevel || this.linkId !== null);
  }
}
