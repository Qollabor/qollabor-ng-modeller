'use strict';

class ProcessModelEditor extends XMLModelEditor {
    /** 
     * This editor handles process models; only validates the xml
     * @param {IDE} ide 
     * @param {String} fileName The full file name to be loaded, e.g. 'helloworld.case', 'sendresponse.humantask'
     * @param {String} modelName The file name without the extension, e.g. 'helloworld'
     * @param {String} modelType  The extension of the filename, e.g. 'case', 'process', 'humantask'
     */
    constructor(ide, fileName, modelName, modelType) {
        super(ide, fileName, modelName, modelType);
        this.html[0].id = "divProcessEditor";
        //set the label of the free data area
        this.html.find('.model-source-tabs .model-content-editor label').html('Process Implementation (XML)');
    }

    /**
     * @returns {ProcessModelDefinition}
     */
    get model() {
        return this._model;
    }

    get label() {
        return 'Edit Process - ' + this.fileName;
    }

    getModelConstructor() {
        return ProcessModelDefinition;
    }

    get codeMirrorMode() {
        return 'xml';
    }

    get implementationContent() {
        return this.model.implementation.xml;
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

        this._save();
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
        <${IMPLEMENTATION_TAG} ${IMPLEMENTATION_PREFIX}="${IMPLEMENTATION_NAMESPACE}" class="org.cafienne.processtask.implementation.http.HTTPCallDefinition" async="true">
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