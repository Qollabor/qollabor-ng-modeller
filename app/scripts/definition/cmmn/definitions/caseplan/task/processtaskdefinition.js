class ProcessTaskDefinition extends TaskDefinition {
    static get prefix() {
        return 'pt';
    }

    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.processRef = this.parseAttribute('processRef');
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'processTask', 'processRef', 'mappings');
    }

    get implementationRef() {
        return this.processRef;
    }

    set implementationRef(ref) {
        this.processRef = ref;
    }
}
