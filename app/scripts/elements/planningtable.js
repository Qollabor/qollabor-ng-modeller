class PlanningTable extends CMMNElement {

    /**
     * 
     * @param {TaskStage} parent 
     * @param {PlanningTableDefinition} definition 
     */
    constructor(parent, definition) {
        super(parent, definition);
        // Setters enable better type introspection
        this.definition = definition;
        this.parent = parent;
        this.__resizable = false;
        parent.__addCMMNChild(this);

        this.stage = this.parent instanceof Stage ? this.parent : this.parent.parent;
        // Now also render the discretionary items from the definition in our parent
        this.definition.tableItems.forEach(item => this.parent.addDiscretionaryItem(item));
    }

    /**
     * Override select in both planningtable and sentry to immediately show properties.
     * @param {Boolean} selected 
     */
    __select(selected) {
        super.__select(selected);
        if (selected) {
            this.propertiesView.show();
        }
    }

    createProperties() {
        return new PlanningTableProperties(this);
    }

    createHalo() {
        return new PlanningTableHalo(this);
    }

    get markup() {
        return `<rect class="cmmn-shape cmmn-planningtable-shape" />
                <image xlink:href="${EXPANDEDPLANNINGTABLE_IMG}" x="1" y="-3" width="24" height="24" />`;
    }

    /**
     * Deleting the planning table should also inform our parent that we're gone...
     */
    __delete() {
        // First make all discretionary items non-discretionary, in order not to loose their drawings.
        this.definition.tableItems.map(i => i).forEach(item => item.switchType());
        // Invoke super logic, but only after switching type of our discretionary items,
        //  otherwise the pointers are lost since super.__delete() removes the definition.
        super.__delete();
        // Render the stage again, in order to remove dotted lines from the converted former discretionary items
        this.stage.refreshView();
    }

    //validate: all steps to check this element
    __validate() {
        //check if planningTable is used and refers to discretionary planItems
        this.hasLinkedDiscretionaryItems();
        this.planningTableRule();
    }

    /**
     * Checks if the planningTable is used and refers to a discretionary item
     */
    hasLinkedDiscretionaryItems() {
        //check if planningTable is used
        const cmmnParentElement = this.parent;
        if (!cmmnParentElement.planningTableView) {
            return;
        }

        if (cmmnParentElement instanceof Stage) {
            const stage = cmmnParentElement;
            if (stage.planningTableView.definition.tableItems.length == 0) {
                if (!stage.__getConnectedElements().find(element => element instanceof PlanItemView && element.definition.isDiscretionary)) {
                    this.raiseValidationIssue(19, [stage.typeDescription, stage.name, this.case.name]);
                }
            }
        } else if (cmmnParentElement instanceof Task) {
            const task = cmmnParentElement;
            if (!task.__getConnectedElements().find(element => element instanceof PlanItemView && element.definition.isDiscretionary)) {
                this.raiseValidationIssue(19, [task.typeDescription, task.name, this.case.name]);
            }
        }
    }

    /**
     * The applicability rules must have a name and an expression
     */
    planningTableRule() {
        // If there is one or more rules without a body, then we need to give only 1 warning
        if (this.definition.ruleDefinitions.find(rule => !rule.body)) {
            this.raiseValidationIssue(25, [this.parent.name, this.case.name]);
        }
        if (this.definition.ruleDefinitions.find(rule => !rule.name)) {
            this.raiseValidationIssue(29, [this.parent.name, this.case.name]);
        }
    }

    /**
     * A planningTable has a fixed position on it's parent, it cannot be moved.
     * Position cursor is not relevant
     */
    __moveConstraint(x, y) {
        const parentX = this.parent.shape.x;
        const parentY = this.parent.shape.y;
        //create a point relative to the parentElement, where the planningTable must be positioned relative to the parent
        const point = g.point(parentX + this.parent.__planningTablePosition.x, parentY + this.parent.__planningTablePosition.y);

        // get the absolute position of the planningTable
        //  NOTE: Planning Table does NOT yet store a CMMNShape object. It would be better if it did... Now we have to use joint :(
        const ptX = this.shape.x;
        const ptY = this.shape.y;

        //position planningTable with respect to the parent
        const translateX = point.x - ptX;
        const translateY = point.y - ptY;

        this.xyz_joint.translate(translateX, translateY);
    }

    referencesDefinitionElement(definitionId) {
        // check in applicabilty rules; note: we're checking sourceRef, but it ought to be contextRef...
        if (this.definition.ruleDefinitions.find(rule => rule.sourceRef == definitionId)) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }
}
CMMNElement.registerType(PlanningTable, 'Planning Table');