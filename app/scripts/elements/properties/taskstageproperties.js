class TaskStageProperties extends PlanItemProperties {
    /**
     * @param {TaskStage} taskStage 
     */
    constructor(taskStage) {
        super(taskStage);
        this.cmmnElement = taskStage;
    }

    addDiscretionaryBlock(imageURL, label) {
        const element = this.cmmnElement.definition;
        const isDiscretionary = element.isDiscretionary;
        const inputDiscretionary = Util.createID();
        const html = $(`<div class="propertyRule">
                            <div class="propertyRow">
                                <input id="${inputDiscretionary}" type="checkbox" ${isDiscretionary?'checked':''}/>
                                <img src="${imageURL}" />
                                <label for="${inputDiscretionary}">${label}</label>
                            </div>
                            <div style="display:${isDiscretionary?'block':'none'}" title="Select case roles allowed to plan the item (not to perform the item, but to plan the item).\nA team member must have one of the roles in order to plan.\nIf empty, all team members can plan the item." class="discretionaryBlock">
                                <div class="authorizedRolesBlock">
                                    <label>Authorized Roles</label>
                                </div>
                                <span class="separator" />
                                <div class="applicabilityRulesBlock">
                                    <label>Applicability Rules</label>
                                </div>
                            </div>
                        </div>`);
        html.find('input').on('click', e => {
            const newDiscretionary = e.target.checked;
            html.find('.discretionaryBlock').css('display', newDiscretionary ? 'block' : 'none');
            this.cmmnElement.definition.switchType();
            if (this.cmmnElement.definition.isDiscretionary) {
                this.cmmnElement.parent.showPlanningTable();
                this.renderApplicabilityRules();
            }
            this.done();
        });

        // Add a row for each role, and also an empty ro(w)le at the end
        const authorizedRolesHTML = html.find('.authorizedRolesBlock');
        const authorizedRoles = this.cmmnElement.definition.authorizedRoles;
        authorizedRoles.forEach(role => this.addAuthorizedRoleField(authorizedRoles, authorizedRolesHTML, role));
        this.addAuthorizedRoleField(authorizedRoles, authorizedRolesHTML);

        // Render the applicability rules
        this.applicabilityRulesBlock = html.find('.applicabilityRulesBlock');
        this.renderApplicabilityRules();

        this.htmlContainer.append(html);
        return html;
    }

    renderApplicabilityRules() {
        if (this.cmmnElement.definition.isDiscretionary) {
            this.cmmnElement.definition.parent.ruleDefinitions.forEach(rule => this.addApplicabilityRuleField(rule));
        }
    }

    /**
     * Adds a role. Can be undefined, in which case an empty row is added.
     * Also adds the required event handlers to the html.
     * @param {ApplicabilityRuleDefinition} rule 
     */
    addApplicabilityRuleField(rule) {
        const isSelected = this.cmmnElement.definition.applicabilityRules.find(r => r == rule) ? true : false;

        const label = rule.name;

        const checked = isSelected ? ' checked' : '';
        const checkId = Util.createID();
        const html = $(`<div class="propertyRule">
                            <div class="propertyRow">
                                <input id="${checkId}" type="checkbox" ${checked} />
                                <label for="${checkId}">${label}</label>
                            </div>
                        </div>`);
        html.on('change', e => {
            if (e.target.checked) {
                this.cmmnElement.definition.applicabilityRules.push(rule);
            } else {
                Util.removeFromArray(this.cmmnElement.definition.applicabilityRules, rule);
            }
            this.done();
        });
        this.applicabilityRulesBlock.append(html);
        return html;
    }

    /**
     * Adds a checkbox whether or not this element has a planning table.
     */
    addPlanningTableField() {
        const checked = this.cmmnElement.planItemDefinition.planningTable ? ' checked' : '';
        const checkId = Util.createID();
        const html = $(`<div class="propertyRule">
                            <div class="propertyRow">
                                <input id="${checkId}" type="checkbox" ${checked} />
                                <img src="${EXPANDEDPLANNINGTABLE_IMG}" />
                                <label for="${checkId}">Planning Table</label>
                            </div>
                        </div>`);
        html.on('change', e => {
            if (e.target.checked == true) {
                // Create a new planning table on the definition by invoking the getter, and show it.
                this.cmmnElement.planItemDefinition.getPlanningTable();
                this.cmmnElement.showPlanningTable();
            } else {
                // Invoking delete on our planning table will also remove the definition and render this element again (and thus hide the pt image)
                this.cmmnElement.planningTableView.__delete();
            }
            this.done();
        });
        this.htmlContainer.append(html);
        return html;
    }
}
