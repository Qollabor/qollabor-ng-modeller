class CaseFileItemDef extends CaseFileItemCollection {
    /**
     * @returns {Array<String>} List of the possible events/transitions on a case file item
     */
    static get transitions() {
        return ['', 'addChild', 'addReference', 'create', 'delete', 'removeChild', 'removeReference', 'replace', 'update'];
    }

    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.multiplicity = this.parseAttribute('multiplicity', 'Unspecified');
        this.definitionRef = this.parseAttribute('definitionRef');
        this.parseGrandChildren('caseFileItem', CaseFileItemDef, this.children);
    }

    /**
     * Returns the default transition for this type of plan item.
     * @returns {String}
     */
    get defaultTransition() {
        return 'create';
    }

    /**
     * Returns all descending case file items including this one, recursively.
     */
    getDescendants() {
        const descendants = [this];
        this.children.forEach(child => child.getDescendants().forEach(c => descendants.push(c)));
        return descendants;
    }

    parseGrandChildren(childName, constructor, collection) {
        const child = XML.getChildByTagName(this.importNode, 'children');
        if (child) {
            XML.getChildrenByTagName(child, childName).forEach(childNode => this.instantiateChild(childNode, constructor, collection));
        }
        return collection;
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'caseFileItem', 'multiplicity', 'definitionRef');
        if (this.children.length > 0) {
            const childrenNode = XML.createChildElement(this.exportNode, 'children');
            this.children.forEach(child => child.createExportNode(childrenNode));
        }
    }
}
