class UndoManager {
    /**
     * @param {CaseModelEditor} editor 
     */
    constructor(editor) {
        this.editor = editor;
    }

    updateUndoRedoButtons(undoCount = this.getUndoCount(), redoCount = this.getRedoCount()) {
        // Only update the buttons once the case is loaded.
        if (this.editor.case) this.editor.case.undoBox.updateButtons(undoCount, redoCount);
    }

    /**
     * Clears the action buffer, and prepares it for the new content.
     * This typically only happens when we open a new case model
     * @param {DefinitionDocument} definition
     */
    resetActionBuffer(definition) {
        this.performingBufferAction = false;
        this.currentAction = null;
        
        // First action is to add what we have to the undo/redo buffer.
        this.addCaseAction(definition);
    }

    get currentAction() {
        return this.__action;
    }

    /**
     * @param {Action} action
     */
    set currentAction(action) {
        this.__action = action;
    }

    /**
     * Save model and upload to server; but only if there are new changes.
     * @param {DefinitionDocument} definition
     * @param {Boolean} forceSave Saving case model is only done on the changes with respect to the previous save action. For creating a new model we have to forcefully save.
     */
    saveCaseModel(definition, forceSave = false) {
        const modelName = definition.caseDefinition.name;
        const newAction = this.addCaseAction(definition);
        if (newAction) {
            if (forceSave) {
                newAction.forceSave();
            } else {
                newAction.save();
            }
        } else {
            // See also console.warn in addCaseAction
            console.warn('Nothing to save for this case model change?!')
        }
    }

    addCaseAction(definition) {
        if (this.performingBufferAction) {
            // This is not supposed to happen. But order of events and invocations is not so easy, so keeping it for safety reasons if you start changing this code
            console.warn('Adding case action while performing buffer action');
            return;
        }

        // Creating a new action makes it also the current action.
        //  Note that the actual action may not resolve in changes, and in such a case, the currentAction will return itself and remain the same.
        this.currentAction = new Action(this, definition, this.currentAction);
        this.updateUndoRedoButtons();
        return this.currentAction;
    }

    getUndoCount() {
        if (this.currentAction) {
            return this.currentAction.undoCount;
        } else {
            return 0;
        }
    }

    undo() {
        if (!this.editor.case) return; // Function currently only enabled in CaseModelEditor
        
        if (this.currentAction) {
            this.currentAction = this.currentAction.undo();
        } else {
            console.log('No undo available');
        }
        this.updateUndoRedoButtons();
    }

    getRedoCount() {
        if (this.currentAction) {
            return this.currentAction.redoCount;
        } else {
            return 0;
        }        
    }

    redo() {
        if (!this.editor.case) return; // Function currently only enabled in CaseModelEditor
        
        if (this.currentAction && this.currentAction.nextAction) {
            this.currentAction = this.currentAction.nextAction.redo();
        } else {
            console.log('No redo availalbe');
        }
        this.updateUndoRedoButtons();
    }
    
}

class UndoRedoBox {
    /**
     * 
     * @param {Case} cs 
     * @param {JQuery<HTMLElement>} html 
     */
    constructor(cs, html) {
        this.case = cs;
        this.html = html;
        this.html.append(
$(`<div class="formheader">
    <div>
        <div class="undo" type="button" title="Undo">
            <span></span>
            <img src="images/undo_128.png" />
        </div>                
        <div class="redo" type="button" title="Redo">
            <img src="images/redo_128.png" />
            <span></span>
        </div>
    </div>
</div>`));
        html.find('.undo').on('click', () => this.undo());
        html.find('.redo').on('click', () => this.redo());
        this.spanUndoCounter = html.find('.undo span');
        this.spanRedoCounter = html.find('.redo span');
    }

    undo() {
        this.case.editor.undoManager.undo();
    }

    redo() {
        this.case.editor.undoManager.redo();
    }

    updateButtons(undoCount, redoCount) {
        this.spanUndoCounter.html(undoCount);
        this.spanRedoCounter.html(redoCount);
    }    
}