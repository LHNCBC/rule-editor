import 'zone.js/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FhirpathEasypathConversionConfirmationDialogComponent } from './fhirpath-easypath-conversion-confirmation-dialog.component';

describe('FhirpathEasypathConversionConfirmationDialogComponent', () => {
  let component: FhirpathEasypathConversionConfirmationDialogComponent;
  let fixture: ComponentFixture<FhirpathEasypathConversionConfirmationDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FhirpathEasypathConversionConfirmationDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FhirpathEasypathConversionConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
