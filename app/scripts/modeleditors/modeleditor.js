'use strict';

class ModelEditor {
    /**
     * Basic model editor
     * @param {IDE} ide 
     * @param {String} fileName The full file name to be loaded, e.g. 'helloworld.case', 'sendresponse.humantask'
     * @param {String} modelName The file name without the extension, e.g. 'helloworld'
     * @param {String} modelType  The extension of the fileName, e.g. 'case', 'process', 'humantask'
     */
    constructor(ide, fileName, modelName, modelType) {
        this.ide = ide;
        this.fileName = fileName;
        this.modelName = modelName;
        this.modelType = modelType;
        /** @type {Array<MovableEditor>} */
        this.movableEditors = [];
        this.html = $(
`<div class="model-editor-base">
    <div class="model-editor-header">
        <label>${this.label}</label>
        <div class="refreshButton" title="Refresh">
            <img src="images/refresh_32.png" />
        </div>
        <div class="closeButton" title="Close">
            <img src="images/close_32.png" />
        </div>
    </div>
    <div class="divMovableEditors"></div>
    <div class="model-editor-content"></div>
</div>`);
        this.htmlContainer = this.html.find('.model-editor-content');
        this.divMovableEditors = this.html.find('.divMovableEditors');
        this.html.find('.closeButton').on('click', e => this.close());
        this.html.find('.refreshButton').on('click', e => this.refresh());
    }

    /**
     * 
     * @param {MovableEditor} editor 
     */
    registerMovableEditor(editor) {
        this.movableEditors.push(editor);
    }

    /**
     * Make sure the editor is on top of the others
     * @param {MovableEditor} editor 
     */
    selectMovableEditor(editor) {
        Util.removeFromArray(this.movableEditors, this);
        this.movableEditors.push(editor);
        // Now reset z-index of editors, oldest at bottom, newest (this) at top.
        this.movableEditors.forEach((editor, index) => $(editor.html).css('z-index', index + 1));
    }

    /**
     * Give the editor an (initial) position
     * @param {MovableEditor} editor 
     */
    positionMovableEditor(editor) {
        const newPosition = editor.html.offset();
        if (newPosition.left == 0) {
            newPosition.left = 220;
        }
        if (newPosition.top == 0) {
            newPosition.top = 60;
        }

        const MINIMUM_MARGIN_BETWEEN_EDITORS = 30;

        // Do not put this editor at exact same location as one of the others
        //  There must be at least 30 px difference
        this.movableEditors.forEach(sibling => {
            if (sibling != editor && sibling.html.css('display') == 'block') {
                const editorOffset = sibling.html.offset();

                const leftMargin = editorOffset.left - MINIMUM_MARGIN_BETWEEN_EDITORS;
                const rightMargin = editorOffset.left + MINIMUM_MARGIN_BETWEEN_EDITORS;
                if (newPosition.left > leftMargin && newPosition.left < rightMargin) {
                    newPosition.left = rightMargin;
                }

                const topMargin = editorOffset.top - MINIMUM_MARGIN_BETWEEN_EDITORS;
                const bottomMargin = editorOffset.top + MINIMUM_MARGIN_BETWEEN_EDITORS;
                if (newPosition.top > topMargin && newPosition.top < bottomMargin) {
                    newPosition.top = bottomMargin;
                }
            }
        });

        // Also keep editor inside the browser window
        const bodyWidth = document.body.offsetWidth;
        const bodyHeight = document.body.offsetHeight;
        if ((newPosition.left + editor.html.width()) > bodyWidth) {
            newPosition.left = Math.max(0, bodyWidth - editor.html.width() - MINIMUM_MARGIN_BETWEEN_EDITORS);
        }
        if ((newPosition.top + editor.html.height()) > bodyHeight) {
            newPosition.top = Math.max(0, bodyHeight - editor.html.height() - MINIMUM_MARGIN_BETWEEN_EDITORS);
        }

        editor.html.css('top', newPosition.top);
        editor.html.css('left', newPosition.left);        
    }

    /**
     * Hide all movable editors.
     */
    hideMovableEditors() {
        this.movableEditors.forEach(editor => editor.visible = false);
    }

    /**
     * Hides the movable editor on top.
     * @returns {Boolean} true if an editor was hidden, false if no editors are visible
     */
    hideTopEditor() {
        const editorsReversed = Array.from(this.movableEditors).reverse();
        const visibleEditor = editorsReversed.find(editor => editor.visible)
        if (visibleEditor) {
            visibleEditor.visible = false;
            return true;
        } else {
            return false;
        }
    }

    /**
     * @returns {String}
     */
    get label() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * Hook to indicate that a user action is completed, e.g. changing an input field
     * has been handled. Can be used by controls to tell the editor something changed.
     * Editor can then decide whether or not to immediately save the model (or await e.g. a timeout)
     */
    completeUserAction() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    loadModel() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * 
     * @param {string} source 
     */
    loadSource(source) {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /** @returns {JQuery<HTMLElement>} */
    get html() {
        return this._html;
    }

    set html(html) {
        this._html = html;
        html.attr('editor', this.constructor.name);
        html.attr('model', this.fileName);
        this.ide.divModelEditors.append(html);
    }

    toString() {
        return this.constructor.name + ' - ' + this.fileName;
    }

    /**
     * Handler invoked after the editor becomes visible.
     */
    onShow() {}

    /**
     * Handler invoked after the editor is hidden.
     */
    onHide() {}

    get visible() {
        return this.html.css('display') == 'block';
    }

    /**
     * @param {Boolean} visible
     */
    set visible(visible) {
        this.html.css('display', visible ? 'block' : 'none');
        visible ? this.onShow() : this.onHide();
        if (visible) {
            this.ide.coverPanel.visible = false;
        }
    }

    close() {
        this.ide.back();
    }

    refresh() {
        this.ide.repository.clear(this.fileName);
        this.loadModel();
    }

    /**
     * Create a new model with given name and description and return the fileName of the model.
     * @param {IDE} ide 
     * @param {String} name 
     * @param {String} description 
     * @returns {String} fileName of the new model
     */
    static createNewModel(ide, name, description) {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }
}
