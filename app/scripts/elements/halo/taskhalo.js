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