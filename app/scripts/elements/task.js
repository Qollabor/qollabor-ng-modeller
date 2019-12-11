class Task extends TaskStage {

    /**
     * Creates a new Task element.
     * @param {CMMNElement} parent 
     * @param {PlanItem} definition
     */
    constructor(parent, definition) {
        super(parent, definition);

        //Define the mapping form to link task parameters with model parameters (case process humantask) 
        this.mappingsEditor = new TaskMappingsEditor(this);

        // Now read the parameters of the model implementing this task
        if (this.planItemDefinition.implementationRef) this.fetchTaskImplementation();
    }

    showMappingsEditor() {
        this.fetchTaskImplementation();
        this.mappingsEditor.open();
    }

    /**
     * Returns the list of models that can serve as an implementation for this task.
     * @returns {Array<ServerFile>}
     */
    getImplementationList() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /** @returns {TaskDefinition} */
    get planItemDefinition() {
        return this.definition.definition;
    }

    createProperties() {
        return new TaskProperties(this);
    }

    createHalo() {
        return new TaskHalo(this);
    }

    setDropHandlers() {
        super.setDropHandlers();
        // Add drop handler with repository browser to handle changing task implementation when it is drag/dropped from there.
        this.case.editor.ide.repositoryBrowser.setDropHandler(model => this.changeTaskImplementation(model), shapeType => this.constructor.name == shapeType);
    }

    removeDropHandlers() {
        super.removeDropHandlers();
        this.case.editor.ide.repositoryBrowser.removeDropHandler();
    }

    generateNewTaskImplementation() {
        const potentialImplementationName = this.definition.name.split(' ').join('');
        const existingModel = this.getImplementationList().find(serverFile => serverFile.name === potentialImplementationName);
        if (existingModel) {
            this.planItemDefinition.implementationRef = existingModel.fileName;
        } else {
            const fileName = this.case.editor.ide.createNewModel(this.fileType, potentialImplementationName, this.definition.description);
            this.planItemDefinition.implementationRef = fileName;
            window.location.hash = fileName;
        }
        this.case.editor.completeUserAction();
        this.refreshView();
    }

    /**
     * Changes the task implementation if the model's fileName differs from the current implementationRef.
     * If it is a newly added task, then the description maybe filled with the name of the task implementation.
     * This can be indicated by passing the "updateTaskDescription" flag to true.
     * @param {DragData | ServerFile} model 
     * @param {Boolean} updateTaskDescription 
     */
    changeTaskImplementation(model, updateTaskDescription = false) {
        if (this.planItemDefinition.implementationRef == model.fileName) {
            // no need to change. Perhaps re-generate parameters??? Better give a separate button for that ...
            return;
        }
        this.fetchTaskImplementation(true, model.fileName, updateTaskDescription, true);
    }

    /**
     * Fetches the file with the specified name from the repository, and associates it with this task through
     * the specified callback function
     * @param {Boolean} saveChanges - Indicates whether any newly generated information must be stored immediately or not. 
     * @param {String} fileName The (relative) URL to the file to be loaded
     * @param {Boolean} updateTaskDescription Indicates whether the Task description should be modified to match the information inside the implementation.
     * @param {Boolean} showProperties Indicates to open the properties view after the new information is rendered and received.
     */
    fetchTaskImplementation(saveChanges = false, fileName = this.planItemDefinition.implementationRef, updateTaskDescription = false, showProperties = false) {
        // Now, read the file, and update the information in the task parameters.
        this.case.editor.ide.repository.readModel(fileName, model => {
            if (! model) {
                this.case.editor.ide.warning('Could not read the model ' + fileName + ' which is referenced from the task ' + this.name);
                return;
            }

            // Only update the name if we drag/drop into a new element; do not change for dropping on existing element
            if (updateTaskDescription) {
                console.warn("Updating the description to "+model.name)
                const name = model.name;
                if (name) {
                    this.definition.name = name;
                    this.refreshView();
                }
            }

            // Set the implementation. If it leads to new mappings, this method will return "true, and we wil"
            this.planItemDefinition.setImplementation(fileName, model);

            // Make sure to save changes if any.
            if (saveChanges) this.case.editor.completeUserAction();

            // Now refresh the renderers and optionally the propertiesmenu.
            this.mappingsEditor.refresh();
            if (showProperties) this.propertiesView.show(true);
        });
    }

    /** @returns {String} */
    get fileType() {
        throw new Error('Task of type ' + this.constructor.name + ' must implement file type');
    }

    refreshReferencingFields(definitionElement) {
        super.refreshReferencingFields(definitionElement);
        this.mappingsEditor.refresh();
    }

    get __planningTablePosition() {
        return { x: 22, y: -9 };
    }

    get markup() {
        return `<g class="scalable">
                    <rect class="cmmn-shape cmmn-border cmmn-${this.constructor.name.toLowerCase()}-shape" rx="5" ry="5" width="100" height="60"/>
                </g>
                <text class="cmmn-text" />
                <image class="taskImage" x="4" y="4" width="16" height="16" xlink:href="${this.imageURL}" />
                ${this.decoratorBox}`;
    }

    get textAttributes() {
        return {
            'text': {
                ref: '.cmmn-shape',
                'ref-x': .5,
                'ref-y': .5,
                'y-alignment': 'middle',
                'x-alignment': 'middle'
            }
        };
    }

    createDecorators() {
        return [
            new Decorator(MANUALACTIVATION_IMG, () => this.definition.itemControl.manualActivationRule),
            new Decorator(REQUIRED_IMG, () => this.definition.itemControl.requiredRule),
            new Decorator(REPETITION_IMG, () => this.definition.itemControl.repetitionRule)
        ];
    }

    //returns true when an element of type 'elementType' can be added as a child to this element
    __canHaveAsChild(elementType) {
        return elementType == EntryCriterion.name || elementType == ExitCriterion.name;
    }

    __delete() {
        super.__delete();
        this.mappingsEditor.delete();
    }

    //validate: all steps to check this element
    __validate() {
        super.__validate();

        if (!this.planItemDefinition.implementationRef) {
            this.raiseValidationIssue(3);
        }

        if (this.planItemDefinition.isBlocking == false) {
            //non blocking task cannot have exit sentries
            if (this.definition.exitCriteria.length > 0) {
                this.raiseValidationIssue(5);
            }

            //non blocking task cannot have output parameters
            if (this.planItemDefinition.outputs.length > 0) {
                this.raiseValidationIssue(6);
            }

            //non blocking human task cannot have a planningtable
            if (this.planItemDefinition.planningTable) {
                this.raiseValidationIssue(8);
            }
        }

        this.validateParameterMappings(this.planItemDefinition.inputMappings, 'sourceRef', 'input');
        this.validateParameterMappings(this.planItemDefinition.inputMappings, 'targetRef', 'input');
    }

    validateParameterMappings(mappings, referenceProperty, mappingType) {
        mappings.forEach(mapping => {
            if (!mapping[referenceProperty]) {
                this.raiseValidationIssue(37, [this.name, this.case.name, mappingType]);
            }
        });
    }

    /**
     * @returns {String}
     */
    get imageURL() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    //shows the element properties as icons in the element
    refreshView() {
        super.refreshView();
        this.refreshTaskImage();
    }

    refreshTaskImage() {
        //show image of the right task type (typically blocking vs. non-blocking human task)
        this.html.find('.taskImage').attr('xlink:href', this.imageURL);
    }

    referencesDefinitionElement(definitionId) {
        if (this.planItemDefinition.inputs.find(parameter => parameter.bindingRef == definitionId)) {
            return true;
        }
        if (this.planItemDefinition.outputs.find(parameter => parameter.bindingRef == definitionId)) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }
}