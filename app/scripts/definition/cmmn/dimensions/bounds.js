class Bounds extends DiagramElement {
    /**
     * Indicates the bounds (x, y, width, height) of a shape.
     */
    constructor(importNode, dimensions, parent) {
        super(importNode, dimensions, parent);
        this.hasError = false;
        this.x = this.parseIntAttribute('x', 0, 'coordinate');
        this.y = this.parseIntAttribute('y', 0, 'coordinate');
        this.width = this.parseIntAttribute('width', 0, 'attribute');
        this.height = this.parseIntAttribute('height', 0, 'attribute');
    }

    /**
     * Parses the attribute with the specified name from the node, and sets it in the bounds object.
     * @param {String} name 
     * @param {Number} minValue 
     * @param {String} errorMsg 
     * @param {String} cmmnElementRef 
     */
    parseIntAttribute(name, minValue, errorMsg) {
        const attributeValue = this.parseNumberAttribute(name);
        if (attributeValue) {
            return attributeValue;
        } else {
            this.error = 'The ' + name + ' ' + errorMsg + ' could not be found in the <Bounds> element of <CMMNShape cmmnElementRef="' + this.parent.cmmnElementRef + '"/>;'
        }
    }

    get w() {
        return this.width;
    }

    set w(newW) {
        this.width = newW;
    }

    get h() {
        return this.height;
    }

    set h(newH) {
        this.height = newH;
    }

    set error(msg) {
        this.errorText = msg;
        this.hasError = true;
    }

    createExportNode(diagramNode) {
        super.createExportNode(diagramNode, BOUNDS, 'x', 'y', 'width', 'height');
    }
}
