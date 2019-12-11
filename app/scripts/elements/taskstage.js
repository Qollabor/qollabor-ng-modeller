class TaskStage extends PlanItemView {
    /**
     * Simple class to share some logic from Task and Stage.
     * @param {CMMNElement} parent 
     * @param {PlanItem} definition 
     */
    constructor(parent, definition) {
        super(parent, definition);
        this.showPlanningTable();
    }

    /** @returns {TaskStageDefinition} */
    get planItemDefinition() {
        return this.definition.definition;
    }

    /**
     * Returns the location of the planning table for this type of element. Subclasses must implement this method
     * @returns {*} A set of x, y coordinates
     */
    get __planningTablePosition () {
        throw new Error('Planning table position is not set in object of type ' + this.constructor.name);
    }

    /**
     * @param {PlanItem} definition 
     */
    addDiscretionaryItem(planItem) {
        throw new Error('This method must be implemented in subclasses');
    }

    refreshView() {
        super.refreshView();
        this.showPlanningTable();
        this.refreshDiscretionaryBorder();
    }

    /**
     * Renders the element border freshly, based on whether this is a discretionary item or not.
     */
    refreshDiscretionaryBorder() {
        const classOperation = this.definition.isDiscretionary ? 'addClass' : 'removeClass';
        this.html.find('.cmmn-shape')[classOperation]('cmmn-discretionary-border');
    }

    /**
     * Creates a planning table if it does not yet exist, and shows it.
     */
    showPlanningTable() {
        if (this.planItemDefinition.planningTable) {
            // If there is a definition, and we do not yet have a child to render it, then add such a child.
            if (! this.planningTableView) {
                new PlanningTable(this, this.planItemDefinition.planningTable);
            }
        }
    }

    /**
     * @returns {PlanningTable}
     */
    get planningTableView() {
        const table = this.__childElements.find(child => child instanceof PlanningTable);
        if (table instanceof PlanningTable) return table; // Adds "typesafety"
    }

    __addConnector(connector) {
        super.__addConnector(connector);
        if (this.definition.isDiscretionary) {
            const target = connector.source == this ? connector.target : connector.source;
            if (target instanceof HumanTask) {
                // We are discretionary, and need to be added to the discretionary items in the planning table of the HumanTask
                this.definition.switchParent(target.planItemDefinition);
            }
            this.parent.refreshView();
        }
    }

    __removeConnector(connector) {
        super.__removeConnector(connector);
        if (this.definition.isDiscretionary) {
            const target = connector.source == this ? connector.target : connector.source;
            if (target instanceof HumanTask) { // If target is HumanTask, then we are the Stage containing that task.
                this.definition.switchParent(target.parent.planItemDefinition);
                this.parent.refreshView();
            }
        }
    }

    referencesDefinitionElement(definitionId) {
        // This checks for discretionary items' authorizedRoles
        if (this.definition.isDiscretionary && this.definition.authorizedRoles.find(role => role.id == definitionId)) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }

    __validate() {
        super.__validate();

        // Check discretionary
        if (this.definition.isDiscretionary) {
            // ------- check if connected to a stage or task with a planning table first check connected to element with planningTable
            const numberOfConnectionsToPlanningTable = this.__getConnectedElements().filter(item => item instanceof TaskStage && item.planItemDefinition.planningTable).length;
            //not connected check if inside stage/case plan model with plannnigTable
            if (numberOfConnectionsToPlanningTable == 0) {
                // not connected to task with planningTable check if parent is stage or case plan
                // model with planningTable
                const cmmnParent = this.parent;
                if (cmmnParent && cmmnParent instanceof TaskStage) {
                    if (!cmmnParent.planItemDefinition.planningTable) {
                        this.raiseValidationIssue(20);
                    }
                } else {
                    this.raiseValidationIssue(20);
                }
            } else {
                if (numberOfConnectionsToPlanningTable >= 2) {
                    this.raiseValidationIssue(21);
                }
            }

            // Authorized roles must be filled with an ID attribute.
            this.definition.authorizedRoles.filter(r => !r.id).forEach(r => this.raiseValidationIssue(40));
        }
    }
}