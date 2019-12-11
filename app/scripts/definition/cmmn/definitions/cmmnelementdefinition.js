class CMMNElementDefinition extends XMLElementDefinition {
    /**
     * Creates a new, abstract CMMNElementDefinition object based on the given XML element 'importNode'.
     * Also parses 'id', 'name' and 'description' attributes, and adds the element to the case definition.
     * Note: importNode is supposed to be used [optional]. That is, it should be possible to create an element without
     * having an xml node as input to parse from. This means that constructors must be able to create elements
     * with sensible default settings.
     * ParentDefinition is mandatory (except for CaseDefinition); it is used to take the case definition from.
     * CaseDefinition and shape are optional parameters. CaseDefinition is taken from parentDefinition, and shape, if
     * not given, is looked up in the dimensions array of the casedefinition.
     * @param {Element} importNode 
     * @param {CaseDefinition} caseDefinition
     * @param {CMMNElementDefinition} parent optional
     */
    constructor(importNode, caseDefinition, parent = undefined) {
        super(importNode, caseDefinition, parent);
        this.caseDefinition = caseDefinition;
        this.id = this.parseAttribute('id');
        this.name = this.parseAttribute('name');
        this.description = this.parseAttribute('description');
    }

    /** @param {String} newId */
    set id(newId) {
        this.__id = newId;
    }

    get id() {
        return this.__id;
    }

    get name() {
        return this.__name || this.id;
    }

    /**
     * @param {String} name
     */
    set name(name) {
        const removeNewlinesAndTabs = str => {
            if (typeof (str) != 'string') return str;
            return str ? str.replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/\t/g, ' ') : str;
        };
        const cleanName = removeNewlinesAndTabs(name);

        if (name == this.id) {
            this.__name = undefined;
            return;
        }
        this.__name = cleanName;
        if (name != cleanName) {
            // Store the name with newlines and so inside the description
            this.description = name;
        } else if (name == this.__description) {
            // Do not store a description if it is the same as the name
            this.__description = undefined;
        }
    }

    get description() {
        return this.__description || this.name;
    }

    /**
     * @param {String} description
     */
    set description(description) {
        if (this.name == description) {
            this.__description = undefined;
        } else {
            this.__description = description;
        }
    }

    /**
     * Returns the default shape size of the element; Must be implemented in all subclasses
     * @returns {*} An object with w, h coordinates for width and height
     */
    defaultShapeSize() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * Returns the shape for this definition from the dimensions document.
     * If there is no shape for this definition, then a new shape will be generated with default size and position.
     * @returns {ShapeDefinition}
     */
    get shape() {
        if (!this._shape) {
            this._shape = this.caseDefinition.dimensions.getShape(this);
            if (!this._shape) {
                if (!this.__startPosition) {
                    console.error(`${this.constructor.name} does not have a start position set, but it is expected to have one. Check whether it is created through method createShapedDefinition`);
                    this.__startPosition = { x: 0, y: 0 };
                }
                const size = this.defaultShapeSize();
                const position = this.__startPosition;
                this._shape = ShapeDefinition.createShape(this, position.x, position.y, size.w, size.h);
            }
        }
        return this._shape;
    }

    createExportNode(parentNode, tagName, ...propertyNames) {
        super.createExportNode(parentNode, tagName, 'id', 'name', 'description', propertyNames);
    }

    toString() {
        const name = this.name ? ` '${this.name}'` : '';
        return `${this.constructor.name}${name}`;
    }
}
