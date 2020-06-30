class TaskProperties extends TaskStageProperties {
    /**
     * 
     * @param {Task} task 
     */
    constructor(task) {
        super(task);
        this.task = task;
    }

    /**
     * Adds a dropdown with all possible task implementation
     */
    addModelImplementation() {
        const repositoryBrowser = this.cmmnElement.case.editor.ide.repositoryBrowser;
        const taskDefinition = this.task.planItemDefinition;
        const implementation = taskDefinition.implementationRef ? taskDefinition.implementationRef : '';

        const options = this.task.getImplementationList().map(model => `<option value="${model.fileName}" ${model.fileName == implementation?" selected":""}>${model.name}</option>`).join('');
        const html = $(`<div class="propertymodelzoomfield">
                            <label>Implementation</label>
                            <div class="properties_filefield">
                                <div>
                                    <select>
                                        <option value="">${implementation ? '... remove '+implementation : ''}</option>
                                        <option value="__new__"><b>create new ...</b></option>
                                        ${options}
                                    </select>
                                </div>
                            </div>
                        </div>`);
        html.find('select').on('change', e => {
            const reference = e.target.value;
            const model = this.task.getImplementationList().find(model => model.fileName == reference);
            if (model) {
                this.task.changeTaskImplementation(model);
            } else if (reference == '__new__') {
                ide.info("This functionality is not yet implemented")
            } else {
                // if (confirm("Do you want to remove the mappings too?")) {
                //     console.log("Removing mappings too...")
                // }
                this.change(taskDefinition, 'implementationRef', e.target.value);
                this.clear();
                this.renderForm();
            }
        });
        // Also make the html a drop target for drag/dropping elements from the repository browser
        html.on('pointerover', e => repositoryBrowser.setDropHandler(selectedModel => this.task.changeTaskImplementation(selectedModel), shapeType => shapeType == this.cmmnElement.constructor.name));
        html.on('pointerout', e => repositoryBrowser.removeDropHandler());
        this.htmlContainer.append(html);
        return html;
    }

    addValidatorField() {
        const taskDefinition = this.task.planItemDefinition;
        const implementation = taskDefinition.validatorRef ? taskDefinition.validatorRef : '';

        const options = this.case.editor.ide.repository.getProcesses().map(model => `<option value="${model.fileName}" ${model.fileName == implementation?" selected":""}>${model.name}</option>`).join('');
        const html = $(`<div class="propertymodelzoomfield" title="Select a web service to be invoked to validate task output">
                            <label>Task Output Validator</label>
                            <div class="properties_filefield">
                                <div>
                                    <select>
                                        <option value="">${implementation ? '... remove '+implementation : ''}</option>
                                        ${options}
                                    </select>
                                </div>
                            </div>
                        </div>`);
        html.find('select').on('change', e => {
            const reference = e.target.value;
            const model = this.task.getImplementationList().find(model => model.fileName == reference);
            if (model) {
                this.change(taskDefinition, 'validatorRef', e.target.value);
                this.clear();
                this.renderForm();
            } else {
                // if (confirm("Do you want to remove the mappings too?")) {
                //     console.log("Removing mappings too...")
                // }
                this.change(taskDefinition, 'validatorRef', e.target.value);
                this.clear();
                this.renderForm();
            }
        });
        this.htmlContainer.append(html);
        return html;
    }

    addParameterMappings() {
        const html = $(`<div class="propertyButton">
                            <label>Parameter Mapping</label>
                            <div>
                                <button id="btnInputMapping">Input</button>
                                <button id="btnOutputMapping">Output</button>
                            </div>
                        </div>`);
        html.find('#btnInputMapping').on('click', e => this.task.mappingsEditor.open());
        html.find('#btnOutputMapping').on('click', e => this.task.mappingsEditor.open());
        this.htmlContainer.append(html);
        return html;
    }

    addIsBlocking() {
        this.addCheckField('Is Blocking', 'If the task is non-blocking, the case will continue without awaiting the task to complete', ISBLOCKING_IMG, 'isBlocking', this.task.planItemDefinition);
    }

    renderData() {
        this.addNameField();
        this.addSeparator();
        this.addDescriptionField();
        this.addSeparator();
        this.addModelImplementation();
        this.addParameterMappings();
        this.addSeparator();
        this.addRepeatRuleBlock();
        this.addRequiredRuleBlock();
        this.addManualActivationRuleBlock();
        this.addSeparator();
        this.addIsBlocking();
        this.addDiscretionaryBlock(DISCRETIONARYTASK_IMG, 'Discretionary Task');
        this.addIdField();
    }
}