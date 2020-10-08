class MovableEditor {
    /**
     * A movable editor resides typically within the context of a case.
     * Usually it is something that pops up upon button click (e.g., Properties of an element, Roles Editor, Parameters Editor, etc)
     * It can be moved around and resized.
     * @param {ModelEditor} modelEditor 
     */
    constructor(modelEditor) {
        this.modelEditor = modelEditor;
        this.htmlParent = this.modelEditor.divMovableEditors;
        this.registerEditor();
    }

    registerEditor() {
        this.editors.push(this);
    }

    get case() {
        return this.modelEditor instanceof CaseModelEditor ? this.modelEditor.case : undefined;
    }

    get editors() {
        return this.modelEditor.movableEditors;
    }

    get html() {
        return $(this._html);
    }

    /**
     * @param {JQuery<HTMLElement>} html
     */
    set html(html) {
        this._html = $(html);
    }

    renderForm() {
        console.warn('The editor ' + this.constructor.name + ' does not implement the renderForm() function, but that is expected');
    }

    /**
     * Brings this editor in front of the others
     */
    toFront() {
        Util.removeFromArray(this.editors, this);
        this.editors.push(this);
        // Now reset z-index of editors, oldest at bottom, newest (this) at top.
        this.editors.forEach((editor, index) => $(editor.html).css('z-index', index + 1));
    }

    get visible() {
        return this._visible;
    }

    /** @param {Boolean} visible */
    set visible(visible) {
        const previouslyVisible = this._visible;
        this._visible = visible;
        if (visible) {
            this.renderForm();
            this.toFront();
            if (! previouslyVisible) {
                this.positionEditor();
            }
        }
        if (this._html) {
            this.html.css('display', visible ? 'block' : 'none');
            if (! this._changingVisiblity) {
                this._changingVisiblity = true;
                const nothing = visible ? this.show() : this.hide();
                this._changingVisiblity = false;
            }
        }
    }

    show() {
        // mechanism to handle fact that editor is shown
    }

    hide() {
        // mechanism to handle fact that editor is hidden
    }

    /**
     * returns coordinates for the new to open/show editor
     * The coordinates must be such that the editor is offset from the currently displayed editors
     * and not outside the window
     */
    positionEditor() {
        const newPosition = this.html.offset();
        if (newPosition.left == 0) {
            newPosition.left = 220;
        }
        if (newPosition.top == 0) {
            newPosition.top = 60;
        }

        const MINIMUM_MARGIN_BETWEEN_EDITORS = 30;

        // Do not put this tree editor at exact same location as one of the others
        //  There must be at least 20 px difference
        this.editors.forEach(editor => {
            if (editor != this && editor.html.css('display') == 'block') {
                const editorOffset = editor.html.offset();

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

        // Also keep tree editor inside the browser window
        const bodyWidth = document.body.offsetWidth;
        const bodyHeight = document.body.offsetHeight;
        if ((newPosition.left + this.html.width()) > bodyWidth) {
            newPosition.left = Math.max(0, bodyWidth - this.html.width() - MINIMUM_MARGIN_BETWEEN_EDITORS);
        }
        if ((newPosition.top + this.html.height()) > bodyHeight) {
            newPosition.top = Math.max(0, bodyHeight - this.html.height() - MINIMUM_MARGIN_BETWEEN_EDITORS);
        }

        this.html.css('top', newPosition.top);
        this.html.css('left', newPosition.left);
    }

    /**
     * Move the editor x pixels to the right, and y pixels down. Negative numbers move it in the opposite direction.
     * @param {Number} x 
     * @param {Number} y 
     */
    move(x, y) {
        const top = parseInt(this.html.css('top'));
        const left = parseInt(this.html.css('left'));
        this.html.css('left', left + x);
        this.html.css('top', top + y);
    }

    /**
     * Method invoked after a role or case file item has changed
     * @param {CMMNElementDefinition} definitionElement 
     */
    refreshReferencingFields(definitionElement) {}

    toString() {
        return this.constructor.name;
    }
}
