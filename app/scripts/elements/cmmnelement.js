/**
 * This file contains basic functions that are available on every CMMNElement in the graph.
 */
class CMMNElement {
    /**
     * Creates a new CMMNElement within the case having the corresponding definition and x, y coordinates
     * @param {CMMNElement} parent
     * @param {CMMNElementDefinition|CustomShape} definition
     */
    constructor(parent, definition) {
        if (!parent || !definition) {
            throw new Error('Cannot create a CMMNElement without a parent and definition.');
        }

        this.parent = parent;
        this.definition = definition;
        /** @type{Case} */
        this.case = parent instanceof Case ? parent : parent.case;
        this.case.items.push(this);
        this.editor = this.case.editor;
        /** @type{Array<Connector>} */
        this.__connectors = []; // An array of the connectors this element has with other elements (both incoming and outgoing)
        /** @type{Array<CMMNElement>} */
        this.__childElements = []; // Create an array to keep track of our children, such that we can render them later on. 
        if (this.parent.__childElements) { // Register with parent.
            this.parent.__childElements.push(this);
        }
        this.createJointElement();
        this.__resizable = true;
        // Area distance is the bandwith around the visual element that is catched by the mouse-move to show/hide the halo element.
        this.areaDistance = 5;
    }

    get id() {
        return this.definition.id;
    }

    get name() {
        return this.definition.name;
    }

    get shape() {
        return this.definition.shape;
    }

    /**
     * Override this method to provide type specific Properties object
     * @returns {Properties}
     */
    createProperties() {
        throw new Error('Class ' + this.constructor.name + ' must implement the createProperties method');
    }

    /**
     * Returns the raw html/svg element.
     * @returns {JQuery<HTMLElement>}
     */
    get html() {
        // Element's ID might contain dots, slashes, etc. Escape them with a backslash
        // Source taken from https://stackoverflow.com/questions/2786538/need-to-escape-a-special-character-in-a-jquery-selector-string
        // Could also use jquery.escapeSelector, but this method is only from jquery 3 onwards, which is not in this jointjs (?)
        const jquerySelector = '#' + this.id.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "\\$&")
        return this.case.svg.find(jquerySelector);
    }

    /**
     * Returns the svg markup to be rendered by joint-js.
     * @returns {String}
     */
    get markup() {
        throw new Error('Class ' + this.constructor.name + ' must implement the markup method');
    }

    /** @returns {Object} */
    get textAttributes() {
        return {};
    }

    createJointElement() {
        const jointSVGSetup = {
            // Markup is the SVG that is rendered through the joint element; we surround the markup with an addition <g> element that holds the element id
            markup: `<g id="${this.id}">${this.markup}</g>`,
            // Type is used to determine whether drag/drop is supported (element border coloring)
            type: this.constructor.name,
            // Take size and position from shape.
            size: this.shape,
            position: this.shape,
            // Attrs can contain additional relative styling for the text label inside the element
            attrs: this.textAttributes
        };
        this.xyz_joint = new joint.shapes.basic.Generic(jointSVGSetup);
        this.xyz_joint.xyz_cmmn = this; // Set the cmmn element pointer on the joint element for compatibilty
        // Directly embed into parent
        if (this.parent && this.parent.xyz_joint) {
            this.parent.xyz_joint.embed(this.xyz_joint);
        }
        this.xyz_joint.on('change:position', e => {
            this.shape.x = this.xyz_joint.attributes.position.x;
            this.shape.y = this.xyz_joint.attributes.position.y;
        });
        // We are not listening to change of size, since this is only done through "our own" resizer
    }

    /**
     * Determines whether the cursor is near the element, i.e., within a certain range of 5px around this element.
     * Used to show/hide the halo of the element.
     * @param {*} e 
     */
    nearElement(e) {
        const offset = this.html.offset();
        const nearLeft = offset.left - this.areaDistance;
        const nearTop = offset.top - this.areaDistance;
        const nearRight = nearLeft + this.shape.width + this.areaDistance * 2; // More room on the right for the halo width
        const nearBottom = nearTop + this.shape.height + this.areaDistance * 2; // Little more room at the bottom for sentry's halo

        if (e.clientX >= nearLeft && e.clientX <= nearRight) {
            if (e.clientY >= nearTop && e.clientY <= nearBottom) {
                return true;
            }
        }
        return false;
    }

    /**
     * Determines whether the cursor is near the border of the element.
     * Used to show/hide the resizer of the element.
     * @param {*} e 
     */
    nearElementBorder(e) {
        const borderDistanceOutside = 3;
        const borderDistanceInside = 20;

        const x = e.clientX;
        const y = e.clientY;

        const offset = this.html.offset();
        const left = offset.left;
        const right = offset.left + this.shape.width;
        const top = offset.top;
        const bottom = offset.top + this.shape.height;

        const near = (a, b) => a >= (b - borderDistanceInside) && a <= (b + borderDistanceOutside);
        return near(left, x) || near(x, right) || near(top, y) || near(y, bottom);
    }

    /**
     * Method invoked when mouse hovers on the element
     */
    setDropHandlers() {
        this.case.shapeBox.setDropHandler((dragData, e) => this.addShape(dragData.shapeType, e), shapeType => this.__canHaveAsChild(shapeType));
    }

    /**
     * Method invoked when mouse leaves the element.
     */
    removeDropHandlers() {
        this.case.shapeBox.removeDropHandler();
    }

    /**
     * Adds a new shape in this element with the specified shape type.
     * @param {String} shapeType
     * @param {*} e
     */
    addShape(shapeType, e) {
        const coor = this.case.getCursorCoordinates(e);
        const cmmnType = CMMNElement.constructors[shapeType];
        const cmmnElement = this.createCMMNChild(cmmnType, Grid.snap(coor.x), Grid.snap(coor.y));
        // Now select the newly added element
        this.case.clearSelection();
        // Show properties of new element
        cmmnElement.propertiesView.show(true);
        return cmmnElement;
    }

    /**
     * Creates a cmmn child under this element with the specified type, and renders it at the given position.
     * @param {Function} cmmnType 
     * @param {Number} x 
     * @param {Number} y 
     * @returns {CMMNElement} the newly created CMMN child
     */
    createCMMNChild(cmmnType, x, y) {
        throw new Error('Cannot create an element of type' + cmmnType.name);
    }

    /**
     * Informs the element to render again after a change to the underlying definition has happened.
     */
    refreshView() {
        if (this.case.loading) {
            // No refreshing when still loading.
            //  This method is being invoked from Connector's constructor when case is being loaded
            // NOTE: overrides of this method should actually also check the same flag (not all of them do...)
            return;
        }
        this.refreshDescription();
        if (this._halo && this._halo.visible) {
            this._halo.refresh();
        }
        if (this.__properties && this.__properties.visible) {
            this.__properties.refresh();
        }
        this.__childElements.forEach(child => child.refreshView());
    }

    /**
     * Invoked from the refreshView. Assumes there is a text element inside the joint element holding the description.
     */
    refreshDescription() {
        this.xyz_joint.attr('text/text', this.definition.description);
    }

    /**
     * Returns the "nice" type description of this CMMN Element.
     * Sub classes must implement this, otherwise an error is thrown.
     * @returns {String}
     */
    get typeDescription() {
        if (!this.constructor.typeDescription) {
            throw new Error(`The type ${this.constructor.name} does not have an typeDescription function ?!`);
        }
        return this.constructor.typeDescription;
    }

    /**
     * BELOW METHODS ARE FOR COMPATIBILITY ONLY.
     * It would be better to change all invocations to access the xyz_joint directly.
     */

    get attributes() {
        return this.xyz_joint.attributes;
    }

    /**
     * Returns the joint constructor for this element. I.e., the function with which the joint element can be created.
     * @returns {Function}
     */
    getJointConstructor() {
        throw new Error('This class does not have a joint constructor?!')
    }

    /**
     * BELOW METHODS ARE 'REAL' CMMNElement methods
     */

    /**
     * Method invoked after a role or case file item has changed
     * @param {CMMNElementDefinition} definitionElement 
     */
    refreshReferencingFields(definitionElement) {
        this.propertiesView.refreshReferencingFields(definitionElement);
    }

    /**
     * @returns {Properties}
     */
    get propertiesView() {
        if (!this.__properties) {
            this.__properties = this.createProperties(); // Create an object to hold the element properties.
        }
        return this.__properties;
    }

    get resizer() {
        if (!this._resizer) {
            this._resizer = new Resizer(this);
        }
        return this._resizer;
    }

    createHalo() {
        return new Halo(this);
    }

    get halo() {
        if (!this._halo) {
            // Creating the halo and it's content in 2 phases to give flexibility.
            this._halo = this.createHalo();
            this._halo.createItems();
        }
        return this._halo;
    }

    /**
     * Invoked when an element is (de)selected.
     * Shows/removes a border, halo, resizer.
     * @param {Boolean} selected 
     */
    __select(selected) {
        if (selected) {
            //do not select element twice
            this.html.find('.cmmn-shape').addClass('cmmn-selected-element');
            this.resizer.visible = true;
            this.halo.visible = true;
        } else {
            // Give ourselves default color again.
            this.html.find('.cmmn-shape').removeClass('cmmn-selected-element');
            this.propertiesView.hide();
            this.resizer.visible = false;
            this.halo.visible = false;
        }
    }

    /**
     * Resizes the element, move sentries and decorators
     * @param {Number} w
     * @param {Number} h
     */
    __resize(w, h) {
        if (w < 0) w = 0;
        if (h < 0) h = 0;

        this.shape.width = w;
        this.shape.height = h;
        // Also have joint resize
        this.xyz_joint.resize(w, h);
    }

    /**
     * Adds an element to another element, implements element.__addElement
     * @param {CMMNElement} cmmnChildElement
     */
    __addCMMNChild(cmmnChildElement) {
        return this.case.__addElement(cmmnChildElement);
    }

    /**
     * When a item is moved from one stage to another, this method is invoked
     * @param {CMMNElement} newParent 
     */
    changeParent(newParent) {
        const currentParent = this.parent;
        currentParent.releaseItem(this);
        newParent.adoptItem(this);
    }

    /**
     * Adds the item to our list of children, and embeds it in the joint structure of this element.
     * It is an existing item in the case.
     * @param {CMMNElement} childElement 
     */
    adoptItem(childElement) {
        childElement.parent = this;
        this.__childElements.push(childElement);
        this.xyz_joint.embed(childElement.xyz_joint);
        // Also move the child's joint element toFront, to make sure it gets mouse attention before the parent.
        //  "deep" option also brings all descendents to front, maintaining order
        childElement.xyz_joint.toFront({
            deep: true
        });
    }

    /**
     * Removes the imte from our list of children, and also unembeds it from the joint structure.
     * Does not delete the item.
     * @param {CMMNElement} childElement 
     */
    releaseItem(childElement) {
        this.xyz_joint.unembed(childElement.xyz_joint);
        Util.removeFromArray(this.__childElements, childElement);
    }

    /**
     * Method invoked on all case elements upon removal of an element.
     * If there are references to the element to be removed, it can be handled here.
     * @param {CMMNElement} cmmnElement 
     */
    __removeReferences(cmmnElement) {
        if (cmmnElement.parent == this) {
            // Perhaps also render the parent again?? Since this element about to be deleted ...
            Util.removeFromArray(this.__childElements, cmmnElement);
        }
    }

    /**
     * delete and element and its' children if available
     */
    __delete() {
        // Deselect ourselves if we are selected, to avoid invocation of __select(false) after we have been removed.
        if (this.case.selectedElement == this) {
            this.case.selectedElement = undefined;
        }

        // First, delete our children.
        while (this.__childElements.length > 0) {
            this.__childElements[0].__delete();
        }

        // Remove resizr, halo and propertiesview; but only if they have been created
        if (this._resizer) this.resizer.delete();
        if (this._halo) this.halo.delete();
        if (this.__properties) this.propertiesView.delete();

        this.__connectors.forEach(connector => connector.remove());

        // Next, inform other elements we're gonna go
        this.case.items.forEach(cmmnElement => cmmnElement.__removeReferences(this));

        // Remove the shape from the definitions
        this.shape.removeShape();

        // Also let the definition side of the house know we're leaving
        console.groupCollapsed("Removing definition for " + this);
        this.definition.removeDefinition();
        console.groupEnd();

        // Delete us from the case
        Util.removeFromArray(this.case.items, this);

        // Finally remove the UI element as well. 
        this.xyz_joint.remove();
    }

    /**
     * creates a connector between the element and the target.
     * @param {CMMNElement} target
     * @returns {Connector}
     */
    __connect(target) {
        const connector = Connector.createConnector(this, target);
        this.case.editor.completeUserAction();
        return connector;
    }

    /**
     * Registers a connector with this element.
     * @param {Connector} connector 
     */
    __addConnector(connector) {
        this.__connectors.push(connector);
    }

    /**
     * This method is invoked on the element if it created a connection to the target CMMNElement
     * @param {CMMNElement} target 
     */
    __connectedTo(target) {}

    /**
     * This method is invoked on the element if a connection to it was made from the source CMMNElement
     * @param {CMMNElement} source 
     */
    __connectedFrom(source) {}

    /**
     * Removes a connector from the registration in this element.
     * @param {Connector} connector 
     */
    __removeConnector(connector) {
        Util.removeFromArray(this.__connectors, connector);
    }

    /**
     * returns an array of elements that are connected (through a link/connector) with this element
     * @returns {Array<CMMNElement>}
     */
    __getConnectedElements() {
        const connectedCMMNElements = [];
        this.__connectors.forEach(connector => {
            if (!connectedCMMNElements.find(cmmnElement => connector.source == cmmnElement || connector.target == cmmnElement)) {
                connectedCMMNElements.push(connector.source == this ? connector.target : connector.source);
            }
        });
        return connectedCMMNElements;
    }

    /**
     * Returns the connector between this and the target element with the specified id,
     * or null
     * @param {String} targetId 
     * @returns {Connector}
     */
    __getConnector(targetId) {
        return this.__connectors.find(c => c.hasElementWithId(targetId));
    }

    /**
     * returns true if this element can contain elements of type 'elementType'.
     * By default it returns false
     * @param {*} elementType 
     * @returns {Boolean}
     */
    __canHaveAsChild(elementType) {
        return false;
    }

    /**
     * validate: all steps to check this element
     */
    __validate() {}

    /**
     * Raises a validation error/warning with the Case
     * @param {Number} number 
     * @param {Array<String>} parameters 
     */
    raiseValidationIssue(number, parameters = []) {
        if (parameters.length == 0) { // Default parameters are element name and case name
            parameters.push(this.name);
            parameters.push(this.case.name);
        }
        this.case.validator.raiseProblem(this.id, number, parameters);
    }

    /**
     * returns an array with all the joint (!) descendants of the element
     * @returns {Array<CMMNElement>}
     */
    __getDescendants() {
        const allDescendants = [];
        this.__childElements.forEach(cmmnChild => this.addDescendantChild(cmmnChild, allDescendants));
        return allDescendants;
    }


    /**
     * Adds the cmmnElement and all its descendants to the array
     * @param {CMMNElement} cmmnElement 
     * @param {Array} allDescendents 
     */
    addDescendantChild(cmmnElement, allDescendents) {
        allDescendents.push(cmmnElement);
        cmmnElement.__childElements.forEach(grantChild => this.addDescendantChild(grantChild, allDescendents));
    }

    /**
     * Returns true when this element references the definitionId (typically a casefile item or a role)
     * @param {String} definitionId 
     */
    referencesDefinitionElement(definitionId) {
        return false;
    }

    /**
     * Mark an element with an image
     * bMark   : true marks the element (default), false removes mark
     */
    __mark(bMark) {
        if (bMark != false) { //-> true is default
            //mark element
            //get relative coordinate element in paper

            const markImage = $('<div class="markelementimage"></div>');

            this.__markImage = markImage.appendTo(this.case.paperContainer);
            this.__markImage.css('left', this.shape.x - markImage[0].clientWidth / 2);
            this.__markImage.css('top', this.shape.y - markImage[0].clientHeight / 2);
        } else {
            if (this.__markImage) {
                this.__markImage.remove();
            }
        }
    }

    get __type() {
        return `${this.constructor.name}[${this.id}]`;
    }

    toString() {
        return this.__type;
    }

    /**
     * Method invoked on an element to enforce move constraints (e.g. sentries cannot be placed in the midst of an element)
     * @param {Number} x 
     * @param {Number} y 
     */
    __moveConstraint(x, y) {}

    /**
     * Registers a class that extends CMMNElement by it's name.
     * @param {Function} cmmnElementType 
     * @param {String} typeDescription Friendly description of the type
     * @param {String} smallImageURL url of small image (for drag/drop, shapebox, etc.)
     * @param {String} menuImageURL optional url of image shown in repository browser
     */
    static registerType(cmmnElementType, typeDescription, smallImageURL = '', menuImageURL = smallImageURL) {
        CMMNElement.constructors[cmmnElementType.name] = cmmnElementType;
        cmmnElementType.typeDescription = typeDescription;
        cmmnElementType.smallImage = smallImageURL;
        cmmnElementType.menuImage = menuImageURL;
    }
}
CMMNElement.constructors = {};
