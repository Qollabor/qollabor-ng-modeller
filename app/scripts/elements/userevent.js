class UserEvent extends EventListener {
    static get definitionClass() {
        return UserEventDefinition;
    }

    /**
     * Creates a new UserEventListener
     * @param {CMMNElement} parent 
     * @param {PlanItem} definition
     */
    constructor(parent, definition) {
        super(parent, definition);
    }

    /** @returns {UserEventDefinition} */
    get planItemDefinition() {
        return this.definition.definition;
    }

    createProperties() {
        return new UserEventProperties(this);
    }

    get imageURL() {
        return 'images/svg/userevent.svg';
    }

    /**
     * validate: all steps to check this element
     */
    __validate() {
        super.__validate();

        // Authorized roles must be filled with an ID attribute.
        this.planItemDefinition.authorizedRoles.filter(r => !r.id).forEach(r => this.raiseValidationIssue(40));
    }

    referencesDefinitionElement(definitionId) {
        if (this.planItemDefinition.authorizedRoles.find(role => role.id == definitionId)) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }
}
CMMNElement.registerType(UserEvent, 'User Event', 'images/svg/userevent.svg');
