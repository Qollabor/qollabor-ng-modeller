class ModelEditorMetadata {
    /**
     * Creates metadata for a type of ModelEditor within the IDE
     * @param {IDE} ide 
     */
    constructor(ide) {
        this.ide = ide;
    }

    init() {
        this.ide.repository.onListRefresh(() => {
            if (! this.modelListPanel) {
                this.modelListPanel = this.ide.repositoryBrowser.createModelListPanel(this);
            }
            this.modelListPanel.setModelList(this.modelList, this.shapeType);
        });
    }

    /** @returns {Array<ServerFile>} */
    get modelList() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /** @returns {Function} */
    get shapeType() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /** @returns {String} */
    get description() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /** @returns {String} */
    get modelType() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /** @returns {Function} */
    get editorType() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * Creates a new instance of the editor for the model.
     * @param {ServerFile} model 
     * @returns {ModelEditor} editor
     */
    createEditor(ide, fileName, modelName, modelType) {
        const editor = new this.editorType(this.ide, fileName, modelName, modelType);
        this.ide._editors.push(editor);
        return editor;
    }

    /**
     * Create a new model with the specified model name.
     * @param {*} newModelName 
     * @param {*} newModelDescription 
     * @returns {String} fileName of the new model
     */
    createNewModel(newModelName, newModelDescription) {
        return this.editorType.createNewModel(this.ide, newModelName, newModelDescription);
    }
}