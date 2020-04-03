class PlanningTableDefinition extends UnnamedCMMNElementDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        /** @type{Array<PlanItem>} */
        this.tableItems = this.parseElements('discretionaryItem', PlanItem);
        /** @type{Array<ApplicabilityRuleDefinition>} */
        this.ruleDefinitions = this.parseElements('applicabilityRule', ApplicabilityRuleDefinition);
        // TODO: PlanningTables can be nested in themselves, according to the spec. But we will not implement that here.

        // Default start position.
        this.__startPosition = { x: 0, y: 0 };
    }

    defaultShapeSize() {
        return { w: 24, h: 16 };
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'planningTable', 'tableItems', 'ruleDefinitions');
    }

    /** @returns {ApplicabilityRuleDefinition} */
    createNewRule() {
        const newRule = super.createDefinition(ApplicabilityRuleDefinition);
        this.ruleDefinitions.push(newRule);
        return newRule;
    }
}

class ApplicabilityRuleDefinition extends ConstraintDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
    }

    // Override isNamedElement; by default Constraints are unnamed, but applicability rules form the exception
    isNamedElement() {
        return true;
    }

    set sourceRef(ref) {
        this.contextRef = ref;
    }

    get sourceRef() {
        return this.contextRef ? this.contextRef : '';
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'applicabilityRule');
    }
}