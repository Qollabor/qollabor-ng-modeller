class CasePlanProperties extends StageProperties {
    /**
     * @param {CasePlanModel} casePlan 
     */
    constructor(casePlan) {
        super(casePlan);
        this.cmmnElement = casePlan;
    }

    renderData() {
        // First couple of lines are actually CASE properties; for now we render these in the case plan properties view
        //  We also need lines to render the roles?
        this.addInputField('Case Name', 'name', this.cmmnElement.definition.caseDefinition);
        this.addTextField('Case Description', 'description', this.cmmnElement.definition.caseDefinition);
        this.addSeparator();
        this.addCaseRolesButton();
        this.addSeparator();
        this.addCaseParameters();
        this.addSeparator();
        this.addSeparator();
        this.addNameField();
        this.addSeparator();
        this.addDescriptionField();
        this.addSeparator();
        this.addAutoComplete();
        this.addPlanningTableField();
        this.addSeparator();
        this.addPlanItemTable();
        this.addIdField();
    }

    addCaseRolesButton() {
        const html = $(`<div title="Edit the case roles" class="propertyButton">
                            <label>Case Team</label>
                            <div>
                                <img src="images/roles_128.png" />
                                <button class="btnCaseRolesEditor">Edit Roles</button>
                            </div>
                        </div>
                        <span class="separator" />
                        <div title="Edit the 'start case schema'" class="propertyButton">
                            <label>Start Case Schema</label>
                            <div>
                                <img src="images/startcaseschema_128.png" />
                                <button class="btnCaseSchemaEditor">Edit Schema</button>
                            </div>
                        </div>`);
        html.find('.btnCaseRolesEditor').on('click', e => this.cmmnElement.case.rolesEditor.open());
        html.find('.btnCaseSchemaEditor').on('click', e => this.cmmnElement.case.startCaseEditor.open());
        this.htmlContainer.append(html);
        return html;
    }

    addCaseParameters() {
        const html = $(`<div title="Edit the case input and output parameters" class="propertyButton">
                            <label>Case Parameters</label>
                            <div>
                                <img src="images/input_128.png" />
                                <button class="btnCaseInputParameters">Input</button>
                                <button class="btnCaseOutputParameters">Output</button>
                                <img src="images/output_128.png" />
                            </div>
                        </div>`);
        html.find('.btnCaseInputParameters').on('click', e => this.cmmnElement.case.caseParametersEditor.open());
        html.find('.btnCaseOutputParameters').on('click', e => this.cmmnElement.case.caseParametersEditor.open());
        this.htmlContainer.append(html);
        return html;
    }
}
