class HumanTaskModelDefinition extends ModelDefinition {
    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     * @param {Element} importNode 
     * @param {DefinitionDocument} definitionDocument 
     */
    constructor(importNode, definitionDocument) {
        super(importNode, definitionDocument);
        /** @type {HumanTaskImplementationDefinition} */
        this.implementation = this.parseElement(IMPLEMENTATION_TAG, HumanTaskImplementationDefinition);
    }

    get name() {
        return this.implementation.name;
    }

    set name(name) {
        if (this.implementation) this.implementation.name = name;
    }

    get description() {
        return this.implementation.description;
    }

    set description(description) {
        if (this.implementation) this.implementation.description = description;
    }

    get inputParameters() {
        return this.implementation.input;
    }

    get outputParameters() {
        return this.implementation.output;
    }

    get taskModel() {
        return this.implementation.taskModel;
    }

    toXML() {
        const xmlDocument = XML.loadXMLString('<humantask />'); // TODO: add proper namespace and so.
        this.exportNode = xmlDocument.documentElement;
        this.exportProperties('implementation');
        return xmlDocument;
    }
}
