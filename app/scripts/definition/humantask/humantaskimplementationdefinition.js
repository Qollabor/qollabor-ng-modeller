class HumanTaskImplementationDefinition extends HumanTaskModelElementDefinition {
    constructor(importNode, modelDefinition, parent) {
        super(importNode, modelDefinition, parent);
        /** @type {Array<ImplementationParameterDefinition>} */
        this.input = this.parseElements('input', ImplementationParameterDefinition);
        /** @type {Array<ImplementationParameterDefinition>} */
        this.output = this.parseElements('output', ImplementationParameterDefinition);
        /** @type {TaskModelDefinition} */
        this.taskModel = this.parseElement('task-model', TaskModelDefinition);
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, IMPLEMENTATION_TAG, 'input', 'output', 'taskModel');
        this.exportNode.setAttribute(IMPLEMENTATION_PREFIX, IMPLEMENTATION_NAMESPACE);
        this.exportNode.setAttribute('class', 'org.qollabor.cmmn.definition.task.WorkflowTaskDefinition');

        // Hmmmm ... perhaps it is better to put name and description a level higher ...
        //  We'd have to investigate compatibility for existing models.
        this.exportNode.setAttribute('name', this.modelDefinition.name);
        this.exportNode.setAttribute('description', this.modelDefinition.description);
    }
}