import 'zone.js/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { QueryObservationComponent } from './query-observation.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('QueryObservationComponent', () => {
  let component: QueryObservationComponent;
  let fixture: ComponentFixture<QueryObservationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [QueryObservationComponent],
      providers: [provideHttpClient(withInterceptorsFromDi())]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QueryObservationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update the expression on code or time change', () => {
    component.variable = {};
    component.codes = ['http://loinc.org|65972-2'];
    component.timeIntervalUnit = 'days';
    component.timeInterval = 1;
    component.onChange();

    expect(component.expression).toEqual(
      'Observation?code=http://loinc.org|65972-2&date=gt{{today()-1 days}}&patient={{%patient.id}}&_sort=-date&_count=1');

    component.codes = ['http://loinc.org|29463-7', 'http://loinc.org|65972-2'];
    component.timeIntervalUnit = 'months';
    component.timeInterval = 2;
    component.onChange();

    expect(component.expression).toEqual(
      'Observation?code=http://loinc.org|29463-7,http://loinc.org|65972-2&date=gt{{today()-2 months}}&patient={{%patient.id}}&_sort=-date&_count=1');
  });
});
