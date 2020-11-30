'use strict';

class IDE {
    constructor() {
        this._editors = [];
        /** @type {Array<ModelEditorMetadata>} */
        this.editorTypes = [];
    }

    back() {
        // Simplistic. Buggy. But nice and simple for now. Better would be to hash all locations we've been and go back properly
        history.back();
    }

    init() {
        // Repository object handles the interaction with the server
        this.repository = new Repository(this);

        this.html = $('body');

        this.header = new IDEHeader(this);
        this.main = new IDEMain(this);
        this.footer = new IDEFooter(this);
        this.messageBox = new MessageBox(this);

        this.coverPanel = new CoverPanel(this); // Helper to show/hide status messages while loading models from the repository

        this.html.on('keydown', e => {
            if (e.keyCode == 83 && e.altKey) {
                SettingsEditor.show();
            }
        });

        // Scan for pasted text. It can upload and re-engineer a deployed model into a set of files
        this.html.on('paste', e => this.handlePasteText(e))


        this.editorTypes.forEach(type => type.init());
    }

    /**
     * 
     * @param {JQuery.TriggeredEvent} e 
     */
    handlePasteText(e) {
        const pastedText = e.originalEvent.clipboardData.getData('text/plain');
        const xmlDoc = XML.loadXMLString(pastedText);
        if (XML.isValidXMLImport(xmlDoc, true) && xmlDoc.documentElement.tagName == 'definitions') {
            console.log('Parsing and uploading definitions from copy/paste command ...');
            const newFiles = new Array();
            const allDimensionsXML = XML.getChildByTagName(xmlDoc.documentElement, 'CMMNDI');
            XML.getChildrenByTagName(xmlDoc.documentElement, 'case').forEach(xmlElement => {
                // Create .case file
                const fileName = xmlElement.getAttribute('id'); // assuming fileName always ends with .case ?!
                newFiles.push({ fileName, xmlElement });

                // Create .dimensions file
                // Copy and clean up dimensions from anything that does not occur inside this case's xmlElement
                /** @type {Element} */
                const dimXML = allDimensionsXML.cloneNode(true);
                const elementMatcher = (element, id1, id2 = '') => XML.allElements(xmlElement).find(e => e.getAttribute('id') == id1 || e.getAttribute('id') == id2) || element.parentNode.removeChild(element);
                XML.getElementsByTagName(dimXML, CMMNSHAPE).forEach(shape => elementMatcher(shape, shape.getAttribute('cmmnElementRef')));
                XML.getElementsByTagName(dimXML, 'textbox').forEach(shape => elementMatcher(shape, shape.getAttribute('parentId')));
                XML.getElementsByTagName(dimXML, 'casefileitem').forEach(shape => elementMatcher(shape, shape.getAttribute('parentId')));
                XML.getElementsByTagName(dimXML, CMMNEDGE).forEach(shape =>  elementMatcher(shape, shape.getAttribute('sourceCMMNElementRef'), shape.getAttribute('targetCMMNElementRef')));
                const dimName = fileName.substring(0, fileName.length - 5) + '.dimensions';
                newFiles.push({ fileName: dimName, xmlElement: dimXML });

                // Create .humantask files
                XML.getElementsByTagName(xmlElement, 'humanTask').forEach(humanTask => {
                    XML.getChildrenByTagName(humanTask, 'qollabor:implementation').forEach(humanTaskExtensionElement => {
                        // Create a copy of implementation
                        /** @type {Element} */
                        const standAloneHumanTaskDefinition = humanTaskExtensionElement.cloneNode(true);
                        // Put the copy in a new XML document
                        const task = XML.loadXMLString('<humantask />')
                        task.documentElement.appendChild(standAloneHumanTaskDefinition);

                        // Handy remover function
                        const removeChildrenWithName = (element, ...tagNames) => tagNames.forEach(tagName => XML.getElementsByTagName(element, tagName).forEach(child => child.parentNode.removeChild(child)));

                        // First clean up the extension element inside the case definition. Remove attributes and elements that belong to the standalone implementation of the humantask.
                        humanTaskExtensionElement.removeAttribute('class');
                        humanTaskExtensionElement.removeAttribute('name');
                        humanTaskExtensionElement.removeAttribute('description');
                        // And remove input and output and task-model from implementation node inside case model
                        removeChildrenWithName(humanTaskExtensionElement, 'input', 'output', 'task-model');

                        // Now cleanup the standalone implementation of the task. Remove attributes and elements that belong to the case model.
                        standAloneHumanTaskDefinition.removeAttribute('humanTaskRef');
                        // Remove parameter mappings, duedate and assignment elements, they belong in case model
                        removeChildrenWithName(standAloneHumanTaskDefinition, 'parameterMapping', 'duedate', 'assignment');

                        // Compose name of .humantask file. Prefer to take humanTaskRef attribute, but if that is not available,
                        //  we'll try to take the name from the implementation tag; and if that is also not there, we try to
                        //  take the name of the task itself inside the case model. Also remove spaces from it.
                        //  Then also set it again inside the case model's implementation of the task.
                        const id = humanTaskExtensionElement.getAttribute('humanTaskRef');
                        const name = humanTaskExtensionElement.getAttribute('name');
                        const backupName = humanTaskExtensionElement.parentNode.parentNode.getAttribute('name').replace(/ /g, '').toLowerCase() + '.humantask';
                        const fileName = id ? id : name ? name.toLowerCase() + '.humantask' : backupName;
                        // Now also set the reference on the implementation attribute (for the case it wasn't there yet)
                        humanTaskExtensionElement.setAttribute('humanTaskRef', fileName);
                        newFiles.push({fileName, xmlElement: task});
                    })
                })

            });
            XML.getChildrenByTagName(xmlDoc.documentElement, 'process').forEach(xmlElement => {
                const fileName = xmlElement.getAttribute('id');
                newFiles.push({ fileName, xmlElement });
            });
            XML.getChildrenByTagName(xmlDoc.documentElement, 'caseFileItemDefinition').forEach(xmlElement => {
                const fileName = xmlElement.getAttribute('id');
                xmlElement.removeAttribute('id')
                newFiles.push({ fileName, xmlElement });
            });
            const fileNames = newFiles.map(file => file.fileName);
            if (confirm('Press OK to upload the following ' + fileNames.length + ' files\n\n- ' + (fileNames.join('\n- ')))) {
                newFiles.forEach(file => {
                    const serverFile = new ServerFile(this.repository, file.fileName);
                    serverFile.data = file.xmlElement;
                    serverFile.save();
                    // ide.repository.saveXMLFile(file.fileName, file.xmlElement)
                });
            }
        }
    }

    /**
     * @returns {RepositoryBrowser}
     */
    get repositoryBrowser() {
        return this.main.repositoryBrowser;
    }

    /** @returns {JQuery<HTMLElement>} The element in which the editors can be added */
    get divModelEditors() {
        return this.main.divModelEditors;
    }

    /** @returns {Array<ModelEditor>} */
    get editors() {
        return this._editors;
    }

    /**
     * @returns {CaseModelEditor}
     */
    get caseModelEditor() {
        return this.editors.find(editor => editor instanceof CaseModelEditor);
    }

    /**
     * @returns {Boolean} Determines if someone is drag/dropping an item across the IDE.
     */
    get dragging() {
        return this._dragging;
    }

    set dragging(dragging) {
        this._dragging = dragging;
    }

    /**
     * 
     * @param {String} modelType 
     * @param {String} newModelName 
     * @param {String} newModelDescription 
     * @returns {String} fileName of the new model
     */
    createNewModel(modelType, newModelName, newModelDescription) {
        const editorMetadata = this.editorTypes.find(type => type.modelType == modelType);
        if (!editorMetadata) {
            const msg = 'Cannot create new models of type ' + modelType;
            console.error(msg);
            this.danger(msg);
            return;
        }
        return editorMetadata.createNewModel(newModelName, newModelDescription);
    }

    /**
     * 
     * @param {ModelDefinition} model 
     */
    openModel(model) {
        console.log("Opened model "+model.name)
    }

    /**
     * Determines the type of the file name and opens the corresponding editor.
     * @param {String} fileName 
     */
    open(fileName) {
        // Split:  divide "myMap/myMod.el.case" into ["MyMap/myMod", "el", "case"]
        const splitList = fileName.split('.');
        const modelType = splitList.pop();
        const modelName = splitList.join('.');
        // Get editor for this type, if available at all. Otherwise type is not supported.
        const editorMetadata = this.editorTypes.find(type => type.modelType == modelType);
        // Determine error message based on absence of loader function name, and absence of name (which really means absence of type)
        const failure = editorMetadata ? '' : modelName ? 'Cannot read ' + location.hash + ' because the file type is not supported' : 'Cannot read ' + location.hash + ' because the file type is missing';

        // Some error checking first
        if (!fileName) {
            // Simply no model to load; but hide all existing editors.
            this.editors.forEach(editor => editor.visible = false);
            this.coverPanel.show('Please, open or create a model.');
            return;
        } else if (failure) {
            this.danger(failure);
            return;
        }

        // In case of subsequent loadings, we have to close the console group of the previous one
        console.groupEnd();
        console.group(fileName);

        // Show the editor with the fileName (if available), hide all the ones with a different fileName
        this.editors.forEach(editor => editor.visible = (editor.fileName == fileName));

        //show model name on browser tab
        document.title = 'Qollabor IDE - ' + modelName;

        // If we already have an editor for the fileName, no need to go further in the loading logic
        const existingEditor = this.editors.find(editor => editor.fileName == fileName);
        if (existingEditor) {
            return;
        }

        // By default open the cover panel. If the model is present and loads,
        //  the cover panel will be closed.
        this.coverPanel.show('Opening ' + fileName);

        const editor = editorMetadata.createEditor(this, fileName, modelName, modelType);
        editor.loadModel();
    }

    /**
     * Shows a green success message.
     * @param {String} message     : text to be displayed
     * @param {Number} delay       : message is automatically remove after this number of microsec  
     */
    success(message, delay = 0) {
        this.messageBox.createMessage(message, 'success', delay);
    }

    /** 
     * Shows a blue info message.
     * @param {String} message     : text to be displayed
     * @param {Number} delay       : message is automatically remove after this number of microsec  
     */
    info(message, delay = 0) {
        this.messageBox.createMessage(message, 'info', delay);
    }

    /** 
     * Shows a yellow warning message.
     * @param {String} message     : text to be displayed
     * @param {Number} delay       : message is automatically remove after this number of microsec  
     */
    warning(message, delay = 0) {
        this.messageBox.createMessage(message, 'warning', delay);
    }

    /** 
     * Shows a red danger message.
     * @param {String} message     : text to be displayed
     * @param {Number} delay       : message is automatically remove after this number of microsec  
     */
    danger(message, delay = 0) {
        this.messageBox.createMessage(message, 'danger', delay);
    }

    /**
     * Registers a type of editor, e.g. HumanTaskEditor, CaseModelEditor, ProcessModelEditor
     * @param {Function} editorMetadata 
     */
    static registerEditorType(editorMetadata) {
        // Assumes ide pointer exists ;)
        ide.editorTypes.push(new editorMetadata(ide));
    }
}

// For now create a global IDE pointer.
const ide = new IDE();
//Start initialization after the entire page is loaded
$(window).on('load', e => ide.init());
