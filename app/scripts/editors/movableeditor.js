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
        this.modelEditor.registerMovableEditor(this);
    }

    get case() {
        return this.modelEditor instanceof CaseModelEditor ? this.modelEditor.case : undefined;
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
        this.modelEditor.selectMovableEditor(this);
    }

    get visible() {
        return this._visible;
    }

    /** @param {Boolean} visible */
    set visible(visible) {
        const alreadyVisible = this._visible;
        this._visible = visible;
        if (visible) {
            this.renderForm();
            this.toFront();
            if (! alreadyVisible) {
                this.positionEditor();
            }
        }
        if (this._html) {
            this.html.css('display', visible ? 'block' : 'none');
            if (! this._changingVisiblity) {
                this._changingVisiblity = true;
                const nothing = visible ? this.onShow() : this.onHide();
                this._changingVisiblity = false;
            }
        }
    }

    show() {
        this.visible = true;
        // mechanism to handle fact that editor is shown
    }

    hide() {
        this.visible = false;
        // mechanism to handle fact that editor is hidden
    }

    onShow() {
        // mechanism to handle fact that editor is hidden
    }

    onHide() {
        // mechanism to handle fact that editor is hidden
    }

    /**
     * Position this editor along with the others to avoid unclear overlap
     */
    positionEditor() {
        this.modelEditor.positionMovableEditor(this);
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
