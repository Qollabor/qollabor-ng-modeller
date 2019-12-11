class ParameterMappingDefinition extends UnnamedCMMNElementDefinition {
    /**
     * 
     * @param {Element} importNode 
     * @param {CaseDefinition} caseDefinition 
     * @param {TaskDefinition} parent 
     */
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.parent = parent;
        this.sourceRef = this.parseAttribute('sourceRef');
        this.targetRef = this.parseAttribute('targetRef');
        this.transformation = this.parseElement('transformation', ExpressionDefinition);
    }

    get taskParameterName() {
        return '';
    }

    get transient() {
        return this._isTransient;
    }

    /** @param {Boolean} transient */
    set transient(transient) {
        this._isTransient = transient;
    }

    /**
     * Creates a new input or output parameter (depending on the type of mapping)
     * @param {String} name 
     * @returns {ParameterDefinition}
     */
    createTaskParameter(name) {
        const task = this.parent;
        this.taskParameter = this.isInputMapping ? task.getInputParameterWithName(name) : task.getOutputParameterWithName(name);
        return this.taskParameter;
    }

    get taskParameter() {
        if (this.isInputMapping) {
            return this.source;
        } else {
            return this.target;
        }
    }

    /**
     * @param {ParameterDefinition} parameter
     */
    set taskParameter(parameter) {
        if (this.isInputMapping) {
            this.source = parameter;
        } else {
            this.target = parameter;
        }
    }

    get implementationParameter() {
        return this._implementationParameter;
    }

    /**
     * @param {ImplementationParameterDefinition} parameter
     */
    set implementationParameter(parameter) {
        this._implementationParameter = parameter;
        if (this.isInputMapping) {
            this.target = parameter;
        } else {
            this.source = parameter;
        }
    }

    /**
     * Returns the name of the implementation parameter if there is an implementation parameter; else an empty string.
     */
    get implementationParameterName() {
        return this.implementationParameter ? this.implementationParameter.name : '';
    }

    /**
     * Returns the id of the implementation parameter if there is an implementation parameter; else an empty string.
     */
    get implementationParameterId() {
        const id = this.isInputMapping ? this.targetRef : this.sourceRef;
        return id;
    }

    /**
     * Either source or target will be undefined, because one refers to the task-implementation's input/output parameter
     * @returns {ParameterDefinition | ImplementationParameterDefinition}
     */
    get source() {
        return this.caseDefinition.getElement(this.sourceRef, ParameterDefinition);
    }

    set source(parameter) {
        this.sourceRef = parameter ? parameter.id : undefined;
        this.transient = false;
    }

    /**
     * Either source or target will be undefined, because one refers to the task-implementation's input/output parameter
     * @returns {ParameterDefinition | ImplementationParameterDefinition}
     */
    get target() {
        return this.caseDefinition.getElement(this.targetRef, ParameterDefinition);
    }

    set target(parameter) {
        this.targetRef = parameter ? parameter.id : undefined;
        this.transient = false;
    }

    get isInputMapping() {
        const sourceRef = this.sourceRef;
        const targetRef = this.targetRef;
        const sourceElement = this.caseDefinition.getElement(this.sourceRef);
        const targetElement = this.caseDefinition.getElement(this.targetRef);

        // First simple cases: if either attribute is filled, and the corresponding element is found in the case,
        //  it is immediately clear.
        if (sourceRef && sourceElement) {
            return true;
        }
        if (targetRef && targetElement) {
            return false;
        }

        if (!sourceRef && !targetRef) {
            // If neither attribute is set, then this is an entirely new mapping; but that is mostly only possible for output mappings,
            //  because there is a fixed set of input mappings.
            return false;
        }

        const taskDefinition = this.parent;
        if (taskDefinition.implementationModel) {
            // If we have an implementation contract available, we can look up the source and/or target ref in the contract.
            if (sourceRef && taskDefinition.implementationModel.outputParameters.find(parameter => parameter.id == sourceRef)) {
                return false;
            } else if (targetRef && taskDefinition.implementationModel.inputParameters.find(parameter => parameter.id == targetRef)) {
                return true;
            } else {
                // this is really an error; source and/or target are filled, but without proper refererences
                console.error('The mapping ' + this.id + ' in task ' + taskDefinition.name + ' has invalid source and target references', this)
                return false;
            }
        } else {
            // No implementation available yet. Let's assume that a bit here.
            if (sourceRef && targetRef) {
                // Both are set?! Must be some error here, since either should have been found in the task definition itself.
                console.error('The mapping ' + this.id + ' in task ' + taskDefinition.name + ' has invalid source and target references', this)
                return false;
            } else if (sourceRef) {
                return false;
            } else {
                return true;
            }
        }
    }

    get body() {
        return this.transformation ? this.transformation.body : '';
    }

    set body(expression) {
        if (expression) {
            if (!this.transformation) {
                this.transformation = this.createDefinition(ExpressionDefinition);
            }
            this.transformation.body = expression;
            this.transient = false;
        } else {
            if (this.transformation) {
                this.transformation.removeDefinition();
            }
        }
    }

    createExportNode(parentNode) {
        if (this.transient) {
            // console.log("We are a transient mapping in task "+this.parent.name);
            return;
        }
        super.createExportNode(parentNode, 'parameterMapping', 'sourceRef', 'targetRef', 'transformation');
    }
}
