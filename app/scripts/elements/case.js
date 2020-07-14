class Case {
    /**
     * Creates a new Case object based on the definition and dimensions
     * @param {CaseModelEditor} editor
     * @param {JQuery<HTMLElement>} htmlParent
     * @param {DefinitionDocument} definitionDocument 
     */
    constructor(editor, htmlParent, definitionDocument) {
        const now = new Date();
        this.editor = editor;
        /** @type {Array<MovableEditor>} */
        this.movableEditors = [];
        this.definitionDocument = definitionDocument;
        this.caseDefinition = definitionDocument.caseDefinition;
        this.dimensions = definitionDocument.dimensions;
        this.id = this.caseDefinition.id;
        this.name = this.caseDefinition.name;
        this.case = this;
        this.htmlParent = htmlParent;

        this.html = $(
`<div case="${this.id}">
    <div class="casemodeler">
        <div class="basicbox basicform undoredobox"></div>
        <div class="basicbox basicform shapebox"></div>
        <div class="divCaseModel">
            <div class="divCaseCanvas basicbox">
                <div class="paper-container-scroller">
                    <div class="paper-container" />
                    <div class="divResizers"></div>
                    <div class="divHalos"></div>
                    <img class="halodragimgid" />
                </div>
            </div>
            <div class="divCaseFileEditor"></div>
        </div>
    </div>
    <div class="divMovableEditors"></div>
</div>`);
        this.htmlParent.append(this.html);

        this.divCaseModel = this.html.find('.divCaseModel');
        this.divMovableEditors = this.html.find('.divMovableEditors');
        this.divUndoRedo = this.html.find('.undoredobox');
        this.divShapeBox = this.html.find('.shapebox');
        this.divCFIEditor = this.html.find('.divCaseFileEditor');
        this.canvas = this.divCaseModel.find('.divCaseCanvas');
        this.paperContainer = this.html.find('.paper-container');

        this.deployForm = new Deploy(this);
        this.sourceEditor = new CaseSourceEditor(this, this.html, definitionDocument);
        this.cfiEditor = new CaseFileItemsEditor(this, this.divCFIEditor);
        this.undoBox = new UndoRedoBox(this, this.divUndoRedo);
        this.shapeBox = new ShapeBox(this, this.divShapeBox);
        this.splitter = new RightSplitter(this.divCaseModel, '60%', 5);

        /** @type {Array<CMMNElement>} */
        this.items = [];
        this.connectors = [];

        //add the drawing area for this case
        this.createJointStructure();

        //create the editor forms for roles, case file items, and case input and output parameters
        this.rolesEditor = new RolesEditor(this);
        this.caseParametersEditor = new CaseParametersEditor(this);
        this.startCaseEditor = new StartCaseEditor(this);
        this.debugEditor = new Debugger(this);

        const casePlanDefinition = this.caseDefinition.casePlan;
        if (casePlanDefinition) {
            this.loading = true;
            this.casePlanModel = new CasePlanModel(this, casePlanDefinition);

            // Now render the custom shapes (textboxes and casefileitems)
            this.dimensions.customShapes.forEach(shape => {
                const parentId = shape.parentId;
                const cmmnParent = this.getItem(parentId);
                if (cmmnParent && cmmnParent instanceof Stage) {
                    cmmnParent.createShapeChild(shape);
                } else {
                    console.error('Do not have the parent with id in order to be able to create the custom shape ', shape);
                }
            });

            // Finally render all connectors
            this.dimensions.edges.forEach(edge => Connector.createConnectorFromEdge(this, edge));

            //update the usedIn column of the case file items editor
            this.cfiEditor.showUsedIn();

            // Post load - now render all items; first add them in one shot to joint. Then render the case plan (which will render it's children)
            this.loading = false;

            // Gather the joint elements of the types cmmn-element and connectors. Put them in one big array and give that to joint.
            const jointElements = this.items.map(item => item.xyz_joint).concat(this.connectors.map(c => c.xyz_joint));
            this.graph.addCells(jointElements);
            this.casePlanModel.refreshView();
        }
        // create object for validation of CMMN schema
        this.validator = new Validator(this);
        this.validateForm = new ValidateForm(this);
        this.validator.addListener(validator => {
            // Shows the number of errors and warnings in the case footer
            const iErrors = validator.errors.length;
            const iWarnings = validator.warnings.length;

            const validateLabel = $('.validateLabel');
            validateLabel.html(`CMMN Validation found ${iErrors} problem${iErrors == 1 ? '' : 's'} and ${iWarnings} suggestion${iWarnings == 1 ? '' : 's'}`);
            validateLabel.css('color', iErrors > 0 ? 'red' : iWarnings > 0 ? 'orange' : 'grey');
            if (iErrors == 0 && iWarnings == 0) {
                validateLabel.html('');
            }
        });

        const end = new Date();
        console.log('Case loaded in ' + ((end - now) / 1000) + ' seconds')
    }

    createJointStructure() {
        this.graph = new joint.dia.Graph();

        //create drawing area (SVG), all elements will be drawn in here
        this.paper = new joint.dia.Paper({
            el: this.paperContainer,
            width: '6000px',
            height: '6000px',
            gridSize: 1,
            perpendicularLinks: true,
            model: this.graph
        });

        this.grid = new Grid(this.paper);

        this.paper.svg.setAttribute('case', this.id);

        //cs.paper.svg has the html element, also store the jQuery svg
        this.svg = $(this.paper.svg);

        // Attach paper events
        this.paper.on('cell:pointerup', (elementView, e, x, y) => handlePointerUpPaper(elementView, e, x, y));
        this.paper.on('element:pointerdown', (elementView, e, x, y) => handlePointerDownPaper(elementView, e, x, y));
        this.paper.on('element:pointermove', (elementView, e, x, y) => handlePointerMovePaper(elementView, e, x, y));
        this.paper.on('element:pointerdblclick', (elementView, e, x, y) => elementView.model.xyz_cmmn.propertiesView.show(true));
        this.paper.on('blank:pointerclick', e => this.clearSelection()); // For some reason pointerclick not always works, so also listening to pointerdown on blank.
        this.paper.on('blank:pointerdown', e => this.clearSelection()); // see e.g. https://stackoverflow.com/questions/35443524/jointjs-why-pointerclick-event-doesnt-work-only-pointerdown-gets-fired
        // When we move over an element with the mouse, an event is raised.
        //  This event is captured to enable elements to register themselves with ShapeBox and RepositoryBrowser
        //  Note: this code relies on elements to always have a xyz_cmmn CMMNElement pointer.
        this.paper.on('element:mouseenter', (elementView, e, x, y) => elementView.model.xyz_cmmn.setDropHandlers());
        this.paper.on('element:mouseleave', (elementView, e, x, y) => elementView.model.xyz_cmmn.removeDropHandlers());
        this.paper.on('link:mouseenter', (elementView, e, x, y) => elementView.model.xyz_cmmn.mouseEnter());
        this.paper.on('link:mouseleave', (elementView, e, x, y) => elementView.model.xyz_cmmn.mouseLeave());

        // Also add special event handlers for case itself. Registers with ShapeBox to support adding case plan element if it does not exist
        this.svg.on('pointerover', e => this.setDropHandlers());
        this.svg.on('pointerout', e => this.removeDropHandlers());
        // Enable/disable the HALO when the mouse is near an item
        this.svg.on('pointermove', e => this.showHaloAndResizer(e));
    }

    /**
     * Returns the container in which Halos can render their HTML elements.
     * @returns {JQuery<HTMLElement>}
     */
    get haloContainer() {
        return this.html.find('.divHalos');
    }

    /**
     * Returns the container in which Resizers can render their HTML elements.
     * @returns {JQuery<HTMLElement>}
     */
    get resizeContainer() {
        return this.html.find('.divResizers')
    }

    repositionSplitter() {
        /*When dragging this repository browser splitter, the splitter between the canvas and cfiEditor is not automatically updated
        Here recalculate the position of the splitter and the width of the canvas.

        canvaswidth is the width of the shapes/canvas/cfi container
        minus the shapes width minus cfiEditor Width, and compensate for width of gap between areas
        */

        const containerWidth = this.htmlParent.width(); // Our parent's parent is "divCaseModelEditor"
        const containerLeft = this.htmlParent.offset().left;
        const cfiBoxWidth = this.divCFIEditor.width();
        const shapesWidth = this.divShapeBox.width();
        const cfiBoxLeft = this.divCFIEditor.offset().left;

        const canvasWidth = containerWidth - shapesWidth - cfiBoxWidth - containerLeft + cfiBoxLeft;

        this.divCaseModel.css('width', canvasWidth);
    }

    refreshSplitter() {
        // Recalculate the splitter position in % after refresh
        const splitterPosition = 100 - (100 * this.divCFIEditor.width() / this.divCaseModel.width());
        const splitterPercentage = splitterPosition > 0 ? `${splitterPosition}%` : '0%';

        this.splitter.repositionSplitter(splitterPercentage);
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
     * Renders the "source" view tab
     */
    viewSource() {
        this.clearSelection();
        this.hideMovableEditors();

        this.runValidation();
        if (this.validator.problems.length > 0) {
            this.validateForm.show();
        }
        this.sourceEditor.open();
    }

    openDebugger() {
        this.debugEditor.open();
    }

    runValidation() {
        this.validator.run();
    }

    /**
     * Method invoked after a role or case file item has changed
     * @param {CMMNElementDefinition} definitionElement 
     */
    refreshReferencingFields(definitionElement) {
        // First tell all items to update their properties, if they refer to this element.
        this.items.forEach(item => item.refreshReferencingFields(definitionElement));
        // Also update the sub editors.
        this.movableEditors.forEach(editor => editor.refreshReferencingFields(definitionElement));
    }

    /**
     * Sets/gets the element currently (to be) selected.
     * Upon setting a new selection, the previously selected element is de-selected
     * @param {CMMNElement} element
     */
    set selectedElement(element) {
        const previousSelection = this._selectedElement;
        if (previousSelection) {
            previousSelection.__select(false);
        }
        this._selectedElement = element;
        if (element) {
            element.__select(true);
        }
    }

    get selectedElement() {
        return this._selectedElement;
    }

    /**
     * Clears the currently selected element, if any
     */
    clearSelection() {
        this.selectedElement = undefined;
    }

    showHaloAndResizer(e) {
        // Algorithm for showing halo and resizers when hovering with mouse/pointer over the canvas is as follows:
        //  1. In drag/drop mode, no changes to current situation, just return;
        //  2. If an element is selected, likewise. When an element is selected, halo and resizer of that element are shown in fixed modus.
        //  3. In all other cases:
        //     - Halo of CasePlan is always visible, unless moving outside of CasePlan; resizer is only shown if CasePlan is selected.
        //       This makes the image more stable when hovering around with mouse.
        //     - When moving towards an element (including a 10px surrounding of the element), halo for that element is shown.
        //     - When moving out of element, wider border around element is used (40px), so that halo doesn't disappear too fast.
        //     - When moving out of CasePlan, then CasePlan halo is no longer visible (so that print-screens and so do not show halo always)

        if (this.editor.ide.dragging) return;
        // If an element is selected, avoid on/off behavior when the mouse moves.
        if (this.selectedElement) {
            return;
        }

        // Determine on which element the cursor is and also which halo/resizer is currently visible
        const itemUnderMouse = this.getItemUnderMouse(e);
        const currentlyVisibleHalo = this.items.find(item => item != this.case.casePlanModel && item.halo.visible);

        if (currentlyVisibleHalo && currentlyVisibleHalo.nearElement(e, 40) && !(itemUnderMouse && itemUnderMouse.hasAncestor(currentlyVisibleHalo))) {
            // Current halo is still visible, and we're still in the wide border around it; 
            //  Also current item under mouse is NOT a child of current halo ...
            // Then: do nothing; just keep current halo visible
        } else {
            // Hide all halos (perhaps it is sufficient to just hide current one), and show the new one (if any)
            this.items.forEach(item => item.__renderBoundary(false));
            if (itemUnderMouse) itemUnderMouse.__renderBoundary(true);
            else this.casePlanModel.hideHalo();          
        }
    }

    /**
     * Returns the deepest cmmn element under cursor. If that is equal to self, then
     * parent of self is returned.
     * @param {*} e 
     * @param {CMMNElement} self 
     * @returns {CMMNElement}
     */
    getItemUnderMouse(e, self = undefined) {
        const itemsUnderMouse = this.items.filter(item => item.nearElement(e, 10));
        const parentsUnderMouse = itemsUnderMouse.filter(item => item.parent instanceof CMMNElement).map(item => item.parent);

        // If self is passed, then the collections need to filter it out.
        if (self) {
            Util.removeFromArray(itemsUnderMouse, self);
            Util.removeFromArray(parentsUnderMouse, self.parent);
        }
        const itemUnderMouse = this.items.find(item => itemsUnderMouse.indexOf(item) >= 0 && parentsUnderMouse.indexOf(item) < 0);
        // console.log("Current item under mouse is "+(itemUnderMouse && itemUnderMouse.name));
        return itemUnderMouse;
    }

    setDropHandlers() {
        if (!this.casePlanModel) {
            this.shapeBox.setDropHandler((model, e) => this.createCasePlan(CasePlanModel, e), shapeType => this.__canHaveAsChild(shapeType));
        }
    }

    removeDropHandlers() {
        this.shapeBox.removeDropHandler();
    }

    /**
     * deletes a case including elements, connectors, graph, editors
     */
    delete() {
        // Remove all our inline editors.
        this.rolesEditor.delete();
        this.cfiEditor.delete();
        this.caseParametersEditor.delete();
        this.startCaseEditor.delete();
        this.sourceEditor.delete();
        this.deployForm.delete();
        this.splitter.delete();
        // All propertyViews that have been created must also be deleted. But we do not go via .propertiesView, because that would unnecessarily create'm
        this.items.forEach(canvasItem => canvasItem.__properties && canvasItem.__properties.delete());
        Util.removeHTML(this.html);
    };

    //returns description of the element well formatted
    get typeDescription() {
        return 'Case';
    };

    /**
     * validates the case and it's content
     */
    validate() {
        if (!this.casePlanModel) {
            this.validator.raiseProblem(this.id, 17, [this.name]);
        }

        //validate editors
        this.cfiEditor.validate();
        this.rolesEditor.validate();
        this.caseParametersEditor.validate();

        //loop all elements in case
        this.items.forEach(cmmnElement => cmmnElement.__validate());
    };

    /**
     * Raises an issue found during validation. The context in which the issue has occured and the issue number must be passed, 
     * along with some parameters that are used to provide a meaningful description of the issue
     * @param {*} context
     * @param {Number} number 
     * @param {Array<String>} parameters 
     */
    raiseEditorIssue(context, number, parameters) {
        this.validator.raiseProblem(context.id, number, parameters);
    }

    //!!!! return true when the graph/background can have an element with elementType as parent
    __canHaveAsChild(elementType) {
        return elementType == CasePlanModel.name && !this.casePlanModel;
    }

    /**
     * Returns the coordinates of the mouse pointer, relative with respect to the top left of the case canvas
     * @param {*} e 
     */
    getCursorCoordinates(e = event) {
        const x = e.clientX;
        const y = e.clientY;
        if (!x || !y) {
            console.error("Fetching cursor coordinates without a proper event... ", e);
            return;
        }

        const offset = this.svg.offset();
        return {
            x: e.clientX - offset.left,
            y: e.clientY - offset.top
        };
    }

    /**
     * Creates a case plan model (if that is the expected type)
     * @param {Function} cmmnType 
     * @param {*} e 
     */
    createCasePlan(cmmnType, e) {
        if (cmmnType == CasePlanModel) {
            const coor = this.getCursorCoordinates(e);
            const casePlanDefinition = this.caseDefinition.getCasePlan(coor.x, coor.y);
            this.casePlanModel = new CasePlanModel(this, casePlanDefinition);
            this.__addElement(this.casePlanModel);
            this.casePlanModel.propertiesView.show(true);
            return this.casePlanModel;
        } else {
            throw new Error('Cannot create an element of type ' + cmmnType.name + ' at the top of a case');
        }
    }

    /**
     * Add an element to the drawing canvas.
     * @param {CMMNElement|CaseFileItem|TextBox} cmmnElement 
     */
    __addElement(cmmnElement) {
        // Only add the element if we're not loading the entire case. Because then all elements are presented to the joint graphs in one shot.
        if (this.loading) {
            return;
        }

        this.graph.addCells([cmmnElement.xyz_joint]);

        // TODO: this should no longer be necessary if constructors fill proper joint immediately based upon definition
        cmmnElement.refreshView();
        // TODO: moveConstraint invocation belongs in proper element base of refreshView (i.e. for sentries and planningtables)
        cmmnElement.__moveConstraint(cmmnElement.shape.x, cmmnElement.shape.y);
        this.editor.completeUserAction();
        return cmmnElement;
    }

    /**
     * Add a connector to the canvas
     * @param {Connector} connector 
     */
    __addConnector(connector) {
        this.connectors.push(connector);
        if (!this.loading) {
            this.graph.addCells([connector.xyz_joint]);
        }
    }

    /**
     * Remove a connector from the registration. This method is invoked when the connector
     * is already removed from the canvas.
     * @param {Connector} connector 
     */
    __removeConnector(connector) {
        connector.edge.removeDefinition();
        Util.removeFromArray(this.connectors, connector);
    }

    /**
     * Remove an element from the canvas, including it's children.
     * @param {CMMNElement} cmmnElement 
     */
    __removeElement(cmmnElement) {
        // if (cmmnElement instanceof PlanningTable) return; // Cannot delete planning table images.

        // Remove it; which recursively also removes the children; only then save it.
        cmmnElement.__delete();

        // And save the changes.
        this.editor.completeUserAction();

        //update the column UsedIn in the case file items treetable
        this.cfiEditor.showUsedIn();
    }

    /**
     * Finds the CMMNElement with the specified ID or undefined.
     * @param {String} id 
     * @returns {CMMNElement}
     */
    getItem(id) {
        return this.items.find(item => id && item.id == id);
    }

    /**
     * returns a case file item element referencing the caseFileItemID
     * @param {String} caseFileItemID 
     */
    getCaseFileItemElement(caseFileItemID) {
        return this.items.find(item => item instanceof CaseFileItem && item.definition.contextRef == caseFileItemID);
    }
}

/**
 * Handles mouse down on an element in the paper.
 * - elementView   : the object definition of an element
 * - e             : event
 * - x,y           : coordinates of the mouse event relative to the paper (<svg>)
 */
function handlePointerDownPaper(elementView, e, x, y) {
    const cmmnElement = elementView.model.xyz_cmmn;

    //select the mouse down element, do not set focus on description, makes it hard to delete
    //the element with [del] keyboard button (you delete the description io element)
    cmmnElement.case.selectedElement = cmmnElement;

    Grid.blurSetSize();
}

/**
 * Handles the mouse move over paper after pointer down event.
 * handle the moving of element and resizing.
 * @param {*} elementView   : the object definition of an element
 * @param {Event} e             : event
 * @param {Number} x             : event
 * @param {Number} y             : event
 * - x,y           : coordinates of the mouse event relative to the paper (<svg>)
 */
function handlePointerMovePaper(elementView, e, x, y) {
    /** @type {CMMNElement} */
    const cmmnElement = elementView.model.xyz_cmmn;

    if (cmmnElement instanceof Sentry || cmmnElement instanceof PlanningTable) {
        cmmnElement.__moveConstraint(x, y);
    }
}

/**
 * fires when the mouseup event is triggered on the jointjs paper (svg element)
 * - elementView   : the object definition of an element
 * - e             : event
 * - x,y           : coordinates of the mouse  up event relative to the paper (<svg>)
 */
function handlePointerUpPaper(elementView, e, x, y) {
    const cmmnElement = elementView.model.xyz_cmmn;

    if (!(cmmnElement instanceof Connector)) {
        if (cmmnElement instanceof Sentry || cmmnElement instanceof PlanningTable) {
            //the element being moved is a sentry, position on boundry of parent
            //then return, sentry can not change parents
            cmmnElement.__moveConstraint(x, y);
        } else {
            //get the element directly under the current element
            const newParent = cmmnElement.case.getItemUnderMouse(e, cmmnElement);
            // Check if this element can serve as a new parent for the cmmn element
            if (newParent && newParent.__canHaveAsChild(cmmnElement.constructor.name) && newParent != cmmnElement.parent) {
                // check if new parent is allowed
                cmmnElement.changeParent(newParent);
            }
            if (cmmnElement instanceof Stage) {
                cmmnElement.resetChildren();
            }
        }
    }
    cmmnElement.case.editor.completeUserAction();
}