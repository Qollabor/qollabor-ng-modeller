class CaseRoleReference {
    /**
     * Simple wrapper around a case role, helps in holding a references instead of the actual role.
     * @param {CaseRoleDefinition} role 
     * @param {PlanItem|UserEventDefinition} parent
     */
    constructor(role, parent = undefined) {
        this.role = role;
        this.parent = parent;
    }

    remove() {
        if (this.parent) {
            Util.removeFromArray(this.parent.authorizedRoles, this);
        }
    }

    get id() {
        return this.role.id;
    }

    set id(newId) {
        const otherRole = this.role.caseDefinition.getElement(newId);
        if (otherRole) {
            this.role = otherRole;
        } else {
            this.role = { // This is a 'temporary' case role definition
                id: '',
                name: '',
                caseDefinition: this.role.caseDefinition
            }
        }
    }

    get name() {
        return this.role.name;
    }

    /**
     * Creates a temporary wrapper
     * @param {CaseDefinition} caseDefinition 
     * @returns {CaseRoleReference}
     */
    static createEmptyCaseRoleReference(caseDefinition) {
        const newRef = new CaseRoleReference(undefined);
        newRef.role = { // This is a 'temporary' case role definition
            id: '',
            name: '',
            caseDefinition: caseDefinition
        }
        return newRef;
    }
}
