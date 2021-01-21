class SettingsEditor extends StandardForm {
    static show() {
        if (!this._editor) {
            this._editor = new SettingsEditor();
        }
        this._editor.show();
    }

    static hide() {
        if (this._editor) this._editor.hide();
    }

    static isOpen() {
        return this._editor && this._editor.visible;
    }

    static get ModelEditor() {
        return {
                divMovableEditors: ide.html,
                registerMovableEditor: () => {},
                selectMovableEditor: () => {},
                positionMovableEditor: () => {}
        }
    }

    /**
     * Editor for the content of the settings of the case model editor
     */
    constructor() {
        super(SettingsEditor.ModelEditor, 'Settings (raw JSON)', 'jsoneditor settings-editor');
    }

    renderData() {
        if (this.errorSpan) {
            // Already rendered once, avoid rendering again.
            // TODO: apparently render/renderHead/renderData as a pattern does not work here...
            return;
        }
        const html = $(
            `<div class="btn-group top-bar">
    <button class="btnResetPreferences">Reset</button>
    <button class="btnSavePreferences">Save (reload browser to effectuate)</button>
    <strong><span class="error-message"></span></strong>
</div>
<div class="jsoncode"></div>`);
        this.errorSpan = html.find('.error-message');
        html.find('.btnResetPreferences').on('click', e => this.reset());
        html.find('.btnSavePreferences').on('click', e => this._save());
        this.htmlContainer.append(html);

        // Add CodeMirror
        this._codeMirrorEditor = CodeMirrorConfig.createJSONEditor(this.html.find('.jsoncode'));

        // CodeMirror onchange fires when content is changed, every change so on keydown (not just after loss of focus)
        this._codeMirrorEditor.on('change', () => this.validateJSON());

        // Avoid CTRL-Y and CTRL-Z invoking undo-manager
        //  Apparently, code mirror does not give the event as a parameter to the function, so we work directly on window.event
        this._codeMirrorEditor.on('keydown', e => window.event.stopPropagation());
    }

    /**
     * Validates the currently typed JSON and shows an optional error message.
     */
    validateJSON() {
        try {
            this.newSettings = JSON.parse(this.value);
            this.errorSpan.html('');
        } catch (exception) {
            // remove whatever was left over from previous edit in order to avoid it getting saved accidentally
            delete this.newSettings;
            this.errorSpan.html(exception);
        }
    }

    reset() {
        this.value = this._originalContent;
        this.errorSpan.html('');
    }

    //test json code and saves case model
    _save() {
        if (this.newSettings) {
            SettingsStorage.save(this.newSettings);
        }
    }

    onShow() {
        // Upon opening the editor, set the value with the current start-case-schema, or use the default value.
        //  Note, default value will not be written into case definition if it is not changed.
        this.value = JSON.stringify(SettingsStorage.store, null, 2);
    }

    get value() {
        return this._codeMirrorEditor.getValue();
    }

    set value(sContent) {
        console.warn("Rendering settings again")
        this._isLoading = true;
        this._originalContent = sContent;
        this._codeMirrorEditor.setValue(sContent);
        this._isLoading = false;
    }
}
