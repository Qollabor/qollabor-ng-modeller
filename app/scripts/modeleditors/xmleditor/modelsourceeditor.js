'use strict';

class ModelSourceEditor {
    /**
     * 
     * @param {JQuery<HTMLElement>} html 
     * @param {ModelEditor} editor 
     */
    constructor(html, editor) {
        this.editor = editor;
        this.html = html;
        this._changed = false;

        // Add the code mirror object to the model-container
        const codeMirrorConfig = {
            mode: 'xml',
            lineNumbers: true
        }

        this._codeMirrorEditor = CodeMirror(this.html[0], codeMirrorConfig);

        // Code Mirror generates to many change events, we
        // handle them only upon blur, and keep track of changes in _changed flag
        this._codeMirrorEditor.on('focus', () => this._changed = true);
        this._codeMirrorEditor.on('blur', () => this.importSource());
        this._codeMirrorEditor.on('change', () => this._changed = true);
    }

    render(source) {
        this._codeMirrorEditor.setValue(source);
        //this refresh, is a workaround for defect in codemirror
        //not rendered properly when html is hidden
        // setTimeout(() => this._codeMirrorEditor.refresh(), 100);
        this._codeMirrorEditor.refresh();
    }

    /**
     * handle the change of all fields, create the xml and save
     */
    importSource() {
        if (this._changed == true) {
            const newSource = this._codeMirrorEditor.getValue();
            const data = XML.loadXMLString(newSource);
            if (!XML.isValidXMLImport(data, true)) {
                ide.warning('Source does not contain valid XML and will not be imported', 2000);
                //not valid xml in the source editor, source tab must remain open
                // setTimeout(() => this.editor.html.find('.model-source-tabs').tabs('option', 'active', 1), 100);
                return;
            }
            this.editor.loadSource(newSource);
        }
    }
}