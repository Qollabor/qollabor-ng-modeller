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

        this.html[0].id = "divHumanTaskEditor";

        this._taskModelNode = null;

        //set the label of the Task Model (free data area)
        this.html.find('.model-source-tabs .model-content-editor label').html('Task Model (JSON)');
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
