class CaseFileItemOnPartDefinition extends OnPartDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent, CaseFileItemDef);
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'caseFileItemOnPart');
    }
}
