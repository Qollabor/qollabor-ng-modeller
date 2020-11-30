class UserEventDefinition extends EventListenerDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.authorizedRoles = [];
        this.authorizedRoleRefs = this.parseAttribute('authorizedRoleRefs');
    }

    static get prefix() {
        return 'ue';
    }

    resolveReferences() {
        super.resolveReferences();
        this.authorizedRoles = this.caseDefinition.findElements(this.authorizedRoleRefs, [], CaseRoleDefinition).map(role => new CaseRoleReference(role, this));
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'userEvent', 'authorizedRoleRefs');
    }

    flattenReferences() {
        super.flattenReferences();
        this.authorizedRoleRefs = super.flattenListToString(this.authorizedRoles);
    }
}
