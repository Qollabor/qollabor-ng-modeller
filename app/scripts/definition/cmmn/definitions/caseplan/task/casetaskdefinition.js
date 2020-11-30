class CaseTaskDefinition extends TaskDefinition {
    static get prefix() {
        return 'ct';
    }

    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.caseRef = this.parseAttribute('caseRef');
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'caseTask', 'caseRef', 'mappings');
    }

    get implementationRef() {
        return this.caseRef;
    }

    set implementationRef(ref) {
        this.caseRef = ref;
    }
}
