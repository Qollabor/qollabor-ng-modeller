'use strict';

class HumantaskModelEditor extends ModelEditor {
    /**
     * This object handles human task models, includes ui-editor and source editor
     * @param {IDE} ide 
     * @param {String} fileName The full file name to be loaded, e.g. 'helloworld.case', 'sendresponse.humantask'
     * @param {String} modelName The file name without the extension, e.g. 'helloworld'
     * @param {String} modelType  The extension of the fileName, e.g. 'case', 'process', 'humantask'
     */
    constructor(ide, fileName, modelName, modelType) {
        super(ide, fileName, modelName, modelType);
        const html = $(`
            <div class="basicbox model-source-tabs">
                <ul>
                    <li><a href="#modelEditor">Editor</a></li>
                    <li><a href="#sourceEditor">Source</a></li>
                </ul>
                <div class="humantask-model-editor" id="modelEditor">
                    <div style="margin-left:10px;position:absolute">
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
                        <div class="task-model-source">
                            <label>Task Model (JSON)</label>
                            <div class="code-mirror-source"></div>
                        </div>
                    </div>
                    <div>
                        <div class="model-content-viewer">
                            <div class="task-preview-header">
                                <h3>Preview</h3>
                                <label>Note: the preview is rendered with AlpacaJS; Cafienne UI uses React JSON Schema Forms, which renders slightly different.</label>
                            </div>
                            <div class="task-preview-content"></div>
                        </div>
                    </div>
                </div>
                <div class="model-source-editor" id="sourceEditor"></div>
            </div>
        `);

        this.htmlContainer.append(html);

        //add change event to input fields
        this.htmlContainer.find('.inputName').on('change', e => this.change('name', e.currentTarget.value));
        this.htmlContainer.find('.inputDescription').on('change', e => this.change('description', e.currentTarget.value));

        new RightSplitter(this.htmlContainer.find('#modelEditor'), '500px');

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

        // add the source part
        this.viewSourceEditor = new ModelSourceEditor(this.html.find('.model-source-tabs .model-source-editor'), this);
        this.contentViewer = this.html.find('.model-content-viewer');
        this.taskPreview = this.html.find('.task-preview-content');
        this.createCodeMirrorEditor();
    }

    createCodeMirrorEditor() {
        //add code mirror JSON style
        this.freeContentEditor = CodeMirrorConfig.createJSONEditor(this.html.find('.code-mirror-source'));

        /* Events for saving and keeping track of changes in the task model editor
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
                this.saveModel();
            }
        });
        this.freeContentEditor.on('change', () => {
            this._enableAutoSave()
        });
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
        this.freeContentEditor.setValue(this.model.implementation.taskModel.value);
        this.freeContentEditor.refresh();
        this.renderPreview();
    }

    /**
     * Sets or replaces the auto save timer (which runs 10 seconds after the last change)
     */
    _enableAutoSave() {
        // Set 'changed' flag.
        this._changed = true;

        this.renderPreview();

        // Remove any existing timers
        this._removeAutoSave();

        // Now add a new timer to go off in 10 seconds from now (if no other activity takes place)
        this._currentAutoSaveTimer = window.setTimeout(() => {
            if (this._changed) {
                this.saveModel();
            }
        }, 10000);
    }

    completeUserAction() {
        this.saveModel();
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
        this._model = this.parser.parseModel(HumanTaskModelDefinition);
        this.render();
    }

    /**
     * handle the change of the source (in 2nd tab)
     */
    loadSource(source) {
        this.openModel(source);
        this.saveModel();
    }

    saveModel() {
        // Take latest and greatest json schema
        this.model.implementation.taskModel.value = this.freeContentEditor.getValue();

        // Remove 'changed' flag just prior to saving
        this._changed = false;

        const data = XML.prettyPrint(this.model.toXML());
        this.ide.repository.saveXMLFile(this.fileName, data);
    }

    /**
     * @returns {HumanTaskModelDefinition}
     */
    get model() {
        return this._model;
    }

    get label() {
        return 'Edit Human Task - ' + this.fileName;
    }

    renderPreview() {
        const formData = this.freeContentEditor.getValue();

        const parseResult = Util.parseJSON(formData);
        if (parseResult.object) {
            const jsonForm = parseResult.object;
            jsonForm.options = {
                focus: false
            }
            // Clear current content
            this.taskPreview.html('');
            // Render the task view
            this.taskPreview.alpaca(jsonForm);
        } else {
            this.taskPreview.html(parseResult.description);
        }
    }


    /**
     * Create a new HumanTask model with given name and description 
     * @param {IDE} ide 
     * @param {String} name 
     * @param {String} description 
     * @returns {String} fileName of the new model
     */
    static createNewModel(ide, name, description) {
        const newModelContent = 
            `<humantask>
                <${IMPLEMENTATION_TAG} name="${name}" description="${description}" ${IMPLEMENTATION_PREFIX}="${IMPLEMENTATION_NAMESPACE}" class="org.cafienne.cmmn.definition.task.WorkflowTaskDefinition">
                    <task-model></task-model>
                </${IMPLEMENTATION_TAG}>
            </humantask>`;
        const fileName = name + '.humantask';
        ide.repository.saveXMLFile(fileName, newModelContent);        
        return fileName;
    }
}

class HumantaskModelEditorMetadata extends ModelEditorMetadata {
    /** @returns {Array<ServerFile>} */
    get modelList() {
        return this.ide.repository.getHumanTasks();
    }

    get modelType() {
        return 'humantask';
    }

    /** @returns {Function} */
    get shapeType() {
        return HumanTask;
    }

    get editorType() {
        return HumantaskModelEditor;
    }

    get description() {
        return 'Human Task Models';
    }    
}

IDE.registerEditorType(HumantaskModelEditorMetadata);
