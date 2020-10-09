class CaseSourceEditor {
    /**
     * 
     * @param {CaseModelEditor} editor 
     * @param {JQuery<HTMLElement>} parentHTML 
     * @param {DefinitionDocument} definition 
     */
    constructor(editor, parentHTML, definition) {
        this.editor = editor;
        this.definition = definition;
        this.parentHTML = parentHTML;
        this.html = $(`<div class="case-source-editor">
    <div class="sourcecontainer">
        <div class="left">
            <h4>Source</h4>
            <div class="codemirrorsource"></div>
        </div>
        <div class="right">
            <h4>Visualization (dimensions)</h4>
            <div class="codemirrorsource"></div>
        </div>
    </div>
    <div class="sourcefooter">
        <button class="btnImport btn btn-default">Import</button>
        <button class="btnClose btn btn-default">Close</button>
    </div>
</div>`);
        parentHTML.append(this.html);


        this.html.find('.btnImport').on('click', e => this.import());
        this.html.find('.btnClose').on('click', () => this.close());

        const codeMirrorXMLConfiguration = {
            mode: 'xml',
            lineNumbers: true,
            scrollbarStyle: 'null'
        }

        this.codeMirrorCaseXML = CodeMirror(this.html.find('.left .codemirrorsource')[0], codeMirrorXMLConfiguration);
        this.codeMirrorDimensionsXML = CodeMirror(this.html.find('.right .codemirrorsource')[0], codeMirrorXMLConfiguration);
    }

    import() {
        const newSource = this.codeMirrorCaseXML.getValue();
        const newDimensions = this.codeMirrorDimensionsXML.getValue();

        // First validate whether the new source contains a (sort of) valid DefinitionDocument
        const newDefinition = new DefinitionDocument(ide, newSource, newDimensions, this.definition.caseFileName, this.definition.dimensionsFileName);
        if (newDefinition.invalid) {
            // Cannot import an invalid definition.
            //  Errors will be shown on the screen through the call to .invalid.
            return;
        }

        this.editor.loadDefinition(newDefinition);
        // Completing the action will save the model and add a corresponding action to the undo/redo buffer
        this.editor.completeUserAction();
        this.close();
    }

    close() {
        this.html.css('display', 'none');
    }

    open() {
        this.html.css('display', 'block');
        this.codeMirrorCaseXML.setValue(this.definition.definitionsXML);
        this.codeMirrorDimensionsXML.setValue(this.definition.dimensionsXML)
    }

    delete() {
        // Delete the generic events of the editor (e.g. click add button, ...)
        Util.removeHTML(this.html);
    }
}