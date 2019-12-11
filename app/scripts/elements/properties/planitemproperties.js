class PlanItemProperties extends Properties {
    /**
     * 
     * @param {PlanItemView} planItem 
     */
    constructor(planItem) {
        super(planItem);
        this.cmmnElement = planItem;
    }

    /**
     * Adds a block to render the item control rule with the specified name
     * @param {String} ruleName 
     * @param {String} imageURL 
     * @param {String} label1 
     * @param {String} label2 
     * @param {String} defaultValue 
     */
    addRuleBlock(ruleName, imageURL, label1, label2 = label1, defaultValue = 'true') {
        const element = this.cmmnElement.definition;
        const propertyType = ruleName;
        const ruleAcronym = label1.split(' ').map(part => part.substring(0, 3)).join('. ');
        const rule = element.planItemControl ? element.planItemControl[ruleName] : undefined;
        const ruleAvailable = rule ? true : false;
        const contextRef = rule ? rule.contextRef : '';
        const contextName = contextRef ? this.cmmnElement.definition.caseDefinition.getElement(contextRef).name : '';
        const ruleBody = rule ? rule.body : defaultValue;
        const rulePresenceIdentifier = Util.createID();
        // const checked = ;
        const html = $(`<div class="propertyRule">
                            <div class="propertyRow">
                                <input id="${rulePresenceIdentifier}" type="checkbox" ${ruleAvailable?'checked':''}/>
                                <img src="${imageURL}" />
                                <label for="${rulePresenceIdentifier}">${label1}</label>
                            </div>
                            <div style="display:${ruleAvailable?'block':'none'}" class="ruleProperty">
                                <div class="propertyBlock">
                                    <label>${label2} Rule</label>
                                    <textarea class="multi">${ruleBody}</textarea>
                                </div>
                                <div class="zoomRow zoomDoubleRow">
                                    <label class="zoomlabel">${ruleAcronym}. Rule Context</label>
                                    <label class="valuelabel">${contextName}</label>
                                    <button class="zoombt"></button>
                                    <button class="removeReferenceButton" title="remove the reference to the case file item" />
                                </div>
                                <span class="separator" />
                            </div>
                        </div>`);
        html.find(`#${rulePresenceIdentifier}`).on('click', e => {
            const newPresence = e.target.checked;
            html.find('.ruleProperty').css('display', newPresence ? 'block' : 'none');
            if (!newPresence) {
                // Remove the rule from the definition...
                this.cmmnElement.definition.itemControl.removeRule(ruleName);
            } else {
                this.cmmnElement.definition.itemControl.getRule(ruleName).body = defaultValue;
            }
            this.done();
        });
        html.find('textarea').on('change', e => this.change(this.cmmnElement.definition.getRule(ruleName), 'body', e.target.value));
        html.find('.zoombt').on('click', e => {
            this.cmmnElement.case.cfiEditor.open(cfi => {
                this.change(this.cmmnElement.definition.getRule(ruleName), 'contextRef', cfi.id);
                html.find('.valuelabel').html(cfi.name);
            });
        });
        html.find('.removeReferenceButton').on('click', e => {
            this.change(this.cmmnElement.definition.getRule(ruleName), 'contextRef', undefined);
            html.find('.valuelabel').html('');
        });
        html.find('.zoomRow').on('pointerover', e => {
            e.stopPropagation();
            this.cmmnElement.case.cfiEditor.dropHandler = cfi => {
                const newContextRef = cfi.id;
                this.change(this.cmmnElement.definition.getRule(ruleName), 'contextRef', newContextRef);
                const name = newContextRef ? this.cmmnElement.definition.caseDefinition.getElement(newContextRef).name : '';
                html.find('.valuelabel').html(name);
            }
        });
        html.find('.zoomRow').on('pointerout', e => {
            this.cmmnElement.case.cfiEditor.dropHandler = undefined;
        });
        this.htmlContainer.append(html);
        return html;
    }

    addRepeatRuleBlock() {
        this.addRuleBlock('repetitionRule', REPETITION_IMG, 'Repeat', 'Repetition');
    }

    addRequiredRuleBlock() {
        this.addRuleBlock('requiredRule', REQUIRED_IMG, 'Required');
    }

    addManualActivationRuleBlock() {
        this.addRuleBlock('manualActivationRule', MANUALACTIVATION_IMG, 'Manual Activation', 'Manual Activation', 'false');
    }

    /**
     * Returns a HTML string with a select that has all case roles in it.
     * Sets the role with currentRoleId as selected if it is set.
     * @param {String} currentRoleId 
     * @param {String} buttonClass
     */
    getRolesAsHTMLSelect(currentRoleId, buttonClass) {
        const existingRolesAsOptions = this.case.caseDefinition.caseRoles.map(role => `<option value="${role.id}" ${role.id == currentRoleId?" selected":""}>${role.name}</option>`).join('');
        return `<div class="role-selector">
                    <span>
                        <select>
                            <option value="">select a role ...</option>
                            ${existingRolesAsOptions}
                        </select>
                    </span>
                    <button class="${buttonClass}"></button>
                </div>`;
    }

    /**
     * Adds a role. Can be undefined, in which case an empty row is added.
     * Also adds the required event handlers to the html.
     * @param {Array<CaseRoleReference>} authorizedRoles 
     * @param {JQuery<HTMLElement>} parentHTML 
     * @param {CaseRoleReference} role 
     */
    addAuthorizedRoleField(authorizedRoles, parentHTML, role = undefined) {
        if (role && !role.name) {
            // We need not render empty roles
            return;
        }
        const roleId = role ? role.id : '';
        const html = $(this.getRolesAsHTMLSelect(role ? role.id : '', 'deleteRoleButton'));
        html.attr('id', roleId);
        html.find('select').on('change', e => {
            const newRoleId = $(e.target).val().toString();
            const newRole = this.cmmnElement.definition.caseDefinition.getElement(newRoleId);
            // console.log("Selected role with id "+newRoleId)
            // const roleAlreadyPresent = authorizedRoles.find(role => role.id == newRoleId)
            // if (roleAlreadyPresent) {
            //     // console.log("Not adding role, because it is already in the list")
            //     return;
            // }

            const currentRoleID = html.attr('id');
            const currentRoleReference = currentRoleID ? authorizedRoles.find(role => role.id == currentRoleID) : undefined;
            if (!currentRoleReference) {
                authorizedRoles.push(new CaseRoleReference(newRole, this.cmmnElement.definition));
                this.addAuthorizedRoleField(authorizedRoles, parentHTML); // Add a new role field    
            } else {
                // this.change(currentRoleReference, 'role', newRole);
                currentRoleReference.role = newRole;
            }
            html.attr('id', newRole.id);
            this.done();
        });
        html.find('.deleteRoleButton').on('click', e => {
            const currentRoleID = html.attr('id');
            if (currentRoleID) {
                const currentRoleReference = authorizedRoles.find(role => role.id == currentRoleID);
                if (currentRoleReference) {
                    currentRoleReference.remove();
                }
                Util.removeHTML(html);
                this.done();
            }
        });
        parentHTML.append(html);
        return html;
    }
}
