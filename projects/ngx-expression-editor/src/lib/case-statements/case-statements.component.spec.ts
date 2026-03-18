import 'zone.js/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CaseStatementsComponent } from './case-statements.component';

describe('CaseStatementsComponent', () => {
  let component: CaseStatementsComponent;
  let fixture: ComponentFixture<CaseStatementsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CaseStatementsComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CaseStatementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should parse simple iif', () => {
    const expectedCases = [{condition: 'true', output: '1'}];
    const expectedDefaultOutput = '0';

    expect(component.parseIif('iif(true, 1, 0)', 0)).toBeTrue();
    expect(component.cases).toEqual(expectedCases);
    expect(component.defaultCase).toEqual(expectedDefaultOutput);
    expect(component.parseIif('iif(true,1,0)', 0)).toBeTrue();
    expect(component.cases).toEqual(expectedCases);
    expect(component.defaultCase).toEqual(expectedDefaultOutput);
  });

  it('should parse multiple level iif', () => {
    const expectedCases = [
      {condition: 'true', output: '1'},
      {condition: 'false', output: '2'}
    ];
    const expectedDefaultOutput = '3';

    expect(component.parseIif('iif(true, 1, iif(false, 2, 3))', 0)).toBeTrue();
    expect(component.cases).toEqual(expectedCases);
    expect(component.defaultCase).toEqual(expectedDefaultOutput);
    expect(component.parseIif('iif(true,1,iif(false,2,3))', 0)).toBeTrue();
    expect(component.cases).toEqual(expectedCases);
    expect(component.defaultCase).toEqual(expectedDefaultOutput);
  });

  it('should parse complex multiple level iif', () => {
    const expectedCases = [
      {condition: 'iif(true, 1, 0)', output: 'iif(true, 2, 3)'},
      {condition: 'false', output: '2'}
    ];
    const expectedDefaultOutput = '3';

    expect(component.parseIif('iif(iif(true, 1, 0), iif(true, 2, 3), iif(false, 2, 3))', 0)).toBeTrue();
    expect(component.cases).toEqual(expectedCases);
    expect(component.defaultCase).toEqual(expectedDefaultOutput);
  });

  it('should not parse non-iif expressions', () => {
    expect(component.parseIif('%bmi', 0)).toBeFalse();
    expect(component.parseIif('%bmi * iif(true, 1, 0)', 0)).toBeFalse();
  });
});
