class Stage extends TaskStage {
    static get definitionClass() {
        return StageDefinition;
    }

    /**
     * Creates a new Stage element
     * @param {CMMNElement} parent
     * @param {PlanItem} definition
     */
    constructor(parent, definition) {
        super(parent, definition);
        this.planItemDefinition.planItems.forEach(planItem => this.addPlanItem(planItem));
    }

    /** @returns {StageDefinition} */
    get planItemDefinition() {
        return this.definition.definition;
    }

    setDropHandlers() {
        super.setDropHandlers();
        // allow for dropping tasks directly from repository browser ...
        this.case.editor.ide.repositoryBrowser.setDropHandler((dragData, e) => this.addTaskModel(dragData, e));
        // ... and case file items to be dropped from the cfiEditor
        this.case.cfiEditor.setDropHandler((dragData, e) => this.addCaseFileItem(dragData, e));
    }

    removeDropHandlers() {
        super.removeDropHandlers();
        this.case.editor.ide.repositoryBrowser.removeDropHandler();
        this.case.cfiEditor.removeDropHandler();
    }

    /**
     * Add a 'drag-dropped' case file item
     * @param {DragData} dragData 
     * @param {JQuery<Event>} e 
     */
    addCaseFileItem(dragData, e) {
        const cfiDefinition = this.case.caseDefinition.getElement(dragData.fileName);
        const coor = this.case.getCursorCoordinates(e);
        cfiDefinition.__startPosition = coor;
        const cfi = CaseFileItem.create(this, coor.x, coor.y);
        // Associate the right definition
        cfi.definition.contextRef = cfiDefinition.id;
        // And add to the stage
        this.__addCMMNChild(cfi);
    }

    /**
     * Add a 'drag-dropped' task implementation
     * @param {DragData} dragData 
     * @param {*} e 
     */
    addTaskModel(dragData, e) {
        /** @type {Task} */
        const element = super.addShape(dragData.shapeType, e);
        element.changeTaskImplementation(dragData, true);
    }

    /**
     * If a stage is moved, then it may be moved onto other plan items.
     * If that is the case, these items will change their parent to this stage.
     * Alternatively, if a stage is resized to a smaller size, items may fall out, and then get a new parent.
     */
    resetChildren() {
        const currentChildren = this.__childElements;
        // Only other plan items, case file items and textboxes can move in/out of us. Not planning tables or sentries.
        const allCaseItems = this.case.items.filter(item => !(item instanceof PlanningTable) && !(item instanceof Sentry));
        // Create a collection of items we surround visually, but only the "top-level", not their children.
        const visuallySurroundedItems = allCaseItems.filter(item => this.surrounds(item) && !this.surrounds(item.parent));
        // Former children: those that are currently a descendant, but that we no longer surround visually.
        const formerChildren = allCaseItems.filter(item => currentChildren.indexOf(item) >= 0 && visuallySurroundedItems.indexOf(item) < 0);
        // New children: those that are currently not a descendant, but that we now surround visually.
        const newChildren = allCaseItems.filter(item => currentChildren.indexOf(item) < 0 && visuallySurroundedItems.indexOf(item) >= 0);
        formerChildren.forEach(child => child.changeParent(this.parent));
        newChildren.forEach(child => child.changeParent(this));
    }

    /**
     * Determines whether this stage visually surrounds the cmmn element.
     * @param {CMMNElement} other 
     */
    surrounds(other) {
        // Note: this method is added here instead of directly invoking shape.surrounds because logic is different at caseplan level, so caseplan can override.
        return this.shape.surrounds(other.shape);
    }

    createProperties() {
        return new StageProperties(this);
    }

    get __planningTablePosition() {
        return { x: 50, y: -9 };
    }

    /**
     * 
     * @param {PlanItem} definition 
     */
    addPlanItem(definition) {
        if (!definition.definition) {
            // there is no planitemdefinition for the planitem...
            console.warn('Plan item has NO definition and will be skipped', definition);
            return;
        }
        // Only add the new plan item if we do not yet visualize it
        if (!this.__childElements.find(planItemView => planItemView.definition.id == definition.id)) {
            return this.__addCMMNChild(this.createPlanItemView(definition));
        }
    }

    /**
     * Creates a new view (either HumanTask, CaseTask, ProcessTask, CasePlanModel, Milestone, Stage, UserEvent, TimerEvent),
     * based on the given plan item. It will look for the planItemDefinition inside the plan item and take it's type to determine the view.
     * @param {PlanItem} definition 
     */
    createPlanItemView(definition) {
        const planItemDefinition = definition.definition;
        switch (planItemDefinition.constructor) {
        case HumanTaskDefinition:
            return new HumanTask(this, definition);
        case CaseTaskDefinition:
            return new CaseTask(this, definition);
        case ProcessTaskDefinition:
            return new ProcessTask(this, definition);
        case StageDefinition:
            return new Stage(this, definition);
        case MilestoneDefinition:
            return new Milestone(this, definition);
        case UserEventDefinition:
            return new UserEvent(this, definition);
        case TimerEventDefinition:
            return new TimerEvent(this, definition);
        default:
            throw new Error('This type of plan item cannot be instantiated into a view' + definition.name);
        }
    }

    /**
     * Method invoked when a child is moved into this element from a different parent.
     * @param {CMMNElement} childElement 
     */
    adoptItem(childElement) {
        const previousParent = childElement.parent;
        super.adoptItem(childElement);
        if (childElement instanceof PlanItemView) {
            // then also move the definition
            childElement.definition.switchParent(this.planItemDefinition);
            // If the item is discretionary, we may also have to clean up the former planning table and refresh ours.
            if (childElement.definition.isDiscretionary && previousParent && previousParent instanceof Stage) {
                previousParent.cleanupPlanningTableIfPossible();
                this.showPlanningTable();
            }
        }
    }

    cleanupPlanningTableIfPossible() {
        if (this.planningTableView) {
            if (this.planningTableView.definition.tableItems.length == 0) {
                this.planningTableView.__delete();
                return;
            }
        }
    }

    /**
     * Adds a discretionary item definition (that is, a PlanItem with .isDiscretionary set to true)
     * @param {PlanItem} definition 
     */
    addDiscretionaryItem(definition) {
        this.addPlanItem(definition);
    }

    createCMMNChild(cmmnType, x, y) {
        if (Util.isSubClassOf(PlanItemView, cmmnType)) {
            const definitionType = cmmnType.definitionClass;
            return this.addPlanItem(this.planItemDefinition.createPlanItem(definitionType, x, y));
        } else if (cmmnType == CaseFileItem) {
            return this.__addCMMNChild(CaseFileItem.create(this, x, y));
        } else if (cmmnType == TextBox) {
            return this.__addCMMNChild(TextBox.create(this, x, y));
        } else { // Could (should?) be sentry
            return super.createCMMNChild(cmmnType, x, y);
        }
    }

    createShapeChild(shape) {
        if (shape instanceof CaseFileItemShape) {
            return this.__addCMMNChild(new CaseFileItem(this, shape));
        } else if (shape instanceof TextBoxShape) {
            return this.__addCMMNChild(new TextBox(this, shape));
        }
    }

    //validation steps of a stage
    __validate() {
        super.__validate();

        this.validatePlanItemDefinitionNesting();
        this.autoCompleteDiscretionary();
        this.oneOrLessChildren();

        //check discretionary
        if (this.definition.isDiscretionary) {
            this.discretionaryStage();
        }
    }

    /**
     * check discretionary stage, NOT discretionary to child
     */
    discretionaryStage() {
        this.__getConnectedElements().forEach(connectedCMMNElement => {
            if (connectedCMMNElement.__planningTable) {
                // this discretionary stage is connected to another element for its' planning table
                this.__getDescendants().forEach(child => {
                    if (child == connectedCMMNElement) {
                        this.raiseValidationIssue(22, [this.name, this.case.name, connectedCMMNElement.name]);
                    }
                });
            }
        });
    }

    /**
     * A stage should have more than one child
     */
    oneOrLessChildren() {
        const numPlanItems = this.planItemDefinition.planItems.length;
        const planningTable = this.planItemDefinition.planningTable;
        const numDiscretionaryItems = planningTable ? planningTable.tableItems.length : 0;
        if (numPlanItems + numDiscretionaryItems <= 1) {
            //stage has one or less children
            this.raiseValidationIssue(13);
        }
    }

    /**
     * A stage with autocomplete=false should have discretionary items (and a planning table)
     */
    autoCompleteDiscretionary() {
        if (this.planItemDefinition.autoComplete == false) {
            const planningTable = this.planItemDefinition.planningTable;
            if (!planningTable || planningTable.tableItems.length == 0) {
                //no discretionary children found
                this.raiseValidationIssue(12);
            }
        }
    }

    /**
     * checks whether element refers for its' plan item definition to an ancestor or descendant
     */
    validatePlanItemDefinitionNesting() {
        const pidID = this.planItemDefinition.id;
        if (pidID) {
            // search parents/ancestors
            let parent = this.parent;
            while (parent) {
                if (parent.id == pidID) {
                    //the element refers for its' PID to a (grand)parent
                    this.raiseValidationIssue(9, [this.name, this.case.name, 'an ancestor or (grand)parent']);
                    return;
                }
                parent = parent.parent;
            }

            // Search children.
            const child = this.__getDescendants().find(child => child.id == pidID);
            if (child) {
                this.raiseValidationIssue(9, [this.name, this.case.name, 'a decendant or (grand)child']);
                return;
            }
        }
    }

    get markup() {
        return `<g class="scalable">
                    <polyline class="cmmn-shape cmmn-border cmmn-stage-shape" points=" 20,0 0,20 0,280 20,300 480,300 500,280 500,20 480,0 20,0" />
                </g>
                <text class="cmmn-bold-text" font-size="12" />
                ${this.decoratorBox}`;
    }

    get textAttributes() {
        return {
            'text': {
                'ref': '.cmmn-shape',
                'ref-x': .5,
                'ref-y': 8,
                'x-alignment': 'middle',
                'y-alignment': 'top'
            }
        };
    }

    createDecorators() {
        return [
            new Decorator(MANUALACTIVATION_IMG, () => this.definition.itemControl.manualActivationRule),
            new Decorator(REQUIRED_IMG, () => this.definition.itemControl.requiredRule),
            new Decorator(MINUS_IMG, () => true),
            new Decorator(AUTOCOMPLETE_IMG, () => this.planItemDefinition.autoComplete),
            new Decorator(REPETITION_IMG, () => this.definition.itemControl.repetitionRule)
        ];
    }

    /**
     * returns true when an element of type 'elementType' can be added as a child to this element
     * @param {*} elementType 
     */
    __canHaveAsChild(elementType) {
        if (elementType == EntryCriterion.name ||
            elementType == ExitCriterion.name ||
            elementType == HumanTask.name ||
            elementType == CaseTask.name ||
            elementType == ProcessTask.name ||
            elementType == Milestone.name ||
            elementType == UserEvent.name ||
            elementType == TimerEvent.name ||
            elementType == CaseFileItem.name ||
            elementType == Stage.name ||
            elementType == TextBox.name) {
            return true;
        }
        return false;
    }
}
CMMNElement.registerType(Stage, 'Stage', 'images/collapsedstage_32.png');