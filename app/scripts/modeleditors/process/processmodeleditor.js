'use strict';

class ProcessModelEditor extends ModelEditor {
    /** 
     * This editor handles process models; only validates the xml
     * @param {IDE} ide 
     * @param {String} fileName The full file name to be loaded, e.g. 'helloworld.case', 'sendresponse.humantask'
     * @param {String} modelName The file name without the extension, e.g. 'helloworld'
     * @param {String} modelType  The extension of the fileName, e.g. 'case', 'process', 'humantask'
     */
    constructor(ide, fileName, modelName, modelType) {
        super(ide, fileName, modelName, modelType);
        this.generateHTML();
    }

    get label() {
        return 'Edit Process - ' + this.fileName;
    }

    /**
     * adds the html of the entire page
     */
    generateHTML() {
        const html = $(`
            <div class="basicbox model-source-tabs">
                <ul>
                    <li><a href="#modelEditor">Editor</a></li>
                    <li><a href="#sourceEditor">Source</a></li>
                </ul>
                <div class="process-model-editor" id="modelEditor">
                    <div class="modelgenericfields">
                        <div>
                            <label>Name</label>
                            <label>Description</label>
                        </div>
                        <div>
                            <input class="inputName" type="text" />
                            <input class="inputDescription" type="text" />
                        </div>
                    </div>
                    <div class="model-parameters">
                        <div class="model-input-parameters"></div>
                        <div class="model-output-parameters"></div>
                    </div>
                    <div class="process-model-source">
                        <label>Process Implementation (XML)</label>
                        <div class="code-mirror-container"></div>
                    </div>
                </div>
                <div class="model-source-editor" id="sourceEditor"></div>
            </div>
        `);

        this.htmlContainer.append(html);

        //add change event to input fields
        this.htmlContainer.find('.inputName').on('change', e => this.change('name', e.currentTarget.value));
        this.htmlContainer.find('.inputDescription').on('change', e => this.change('description', e.currentTarget.value));


        // Render input parameters
        this.inputParametersControl = new ModelParameters(this, this.html.find('.model-input-parameters'), 'Input Parameters');
        this.outputParametersControl = new ModelParameters(this, this.html.find('.model-output-parameters'), 'Output Parameters');

        //add the tab control
        this.htmlContainer.find('.model-source-tabs').tabs({
            activate: (e, ui) => {
                if (ui.newPanel.hasClass('model-source-editor')) {
                    this.viewSourceEditor.render(XML.prettyPrint(this.model.toXML()));
                }
            }
        });

        // Add code mirror xml style
        this.freeContentEditor = CodeMirrorConfig.createXMLEditor(this.html.find('.code-mirror-container'));

        /*Events for saving and keeping track of changes in the task model editor
        The model should only be saved when there is a change and the codemirror is blurred.
        The onchange event of codemirror fires after every keydown, this is not wanted.
        So only save after blur, but only when there is a change in content.
        To avoid missing the blur event and therewith loosing work, 
        the editor automatically saves 10 seconds after last change.
        */
        // Add event handlers on code mirror to track changes
        this.freeContentEditor.on('focus', () => this._changed = false);
        this.freeContentEditor.on('blur', () => {
            if (this._changed) {
                this._removeAutoSave();
                this._validateAndSave();
            }
        });
        this.freeContentEditor.on('change', () => {
            this._enableAutoSave()
        });

        //add the source part
        this.viewSourceEditor = new ModelSourceEditor(this.html.find('.model-source-tabs .model-source-editor'), this);
    }

    /**
     * 
     * @param {String} propertyName 
     * @param {String} propertyValue 
     */
    change(propertyName, propertyValue) {
        this.model[propertyName] = propertyValue;
        this.saveModel();
    }

    render() {
        // Render name and description
        this.htmlContainer.find('.inputName').val(this.model.name);
        this.htmlContainer.find('.inputDescription').val(this.model.description);

        this.inputParametersControl.renderParameters(this.model.inputParameters);
        this.outputParametersControl.renderParameters(this.model.outputParameters);

        // Set the implementation content in the code mirror editor and
        this.freeContentEditor.setValue(this.model.implementation.xml);
        this.freeContentEditor.refresh();
    }

    completeUserAction() {
        this.saveModel();
    }

    /**
     * Sets or replaces the auto save timer (which runs 10 seconds after the last change)
     */
    _enableAutoSave() {
        // Set 'changed' flag.
        this._changed = true;

        // Remove any existing timers
        this._removeAutoSave();

        // Now add a new timer to go off in 10 seconds from now (if no other activity takes place)
        this._currentAutoSaveTimer = window.setTimeout(() => {
            if (this._changed) {
                this._validateAndSave();
            }
        }, 10000);
    }

    /**
     * Removes the auto save timer, if it is defined.
     */
    _removeAutoSave() {
        if (this._currentAutoSaveTimer) {
            window.clearTimeout(this._currentAutoSaveTimer);
        }
    }

    onHide() {
        this._removeAutoSave();
    }

    onShow() {
        //always start with editor tab
        this.html.find('.model-source-tabs').tabs('option', 'active', 0);
        //this refresh, is a workaround for defect in codemirror
        //not rendered properly when html is hidden
        setTimeout(() => this.freeContentEditor.refresh(), 100);
    }

    loadModel() {
        this.ide.repository.readModel(this.fileName, model => {
            this._model = model;
            this.render();
            this.visible = true;
        });
    }

    openModel(content) {
        this.parser = new ModelDocument(this.ide, this.fileName, content);
        this._model = this.parser.parseModel(ProcessModelDefinition);
        this.render();
    }

    /**
     * handle the change of the source (in 2nd tab)
     */
    loadSource(newSource) {
        this.openModel(newSource);
        this.saveModel();
    }

    saveModel() {
        // Remove 'changed' flag just prior to saving
        this._changed = false;

        const data = XML.prettyPrint(this.model.toXML());
        this.ide.repository.saveXMLFile(this.fileName, data);
    }

    /**
     * @returns {ProcessModelDefinition}
     */
    get model() {
        return this._model;
    }

    //handle the change of process implementation
    _validateAndSave() {
        const value = this.freeContentEditor.getValue();
        const xmlData = XML.loadXMLString(value);

        // Must be valid xml - and contain a root tag
        if (!XML.isValidXMLImport(xmlData) || xmlData.childNodes.length == 0) {
            this.ide.danger('XML is invalid or missing, model will not be saved');
            return;
        }

        this.model.implementation.xml = value;

        this.saveModel();
    }

    /**
     * Create a new Process model with given name and description 
     * @param {IDE} ide 
     * @param {String} name 
     * @param {String} description 
     * @returns {String} fileName of the new model
     */
    static createNewModel(ide, name, description) {
        const newModelContent =
`<process name="${name}" description="${description}">
    <${EXTENSIONELEMENTS}>
        <${IMPLEMENTATION_TAG} ${IMPLEMENTATION_PREFIX}="${IMPLEMENTATION_NAMESPACE}" class="org.qollabor.processtask.implementation.http.HTTPCallDefinition" async="true">
        </${IMPLEMENTATION_TAG}>
    </${EXTENSIONELEMENTS}>
</process>`;
        const fileName = name + '.process';
        ide.repository.saveXMLFile(fileName, newModelContent);
        return fileName;        
    }
}

class ProcessModelEditorMetadata extends ModelEditorMetadata {
    /** @returns {Array<ServerFile>} */
    get modelList() {
        return this.ide.repository.getProcesses();
    }

    get modelType() {
        return 'process';
    }

    /** @returns {Function} */
    get shapeType() {
        return ProcessTask;
    }

    get editorType() {
        return ProcessModelEditor;
    }

    get description() {
        return 'Processes';
    }
}

IDE.registerEditorType(ProcessModelEditorMetadata);