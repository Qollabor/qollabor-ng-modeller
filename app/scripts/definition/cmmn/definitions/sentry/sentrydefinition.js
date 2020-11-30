class SentryDefinition extends UnnamedCMMNElementDefinition {
    /**
     * 
     * @param {Element} importNode 
     * @param {CaseDefinition} caseDefinition 
     * @param {StageDefinition} parent 
     */
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        /** @type {StageDefinition} */
        this.parent = parent;
        /** @type{IfPartDefinition} */
        this.ifPart = this.parseElement('ifPart', IfPartDefinition);
        /** @type {Array<CaseFileItemOnPartDefinition>} */
        this.caseFileItemOnParts = this.parseElements('caseFileItemOnPart', CaseFileItemOnPartDefinition);
        /** @type {Array<PlanItemOnPartDefinition>} */
        this.planItemOnParts = this.parseElements('planItemOnPart', PlanItemOnPartDefinition);
    }

    /**
     * Move the sentry from one stage to another (typically when it's associated Criterion's plan item is moved to another stage as well)
     * @param {StageDefinition} newParent 
     */
    switchParent(newParent) {
        const currentParentStage = this.parent;
        Util.removeFromArray(currentParentStage.sentries, this);
        Util.removeFromArray(currentParentStage.childDefinitions, this);
        this.parent = newParent;
        newParent.sentries.push(this);
        newParent.childDefinitions.push(this);
    }

    static get prefix() {
        return 'crit';
    }

    defaultShapeSize() {
        return { w: 12, h: 20 };
    }

    getIfPart() {
        if (!this.ifPart) {
            /** @type{IfPartDefinition} */
            this.ifPart = super.createDefinition(IfPartDefinition);
            this.ifPart.language = 'spel'; // Default language
        }
        return this.ifPart;
    }

    /**
     * @returns {PlanItemOnPartDefinition}
     */
    createPlanItemOnPart() {
        const onPart = this.createDefinition(PlanItemOnPartDefinition);
        this.planItemOnParts.push(onPart);
        return onPart;
    }

    /**
     * @returns {CaseFileItemOnPartDefinition}
     */
    createCaseFileItemOnPart() {
        const onPart = this.createDefinition(CaseFileItemOnPartDefinition);
        onPart.standardEvent = 'create'; // Set the default event for case file items
        this.caseFileItemOnParts.push(onPart);
        return onPart;
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'sentry', 'ifPart', 'caseFileItemOnParts', 'planItemOnParts');
    }
}
