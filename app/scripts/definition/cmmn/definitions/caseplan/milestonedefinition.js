class MilestoneDefinition extends MilestoneEventListenerDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
    }

    static get prefix() {
        return 'ms';
    }

    defaultShapeSize() {
        return { w: 100, h: 40};
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'milestone');
    }

}
