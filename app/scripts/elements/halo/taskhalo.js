class TaskHalo extends PlanItemHalo {
    /**
     * Create the halo for the task.
     * @param {Task} element 
     */
    constructor(element) {
        super(element);
        this.element = element;
    }

    createItems() {
        super.createItems();
        if (this.element.planItemDefinition.implementationRef) {
            this.addItems(ZoomTaskImplementationHaloItem, InputParametersHaloItem, OutputParametersHaloItem);
        } else {
            this.addItems(NewTaskImplemenationHaloItem);
        }
    }
}

class HumanTaskHalo extends TaskHalo {
    /**
     * Create the halo for the task.
     * @param {HumanTask} element 
     */
    constructor(element) {
        super(element);
        this.element = element;
    }

    createItems() {
        this.addItems(ConnectorHaloItem, PropertiesHaloItem, WorkflowHaloItem, DeleteHaloItem);
        if (!this.element.definition.isDiscretionary) {
            this.addItems(EntryCriterionHaloItem, ExitCriterionHaloItem);
        }
        if (this.element.planItemDefinition.implementationRef) {
            this.addItems(ZoomTaskImplementationHaloItem, InputParametersHaloItem, OutputParametersHaloItem);
        } else {
            this.addItems(NewTaskImplemenationHaloItem);
        }
    }    
}