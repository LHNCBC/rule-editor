import { Pipe, PipeTransform } from '@angular/core';
import * as easyPathExpressions from 'easy-path-expressions';

@Pipe({
  name: 'easyPathExpressions'
})
export class EasyPathExpressionsPipe implements PipeTransform {

  transform(value: string, variables: string[]): string {
    if (value !== undefined) {
      variables = variables.filter(v => v !== "");
      const fhirPath = easyPathExpressions.fhirConvert(value, variables);
      if (fhirPath !== null) {
        return fhirPath;
      }
    }

    return 'Not valid';
  }
}
