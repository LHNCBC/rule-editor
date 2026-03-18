import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { ExpressionEditorService, SimpleStyle } from '../expression-editor.service';
import { UneditableVariable } from '../variable';

@Component({
  selector: 'lhc-uneditable-variables',
  templateUrl: './uneditable-variables.component.html',
  styleUrls: ['./uneditable-variables.component.css', '../styles/section.css']
})
export class UneditableVariablesComponent implements OnInit, OnDestroy {
  @Input() lhcStyle: SimpleStyle = {};
  @Input() isSectionExpanded = true;

  uneditableVariables: UneditableVariable[];
  uneditableVariablesSubscription;

  private variableService = inject(ExpressionEditorService);

  /**
   * Angular lifecycle hook called when the component is initialized
   */
  ngOnInit(): void {
    this.uneditableVariables = this.variableService.uneditableVariables;
    this.uneditableVariablesSubscription =
        this.variableService.uneditableVariablesChange.subscribe((variables) => {
      this.uneditableVariables = variables;
    });
  }

  /**
   * Angular lifecycle hook called before the component is destroyed
   */
  ngOnDestroy(): void {
    this.uneditableVariablesSubscription.unsubscribe();
  }

  /**
   * Toggles the expanded state of the component.
   */
  toggle() {
    this.isSectionExpanded = !this.isSectionExpanded;
  }
}
