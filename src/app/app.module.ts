import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { ExpressionEditorModule, ENVIRONMENT_TOKEN } from 'projects/ngx-expression-editor/src/public-api';

import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { A11yModule } from '@angular/cdk/a11y';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../environments/environment';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [],
  bootstrap: [
    AppComponent
  ],
  imports: [
    AppComponent,
    BrowserModule,
    FormsModule,
    ExpressionEditorModule,
    A11yModule,
    MatTooltipModule,
    RouterModule.forRoot([])
  ],
  providers: [
    { provide: ENVIRONMENT_TOKEN, useValue: environment },
    provideHttpClient(withInterceptorsFromDi())
  ]
})
export class AppModule { }
