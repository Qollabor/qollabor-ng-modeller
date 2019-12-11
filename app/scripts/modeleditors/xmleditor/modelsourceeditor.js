'use strict';

class ModelSourceEditor {
    /**
     * 
     * @param {JQuery<HTMLElement>} html 
     * @param {XMLModelEditor} editor 
     */
    constructor(html, editor) {
        this.editor = editor;
        this.html = html;
        this._show = false;
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
        this._codeMirrorEditor.on('blur', () => this._handleBlur());
        this._codeMirrorEditor.on('change', () => this._changed = true);
    }

    render() {
        this._codeMirrorEditor.setValue(XML.prettyPrint(this.editor.model.toXML()));
        //this refresh, is a workaround for defect in codemirror
        //not rendered properly when html is hidden
        // setTimeout(() => this._codeMirrorEditor.refresh(), 100);
        this._codeMirrorEditor.refresh();
    }

    /**
     * handle the change of all fields, create the xml and save
     */
    _handleBlur() {
        if (this._changed == true) {
            const newSource = this._codeMirrorEditor.getValue();
            this.editor._handleOnchangeSource(newSource);
        }
    }
}