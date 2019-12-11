const NEWDEF = '__new__';

class CaseFileItemsEditor {
    /**
     * Renders the CaseFile definition through fancytree
     * @param {Case} cs 
     * @param {JQuery<HTMLElement>} htmlParent 
     */
    constructor(cs, htmlParent) {
        this.case = cs;
        this.ide = this.case.editor.ide;
        this.htmlParent = htmlParent;
        this.renderHTML();

        this.divCaseFileDefinitions = this.html.find('.divCaseFileDefinitions');
        this.caseFileItemDefinitionEditor = new CaseFileItemDefinitionEditor(this, this.divCaseFileDefinitions);
        this.splitter = new BottomSplitter(htmlParent, '70%', 175);        
        
        //get the tree table which will contain the data from the html
        this.tree = this.html.find('table');
        //render the treetable. Add the data from the treeEditor object to the tree
        this.tree.fancytree(this.getRenderStructure());

        //add the event handles, for adding and removing data at top level
        this.attachEventHandlers();

        //fancy tree has the tree object: the fancytree.js object (this.tree just points to html node)
        this.fancyTree = this.tree.fancytree('getTree');
    }

    /**
     * returns the fancy tree definition for the case file items tree table.
     * @returns {Fancytree.FancytreeOptions}
     */
    getRenderStructure() {
        const treeRender = {
            checkbox: false, //no checkboxes at the left of row
            source: this.data,
            titlesTabbable: true,
            activeVisible: true,
            //focusOnSelect: true,
            extensions: ['edit', 'table', 'dnd'],
            dblclick: e => this.clickOK(e), // Double clicking an element is same as clicking OK
            tables: {
                nodeColumnIdx: 0,
                indentation: 10
            },
            dnd: {
                // Available options with their default:
                autoExpandMS: 1000, // Expand nodes after n milliseconds of hovering
                draggable: null, // Additional options passed to jQuery UI draggable
                droppable: null, // Additional options passed to jQuery UI droppable
                focusOnClick: false, // Focus, although draggable cancels mousedown event (#270)
                preventRecursiveMoves: true, // Prevent dropping nodes on own descendants
                preventVoidMoves: true, // Prevent dropping nodes 'before self', etc.
                smartRevert: true, // set draggable.revert = true if drop was rejected

                // Events that make tree nodes draggable
                dragStart: (node, data) => this.handleDragStartCFIDataNode(node, data), // Callback(sourceNode, data), return true to enable dnd
                dragStop: null, // Callback(sourceNode, data)
                initHelper: null, // Callback(sourceNode, data)
                updateHelper: null, // Callback(sourceNode, data)

                // Events that make tree nodes accept draggables
                dragEnter: null, // Callback(targetNode, data)
                dragOver: null, // Callback(targetNode, data)
                dragDrop: null, // Callback(targetNode, data)
                dragLeave: null // Callback(targetNode, data)
            },
            //handle (de)activation of a dataNode
            activate: (event, data) => this.selectRow(data.node),
            deactivate: (event, data) => this.deselectRow(data.node),
            renderColumns: (event, data) => {
                //the first column is the title property
                const node = data.node;
                const $tdList = $(data.node.tr).find('>td');
                const caseFileItem = this.getDefinitionElement(data.node);

                // Set the fancy tree node title of the element.
                $tdList.eq(0).find('.fancytree-title').html(caseFileItem.name); // Setting it in the HTML ensures that the name is also rendered for child items
                data.node.title = caseFileItem.name; // Setting it in title ensures that it the text is not rendered as "undefined" for empty strings

                $tdList.eq(0).off('change'); // Avoid adding duplicate handlers each time a node is rendered again.
                $tdList.eq(0).on('change', (e) => {
                    // Captures changes to name of case file item
                    caseFileItem.name = e.target.value;
                    if (!caseFileItem.definitionRef) {
                        const cfid = this.ide.repository.getCaseFileItemDefinitions().find(definition => definition.name.toLowerCase() == caseFileItem.name.toLowerCase());
                        if (cfid) {
                            caseFileItem.definitionRef = cfid.fileName;
                        }
                    }
                    this.case.refreshReferencingFields(caseFileItem);
                    this.case.editor.completeUserAction();
                })

                const multiplicitySelect = `<select>
                    <option value="ExactlyOne">[1]</option>
                    <option value="ZeroOrOne">[0..1]</option>
                    <option value="ZeroOrMore">[0..*]</option>
                    <option value="OneOrMore">[1..*]</option>
                    <option value="Unspecified">[*]</option>
                    <option value="Unknown">[?]</option>
               </select>`;

                $tdList.eq(1).html(multiplicitySelect);

                const multiplicityField = $tdList.eq(1)[0].firstChild;
                multiplicityField.value = caseFileItem.multiplicity;

                //attach the onchange select here
                $(multiplicityField).on('change', () => {
                    caseFileItem.multiplicity = multiplicityField.value;
                    this.case.editor.completeUserAction();
                });

                // Set the case file item definition field
                // Create the dropdown with the models (including __NEW__ and __EMPTY__)
                $tdList.eq(2).html(this.getSelectHTML());

                // Select the right CaseFileItemDefinition with our current value
                const cfidefField = $tdList.eq(2)[0].firstChild;
                cfidefField.value = caseFileItem.definitionRef;
                // And make sure we can handle change of the value
                $(cfidefField).on('change', e => this.changeCaseFileItemDefinition(caseFileItem, e.currentTarget));

                const UsedInTooltip =
                    `The Case File Item is used by:

                    s = sentry
                    T = Task
                    E = Event
                    M = Milestone
                    S = Stage
                    P = PlanningTable
                    C = Case File Item (element)
                    I = Input Case Parameters
                    O = Output Case Parameters`;

                $tdList.eq(3).attr('title', UsedInTooltip);

                $tdList.eq(3).html('<span class="treetextfield"></span>')
                const usedInField = $tdList.eq(3)[0].firstChild;
                usedInField.innerHTML = caseFileItem.usedIn;
            }
        };
        return treeRender;
    }


    /**
     * Raises an issue found during validation. The context in which the issue has occured and the issue number must be passed, 
     * along with some parameters that are used to provide a meaningful description of the issue
     * @param {*} context
     * @param {Number} number 
     * @param {Array<String>} parameters 
     */
    raiseEditorIssue(context, number, parameters) {
        this.case.validator.raiseProblem(context.id, number, parameters);
    }

    /**
     * @returns {Array<CaseFileItemDef>}
     */
    get data() {
        return this.case.caseDefinition.caseFile.children;
    }

    /**
     * Registers a function handler that is invoked upon dropping an element.
     * @param {Function} handler
     */
    set dropHandler(handler) {
        this._dropHandler = handler;
    }

    /**
     * Returns the CMMNElementDefinition associated with the fancy tree node.
     * @returns {CaseFileItemDef}
     */
    getDefinitionElement(node) {
        if (!node) {
            throw new Error('Node must be given to this function');
        }
        return this.case.caseDefinition.getElement(node.data.__id);
    }

    /**
     * Opens the editor form.
     * @param {Function} callback 
     */
    open(callback = undefined) {
        this.enterSelectionMode(callback);
    }

    /**
     * Opens the editor in selection modus; This allows for selecting a case file item on dbl click or on OK click to be set on the object that invoked this function (through the callback method)
     * @param {Function} callback 
     */
    enterSelectionMode(callback) {
        //set the callback function for when a tree item has been selected
        this.callback = callback;        
        this.html.find('.dialogButtons').css('display', 'block');        
    }

    /**
     * Both pressing OK and Cancel make us leave selection mode.
     * @param {*} e 
     */
    leaveSelectionMode(e) {
        e.stopPropagation();
        delete this.callback;
        this.html.find('.dialogButtons').css('display', 'none');
    }

    clickOK(e) {
        e.stopPropagation();
        e.preventDefault();

        if (this.callback) {
            //get the row selected by the user
            const activeNode = this.fancyTree.getActiveNode();
            if (activeNode) {
                const definitionElement = this.getDefinitionElement(activeNode);
                this.callback(definitionElement);
                this.leaveSelectionMode(e);
            } else {
                this.ide.warning('Please select an item', 1000);
            }
        }
    }

    /**
     * Deletes this editor
     */
    delete() {
        // Delete the generic events of the treeEditor (e.g. click add button, ...)
        Util.removeHTML(this.html);
        this.splitter.delete();
    }

    /**
     * define the events of the data manipulation buttons, tree click event and other buttons
     */
    attachEventHandlers() {
        this.html.find('.btnAddChild').on('click', e => this.clickAddButton('child'));
        this.html.find('.btnAddSibling').on('click', e => this.clickAddButton('after'));
        this.html.find('.btnRemoveItem').on('click', e => this.clickRemoveButton(e));

        //add event for OK, cancel and close buttons (bottom)
        this.html.find('.treeeditorokbt').on('click', e => this.clickOK(e));
        this.html.find('.treeeditorcancelbt').on('click', e => this.leaveSelectionMode(e));

        //add event for mouse leaving the tree editor -> unmark elements
        this.html.on('pointerleave', (e, data) => {
            this.changeMarking(false);
            const activeNode = this.fancyTree.getActiveNode();
            if (activeNode) {
                activeNode.setActive(false);
            }
        });

        //add event for the [edit row] button (f2)
        this.html.find('.treeeditoreditrowbt').on('click', e => {
            e.stopPropagation();
            e.preventDefault();
            const activeNode = this.fancyTree.getActiveNode();
            if (activeNode) {
                activeNode.editStart();
            }
        });
    }

    /**
     * Adds a node to the fancy tree, either as sibling or child of the current node (depends on the value of the position string)
     * @param {String} position Must be either 'child' or 'after' for either adding a child or a sibling.
     */
    clickAddButton(position) {
        const anchorNode = this.fancyTree.getActiveNode() || this.fancyTree.getRootNode();
        // Parent node is used for determining the new case file item definition's parent.
        const parentNode = position == 'after' ? anchorNode.parent : anchorNode;
        const caseDefinition = this.case.caseDefinition;
        const parentCaseFileItemID = parentNode && parentNode.data ? parentNode.data.__id : undefined;
        /** @type {CaseFileItemCollection} */
        const parentDefinition = parentCaseFileItemID ? caseDefinition.getElement(parentCaseFileItemID) : caseDefinition.getCaseFile();
        const newCaseFileItemDefinition = parentDefinition.createChildDefinition()

        // Fancy tree likes to get his new nodes in an array...
        const newDataNode = [newCaseFileItemDefinition];

        // Adding a sibling to the root will result in a fancytree error. Here we check for that case, and convert it to adding a child instead of a sibling
        if (position == 'after' && !parentNode) {
            position = 'child';
        }
        const newNode = anchorNode.addNode(newDataNode, position);
        this.editStart(newNode);
        this.case.editor.completeUserAction();                
    }

    clickRemoveButton(e) {
        // Get the user selected node. Can be null if none is seleted
        const activeNode = this.fancyTree.getActiveNode();
        if (activeNode) {
            const definitionElement = this.getDefinitionElement(activeNode);
            if (this.hasReferences(definitionElement)) {
                // Only remove the node if it is not in use
                this.ide.danger('The item (or one of its children) is in use, it cannot be deleted');
            } else {
                // Remove the node and the corresponding definition element.
                definitionElement.removeDefinition();
                activeNode.remove();
                this.caseFileItemDefinitionEditor.hideEditor();
            }
        } else {
            ide.warning('Select a node to be removed', 1000);
        }
        this.case.editor.completeUserAction();        
    }

    /**
     * return a string that defines the content of the select defintion field in the case file items editor
     * Select has an empty field, a <new> for creating a new cfidef, and the already available cfidef's
     * @returns {String}
     */
    getSelectHTML() {
        // First create 2 options for "empty" and "_new_", then add all casefileitem definition files
        return (
            [`<select class="cfidefselect"><option value=""></option> <option value="${NEWDEF}">&lt;new&gt;</option>`]
            .concat(this.ide.repository.getCaseFileItemDefinitions().map(definition => `<option value="${definition.fileName}">${definition.name}</option>`))
            .concat('</select>')
            .join(''));
    };

    /**
     * Creates a non-existing name for the new case file item definition node,
     * i.e., one that does not conflict with the existing list of case file item definitions.
     * @returns {String}
     */
    __getUniqueDefinitionName(cfidName) {
        const currentDefinitions = this.ide.repository.getCaseFileItemDefinitions();
        for (let i = 0; i < currentDefinitions.length; i++) {
            const modelName = currentDefinitions[i].name;
            if (modelName == cfidName) {
                console.log('The name ' + cfidName + ' already exists in repository; creating new one');
                return this.__getUniqueDefinitionName(this.__nextName(cfidName));
            }
        }
        return cfidName;
    }

    /**
     * Returns the next name for the specified string; it checks the last
     * characters. For a name like 'abc' it will return 'abc_1', for 'abc_1' it returns 'abc_2', etc.
     * @returns {String}
     */
    __nextName(proposedName) {
        const underscoreLocation = proposedName.indexOf('_');
        if (underscoreLocation < 0) {
            return proposedName + '_1';
        } else {
            const front = proposedName.substring(0, underscoreLocation + 1);
            const num = new Number(proposedName.substring(underscoreLocation + 1));
            const newName = front + (num + 1);
            return newName;
        }
    }

    /**
     * Changes the definitionRef of the case file item, and loads the new definition ref
     * @param {CaseFileItemDef} caseFileItem 
     * @param {Element} cfidefField 
     */
    changeCaseFileItemDefinition(caseFileItem, cfidefField) {
        const newValue = cfidefField.value;
        const newModelName = newValue == NEWDEF ? this.__getUniqueDefinitionName(caseFileItem.name.toLowerCase()) : undefined;
        const definitionRef = newModelName ? newModelName + '.cfid' : newValue;

        if (newValue == NEWDEF) {
            // Create a new option for the new model
            $(cfidefField).append($(`<option value="${definitionRef}">${newModelName}</option>`));
            // select the option
            cfidefField.value = definitionRef;
            // and start an editor for it
            this.caseFileItemDefinitionEditor.createNewModel(definitionRef);
        } else {
            // Inform the CaseFileItemDefinition editor to render the new definition
            this.caseFileItemDefinitionEditor.loadDefinition(definitionRef);
        }

        // Do the actual definition change and make sure it is saved
        caseFileItem.definitionRef = definitionRef;
        this.case.editor.completeUserAction();
    }

    /**
     * Fills the usedIn column, shows which type of elements use this cfi
     * Values can be: sTEMSPOCIO (sentry, Task, Event, Milestone, Stage, PlanningTable, input output CaseParameters, CFIElement
     * - dataNode      : (optional) shows the usedIn just for this dataNode
     */
    showUsedIn(dataNode) {
        const allCaseFileItems = this.case.caseDefinition.getCaseFile().getDescendants();
        //loop all dataNodes
        allCaseFileItems.forEach(cfi => {
            //get objects using this case file item
            const objectsUsingDN = this.getReferences(cfi);
            cfi.usedIn = this.getUsedInValueFromObjects(objectsUsingDN);
        });
        this.fancyTree.rootNode.render(true, true);
    }

    /**
     * @returns {Boolean}
     */
    hasReferences(definitionElement) {
        // Check for references not just for this element, but also for the children
        return definitionElement.getDescendants().find(child => this.getReferences(child).length > 0);
    }

    /**
     * Gets all elements and editors that refer to the definition element
     * @param {CaseFileItemDef} definitionElement 
     * @returns {Array<*>}
     */
    getReferences(definitionElement) {
        /** @type {Array<*>} */
        const references = this.case.items.filter(item => item.referencesDefinitionElement(definitionElement.id));
        // Also check whether the case parameters may be using the case file item
        if (this.case.caseDefinition.input.find(p => p.bindingRef == definitionElement.id)) {
            references.push(this.case.caseParametersEditor);
        } else if (this.case.caseDefinition.output.find(p => p.bindingRef == definitionElement.id)) {
            // else statement, since no need to add the same editor twice
            references.push(this.case.caseParametersEditor);
        }
        return references;
    }

    /** 
     * returns a string of characters, these represent the object types used by a dataNode
     * sTEMSPOCIO
     */
    getUsedInValueFromObjects(objects) {
        //loop objects
        const chars = [];
        for (let i = 0; i < 9; i++) {
            chars[i] = '&nbsp;';
        }

        objects.forEach(object => {
            if (object instanceof CaseParametersEditor) {
                // TODO: this can be made more precise through navigating the definition structure instead of the visualization structure.
                chars[7] = 'I';
                chars[8] = 'O';
            } else if (object instanceof Task) {
                chars[1] = 'T'
            } else if (object instanceof Stage) {
                chars[4] = 'S';
            } else if (object instanceof Milestone) {
                chars[3] = 'M';
            } else if (object instanceof EventListener) {
                chars[2] = 'E';
            } else if (object instanceof Sentry) {
                chars[0] = 's';
            } else if (object instanceof PlanningTable) {
                chars[5] = 'P';
            } else if (object instanceof CaseFileItem) {
                chars[6] = 'C';
            }
        })
        return chars.join('');
    }

    /**
     * Handles the dragging of a case file item from the cfi editor to a zoom field (cfi field)
     */
    handleDragStartCFIDataNode(node, data) {
        //create the drag image: file icon + name of cfi, use styling fancy tree
        const dragImage = $(`<div class="dragbox">
                                <span class="fancytree-icon"></span>
                                <span class="fancytree-title">${node.title}</span>
                            </div>`);

        $('body').append(dragImage);

        //save the node which is dragged in dragData
        $('body').on('pointermove', e => this.handleMousemoveCFI(e, dragImage));
        $('body').on('pointerup', e => this.handleMouseupCFI(e, dragImage, node));
    }

    /**
     * handle the drag action/mouse move of cfi item, event attached to 'body'
     */
    handleMousemoveCFI(e, dragImage) {
        this.ide.dragging = true;
        e.stopPropagation();

        //position the drag image
        dragImage.offset({
            top: e.pageY,
            left: e.pageX + 20 //+20 such that cursor is not above drag image, messes up the events
        });

        //check if cursor is over a cfi zoom field
        if (this._dropHandler) {
            dragImage.addClass('dropallowed');
        } else {
            dragImage.removeClass('dropallowed')
        }
    }

    /**
     * handle drop of cfi, event attached to 'body'
     * Used to drag and drop a case file item from the editor to a zoom field
     */
    handleMouseupCFI(e, dragImage, node) {
        e.stopPropagation();

        if (this._dropHandler) {
            const cfi = this.getDefinitionElement(node);
            this._dropHandler(cfi);

            //update the usedIn column
            this.showUsedIn();
        }

        // Cleanup image and event handlers
        dragImage.remove();
        this.ide.dragging = false;
        $('body').off('pointermove').off('pointerup');
    }

    /**
     * specific function for when a row in the cfiEditor is selected
     */
    selectRow(activeNode) {
        const cfi = this.getDefinitionElement(activeNode);
        // Show the right item in the definitions editor
        this.caseFileItemDefinitionEditor.loadDefinition(cfi.definitionRef);
        //get all objects using the dataNode = all objects using the case file item
        this.markedObjects = this.getReferences(cfi);
        this.changeMarking(true);
    }

    /**
     * Function invoked when row is deselected; should clean up the existing markings.
     */
    deselectRow(activeNode) {
        this.changeMarking(false);
    }

    editStart(newNode) {
        newNode.setActive();
        newNode.editStart();
    }

    /**
     * (un)mark the objects (elements or editors) currently marked
     * - bMark     : true marks the object, false unmarks
     */
    changeMarking(bMark) {
        if (!this.markedObjects) {
            return;
        }
        this.markedObjects.forEach(mObject => {
            //two types of objects possible: cmmn element, or an editor
            // Both must implement __mark() method
            mObject.__mark(bMark);
        });
    }

    /**
     * validates this
     */
    validate() {
        const allCaseFileItems = this.case.caseDefinition.getCaseFile().getDescendants();
        if (!allCaseFileItems || allCaseFileItems.length <= 0) {
            this.raiseEditorIssue(this.case, 38, [this.case.name]);
        }
        allCaseFileItems.forEach(item => {
            if (!item.name) {
                this.raiseEditorIssue(item, 1, ['Case File Item', this.case.name, item.multiplicity]);
            }
            if (!item.definitionRef) {
                this.raiseEditorIssue(item, 31, [item.name, this.case.name]);
            }
        });
    }

    /**
     * create the html element of a treeEditor form
     */
    renderHTML() {
        //create the main element add to document
        this.html = $(
`<div class="schemadatabox">
    <div id="divCaseFileItems">
        <div class="treeeditorform basicbox basicform">
            <div class="casefile-header formheader">
                <label>Case File Items</label>
            </div>
            <div id="treeeditorcontainerid">
                <button class="btnAddChild" type="addchild">Add Child</button>
                <button class="btnAddSibling" type="addsibling">Add Sibling</button>
                <button class="btnRemoveItem" type="remove">Remove</button>
                <div class="containerbox">
                    <table>
                        <colgroup>
                            <col width="420px"></col>
                            <col width="80px"></col>
                            <col width="80px"></col>
                            <col width="80px"></col>
                        </colgroup>
                        <thead>
                            <tr>
                                <th>Case File Item</th>
                                <th>Multiplicity</th>
                                <th>Definition</th>
                                <th>UsedIn</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
            <div class="treeeditorfooter">
                <span class="dialogButtons">
                    <button class="OkCancelButtons treeeditorokbt">OK</button>
                    <button class="OkCancelButtons treeeditorcancelbt">Cancel</button>
                </span>
                <div class="treeeditorfootereditrow">
                    <button class="treeeditoreditrowbt">Edit Row</button>
                    <span> or [F2], Drag To Properties</span>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="schemadatabox">
    <div class="divCaseFileDefinitions basicbox"></div>
</div>`);
        this.htmlParent.append(this.html);
    }
}