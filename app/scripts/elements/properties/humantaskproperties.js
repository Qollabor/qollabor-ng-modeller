class HumanTaskProperties extends TaskProperties {
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

    renderData() {
        this.addNameField();
        this.addSeparator();
        this.addDescriptionField();
        this.addSeparator();
        this.addModelImplementation();
        this.addParameterMappings();
        this.addValidatorField();
        this.addSeparator();
        this.addRepeatRuleBlock();
        this.addRequiredRuleBlock();
        this.addManualActivationRuleBlock();
        this.addSeparator();
        this.addIsBlocking();
        this.addDiscretionaryBlock(DISCRETIONARYTASK_IMG, 'Discretionary Task');
        this.addSeparator();
        this.addPlanningTableField();
        this.addIdField();
    }
}
