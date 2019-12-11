class IfPartDefinition extends ConstraintDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'ifPart');
    }
}
