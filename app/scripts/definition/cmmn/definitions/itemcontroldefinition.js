class ItemControlDefinition extends UnnamedCMMNElementDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.repetitionRule = this.parseElement('repetitionRule', ConstraintDefinition);
        this.requiredRule = this.parseElement('requiredRule', ConstraintDefinition);
        this.manualActivationRule = this.parseElement('manualActivationRule', ConstraintDefinition);
    }

    /**
     * Gets or creates one of 'repetitionRule', 'requiredRule' or 'manualActivationRule'.
     * @param {String} ruleName 
     * @returns {ConstraintDefinition}
     */
    getRule(ruleName) {
        if (! this[ruleName]) {
            this[ruleName] = super.createDefinition(ConstraintDefinition);
        }
        return this[ruleName];
    }

    /**
     * Removes one of 'repetitionRule', 'requiredRule' or 'manualActivationRule'.
     * @param {String} ruleName 
     */
    removeRule(ruleName) {
        delete this[ruleName];
    }

    createExportNode(parentNode) {
        if (this.repetitionRule || this.requiredRule || this.manualActivationRule) {
            // Only export if there are any rules
            super.createExportNode(parentNode, 'itemControl', 'repetitionRule', 'requiredRule', 'manualActivationRule');
        }
    }
}