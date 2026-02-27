import { TestBed } from '@angular/core/testing';
import copy from 'fast-copy';
import { ExpressionEditorService } from './expression-editor.service';
import bmi from '../../../../src/assets/bmi.json';
import phq9 from '../../../../src/assets/phq9.json';
import phq9_group from '../../../../src/assets/phq9_group.json';
import phq9_preselected from '../../../../src/assets/phq9_preselected.json';

// This file is not used in the demo. It is solely utilized for testing the
// getSelectedLinkIdsForScoring() function, specifically to validate the scenario where the
// Total Scoring calculation item is located at the child item level.
import phq9_preselected_child_total from '../../../../src/test/data/phq9_preselected_child_total.json';

import phq9_preselected_without_scoring_ext from '../../../../src/test/data/phq9_preselected_without_scoring_ext.json';

const outputTotalScore = {
  url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression',
  valueExpression: {
    description: 'Total score calculation',
    language: 'text/fhirpath',
    expression: 'iif(%any_questions_answered, iif(%a.exists(), %a, 0) + iif(%b.exists(), %b, 0) + ' +
      'iif(%c.exists(), %c, 0) + iif(%d.exists(), %d, 0) + iif(%e.exists(), %e, 0) + ' +
      'iif(%f.exists(), %f, 0) + iif(%g.exists(), %g, 0) + iif(%h.exists(), %h, 0) + ' +
      'iif(%i.exists(), %i, 0), {})',
    extension: [{
      url: ExpressionEditorService.SCORE_EXPRESSION_EXTENSION_LINKIDS,
      valueString: "[\"/44250-9\",\"/44255-8\",\"/44259-0\",\"/44254-1\",\"/44251-7\"," +
        "\"/44258-2\",\"/44252-5\",\"/44253-3\",\"/44260-8\"]"
    }]
  }
};

const outputItem = {
  url: 'http://hl7.org/fhir/StructureDefinition/variable',
  valueExpression: {
    name: 'i',
    language: 'text/fhirpath',
    expression: '%questionnaire.item.where(linkId = \'/44260-8\').answerOption' +
      '.where(valueCoding.code=%resource.item.where(linkId = \'/44260-8\').answer.valueCoding.code)' +
      '.extension.where(url=\'http://hl7.org/fhir/StructureDefinition/ordinalValue\').valueDecimal',
    extension: [{
      url: 'http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-score-variable',
      valueBoolean: true
    }]
  }
};

const outputItemWhereExpression = ".item.where(linkId = '/44254-1')";

const outputItemExpression = "%questionnaire.item.where(linkId = '/44254-1').answerOption" +
  ".where(valueCoding.code=%resource.item.where(linkId = '/44254-1').answer.valueCoding.code)" +
  ".extension.where(url='http://hl7.org/fhir/StructureDefinition/ordinalValue').valueDecimal"


const phq9_scoringItemLinkIds = [
  "/44250-9", "/44255-8", "/44259-0", "/44254-1", "/44251-7",
  "/44258-2", "/44252-5", "/44253-3", "/44260-8"
];

const phq9_partialScoringItemLinkIds = [
  "/44250-9", "/44254-1", "/44260-8"
];

const outputGroupItemWhereExpression = ".item.where(linkId = '/45900-0').item.where(linkId = '/45900-0/44254-1')";

const outputGroupItemExpression = "%questionnaire.item.where(linkId = '/45900-0').item" +
  ".where(linkId = '/45900-0/44254-1').answerOption.where(valueCoding.code=%resource.item" +
  ".where(linkId = '/45900-0').item.where(linkId = '/45900-0/44254-1').answer.valueCoding.code)" +
  ".extension.where(url='http://hl7.org/fhir/StructureDefinition/ordinalValue').valueDecimal"

const phq9_group_scoringItemLinkIds = [
  "/45900-0/44250-9", "/45900-0/44255-8", "/45900-0/44259-0", "/45900-0/44254-1", "/44251-7",
  "/44258-2", "/44252-5", "/44253-3", "/44260-8"
];

const phq9_group_partialScoringItemLinkIds = [
  "/45900-0/44250-9", "/45900-0/44254-1", "/44260-8"
];

describe('ExpressionEditorService', () => {
  const LINK_ID = '/39156-5';
  const BMI_INDEX = 3;
  const EXPRESSION_URI = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression';

  let service: ExpressionEditorService;
  const emptyCalculatedExpression = {
    url: EXPRESSION_URI,
    valueExpression: {
      language: 'text/fhirpath',
      expression: ''
    }
  };
  const TEST_EXTENSION = {url: 'http://example.com/test'};

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExpressionEditorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should keep extension order on save with no modifications', () => {
    // @ts-ignore
    bmi.item[BMI_INDEX].extension.push(TEST_EXTENSION);
    service.import(EXPRESSION_URI, bmi, LINK_ID);
    const saved = service.export(EXPRESSION_URI, emptyCalculatedExpression);

    // Make sure the test extension is still at the end

    // @ts-ignore
    expect(saved.item[BMI_INDEX].extension[saved.item[BMI_INDEX].extension.length - 2]).toEqual(TEST_EXTENSION);
  });

  it('should keep extension order on save when adding a variable', () => {
    // @ts-ignore
    bmi.item[BMI_INDEX].extension.push(TEST_EXTENSION);
    service.import(EXPRESSION_URI, bmi, LINK_ID);

    service.addVariable();
    const saved = service.export(EXPRESSION_URI, emptyCalculatedExpression);

    // Make sure the test extension is second from last
    // @ts-ignore
    expect(saved.item[BMI_INDEX].extension[saved.item[BMI_INDEX].extension.length - 3]).toEqual(TEST_EXTENSION);
  });

  it('should be able to add and remove scores', () => {

    service.import('http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression',
      phq9, LINK_ID);
    const original = phq9;

    // Check to make sure we start with the expected number of extensions on the target item
    const INITIAL_EXTENSION_COUNT = 4;
    const CONTEXT_INDEX = 9;
    expect(original.item[CONTEXT_INDEX].extension.length).toEqual(INITIAL_EXTENSION_COUNT);

    expect(service.isScoreCalculation(original, LINK_ID)).toBeFalse();

    service.setItemLinkIdsForTotalCalculation(phq9_scoringItemLinkIds);
    const withScores = service.addSumOfScores();
    const withScoresCopy = copy(withScores);

    expect(service.isScoreCalculation(withScores, LINK_ID)).toBeTrue();

    expect(withScores.item[CONTEXT_INDEX].extension.length).toEqual(INITIAL_EXTENSION_COUNT + 11);

    expect(service.updateScoreCalculation(withScores, LINK_ID)).toEqual(withScoresCopy);

    const removedScores = service.removeSumOfScores(withScores);

    expect(removedScores.item[CONTEXT_INDEX].extension.length).toEqual(INITIAL_EXTENSION_COUNT);
    expect(removedScores).toEqual(phq9);
  });

  it('should return scored questionnaire with total score', () => {
    service.setItemLinkIdsForTotalCalculation(phq9_scoringItemLinkIds);
    const output = service.addTotalScoreRule(copy(phq9), LINK_ID);
    // @ts-ignore
    expect(output.item[9].extension[14]).toEqual(outputTotalScore);
  });

  it('should return scored questionnaire with var10', () => {
    service.setItemLinkIdsForTotalCalculation(phq9_scoringItemLinkIds);
    const output = service.addTotalScoreRule(copy(phq9), LINK_ID);
    // @ts-ignore
    expect(output.item[9].extension[12]).toEqual(outputItem);
  });

  it('should return item scoring expression with var "i"', () => {
    service.setItemLinkIdsForTotalCalculation(phq9_scoringItemLinkIds);
    const output = service.composeItemsWhereConditionExpressions(copy(phq9.item), LINK_ID);

    // there should be 9 item selections
    expect(output.length).toEqual(9);

    expect(output[3]['itemQuery']).toEqual(outputItemWhereExpression);
  });

  it('should return partial selection item scoring expression with var "c"', () => {
    service.setItemLinkIdsForTotalCalculation(phq9_partialScoringItemLinkIds);
    const output = service.composeItemsWhereConditionExpressions(copy(phq9.item), LINK_ID);

    // there should be only 3 item selections
    expect(output.length).toEqual(3);

    expect(output[1]['itemQuery']).toEqual(outputItemWhereExpression);
  });

  it('should return scoring expression with var "d"', () => {
    service.setItemLinkIdsForTotalCalculation(phq9_scoringItemLinkIds);
    const output = service.composeScoringItemsExpressions(copy(phq9.item), LINK_ID);

    // there should be 9 item selections
    expect(output.length).toEqual(9);

    expect(output[3]).toEqual(outputItemExpression);
  });

  it('should return partial selection scoring expression with var "c"', () => {
    service.setItemLinkIdsForTotalCalculation(phq9_partialScoringItemLinkIds);
    const output = service.composeScoringItemsExpressions(copy(phq9.item), LINK_ID);

    // there should be only 3 item selections
    expect(output.length).toEqual(3);

    expect(output[1]).toEqual(outputItemExpression);
  });


  // PHQ9_GROUP
  it('should return item scoring expression with var "d"', () => {
    service.setItemLinkIdsForTotalCalculation(phq9_group_scoringItemLinkIds);
    const output = service.composeItemsWhereConditionExpressions(copy(phq9_group.item), LINK_ID);

    // there should be 9 item selections
    expect(output.length).toEqual(9);

    expect(output[3]['itemQuery']).toEqual(outputGroupItemWhereExpression);
  });

  it('should return partial selection item scoring expression with var "c"', () => {
    service.setItemLinkIdsForTotalCalculation(phq9_group_partialScoringItemLinkIds);
    const output = service.composeItemsWhereConditionExpressions(copy(phq9_group.item), LINK_ID);

    // there should be only 3 item selections
    expect(output.length).toEqual(3);

    expect(output[1]['itemQuery']).toEqual(outputGroupItemWhereExpression);
  });

  it('should return scoring expression with var "d"', () => {
    service.setItemLinkIdsForTotalCalculation(phq9_group_scoringItemLinkIds);
    const output = service.composeScoringItemsExpressions(copy(phq9_group.item), LINK_ID);


    // there should be 9 item selections
    expect(output.length).toEqual(9);

    expect(output[3]).toEqual(outputGroupItemExpression);
  });

  it('should return partial selection scoring expression with var "c"', () => {
    service.setItemLinkIdsForTotalCalculation(phq9_group_partialScoringItemLinkIds);
    const output = service.composeScoringItemsExpressions(copy(phq9_group.item), LINK_ID);

    // there should be only 3 item selections
    expect(output.length).toEqual(3);

    expect(output[1]).toEqual(outputGroupItemExpression);
  });

  it('should return pre-selected link ids if available', () => {
    const preselectedLinkIds = service.getSelectedScoringLinkIds(copy(phq9_preselected.item), LINK_ID);

    // there should be 6 items selected
    expect(preselectedLinkIds.length).toEqual(6);

    expect(preselectedLinkIds[0]).toEqual("/45900-0/44255-8");
    expect(preselectedLinkIds[1]).toEqual("/44251-7");
    expect(preselectedLinkIds[2]).toEqual("/44252-5");
    expect(preselectedLinkIds[3]).toEqual("/44252-5/44255-8");
    expect(preselectedLinkIds[4]).toEqual("/44260-8");
    expect(preselectedLinkIds[5]).toEqual("/44260-8/45907-0/44259-0");
  });

  it('should return number of scoring items based on the selected item', () => {
    const firstItem = service.getScoreItems(phq9.item, "/44250-9")['scoreItems'];
    expect(firstItem.length).toEqual(0);

    const secondItem = service.getScoreItems(phq9.item, "/44255-8")['scoreItems'];
    expect(secondItem.length).toEqual(1);

    const totalItem = service.getScoreItems(phq9.item, "/39156-5")['scoreItems'];
    expect(totalItem.length).toEqual(9);

    // PHQ9 Group - testing hierarchical scoring items.
    const group1 = service.getScoreItems(phq9_group.item, "/45900-0")['scoreItems'];
    expect(group1.length).toEqual(0);

    const childItem1 = service.getScoreItems(phq9_group.item, "/45900-0/44250-9")['scoreItems'];
    expect(childItem1.length).toEqual(0);

    const childItem2 = service.getScoreItems(phq9_group.item, "/45900-0/44255-8")['scoreItems'];
    expect(childItem2.length).toEqual(1);
    const parentOfChildItem2 = childItem2[0];
    expect(Object.keys(parentOfChildItem2)).not.toContain('hasScore');
    expect(Object.keys(parentOfChildItem2)).toContain('item');
    expect(parentOfChildItem2.item.length).toEqual(1);

    const childItem4 = service.getScoreItems(phq9_group.item, "/45900-0/44254-1")['scoreItems'];
    expect(childItem4.length).toEqual(1);
    expect(childItem4[0].item.length).toEqual(3);

    const parentScoringItem1 = service.getScoreItems(phq9_group.item, "/44251-7")['scoreItems'];
    expect(parentScoringItem1.length).toEqual(1);
    expect(Object.keys(parentScoringItem1[0])).not.toContain('hasScore');
    expect(parentScoringItem1[0].item.length).toEqual(4);

    const parentScoringItem2 = service.getScoreItems(phq9_group.item, "/44258-2")['scoreItems'];
    expect(parentScoringItem2.length).toEqual(2);
    expect(Object.keys(parentScoringItem2[0])).not.toContain('hasScore');
    expect(Object.keys(parentScoringItem2[1])).toContain('hasScore');
    expect(Object.keys(parentScoringItem2[1])).not.toContain('item');

    const parentNonScoringItem1 = service.getScoreItems(phq9_group.item, "/44253-5")['scoreItems'];
    // Have 3 sibling items before this.
    expect(parentNonScoringItem1.length).toEqual(3);

    const childItem6 = service.getScoreItems(phq9_group.item, "/44253-5/44255-8")['scoreItems'];
    expect(childItem6.length).toEqual(4);
    const parentOfChildItem6 = childItem6[3];
    expect(Object.keys(parentOfChildItem6)).not.toContain('hasScore');
    expect(Object.keys(parentOfChildItem6)).toContain('item');
    expect(parentOfChildItem6.item.length).toEqual(1);

    const parentScoringItem3 = service.getScoreItems(phq9_group.item, "/44252-5")['scoreItems'];
    expect(parentScoringItem3.length).toEqual(4);
    expect(Object.keys(parentScoringItem3[0])).not.toContain('hasScore');
    expect(Object.keys(parentScoringItem3[1])).toContain('hasScore');
    expect(Object.keys(parentScoringItem3[1])).not.toContain('item');
    expect(Object.keys(parentScoringItem3[2])).toContain('hasScore');
    expect(Object.keys(parentScoringItem3[2])).not.toContain('item');
    expect(Object.keys(parentScoringItem3[3])).not.toContain('hasScore');
    expect(Object.keys(parentScoringItem3[3])).toContain('item');

    const childItem8 = service.getScoreItems(phq9_group.item, "/44252-5/44255-8")['scoreItems'];
    expect(childItem8.length).toEqual(5);
    const parentOfChildItem8 = childItem8[4];
    expect(Object.keys(parentOfChildItem8)).toContain('hasScore');
    expect(Object.keys(parentOfChildItem8)).toContain('item');
    expect(parentOfChildItem8.item.length).toEqual(1);

    const parentScoringItem4 = service.getScoreItems(phq9_group.item, "/44253-3")['scoreItems'];
    expect(parentScoringItem4.length).toEqual(5);
    expect(Object.keys(parentScoringItem4[0])).not.toContain('hasScore');
    expect(Object.keys(parentScoringItem4[1])).toContain('hasScore');
    expect(Object.keys(parentScoringItem4[1])).not.toContain('item');
    expect(Object.keys(parentScoringItem4[2])).toContain('hasScore');
    expect(Object.keys(parentScoringItem4[2])).not.toContain('item');
    expect(Object.keys(parentScoringItem4[3])).not.toContain('hasScore');
    expect(Object.keys(parentScoringItem4[3])).toContain('item');
    expect(Object.keys(parentScoringItem4[4])).toContain('hasScore');
    expect(Object.keys(parentScoringItem4[4])).toContain('item');

    const parentScoringItem5 = service.getScoreItems(phq9_group.item, "/44260-8")['scoreItems'];
    expect(parentScoringItem5.length).toEqual(6);
    expect(Object.keys(parentScoringItem5[0])).not.toContain('hasScore');
    expect(Object.keys(parentScoringItem5[1])).toContain('hasScore');
    expect(Object.keys(parentScoringItem5[1])).not.toContain('item');
    expect(Object.keys(parentScoringItem5[2])).toContain('hasScore');
    expect(Object.keys(parentScoringItem5[2])).not.toContain('item');
    expect(Object.keys(parentScoringItem5[3])).not.toContain('hasScore');
    expect(Object.keys(parentScoringItem5[3])).toContain('item');
    expect(Object.keys(parentScoringItem5[4])).toContain('hasScore');
    expect(Object.keys(parentScoringItem5[4])).toContain('item');
    expect(Object.keys(parentScoringItem5[5])).toContain('hasScore');
    expect(Object.keys(parentScoringItem5[5])).not.toContain('item');

    const grandchildItem1 = service.getScoreItems(phq9_group.item, "/44260-8/45907-0/44250-9")['scoreItems'];
    expect(grandchildItem1.length).toEqual(7);
    // /44260-8 is a scoring item and also contains child scoring items.
    const grandParentOfGrandChildItem1 = grandchildItem1[6];
    expect(grandParentOfGrandChildItem1.linkId).toEqual("/44260-8");
    expect(grandParentOfGrandChildItem1.type).toEqual("choice");
    expect(Object.keys(grandParentOfGrandChildItem1)).toContain('hasScore');
    expect(Object.keys(grandParentOfGrandChildItem1)).toContain('item');
    // /44260-8/45907-0 is a group, and for this selection, the grandchild is also empty,
    // so it is not included here.
    expect(grandParentOfGrandChildItem1.item.length).toEqual(0);

    const grandchildItem4 = service.getScoreItems(phq9_group.item, "/44260-8/45907-0/44254-1")['scoreItems'];
    const parentOfGrandChildItem4 = grandchildItem4[6].item[0];
    expect(parentOfGrandChildItem4.item.length).toEqual(3);
    expect(parentOfGrandChildItem4.item[0].linkId).toEqual("/44260-8/45907-0/44250-9");
    expect(parentOfGrandChildItem4.item[0].type).toEqual("choice");
    expect(parentOfGrandChildItem4.item[1].linkId).toEqual("/44260-8/45907-0/44255-8");
    expect(parentOfGrandChildItem4.item[1].type).toEqual("choice");
    expect(parentOfGrandChildItem4.item[2].linkId).toEqual("/44260-8/45907-0/44259-0");
    expect(parentOfGrandChildItem4.item[2].type).toEqual("choice");

    const childNonScoringItem1 = service.getScoreItems(phq9_group.item, "/44260-8/44253-5")['scoreItems'];
    expect(childNonScoringItem1.length).toEqual(7);
    // sibling
    expect(childNonScoringItem1[6].item.length).toEqual(1);
    expect(childNonScoringItem1[6].item[0].type).toEqual("group");

    const grandchildItem6 = service.getScoreItems(phq9_group.item, "/44260-8/44253-5/44255-8")['scoreItems'];
    expect(grandchildItem6.length).toEqual(7);
    // /44260-8 is a scoring item and also contains child scoring items.
    const grandParentOfGrandChildItem6 = grandchildItem6[6];
    expect(grandParentOfGrandChildItem6.linkId).toEqual("/44260-8");
    expect(Object.keys(grandParentOfGrandChildItem6)).toContain('hasScore');
    expect(Object.keys(grandParentOfGrandChildItem6)).toContain('item');
    // /44260-8 has 2 child items
    expect(grandParentOfGrandChildItem6.item.length).toEqual(2);
    // /44260-8/44253-5 is a second child item, a non-scoring item, and contains child scoring items
    const parentOfGrandChildItem6 = grandchildItem6[6].item[1];
    expect(parentOfGrandChildItem6.linkId).toEqual("/44260-8/44253-5");
    expect(parentOfGrandChildItem6.type).toEqual("choice");
    expect(Object.keys(parentOfGrandChildItem6)).not.toContain('hasScore');
    expect(Object.keys(parentOfGrandChildItem6)).toContain('item');
    // sibling
    expect(parentOfGrandChildItem6.item.length).toEqual(1);
    expect(parentOfGrandChildItem6.item[0].linkId).toEqual("/44260-8/44253-5/44250-9");
    expect(parentOfGrandChildItem6.item[0].type).toEqual("choice");

    const childScoringItem1 = service.getScoreItems(phq9_group.item, "/44260-8/44252-5")['scoreItems'];
    expect(childScoringItem1.length).toEqual(7);
    // sibling
    expect(childScoringItem1[6].item.length).toEqual(2);
    // 1st sibling is a group
    expect(childScoringItem1[6].item[0].type).toEqual("group");
    // 2nd sibling is a choice
    expect(childScoringItem1[6].item[1].type).toEqual("choice");

    const grandchildItem8 = service.getScoreItems(phq9_group.item, "/44260-8/44252-5/44255-8")['scoreItems'];
    expect(grandchildItem8.length).toEqual(7);
    // /44260-8 is a scoring item and also contains child scoring items.
    const grandParentOfGrandChildItem8 = grandchildItem8[6];
    expect(grandParentOfGrandChildItem8.linkId).toEqual("/44260-8");
    expect(Object.keys(grandParentOfGrandChildItem8)).toContain('hasScore');
    expect(Object.keys(grandParentOfGrandChildItem8)).toContain('item');
    // /44260-8 has 3 child items
    expect(grandParentOfGrandChildItem8.item.length).toEqual(3);
    // /44260-8/44252-5 is a third child item, a scoring item, and also contains child scoring items.
    const parentOfGrandChildItem8 = grandchildItem8[6].item[2];
    expect(parentOfGrandChildItem8.linkId).toEqual("/44260-8/44252-5");
    expect(parentOfGrandChildItem8.type).toEqual("choice");
    expect(Object.keys(parentOfGrandChildItem8)).toContain('hasScore');
    expect(Object.keys(parentOfGrandChildItem8)).toContain('item');
    // sibling
    expect(parentOfGrandChildItem8.item.length).toEqual(1);
    expect(parentOfGrandChildItem8.item[0].linkId).toEqual("/44260-8/44252-5/44250-9");
    expect(parentOfGrandChildItem8.item[0].type).toEqual("choice");
  });

  it('should return whether the selected item has scoring items', () => {
    const firstItem = service.hasCalculatedScoringItems(copy(phq9.item), "/44250-9");
    expect(firstItem).toBeFalse();

    const secondItem = service.hasCalculatedScoringItems(copy(phq9.item), "/44255-8");
    expect(secondItem).toBeTrue();

    const totalItem = service.hasCalculatedScoringItems(copy(phq9.item), "/39156-5");
    expect(totalItem).toBeTrue();
  });

  it('should determine if item contains standard calculated expression', () => {
    const scoringItem = copy(phq9_preselected_without_scoring_ext.item[0]);
    const totalScoringStandardCalculatedExpressionItem = copy(phq9_preselected_without_scoring_ext.item[9]);
    const totalScoringNewCalculatedExpressionItem = copy(phq9_preselected.item[6]);

    const result = service.hasStandardCalculatedExpressionForItem(scoringItem);
    expect(result).toBeFalse();

    const result2 =
      service.hasStandardCalculatedExpressionForItem(totalScoringStandardCalculatedExpressionItem);
    expect(result2).toBeTrue();

    const result3 =
      service.hasStandardCalculatedExpressionForItem(totalScoringNewCalculatedExpressionItem);
    expect(result3).toBeFalse();
  });


  it('should determine if item contains standard calculated expression based on linkId', () => {
    // Empty linkId
    const emptyLinkId =
      service.hasStandardCalculatedExpression(copy(phq9_preselected_without_scoring_ext), "");
    expect(emptyLinkId).toBeFalse();

    // Null linkId
    const nullLinkId =
      service.hasStandardCalculatedExpression(copy(phq9_preselected_without_scoring_ext), null);
    expect(nullLinkId).toBeFalse();

    // Undefined linkId
    const undefinedLinkId =
      service.hasStandardCalculatedExpression(copy(phq9_preselected_without_scoring_ext), undefined);
    expect(undefinedLinkId).toBeFalse();

    // Scoring item - does not contain calculated expression
    const scoringItem =
      service.hasStandardCalculatedExpression(copy(phq9_preselected_without_scoring_ext), "/44251-7");
    expect(scoringItem).toBeFalse();

    // Predefined total scoring calculation with standard calculated expression
    const totalScoringStandardCalculatedExpression =
      service.hasStandardCalculatedExpression(copy(phq9_preselected_without_scoring_ext), "/44261-6");
    expect(totalScoringStandardCalculatedExpression).toBeTrue();

    // Item that can be used as for total scoring calculation - does not contain calculated expression
    const canBeTotalScoring = service.hasStandardCalculatedExpression(copy(phq9), "/39156-5");
    expect(canBeTotalScoring).toBeFalse();

    // Predefined total scoring calculation with new calculated expression
    const totalScoringNewCalculatedExpression =
      service.hasStandardCalculatedExpression(copy(phq9_preselected), "/39156-5");
    expect(totalScoringNewCalculatedExpression).toBeFalse();
  });

  it('should determine if the scoring calculation prompt will be displayed', () => {
    const answerExpressionUri = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-answerExpression";
    const calculatedExpressionUri = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression";
    const enableWhenExpressionUri = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression";
    const initialExpressionUri = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-initialExpression";

    // Output Expression - None
    const emptyOutputExpressionPrompt = service.shouldCalculateScoreForItem(copy(phq9), "/39156-5", "");
    expect(emptyOutputExpressionPrompt).toBeFalse();

    // Output Expression = Answer Expression
    const answerExpressionPrompt =
      service.shouldCalculateScoreForItem(copy(phq9), "/39156-5", answerExpressionUri);
    expect(answerExpressionPrompt).toBeFalse();

    // Output Expression = Calculated Expression
    const calculatedExpressionPrompt =
      service.shouldCalculateScoreForItem(copy(phq9_preselected), "/39156-5", calculatedExpressionUri);
    expect(calculatedExpressionPrompt).toBeTrue();

    // Output Expression = Calculated/Initial Expression (user editable)
    const calculatedInitExpressionPrompt =
      service.shouldCalculateScoreForItem(copy(phq9_preselected), "/39156-5", calculatedExpressionUri);
    expect(calculatedInitExpressionPrompt).toBeTrue();

    // Output Expression = Enable When Expression
    const enableWhenExpressionPrompt =
      service.shouldCalculateScoreForItem(copy(phq9), "/39156-5", enableWhenExpressionUri);
    expect(enableWhenExpressionPrompt).toBeFalse();

    // Output Expression = Initial Expression
    const initialExpressionPrompt =
      service.shouldCalculateScoreForItem(copy(phq9), "/39156-5", initialExpressionUri);
    expect(initialExpressionPrompt).toBeFalse();

    // First item in the list - no scoring items to be calculated
    const firstItemPrompt =
      service.shouldCalculateScoreForItem(copy(phq9), "/44250-9", calculatedExpressionUri);
    expect(firstItemPrompt).toBeFalse();

    // Second item in the list - should have one scoring item to be calculated
    const secondItemPrompt =
      service.shouldCalculateScoreForItem(copy(phq9), "/44255-8", calculatedExpressionUri);
    expect(secondItemPrompt).toBeTrue();

    // Predefined total scoring calculation with standard calculated expression
    const scoringStandardCalculatedExpressionPrompt =
      service.shouldCalculateScoreForItem(copy(phq9_preselected_without_scoring_ext), "/44261-6", calculatedExpressionUri);
    expect(scoringStandardCalculatedExpressionPrompt).toBeFalse();

    // Predefined total scoring calculation with new calculated expression
    const scoringNewCalculatedExpressionPrompt =
    service.shouldCalculateScoreForItem(copy(phq9_preselected), "/39156-5", calculatedExpressionUri);
    expect(scoringNewCalculatedExpressionPrompt).toBeTrue();
  });

  it('should return pre-selected link ids from the child item', () => {
    const preselectedLinkIds = service.getSelectedScoringLinkIds(copy(phq9_preselected_child_total.item), LINK_ID);

    // There should be 2 items selected
    expect(preselectedLinkIds.length).toEqual(2);

    expect(preselectedLinkIds[0]).toEqual("/44251-7");
    expect(preselectedLinkIds[1]).toEqual("/44258-2");
  });

  describe('score calculation getScoreItemIds', () => {
    function score(name): any {
      return {
        linkId: name, answerOption: [{
          extension: [{
            url: 'http://hl7.org/fhir/StructureDefinition/ordinalValue'
          }]
        }]
      };
    }
    const totalScore = {
      linkId: '',
      extension: [{
        url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression',
        valueExpression: {
          extension:
            [{url: ExpressionEditorService.SCORE_EXPRESSION_EXTENSION}]
        }
      }]
    };

    it('should not include items below total score', () => {
      const nonScore = {};
      const total = {linkId: 'test'};

      const testItems = [nonScore, {
        item:
          [score('a'), score('b')]
      }, score('c'), total, score('d')];
      const itemIds = service.getScoreItemIds(testItems, 'test');

      expect(itemIds).toEqual(['a', 'b', 'c']);
    });

    it('should not include items above another total score', () => {
      const nonScore = {};
      const total = {linkId: 'test'};

      const testItems = [nonScore, {item: [score('a'), score('b')]},
        totalScore, score('c'), total, score('d')];
      const itemIds = service.getScoreItemIds(testItems, 'test');

      expect(itemIds).toEqual(['c']);
    });

    it('should not include items below another total score', () => {
      const total = {linkId: 'test'};
      const existingTotalScore = {
        linkId: '',
        extension: [{
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression',
          valueExpression: {
            extension:
              [{url: ExpressionEditorService.SCORE_EXPRESSION_EXTENSION}]
          }
        }]
      };

      const testItems = [score('a'), existingTotalScore, score('b'), total, score('c')];
      const itemIds = service.getScoreItemIds(testItems, 'test');

      expect(itemIds).toEqual(['b']);
    });
  });

  it('should get item ancestors correctly', () => {
    // In the test data below, the linkIds repeat, but that should not affect
    // getAncestors
    const item = { linkId: 'notTarget' };
    const nested = { linkId: 'notTarget', item: [item, item]};
    const items = [
      nested,
      nested,
      {
        linkId: 'root',
        item: [item, { linkId: 'nested', item: [{linkId: 'target'}]}, item]
      },
      nested
    ];
    const output = service.getAncestors(items, 'target', []);

    expect(output.length).toEqual(2);
    expect(output[0].linkId).toEqual('root');
    expect(output[1].linkId).toEqual('nested');
  });

  describe('isValidDoubleBracesSyntax', () => {
    it('should validate if string has valid double braces', () => {
      // Contain no {{}}, return true
      const output = service.isValidDoubleBracesSyntax("-date");
      expect(output).toEqual(true);
      const output2 = service.isValidDoubleBracesSyntax("{%patient.id}");
      expect(output2).toEqual(true);

      // Contain equal number of {{}}, in correct order, return true
      const output3 = service.isValidDoubleBracesSyntax("{{%patient.id}}");
      expect(output3).toEqual(true);
      const output4 = service.isValidDoubleBracesSyntax("gt{{today()-1 months}} and {{day()}}");
      expect(output4).toEqual(true);

      // Either contain incorrect order or unequal number of {{ and }}, return false
      const output5 = service.isValidDoubleBracesSyntax("}}%patient.id{{");
      expect(output5).toEqual(false);
      const output6 = service.isValidDoubleBracesSyntax("gh{{today()");
      expect(output6).toEqual(false);
      const output7 = service.isValidDoubleBracesSyntax("ghtoday()}}");
      expect(output7).toEqual(false);
      const output8 = service.isValidDoubleBracesSyntax("gt{{today()-1 months}} and {{day()");
      expect(output8).toEqual(false);
      const output9 = service.isValidDoubleBracesSyntax("{{{{%a * 2}} - %b}}");
      expect(output9).toEqual(false);
      const output10 = service.isValidDoubleBracesSyntax("{{{{{{%a * 2}} - %b}} + %c}}");
      expect(output10).toEqual(false);
    });
  });

  describe('encodeParamValue', () => {
    it('should URI encode string not include in double braces or content inside it', () => {
      // URI encoded
      const output = service.encodeParamValue("-date");
      expect(output).toEqual("-date");
      const output2 = service.encodeParamValue("{%patient.id}");
      expect(output2).toEqual("%7B%25patient.id%7D");

      // Contains valid double braces, no URI encoded on the braces or content inside
      const output3 = service.encodeParamValue("{{%patient.id}}");
      expect(output3).toEqual("{{%patient.id}}");

      // URI encoded text before and between the two {{}}
      const output4 = service.encodeParamValue("gt{{today()-1 months}} and {{day()}}");
      expect(output4).toEqual("gt{{today()-1 months}}%20and%20{{day()}}");

      // This has {{}} but in incorrect order, so the URI encode in this case.
      // In the future, these will be shown as error.
      const output5 = service.encodeParamValue("}}%patient.id{{");
      expect(output5).toEqual("}}%patient.id{{");

      // The following has unequal number of {{ and }}, so no URI encode in these cases.
      // In the future, these will be shown as error.
      const output6 = service.encodeParamValue("gh{{today()");
      expect(output6).toEqual("gh{{today()");
      const output7 = service.encodeParamValue("ghtoday()}}");
      expect(output7).toEqual("ghtoday()}}");
      const output8 = service.encodeParamValue("gt{{today()-1 months}} and {{day()");
      expect(output8).toEqual("gt{{today()-1 months}} and {{day()");
      const output9 = service.encodeParamValue("{{{{%a * 2}} - %b}}");
      expect(output9).toEqual("{{{{%a * 2}} - %b}}");
      const output10 = service.encodeParamValue("{{{{{{%a * 2}} - %b}} + %c}}");
      expect(output10).toEqual("{{{{{{%a * 2}} - %b}} + %c}}");
    });
  });

  describe('decodeFHIRQueryObservationURIExpression', () => {
    it('should extract FHIR Query Observation object', () => {
      // URI encoded
      const expressionConditionResource = "Condition?onset=23%20May%202009";
      const expressionObservationResourceShort = "Observation?code=loinc|1234-1";
      const expressionObservationResource =
        "Observation?code=test%2Chttp://loinc.org|65972-2&date=gt{{today()-2 days}}&patient={{%patient.id}}&_sort=-date&_count=1";
      const expressionObservationResourceParamsDiffOrders =
        "Observation?_sort=-date&_count=1&code=test%2Chttp://loinc.org|65972-2&date=gt{{today()-4 weeks}}&patient={{%patient.id}}";
      const expressionObservationResourceParamsDiffOrders2 =
        "Observation?patient={{%patient.id}}&_sort=-date&_count=1&code=test%2Chttp://loinc.org|65972-2&date=gt{{today()-6 months}}";
      const expressionObservationMissingValue =
        "Observation?code=test%2Chttp://loinc.org|65972-2&date=gt{{today()-2 days}}&patient=&_sort=-date&_count=1";
      const expressionObservationWithNoParameters = "Observation";
      const expressionObservationMissingKey =
        "Observation?code=test%2Chttp://loinc.org|65972-2&date=gt{{today()-2 days}}&_sort=-date&_count=1";

      const fhirqueryobs1 = service.decodeFHIRQueryObservationURIExpression(expressionConditionResource);
      const fhirqueryobs2 = service.decodeFHIRQueryObservationURIExpression(expressionObservationResourceShort);
      const fhirqueryobs3 = service.decodeFHIRQueryObservationURIExpression(expressionObservationResource);
      const fhirqueryobs4 = service.decodeFHIRQueryObservationURIExpression(expressionObservationResourceParamsDiffOrders);
      const fhirqueryobs5 = service.decodeFHIRQueryObservationURIExpression(expressionObservationResourceParamsDiffOrders2);
      const fhirqueryobs6 = service.decodeFHIRQueryObservationURIExpression(expressionObservationMissingValue);
      const fhirqueryobs7 = service.decodeFHIRQueryObservationURIExpression(expressionObservationWithNoParameters);
      const fhirqueryobs8 = service.decodeFHIRQueryObservationURIExpression(expressionObservationMissingKey);

      expect(fhirqueryobs1).toBeNull();
      expect(fhirqueryobs2).toBeNull();

      expect(fhirqueryobs3).not.toBeNull();
      const output3Keys = Object.keys(fhirqueryobs3);
      for (const field of ExpressionEditorService.FHIR_QUERY_OBS_FIELDS) {
        expect(output3Keys).toContain(field);
      }
      expect(fhirqueryobs3['date']).toEqual("gt{{today()-2 days}}");

      expect(fhirqueryobs4).not.toBeNull();
      const output4Keys = Object.keys(fhirqueryobs4);
      for (const field of ExpressionEditorService.FHIR_QUERY_OBS_FIELDS) {
        expect(output4Keys).toContain(field);
      }
      expect(fhirqueryobs4['date']).toEqual("gt{{today()-4 weeks}}");

      expect(fhirqueryobs5).not.toBeNull();
      const output5Keys = Object.keys(fhirqueryobs5);
      for (const field of ExpressionEditorService.FHIR_QUERY_OBS_FIELDS) {
        expect(output5Keys).toContain(field);
      }
      expect(fhirqueryobs5['date']).toEqual("gt{{today()-6 months}}");

      expect(fhirqueryobs6).toBeNull();
      expect(fhirqueryobs7).toBeNull();
      expect(fhirqueryobs8).toBeNull();
    });
  });

  describe('getFHIRQueryObservationMatches', () => {
    it('should extract FHIR Query Observation match array', () => {
      // URI encoded
      const expressionConditionResource = "Condition?onset=23%20May%202009";
      const expressionObservationResourceShort = "Observation?code=loinc|1234-1";
      const expressionObservationResource =
        "Observation?code=test%2Chttp://loinc.org|65972-2&date=gt{{today()-2 days}}&patient={{%patient.id}}&_sort=-date&_count=1";
      const expressionObservationResourceParamsDiffOrders =
        "Observation?_sort=-date&_count=1&code=test%2Chttp://loinc.org|65972-2&date=gt{{today()-4 weeks}}&patient={{%patient.id}}";
      const expressionObservationResourceParamsDiffOrders2 =
        "Observation?patient={{%patient.id}}&_sort=-date&_count=1&code=test%2Chttp://loinc.org|65972-2&date=gt{{today()-6 months}}";

      const matchArr1 = service.getFHIRQueryObservationMatches(expressionConditionResource);
      const matchArr2 = service.getFHIRQueryObservationMatches(expressionObservationResourceShort);
      const matchArr3 = service.getFHIRQueryObservationMatches(expressionObservationResource);
      const matchArr4 = service.getFHIRQueryObservationMatches(expressionObservationResourceParamsDiffOrders);
      const matchArr5 = service.getFHIRQueryObservationMatches(expressionObservationResourceParamsDiffOrders2);

      expect(matchArr1.length).toEqual(0);
      expect(matchArr2.length).toEqual(0);
      expect(matchArr3.length).toEqual(4);
      expect(matchArr3[2]).toEqual("2");
      expect(matchArr3[3]).toEqual("days");
      expect(matchArr4.length).toEqual(4);
      expect(matchArr4[2]).toEqual("4");
      expect(matchArr4[3]).toEqual("weeks");
      expect(matchArr5.length).toEqual(4);
      expect(matchArr5[2]).toEqual("6");
      expect(matchArr5[3]).toEqual("months");

    });
  });

});
