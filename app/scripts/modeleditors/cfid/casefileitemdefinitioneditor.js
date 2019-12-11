class CaseFileItemDefinitionEditor {
    /** 
     * This object handles the case file items definition (cfidef) form.
     * with a case file item.
     * @param {CaseFileItemsEditor} caseFileItemsEditor
     */
    constructor(caseFileItemsEditor, parentHTML) {
        this.ide = caseFileItemsEditor.ide;
        //define default definitionTypes
        this.definitionTypes = [
            { name: UNSPECIFIED, uri: UNSPECIFIED_URI, editor: CFIDefinitionUnspecified },
            { name: XMLELEMENT, uri: XMLELEMENT_URI, editor: CFIDefinitionXMLElement },
            { name: UNKNOWN, uri: UNKNOWN_URI, editor: CFIDefinitionUnknown }
        ]
        this.__editors = [];

        // active definition is a property holding the current active CaseFileItemDefinition object.
        this.activeDefinition = null;

        // Now create the basic HTML structure and add event handlers
        //  The HTML consists of a basic input with the name, and a flexible part, depending on the type of definition.
        //  Currently we support 3 definitionTypes, and each has it's own renderer. A definition type can be
        //  selected from a selectbox in the main editor.
        // Renaming a CaseFileItemDefinition is currently not supported.
        this.html = $(
            `<div class="basicform cfidefeditor">
    <div class="formheader">
        <label>Case File Item Definition</label>
    </div>
    <div class="formcontainer">
        <div id="cfidefeditorcontent">
            <div class="maincfidefdata">
                <div>
                    <label>Name</label>
                    <input class="inputDefinitionName"/>
                </div>
                <div>
                    <label>Definition Type</label>
                    <select>
                        <option value="${UNSPECIFIED_URI}">${UNSPECIFIED}</option>
                        <option value="${XMLELEMENT_URI}">${XMLELEMENT}</option>
                        <option value="${UNKNOWN_URI}">${UNKNOWN}</option>
                    </select>
                </div>
            </div>
            <div class="cfideftypecontainer"></div>
        </div>
    </div>
</div`);
        //add the cfi definition editor html to the splitter area
        parentHTML.append(this.html);

        //add change handler for the select of definitionType
        this.html.find('.maincfidefdata select').on('change', e => this.changeDefinitionType(e.currentTarget.value));

        //add change handler for the name
        this.html.find('.inputDefinitionName').on('change', e => this.changeDefinitionName(e.currentTarget.value));

        //html node having the details of the cfidef (details determined by the definition type)
        this.definitionTypeContainer = this.html.find('.cfideftypecontainer');

        // Create editors for each definition type
        for (let i = 0; i < this.definitionTypes.length; i++) {
            const dtd = this.definitionTypes[i];
            this.__editors[dtd.uri] = new dtd.editor(this, this.definitionTypeContainer);
        }
    }

    /**
     * Returns an array with the names of the definition types and other options
     */
    getData() {
        console.warn('GetData is deprecated; inserting this statement to see the usage');
        return this.ide.repository.getCaseFileItemDefinitions();
    };

    reset() {
        this.definitionTypeContainer.html('');
        this.hideEditor();
    };

    changeDefinitionName(newName) {
        this.activeDefinition.name = newName;
        this.saveModel();
    }

    /**
     * Event handler if the definition type is changed from the UI
     */
    changeDefinitionType(newDefinitionType) {
        this.activeDefinition.definitionType = newDefinitionType;
        // Save the changes
        this.saveModel();
        // Render the type specific editor
        this.renderDefinitionTypeEditor();
    }

    /**
     * Creates a new model with the specified filename, and renders it.
     * The new model is not saved by this editor.
     */
    createNewModel(definitionRef) {
        this.showEditor(definitionRef, true);
    }

    /**
     * fires after case file items select field: definition is changed
     */
    loadDefinition(definitionRef) {
        this.showEditor(definitionRef);
    }

    disable(bDisable) {
        //disabled the input and select field
        this.html.find('.maincfidefdata input').attr('disabled', bDisable);
        this.html.find('.maincfidefdata select').attr('disabled', bDisable);

        const label = 'Case File Item Editor' + (bDisable ? ' - Please first select a definition for the case file item' : '');

        this.html.find('.formheader label').html(label);
        this.html.find('.maincfidefdata input').val('');
        this.html.find('.maincfidefdata select').val('');

        this.definitionTypeContainer.children().css('display', 'none');
    }

    /**
     * shows the cfi definition editor for the passed activeNode from the cfi editor
     */
    showEditor(definitionRef, isNew) {
        // Make us visible
        this.html.css('display', 'block');

        this.definitionRef = definitionRef;

        // Render our new content; either disabled, or 'new', or read it from the server
        if (!definitionRef) {
            // Show the "empty" editor
            this.disable(true);
            return;
        }

        if (isNew) {
            const name = definitionRef.substring(0, definitionRef.length - 5);
            const data = XML.loadXMLString(`<caseFileItemDefinition name="${name}" definitionType="http://www.omg.org/spec/CMMN/DefinitionType/Unspecified" />`);
            const serverFile = new ServerFile(this.ide.repository, definitionRef);
            serverFile.data = data;
            // this.ide.repository.saveXMLFile(definitionRef, data, () => {
            serverFile.save(() => {
                // If it is new, then create a local object and render it.
                this.renderDefinition(serverFile.parseToModel());
            })

        } else {
            // Read it from the repository, and only render upon callback.
            this.ide.repository.readModel(definitionRef, definition => {
                this.renderDefinition(definition);
            });
        }

    }

    /**
     * 
     * @param {CaseFileDefinitionDefinition} definition 
     */
    renderDefinition(definition) {
        this.activeDefinition = definition;
        this.disable(false);

        const defType = definition.definitionType;

        $('.cfidefeditor .maincfidefdata input').val(definition.name);
        $('.cfidefeditor .maincfidefdata select').val(defType);
        this.renderDefinitionTypeEditor();
    }

    renderDefinitionTypeEditor() {
        const defType = this.activeDefinition.definitionType;
        this.definitionTypeContainer.children().css('display', 'none');
        this.__editors[defType].show(this.activeDefinition);
        this.__editors[defType].html.css('display', '');
    }

    /**
     * hides the cfi definition editor/form
     */
    hideEditor() {
        this.html.css('display', 'none');
    }

    saveModel() {
        if (this.activeDefinition) {
            const data = XML.prettyPrint(this.activeDefinition.toXML());
            const serverFile = new ServerFile(this.ide.repository, this.definitionRef);
            serverFile.data = data;
            serverFile.save();
            // this.ide.repository.saveXMLFile(this.definitionRef, data);
        }
    }
}