class CaseFileItemCollection extends CMMNElementDefinition {
    /**
     * Helper class to share logic across CaseFile and CaseFileItem (mostly the 'children' array)
     */
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        /** @type {Array<CaseFileItemDef>} */
        this._children = [];
    }

    /**
     * Creates a new CaseFileItemDef child.
     * @returns {CaseFileItemDef}
     */
    createChildDefinition() {
        const newCaseFileItem = this.createDefinition(CaseFileItemDef);
        this.children.push(newCaseFileItem);
        newCaseFileItem.name = '';
        newCaseFileItem.multiplicity = 'ExactlyOne';
        newCaseFileItem.usedIn = '';
        newCaseFileItem.expanded = true;
        return newCaseFileItem;
    }

    /**
     * Overriding name getter and setter to not give back the id, because that may cause visual issues.
     */
    get name() {
        return this.__name;
    }

    set name(name) {
        super.name = name;
    }

    /**
     * Returns the case file item children of this element.
     * @returns {Array<CaseFileItemDef>}
     */
    get children() {
        return this._children;
    }
}
