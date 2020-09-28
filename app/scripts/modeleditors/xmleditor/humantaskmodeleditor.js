'use strict';

class HumantaskModelEditor extends XMLModelEditor {
    /**
     * This object handles human task models, includes ui-editor and source editor
     * @param {IDE} ide 
     * @param {String} fileName The full file name to be loaded, e.g. 'helloworld.case', 'sendresponse.humantask'
     * @param {String} modelName The file name without the extension, e.g. 'helloworld'
     * @param {String} modelType  The extension of the fileName, e.g. 'case', 'process', 'humantask'
     */
    constructor(ide, fileName, modelName, modelType) {
        super(ide, fileName, modelName, modelType);

        //set the label of the Task Model (free data area)
        this.html.find('.model-source-tabs .model-content-editor label').html('Task Model (JSON)');
        //Add the div for model content viewer
        this.html.find('.model-source-tabs').append(`
            <div class="model-content-viewer" style="height:100%;width:45%;float:right;position:relative;border-left:1px solid black">
                <div class="task-preview" style="height:100%;overflow:auto;background-color:#f5f5f5"></div>
            </div>
        `);
        this.contentViewer = this.html.find('.model-content-viewer');
        this.taskPreview = this.html.find('.task-preview');
    }

    getModelConstructor() {
        return HumanTaskModelDefinition;
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

    get codeMirrorMode() {
        return 'application/json';
    }

    get implementationContent() {
        return this.model.implementation.taskModel.value;
    }

    _validateAndSave() {
        const cmValue = this.freeContentEditor.getValue();
        this.model.implementation.taskModel.value = cmValue;

        this._save();
    }

    _enableAutoSave() {
        super._enableAutoSave();
        this.renderPreview();
    }

    render() {
        super.render();
        this.renderPreview();
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
