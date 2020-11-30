class EventListenerDefinition extends MilestoneEventListenerDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
    }

    defaultShapeSize() {
        return { w: 32, h: 32};
    }
}
