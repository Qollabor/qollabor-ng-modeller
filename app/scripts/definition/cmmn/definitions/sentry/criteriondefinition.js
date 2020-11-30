class CriterionDefinition extends CMMNElementDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.sentryRef = this.parseAttribute('sentryRef');
    }

    get ifPart() {
        return this.sentry.ifPart;
    }

    get caseFileItemOnParts() {
        return this.sentry.caseFileItemOnParts;
    }

    get planItemOnParts() {
        return this.sentry.planItemOnParts;
    }

    defaultShapeSize() {
        return { w: 12, h: 20 };
    }

    get shape() {
        if (! this._shape) {
            this._shape = this.caseDefinition.dimensions.getShape(this);
            if (! this._shape) {
                const sentryShape = this.caseDefinition.dimensions.getShape(this.sentry);
                if (sentryShape) {
                    console.log("Converting sentry shape to cmmn 1.1")
                    this._shape = sentryShape;
                    this._shape.cmmnElementRef = this.id;
                    delete this.sentry._shape;
                    return this._shape;
                }
            }
        }
        return super.shape;
    }

    /**
     * @returns {SentryDefinition}
     */
    get sentry() {
        return this.caseDefinition.getElement(this.sentryRef, SentryDefinition);
    }

    /**
     * @returns {IfPartDefinition}
     */
    getIfPart() {
        return this.sentry.getIfPart();
    }

    /**
     * @returns {PlanItemOnPartDefinition}
     */
    createPlanItemOnPart() {
        return this.sentry.createPlanItemOnPart();
    }

    /**
     * @returns {CaseFileItemOnPartDefinition}
     */
    createCaseFileItemOnPart() {
        return this.sentry.createCaseFileItemOnPart();
    }

    /**
     * @param {Element} parentNode 
     * @param {String} tagName 
     */
    createExportNode(parentNode, tagName) {
        super.createExportNode(parentNode, tagName, 'sentryRef');
    }

    removeDefinition() {
        // Since sentry is not a child of criterion, but has an independent place inside the parent stage, we will also remove it from the stage
        this.sentry.removeDefinition();
        super.removeDefinition();
    }
}
