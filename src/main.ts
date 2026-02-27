import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { A11yModule } from '@angular/cdk/a11y';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AppComponent } from './app/app.component';
import { ExpressionEditorModule, ENVIRONMENT_TOKEN } from 'projects/ngx-expression-editor/src/public-api';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}
interface Env {
  production: boolean,
  appName: string,
  appTitle: string
}

declare global {
  interface Window {
    env: Env;
  }
}

window.env = environment;

bootstrapApplication(AppComponent, {
  providers: [
    { provide: ENVIRONMENT_TOKEN, useValue: environment },
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter([]),
    importProvidersFrom(ExpressionEditorModule, A11yModule, MatTooltipModule)
  ]
}).catch(err => console.error(err));
