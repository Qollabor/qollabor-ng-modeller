'use strict';

class CaseModelEditor extends ModelEditor {
    /**
     * This editor handles Case models
     * @param {IDE} ide 
     * @param {String} fileName The full file name to be loaded, e.g. 'helloworld.case', 'sendresponse.humantask'
     * @param {String} modelName The file name without the extension, e.g. 'helloworld'
     * @param {String} modelType  The extension of the fileName, e.g. 'case', 'process', 'humantask'
     */
    constructor(ide, fileName, modelName, modelType) {
        super(ide, fileName, modelName, modelType);
        this.ideCaseFooter = $('.ideCaseFooter');

        // Listener for keydown event; will be attached/detached from document.body when we become visible/hidden.
        this.keyStrokeListener = e => this.keyStrokeHandler(e);

        Grid.initialize(); // Initialize the snap-to-grid component
        this.undoManager = new UndoManager(this);

        // Upon clicking the case footer's validation label, render the validateform of the case (if a case is there)
        this.ideCaseFooter.find('.validateLabel').on('click', () => this.case && this.case.validateForm.show());
    }

    get label() {
        return 'Edit Case Model - ' + this.fileName;
    }

    /**
     * Loads the model and makes the editor visible
     */
    loadModel() {
        this.dimensionsFileName = this.modelName + '.dimensions';
        this.ide.repository.readModel(this.fileName, caseDefinition => 
            this.ide.repository.readModel(this.dimensionsFileName, dimensions => {
                this.open(this.modelName, caseDefinition.toXML(), dimensions.toXML());
                super.visible = true;
            }));
    }

    refresh() {
        this.ide.repository.clear(this.dimensionsFileName);
        super.refresh();
    }

    /**
     * 
     * @param {JQuery.KeyDownEvent} e 
     */
    keyStrokeHandler(e) {
        if (!this.case) {
            console.log("No case, but already pressing a key?! You're too quick ;)");
            return;
        }
        const visibleMovableEditor = this.movableEditors.find(e => e.visible);
        const selectedElement = this.case.selectedElement;
        switch (e.keyCode) {
        case 27: // esc
            // Clicking Escape closes Movable editors one by one, and if none is left, it deselects current selection
            if (!this.hideTopEditor()) {
                if (this.case) {
                    this.case.clearSelection();
                }
            }
            break;
        case 46: //del
            if (!visibleMovableEditor && selectedElement) {
                this.case.__removeElement(selectedElement);
                this.case.clearSelection();
            }
            break;
        case 37: //arrow left;
        case 38: //arrow up;
        case 39: //arrow right;
        case 40: //arrow down;
            // Pressing one of the arrow keys will move any selected editor or element according to the grid size
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                // Arrow press should not have effect when you're in an input or textarea.
                break;
            }
            return this.handleArrowPress(e.keyCode, visibleMovableEditor, selectedElement);
        case 97: //1;
            break;
        case 98: //2;
            break;
        case 99: //3;
            break;
        case 100: //4;
            break;
        case 83: //s
            if (e.ctrlKey) { // Avoid the browser's save, and save the current model.
                e.stopPropagation();
                e.preventDefault();
                this.autoSaveModel();
            }
            break;
        case 89: //y
            if (e.ctrlKey) this.undoManager.redo();
            break;
        case 90: //z
            if (e.ctrlKey) this.undoManager.undo();
        default:
            break;
        }
    }

    /**
     * Handles pressing an arrow key. Moves either top editor or selected element around.
     * @param {Number} keyCode 
     * @param {MovableEditor} visibleMovableEditor 
     * @param {CMMNElement} selectedElement 
     * @returns {Boolean} false if the event must be canceled, true if the arrow press was not handled.
     */
    handleArrowPress(keyCode, visibleMovableEditor, selectedElement) {
        // 37: arrow left, 39: arrow right, 38: arrow up, 40: arrow down 
        const xMove = (keyCode == 37 ? -1 : keyCode == 39 ? 1 : 0) * Grid.Size;
        const yMove = (keyCode == 38 ? -1 : keyCode == 40 ? 1 : 0) * Grid.Size;
        if (visibleMovableEditor) {
            visibleMovableEditor.move(xMove, yMove);
            return false;
        } else if (selectedElement) {
            selectedElement.xyz_joint.translate(xMove, yMove);
            this.completeUserAction();
            return false;
        }
        return true;
    }

    /**
     * 
     * @param {String} modelName 
     * @param {Document} caseXML 
     * @param {Document} dimensionsXML 
     */
    open(modelName, caseXML, dimensionsXML) {
        // We serialize the XML in our own style, because undomanager comparison happens against our XML serialization of the case.
        //  If the raw source of the model that is opened has a somewhat different format compared to what we would print
        //  this would lead to an unnecessary first save action when a model is loaded.
        const caseString = XML.prettyPrint(caseXML);
        const dimensionsString = XML.prettyPrint(dimensionsXML);

        const definition = new DefinitionDocument(this.ide, caseString, dimensionsString, this.fileName, this.dimensionsFileName);
        if (definition.invalid) {
            // call to definition.invalid will show errors on the screen.
            //  if it is invalid, we will simply stop loading and return to existing state.
            return;
        }

        // Reset the undo manager.
        this.undoManager.resetActionBuffer(definition);

        // Now that the visualization information is available, we can start the import.
        this.loadDefinition(definition);
    }

    /**
     * Imports the source and tries to visualize it
     * @param {DefinitionDocument} definition 
     */
    loadDefinition(definition) {
        // During import no live validation and storage of changes
        this.trackChanges = false;

        // First, remove current case content; but without tracking changes...
        if (this.case) {
            this.case.delete();
        }

        // Create a new case renderer on the definition and dimensions
        this.case = new Case(this, this.htmlContainer, definition);

        // activate live validation and undo etc
        this.trackChanges = true;

        // Run once for migration
        if (definition.caseDefinition.migrated) {
            this.ide.repository.saveXMLFile(definition.caseFileName, definition.definitionsXML);
            this.ide.repository.saveXMLFile(definition.dimensionsFileName, definition.dimensionsXML);
        }

        // Do a first time validation.
        window.setTimeout(() => this.case.runValidation(), 100);
    }

    /**
     * Completes a user action; triggers live-validation and auto-save of models
     */
    completeUserAction() {
        //check if the execute is active (can be set inactive for import)
        if (this.trackChanges) {
            if (!this.autoSaveTimer) {
                // console.warn("Setting the auto-save timer")
                this.autoSaveTimer = window.setTimeout(() => {
                    // console.log("Removing timer and saving changes")
                    delete this.autoSaveTimer;
                    // Tell the repository to save
                    this.autoSaveModel();
                }, 0);
            } else {
                // console.warn("There is already an auto save timer in progress")
            }
        }
    }

    /**
     * to be used to save the current active model
     */
    autoSaveModel() {
        // Validate all models currently active in the ide
        this.case.runValidation();
        // Get the modelName from the url every thing after the hash (#), excluding the hash
        this.undoManager.saveCaseModel(this.case.definitionDocument);
    }

    onShow() {
        this.ideCaseFooter.css('display', 'block');
        $(document.body).on('keydown', this.keyStrokeListener);
    }

    onHide() {
        this.ideCaseFooter.css('display', 'none');
        $(document.body).off('keydown', this.keyStrokeListener);
    }

    /**
     * Creates a new case model
     * @param {IDE} ide
     * @param {String} name The user entered case name
     * @param {String} description The description given by the user (can be empty)
     * @returns {String} fileName of the new model
     */
    static createNewModel(ide, name, description) {
        // By default we create a case plan that fills the whole canvas size;
        //  We position it left and top at 2 times the grid size, with a minimum of 10px;
        //  Width and height have to be adjusted for scrollbar size.
        const margin = 2 * Grid.Size;
        const scrollbar = 40;
        const x = 20;//margin;
        const y = 20;//margin;
        const width = 800;//ide.caseModelEditor && ide.caseModelEditor.case ? ide.caseModelEditor.case.canvas.width() - (margin + scrollbar) : 800;
        const height = 500;//ide.caseModelEditor && ide.caseModelEditor.case ? ide.caseModelEditor.case.canvas.height() - (margin + scrollbar) : 500;

        const definitionDocument = DefinitionDocument.createNewDefinitionDocument(name, description, width, height, x, y);

        // Upload model to server, and force it to save by passing true parameter.
        ide.repository.saveXMLFile(definitionDocument.caseFileName, definitionDocument.caseString)
        ide.repository.saveXMLFile(definitionDocument.dimensionsFileName, definitionDocument.dimensionsString)
        // ide.caseModelEditor.undoManager.saveCaseModel(definitionDocument, true);
        return definitionDocument.caseFileName;
    }
}

class CaseModelEditorMetadata extends ModelEditorMetadata {
    /** @returns {Array<ServerFile>} */
    get modelList() {
        return this.ide.repository.getCases();
    }

    get modelType() {
        return 'case';
    }

    /** @returns {Function} */
    get shapeType() {
        return CaseTask;
    }

    get editorType() {
        return CaseModelEditor;
    }

    get description() {
        return 'Cases';
    }
}

IDE.registerEditorType(CaseModelEditorMetadata);
