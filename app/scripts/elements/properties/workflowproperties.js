class WorkflowProperties extends TaskProperties {
    /**
     * 
     * @param {HumanTask} task 
     */
    constructor(task) {
        super(task);
        this.cmmnElement = task;
        /** @type {HumanTaskDefinition} */
        this.humanTaskDefinition = this.cmmnElement.definition.definition;
    }

    get label() {
        return 'Properties';
    }

    addPerformerField() {
        const html = $(`<div class="szoomDoubleRow performer-field" title="Select a Case Role that is required to perform the task.\nWhen empty all case team members can perform the task.">
                            <label class="zoomlabel">Performer (role needed to do task)</label>
                            ${this.getRolesAsHTMLSelect(this.cmmnElement.planItemDefinition.performerRef, 'removeRoleButton')}
                        </div>`);
        html.find('select').on('change', e => {
            this.change(this.cmmnElement.planItemDefinition, 'performerRef', e.target.value);
        });
        html.find('.removeRoleButton').on('click', e => {
            this.change(this.cmmnElement.planItemDefinition, 'performerRef', undefined);
            html.find('select').val(undefined);
        });
        this.htmlContainer.append(html);
        return html;
    }

    /**
     * Adds a block to render the Assignee of the task
     */
    addAssignmentField() {
        const assignmentExpression = this.humanTaskDefinition.assignment;
        const ruleAvailable = assignmentExpression ? true : false;
        const contextRef = assignmentExpression ? assignmentExpression.contextRef : '';
        const contextName = contextRef ? this.cmmnElement.definition.caseDefinition.getElement(contextRef).name : '';
        const expressionBody = assignmentExpression ? assignmentExpression.body : '';
        const assignmentPresenceIdentifier = Util.createID();
        // const checked = ;
        const html = $(`<div class="propertyRule" title="Provide an expression that dynamically assigns the task to a user">
                            <div class="propertyRow">
                                <input id="${assignmentPresenceIdentifier}" type="checkbox" ${ruleAvailable?'checked':''}/>
                                <label for="${assignmentPresenceIdentifier}">Dynamic Assignment</label>
                            </div>
                            <div style="display:${ruleAvailable?'block':'none'}" class="ruleProperty">
                                <div class="propertyBlock">
                                    <label>Expression</label>
                                    <textarea class="multi">${expressionBody}</textarea>
                                </div>
                                <div class="zoomRow zoomDoubleRow">
                                    <label class="zoomlabel">Context for expression</label>
                                    <label class="valuelabel">${contextName}</label>
                                    <button class="zoombt"></button>
                                    <button class="removeReferenceButton" title="remove the reference to the case file item" />
                                </div>
                                <span class="separator" />
                            </div>
                        </div>`);
        html.find(`#${assignmentPresenceIdentifier}`).on('click', e => {
            const newPresence = e.target.checked;
            html.find('.ruleProperty').css('display', newPresence ? 'block' : 'none');
            if (!newPresence) {
                this.humanTaskDefinition.assignment = undefined;
            } else {
                this.humanTaskDefinition.assignment = this.humanTaskDefinition.createDefinition(AssignmentDefinition);
            }
            this.done();
        });
        html.find('textarea').on('change', e => this.change(assignmentExpression, 'body', e.target.value));
        html.find('.zoombt').on('click', e => {
            this.cmmnElement.case.cfiEditor.open(cfi => {
                this.change(assignmentExpression, 'contextRef', cfi.id);
                html.find('.valuelabel').html(cfi.name);
            });
        });
        html.find('.removeReferenceButton').on('click', e => {
            this.change(assignmentExpression, 'contextRef', undefined);
            html.find('.valuelabel').html('');
        });
        html.find('.zoomRow').on('pointerover', e => {
            e.stopPropagation();
            this.cmmnElement.case.cfiEditor.dropHandler = cfi => {
                const newContextRef = cfi.id;
                this.change(assignmentExpression, 'contextRef', newContextRef);
                const name = cfi ? cfi.name : '';
                html.find('.valuelabel').html(name);
            }
        });
        html.find('.zoomRow').on('pointerout', e => {
            this.cmmnElement.case.cfiEditor.dropHandler = undefined;
        });
        this.htmlContainer.append(html);
        return html;
    }

    /**
     * Adds a block to render the Assignee of the task
     */
    addDueDateField() {
        const dueDateExpression = this.humanTaskDefinition.dueDate;
        const ruleAvailable = dueDateExpression ? true : false;
        const contextRef = dueDateExpression ? dueDateExpression.contextRef : '';
        const contextName = contextRef ? this.cmmnElement.definition.caseDefinition.getElement(contextRef).name : '';
        const expressionBody = dueDateExpression ? dueDateExpression.body : '';
        const assignmentPresenceIdentifier = Util.createID();
        // const checked = ;
        const html = $(`<div class="propertyRule" title="Provide an expression returning a due date to set on the task">
                            <div class="propertyRow">
                                <input id="${assignmentPresenceIdentifier}" type="checkbox" ${ruleAvailable?'checked':''}/>
                                <label for="${assignmentPresenceIdentifier}">Due Date</label>
                            </div>
                            <div style="display:${ruleAvailable?'block':'none'}" class="ruleProperty">
                                <div class="propertyBlock">
                                    <label>Expression</label>
                                    <textarea class="multi">${expressionBody}</textarea>
                                </div>
                                <div class="zoomRow zoomDoubleRow">
                                    <label class="zoomlabel">Context for expression</label>
                                    <label class="valuelabel">${contextName}</label>
                                    <button class="zoombt"></button>
                                    <button class="removeReferenceButton" title="remove the reference to the case file item" />
                                </div>
                                <span class="separator" />
                            </div>
                        </div>`);
        html.find(`#${assignmentPresenceIdentifier}`).on('click', e => {
            const newPresence = e.target.checked;
            html.find('.ruleProperty').css('display', newPresence ? 'block' : 'none');
            if (!newPresence) {
                this.humanTaskDefinition.dueDate = undefined;
            } else {
                this.humanTaskDefinition.dueDate = this.humanTaskDefinition.createDefinition(DueDateDefinition);
            }
            this.done();
        });
        html.find('textarea').on('change', e => this.change(dueDateExpression, 'body', e.target.value));
        html.find('.zoombt').on('click', e => {
            this.cmmnElement.case.cfiEditor.open(cfi => {
                this.change(dueDateExpression, 'contextRef', cfi.id);
                html.find('.valuelabel').html(cfi.name);
            });
        });
        html.find('.removeReferenceButton').on('click', e => {
            this.change(dueDateExpression, 'contextRef', undefined);
            html.find('.valuelabel').html('');
        });
        html.find('.zoomRow').on('pointerover', e => {
            e.stopPropagation();
            this.cmmnElement.case.cfiEditor.dropHandler = cfi => {
                const newContextRef = cfi.id;
                this.change(dueDateExpression, 'contextRef', newContextRef);
                const name = cfi ? cfi.name : '';
                html.find('.valuelabel').html(name);
            }
        });
        html.find('.zoomRow').on('pointerout', e => {
            this.cmmnElement.case.cfiEditor.dropHandler = undefined;
        });
        this.htmlContainer.append(html);
        return html;
    }

    renderData() {
        this.addLabelField('Workflow properties for', `'${this.cmmnElement.name}'`);
        this.addSeparator();
        this.addSeparator();
        this.addPerformerField();
        this.addSeparator();
        this.addSeparator();
        this.addDueDateField();
        this.addSeparator();
        this.addSeparator();
        this.addAssignmentField();
        this.addIdField();
    }
}
