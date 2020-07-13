class ReferableElementDefinition extends XMLElementDefinition {
    /**
     * Creates an XML element that can be referred to by the value of the name or id attribute of the underlying XML element.
     * 
     * @param {Element} importNode 
     * @param {ModelDefinition} modelDefinition 
     * @param {XMLElementDefinition} parent 
     */
    constructor(importNode, modelDefinition, parent) {
        super(importNode, modelDefinition, parent);
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
        return this.__name;
    }

    set name(name) {
        this.__name = name;
    }

    get description() {
        return this.__description;
    }

    set description(description) {
        this.__description = description;
    }

    /**
     * Returns true if name or id property equals the identifier
     * @param {String} identifier 
     * @returns {Boolean}
     */
    hasIdentifier(identifier) {
        return this.id === identifier || this.name === identifier;
    }

    createExportNode(parentNode, tagName, ...propertyNames) {
        super.createExportNode(parentNode, tagName, 'id', 'name', 'description', propertyNames);
    }
}
