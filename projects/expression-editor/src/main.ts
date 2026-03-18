import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
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

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
