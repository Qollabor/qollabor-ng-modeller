class UserEventProperties extends PlanItemProperties {
    /**
     * 
     * @param {UserEvent} userEvent 
     */
    constructor(userEvent) {
        super(userEvent);
        this.cmmnElement = userEvent;
    }

    renderData() {
        this.addNameField();
        this.addSeparator();
        this.addDescriptionField();
        this.addSeparator();
        this.addAuthorizedRoles();
        this.addIdField();
    }

    addAuthorizedRoles() {
        const html = $(`<div class="authorizedRolesBlock propertyBlock" title="Select one or more case roles that are allowed to raise the event.\nA team member must have at least one of these roles.\nIf empty, all team members can raise the event.">
                            <label>Authorized Roles</label>
                        </div>`);
        // Add a row for each role, and also an empty ro(w)le at the end
        const authorizedRoles = this.cmmnElement.planItemDefinition.authorizedRoles;
        authorizedRoles.forEach(role => this.addAuthorizedRoleField(authorizedRoles, html, role));
        this.addAuthorizedRoleField(authorizedRoles, html);

        this.htmlContainer.append(html);
    }
}