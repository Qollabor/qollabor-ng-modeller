class OnPartDefinition extends UnnamedCMMNElementDefinition {
    /**
     * 
     * @param {Element} importNode 
     * @param {SentryDefinition} parent 
     * @param {ModelDefinition} caseDefinition 
     * @param {Function} sourceConstructor 
     */
    constructor(importNode, caseDefinition, parent, sourceConstructor) {
        super(importNode, caseDefinition, parent);
        this.sentry = parent;
        this.sourceConstructor = sourceConstructor;
        this.standardEvent = this.parseElementText('standardEvent', '');
        this.sourceRef = this.parseAttribute('sourceRef', '');
    }

    /**
     * @returns {PlanItem | CaseFileItemDef}
     */
    get source() {
        return this.caseDefinition.getElement(this.sourceRef, this.sourceConstructor)
    }

    /**
     * @returns {String}
     */
    get defaultTransition() {
        return this.source.defaultTransition;
    }

    removeProperty(propertyName) {
        super.removeProperty(propertyName);
        if (propertyName === 'sourceRef') {
            // If a PlanItem is deleted or a CaseFileItem which is refered to from this on part, then we will also delete this onpart from it's sentry.
            this.removeDefinition();
        }
    }

    createExportNode(parentNode, tagName, ...propertyNames) {
        super.createExportNode(parentNode, tagName, 'sourceRef', propertyNames);
        XML.createTextChild(XML.createChildElement(this.exportNode, 'standardEvent'), this.standardEvent);
    }
}

