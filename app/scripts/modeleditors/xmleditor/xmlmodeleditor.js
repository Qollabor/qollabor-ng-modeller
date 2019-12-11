class XMLModelEditor extends ModelEditor {
    /**
     * Base editor for humantask and process, rendered in tabs with sourceview and parameters view
     * @param {IDE} ide 
     * @param {String} fileName The full file name to be loaded, e.g. 'helloworld.case', 'sendresponse.humantask'
     * @param {String} modelName The file name without the extension, e.g. 'helloworld'
     * @param {String} modelType  The extension of the filename, e.g. 'case', 'process', 'humantask'
     */
    constructor(ide, fileName, modelName, modelType) {
        super(ide, fileName, modelName, modelType);
        //the html of page
        this.generateHTML();
    }

    /**
     * adds the html of the entire page
     */
    generateHTML() {
        const html = $(
            `<div class="basicbox model-source-tabs">
                <ul>
                    <li><a href="#modelEditor">Editor</a></li>
                    <li><a href="#sourceEditor">Source</a></li>
                </ul>
                <div class="xml-model-editor" id="modelEditor">
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
                    <div class="model-content-editor">
                        <label></label>
                        <div></div>
                    </div>
                </div>
                <div class="xml-source-editor" id="sourceEditor"></div>
            </div>`);

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
                if (ui.newPanel.hasClass('xml-source-editor')) {
                    this.viewSourceEditor.render();
                }
            }
        });

        //add an editor to the free data area (task model, or Process Implementation)
        const codeMirrorConfiguration = {
            matchBrackets: true,
            autoCloseBrackets: true,
            lineWrapping: true,
            mode: this.codeMirrorMode,
            lineNumbers: true
        };
        //add code mirror to 1st codeField
        this.freeContentEditor = CodeMirror(this.html.find('.xml-model-editor .model-content-editor>div')[0], codeMirrorConfiguration);

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
        this.freeContentEditor.on('change', () => this._enableAutoSave());

        //add the source part
        this.viewSourceEditor = new ModelSourceEditor(this.html.find('.model-source-tabs .xml-source-editor'), this);
    }

    /**
     * 
     * @param {String} propertyName 
     * @param {String} propertyValue 
     */
    change(propertyName, propertyValue) {
        this.model[propertyName] = propertyValue;
        this._save();
    }

    render() {
        // Render name and description
        this.htmlContainer.find('.inputName').val(this.model.name);
        this.htmlContainer.find('.inputDescription').val(this.model.description);

        this.inputParametersControl.renderParameters(this.model.inputParameters);
        this.outputParametersControl.renderParameters(this.model.outputParameters);

        // Set the implementation content in the code mirror editor and
        this.freeContentEditor.setValue(this.implementationContent);
        this.freeContentEditor.refresh();
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

    _validateAndSave() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * Removes the auto save timer, if it is defined.
     */
    _removeAutoSave() {
        if (this._currentAutoSaveTimer) {
            window.clearTimeout(this._currentAutoSaveTimer);
        }
    }

    onShow() {
        //always start with editor tab
        this.html.find('.model-source-tabs').tabs('option', 'active', 0);
        //this refresh, is a workaround for defect in codemirror
        //not rendered properly when html is hidden
        setTimeout(() => this.freeContentEditor.refresh(), 100);
    }

    /**
     * @returns {String}
     */
    get label() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
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
        this._model = this.parser.parseModel(this.getModelConstructor());
        this.render();
    }

    /**
     * @returns {ModelDefinition}
     */
    get model() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * @returns {Function}
     */
    getModelConstructor() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * @returns {String}
     */
    get codeMirrorMode() {
        throw new Error('This property must be implemented in ' + this.constructor.name);
    }

    /**
     * @returns {String}
     */
    get implementationContent() {
        throw new Error('This property must be implemented in ' + this.constructor.name);
    }

    /**
     * handle the change of the source (in 2nd tab)
     */
    _handleOnchangeSource(newSource) {
        const data = XML.loadXMLString(newSource);
        if (!XML.isValidXMLImport(data)) {
            ide.danger('No Valid XML, model not saved');
            //not valid xml in the source editor, source tab must remain open
            setTimeout(() => this.html.find('.model-source-tabs').tabs('option', 'active', 1), 100);
            return;
        }

        this.openModel(newSource);

        this._save();
    }

    _save() {
        // Remove 'changed' flag just prior to saving
        this._changed = false;

        const data = XML.prettyPrint(this.model.toXML());
        this.ide.repository.saveXMLFile(this.fileName, data);
    }
}