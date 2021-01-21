class RolesEditor extends TableEditor {
    get label() {
        return 'Roles';
    }

    /** @returns {Array<TableEditorColumn>} */
    get columns() {
        return [
            new TableEditorColumn('', '20px', 'Delete the role'),
            new TableEditorColumn('Role', '200px', 'The name of the role'),
            new TableEditorColumn('Description', '', 'The description of the role')
        ];
    }

    /** @returns {Array<CaseRoleDefinition>} */
    get data() {
        return this.case.caseDefinition.caseRoles;
    }

    /**
     * 
     * @param {CaseRoleDefinition} role 
     * @returns {RoleRenderer}
     */
    addRenderer(role = undefined) {
        return new RoleRenderer(this, role);
    }

    /**
     * validates this
     */
    validate() {
        // Throw an error for each role that has no name
        this.data.filter(role => !role.name).forEach(role => this.raiseEditorIssue(role, 1, ['role', this.case.name, role.description]));
    }
}

class RoleRenderer extends RowEditor {
    /**
     * @param {RolesEditor} editor 
     * @param {CaseRoleDefinition} role 
     */
    constructor(editor, role = undefined) {
        super(editor, role);
        const roleName = role ? role.name : '';
        const roleDescription = role ? role.description : '';
        this.html = $(`<tr class="case-team-role">
                            <td><button class="btnDelete"><img src="images/delete_32.png" /></button></td>
                            <td><input type="text" dataType="name" value="${roleName}" /></td>
                            <td><input type="text" dataType="description" value="${roleDescription}" /></td>
                        </tr>`);

        this.html.find('input').on('change', e => {
            // Handle changes of name and description
            const propertyType = e.currentTarget.getAttribute('dataType');
            const newValue = e.currentTarget.value;
            this.change(propertyType, newValue);
            editor.case.refreshReferencingFields(this.element);
        });
    }

    /**
     * @returns {CaseRoleDefinition}
     */
    createElement() {
        const newRole = this.editor.case.caseDefinition.createDefinition(CaseRoleDefinition);
        newRole.description = '';
        return newRole;
    }
}
