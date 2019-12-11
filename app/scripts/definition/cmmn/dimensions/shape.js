class ShapeDefinition extends DiagramElement {
    /**
     * 
     * @param {CMMNElementDefinition} cmmnElement 
     * @param {Number} x 
     * @param {Number} y 
     * @param {Number} w 
     * @param {Number} h 
     * @returns {ShapeDefinition}
     */
    static createShape(cmmnElement, x, y, w, h) {
        const shape = new ShapeDefinition(undefined, cmmnElement.caseDefinition.dimensions);
        shape.cmmnElementRef = cmmnElement.id;
        shape.x = x;
        shape.y = y;
        shape.width = w;
        shape.height = h;
        cmmnElement.caseDefinition.dimensions.addShape(shape);
        return shape;
    }

    /**
     * Representation of a <CMMNShape> element
     * 
     * @param {Element} importNode 
     * @param {Dimensions} dimensions 
     */
    constructor(importNode, dimensions) {
        super(importNode, dimensions, dimensions);
        this.cmmnElementRef = this.parseAttribute(CMMNELEMENTREF);
        if (!this.cmmnElementRef) {
            this.dimensions.addParseWarning('Encountered a shape node in dimensions without a reference to a CMMN element');
        }
        this.bounds = this.parseElement(BOUNDS, Bounds);
        if (!this.bounds) {
            this.dimensions.addParseError('The Shape node for ' + this.cmmnElementRef + ' does not have a Bounds node; it cannot be used to draw element ' + this.cmmnElementRef);
        }
    }

    get cmmnElement() {
        return this.caseDefinition.getElement(this.cmmnElementRef);
    }

    get description() {
        return this.cmmnElement ? this.cmmnElement.description : '';
    }

    get name() {
        return this.cmmnElement ? this.cmmnElement.name : '';
    }

    /**
     * @returns {Bounds}
     */
    get bounds() {
        if (!this._bounds) {
            this._bounds = new Bounds(undefined, this.dimensions, this);
        }
        return this._bounds;
    }

    set bounds(bounds) {
        this._bounds = bounds;
    }

    /**
     * removeDefinition is an "override" implementation of CMMNElementDefinition.removeDefinition.
     * Within CMMNElement, the __delete() method invokes this.definition.removeDefinition(), which in fact removes the CMMNElementDefinition
     * from the CaseDefinition. However, for TextBox and CaseFileItem, this.definition refers to the custom shape, instead of to a CMMNElementDefinition.
     * Therefore we "override" this method here and update the internal registration.
     */
    removeShape() {
        // Remove the shape from the dimensions as well
        this.dimensions.removeShape(this);
    }

    createExportNode(diagramNode, tagName = CMMNSHAPE, ...propertyNames) {
        super.createExportNode(diagramNode, tagName, 'cmmnElementRef', 'bounds', propertyNames);
    }

    get hasError() {
        return this.bounds.hasError;
    }

    get errorText() {
        return this.bounds.errorText;
    }

    /**
     * Determines whether this shape surrounds the other shape
     * @param {ShapeDefinition} other 
     */
    surrounds(other) {
        return this != other && this.x <= other.x && this.y <= other.y && this.width + this.x >= other.width + other.x && this.height + this.y >= other.height + other.y;
    }

    get x() {
        return this.bounds.x;
    }

    set x(x) {
        this.bounds.x = x;
    }

    get y() {
        return this.bounds.y;
    }

    set y(y) {
        this.bounds.y = y;
    }

    get width() {
        return this.bounds.w;
    }

    set width(w) {
        this.bounds.w = w;
    }

    get height() {
        return this.bounds.h;
    }

    set height(h) {
        this.bounds.h = h;
    }

    toString() {
        return this.constructor.name + `[x=${this.x}, y=${this.y}, width=${this.width}, height=${this.height}`;
    }
}

class CustomShape extends ShapeDefinition {
    constructor(importNode, dimensions) {
        super(importNode, dimensions);
        this.parentId = this.parseAttribute('parentId');
        if (!this.parentId) { // compatibility
            this.parentId = this.parseAttribute('parentid');
        }
    }

    get shape() {
        return this;
    }

    get id() {
        // Hack to be able to lookup element when it has same definition
        return this.cmmnElementRef;
    }

    /**
     * removeDefinition is an "override" implementation of CMMNElementDefinition.removeDefinition.
     * Within CMMNElement, the __delete() method invokes this.definition.removeDefinition(), which in fact removes the CMMNElementDefinition
     * from the CaseDefinition. However, for TextBox and CaseFileItem, this.definition refers to the custom shape, instead of to a CMMNElementDefinition.
     * Therefore we "override" this method here to avoid null pointers.
     */
    removeDefinition() {}

    createExportNode(diagramNode, tagName, ...propertyNames) {
        super.createExportNode(diagramNode, tagName, 'parentId', propertyNames);
    }

    static generateIdentifier(caseDefinition) {
        const caseUID = caseDefinition.typeCounters.guid + '_shape_';
        const nextElement = caseDefinition.dimensions.shapes.length;
        return caseUID + nextElement;
    }

    generateDefaultContent(cmmnParent, x, y, w, h) {
        this.cmmnElementRef = CustomShape.generateIdentifier(cmmnParent.caseDefinition);
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.parentId = cmmnParent.id;
        this.dimensions.addShape(this); // Make sure to register it as a custom shape
        return this;
    }
}

class CaseFileItemShape extends CustomShape {
    constructor(importNode, dimensions) {
        super(importNode, dimensions);
        this.contextRef = this.parseAttribute('contextRef');
    }

    defaultShapeSize() {
        return {
            w: 25,
            h: 40
        };
    }

    get description() {
        const cfi = this.caseDefinition.getElement(this.contextRef);
        return cfi ? cfi.description : '';
    }

    /**
     * 
     * @param {CMMNElementDefinition} cmmnParent 
     * @param {Number} x 
     * @param {Number} y 
     */
    static create(cmmnParent, x, y) {
        return new CaseFileItemShape(undefined, cmmnParent.caseDefinition.dimensions).generateDefaultContent(cmmnParent, x, y, 25, 40);
    }

    createExportNode(diagramNode) {
        super.createExportNode(diagramNode, 'casefileitem', 'contextRef');
    }
}

class TextBoxShape extends CustomShape {
    /**
     * 
     * @param {CMMNElementDefinition} cmmnParent 
     * @param {Number} x 
     * @param {Number} y 
     */
    static create(cmmnParent, x, y) {
        return new TextBoxShape(undefined, cmmnParent.caseDefinition.dimensions).generateDefaultContent(cmmnParent, x, y, 100, 60, 'TextBox');
    }

    constructor(importNode, dimensions) {
        super(importNode, dimensions);
        this.content = this.parseAttribute('content', '');
    }

    get description() {
        // Override to have the contents rendered properly by default CMMNElement class.
        return this.content;
    }

    defaultShapeSize() {
        return {
            w: 100,
            h: 60
        };
    }

    createExportNode(diagramNode) {
        return super.createExportNode(diagramNode, 'textbox', 'content');
    }
}
