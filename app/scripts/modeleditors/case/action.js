class Action {
    /**
     * 
     * @param {UndoManager} undoManager 
     * @param {DefinitionDocument} definition 
     * @param {Action} previousAction
     */
    constructor(undoManager, definition, previousAction) {
        // console.log("Creating new action with dimensions: ", dimensions)
        this.undoManager = undoManager;
        this.repository = undoManager.editor.ide.repository;
        this.modelName = definition.name;
        this.caseString = definition.definitionsXML;
        this.dimensionsString = definition.dimensionsXML;
        this.caseFileName = definition.caseFileName;
        this.dimensionsFileName = definition.dimensionsFileName;
        this.caseChanged = false;
        this.dimensionsChanged = false;
        this.previousAction = previousAction;

        if (previousAction) {
            // Update flags if we have previous actions
            this.caseChanged = previousAction.caseString != this.caseString;
            this.dimensionsChanged = previousAction.dimensionsString != this.dimensionsString;
            if (!this.caseChanged && !this.dimensionsChanged && previousAction) {
                // If no changes, then just return the previous action instead of this new one.
                //  Note: if that previousAction was a change w.r.t. it's predecessor, then we should not keep saving.
                //  This is why the action keeps track of a "saved" flag (see logic in save() method).
                return previousAction;
            }

            // Also make ourselves the next action of the previous one.
            previousAction.nextAction = this;
        }
    }

    get nextAction() {
        return this.next;
    }

    /**
     * @param {Action} action
     */
    set nextAction(action) {
        this.next = action;
    }

    /**
     * Returns the number of undo actions available before this action.
     * @returns {Number}
     */
    get undoCount() {
        return this.previousAction && this.previousAction.undoCount + 1 || 0;
    }

    /**
     * Returns the number of redo actions available behind this action.
     * @returns {Number}
     */
    get redoCount() {
        return this.nextAction && this.nextAction.redoCount + 1 || 0;
    }

    undo() {
        if (this.previousAction) {
            // Undo means we have to perform the previous action.
            //  But for saving the result of that action we have to use our change flags, because we are moving back.
            return this.previousAction.perform('undo', this.caseChanged, this.dimensionsChanged);
        } else {
            console.log('No undo available');
            return this;
        }
    }

    redo() {
        // For redo we can suffice with our own change flags for saving
        return this.perform('redo');
    }

    /**
     * Performs this specific action again, i.e., tells the editor to load the model state
     * corresponding with this action, and also invokes the save logic on the action.
     * Note that the save logic depends on the direction of the perform: for undo, the save flags
     * has to be taken from the current action, for redo it has to be taken from the next action.
     * (See the actual implementations of undo and redo above) 
     * @param {String} direction 
     * @param {Boolean} caseChanged 
     * @param {Boolean} dimensionsChanged 
     */
    perform(direction, caseChanged = this.caseChanged, dimensionsChanged = this.dimensionsChanged) {
        // console.log("Performing "+direction+" on action "+this.undoCount )
        this.undoManager.performingBufferAction = true;
        // Parse the sources again into a definition and load that in the editor.
        const definition = new DefinitionDocument(this.repository.ide, this.caseString, this.dimensionsString, this.caseFileName, this.dimensionsFileName);
        this.undoManager.editor.loadDefinition(definition);
        // Reset the "saved" flag.
        this.saved = false;
        this.save(caseChanged, dimensionsChanged);
        this.undoManager.performingBufferAction = false;
        return this;
    }

    /**
     * Trigger save logic on the action. Executes two independent save actions,
     * one on the case definition and one on the dimensions file; but only if they changed.
     * The flags indicate whether they have changed, and take the values of the Action itself by default.
     * @param {Boolean} caseChanged 
     * @param {Boolean} dimensionsChanged 
     */
    save(caseChanged = this.caseChanged, dimensionsChanged = this.dimensionsChanged) {
        if (this.saved) {
            // We keep track of a "saved" flag. This is required, because the constructor call
            //  may return the previous action, and hence, if there is a change, the save logic is invoked again.
            return;
        }
        if (caseChanged) {
            this.repository.saveXMLFile(this.caseFileName, this.caseString);
        }
        if (dimensionsChanged) {
            this.repository.saveXMLFile(this.dimensionsFileName, this.dimensionsString);
        }
        this.saved = true;
    }

    /**
     * Forceful save. Required for creating new models.
     */
    forceSave() {
        this.save(true, true);
    }
}