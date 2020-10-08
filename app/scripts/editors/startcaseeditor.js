'use strict';

class StartCaseEditor extends StandardForm {
    /**
     * Editor for the content of the extension element <start-case-schema>
     * @param {CaseModelEditor} editor 
     */
    constructor(editor) {
        super(editor, 'Start Case Schema Editor', 'jsoneditor');
    }

    renderData() {
        this.htmlContainer.html(
`<label>JSON Definition</label>
<div class="jsoncode"></div>`);

        //get the container of the form to add the code mirror editor
        const codeField = this.htmlContainer.find('.jsoncode')[0];

        //add code mirror to 1st codeField
        this._codeMirrorEditor = CodeMirror(
            codeField, {
                matchBrackets: true,
                autoCloseBrackets: true,
                lineWrapping: true,
                mode: 'application/json',
                lineNumbers: true
            }
        );

        // CodeMirror onchange fires when content is changed, every change so on keydown (not just after loss of focus)
        //this._codeMirrorEditor.on('change', this._handleChangeContent(this));

        //._changed keeps track whether user has changed the task model content
        this._codeMirrorEditor.on('focus', () => this._changed = false);

        this._codeMirrorEditor.on('blur', () => {
            // On blur, save changes if any
            if (this._changed) {
                this._removeAutoSave();
                this._save();
            }
        });

        this._codeMirrorEditor.on('change', () => {
            //directly after import when the value is loaded, do not save or show as changed
            if (! this._isLoading) {
                // Update the value inside the definition.
                this.case.caseDefinition.startCaseSchema = this.value;
                // Set 'changed' flag and enable autosave timer after 10 seconds of no change
                this._changed = true;
                this._enableAutoSave();
            }
        });

        // Avoid CTRL-Y and CTRL-Z invoking undo-manager
        //  Apparently, code mirror does not give the event as a parameter to the function, so we work directly on window.event
        this._codeMirrorEditor.on('keydown', () => window.event.stopPropagation());
    }

    /**
     * Removes the auto save timer, if it is defined.
     */
    _removeAutoSave() {
        if (this._currentAutoSaveTimer) {
            window.clearTimeout(this._currentAutoSaveTimer);
        }
    }

    /**
     * Sets or replaces the auto save timer (which runs 10 seconds after the last change)
     */
    _enableAutoSave() {
        // First remove any existing timers
        this._removeAutoSave();

        // Now add a new timer to go off in 10 seconds from now (if no other activity takes place)
        this._currentAutoSaveTimer = window.setTimeout(() => {
            if (this._changed) {
                this._save();
            }
        }, 10000);
    }

    //test json code and saves case model
    _save() {
        this._changed = false;
        this.case.editor.completeUserAction();
    }

    open() {        
        this.visible = true;
        const defaultValue = 
`{
    "schema":{
        "title": "",
        "type": "object",
        "properties":{
        }
    }
}`
        const definitionValue = this.case.caseDefinition.startCaseSchema;
        // Upon opening the editor, set the value with the current start-case-schema, or use the default value.
        //  Note, default value will not be written into case definition if it is not changed.
        this.value = definitionValue ? definitionValue : defaultValue;
        // this refresh is a workaround for defect in codemirror not rendered properly when html is hidden
        setTimeout(() => this._codeMirrorEditor.refresh(), 100);
    }

    get value() {
        return this._codeMirrorEditor.getValue();
    }

    set value(sContent) {
        this._isLoading = true;
        this._codeMirrorEditor.setValue(sContent);
        this._isLoading = false;
    }
}