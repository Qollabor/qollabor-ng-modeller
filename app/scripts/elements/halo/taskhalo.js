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
        const task = this.element;
        this.addItems(ConnectorHaloItem, PropertiesHaloItem, WorkflowHaloItem, DeleteHaloItem);
        if (!this.element.definition.isDiscretionary) {
            this.addItems(EntryCriterionHaloItem, ExitCriterionHaloItem);
        }
        if (this.element.planItemDefinition.implementationRef) {
            const model = task.planItemDefinition.implementationModel && task.planItemDefinition.implementationModel.taskModel;
            const taskModel = model && model.taskModel || '';
            try {
                JSON.parse(taskModel)
                this.addItems(ZoomTaskImplementationHaloItem, InputParametersHaloItem, OutputParametersHaloItem, PreviewTaskFormHaloItem);                
            } catch (error) {
                this.addItems(ZoomTaskImplementationHaloItem, InputParametersHaloItem, OutputParametersHaloItem, InvalidPreviewTaskFormHaloItem);
            }
        } else {
            this.addItems(NewTaskImplemenationHaloItem);
        }
    }    
}