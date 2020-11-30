class CaseFileItem extends CMMNElement {
    /**
     * 
     * @param {Stage} stage 
     * @param {Number} x 
     * @param {Number} y 
     */
    static create(stage, x, y) {
        const shape = CaseFileItemShape.create(stage.definition, x, y);
        return new CaseFileItem(stage, shape);
    }

    /**
     * Creates a new CaseFileItem
     * @param {Stage} parent 
     * @param {CaseFileItemShape} definition 
     */
    constructor(parent, definition) {
        super(parent, definition);
        this.definition = definition;
        this.__resizable = false;
    }

    createProperties() {
        return new CaseFileItemProperties(this);
    }

    createHalo() {
        return new CaseFileItemHalo(this);
    }

    refreshReferencingFields(definitionElement) {
        super.refreshReferencingFields(definitionElement);
        if (this.shape.contextRef == definitionElement.id) {
            this.refreshDescription();
        }
    }

    get markup() {
        return `<g>
                    <polyline class="cmmn-shape cmmn-border cmmn-casefile-shape" points=" 15,0 0,0 0,40 25,40 25,10 15,0 15,10 25,10" />
                </g>
                <text class="cmmn-text" text-anchor="middle" x="10" y="55" />`;
    }

    //validate: all steps to check this element
    __validate() {
        if (!this.name) {
            const message = this.parent ? this.parent.name : '-no parent-';
            this.raiseValidationIssue(0, [message, this.case.name]);
        }
    }

    referencesDefinitionElement(definitionId) {
        return definitionId == this.shape.contextRef;
    }
}
CMMNElement.registerType(CaseFileItem, 'Case File Item', 'images/svg/casefileitem.svg');