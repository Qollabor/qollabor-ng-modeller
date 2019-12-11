class PlanItemOnPartDefinition extends OnPartDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent, PlanItem);
        const cmmn10Ref = this.parseAttribute('sentryRef');
        const exitCriterionRef = this.parseAttribute('exitCriterionRef');
        if (cmmn10Ref && !exitCriterionRef) {
            console.log('Migrating old definition of sentryRef')
            this.caseDefinition.migrated = true;
        }
        this.exitCriterionRef = this.parseAttribute('exitCriterionRef', cmmn10Ref);
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'planItemOnPart', 'exitCriterionRef');
    }
}
