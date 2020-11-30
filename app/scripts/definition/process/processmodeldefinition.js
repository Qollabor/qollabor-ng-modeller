class ProcessModelDefinition extends ModelDefinition {
    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     * @param {Element} importNode 
     * @param {ModelDocument} definitionDocument 
     */
    constructor(importNode, definitionDocument) {
        super(importNode, definitionDocument);
        /** @type {Array<ImplementationParameterDefinition>} */
        this.input = this.parseElements('input', ImplementationParameterDefinition);
        /** @type {Array<ImplementationParameterDefinition>} */
        this.output = this.parseElements('output', ImplementationParameterDefinition);
        this.implementation = this.parseExtension(ProcessImplementationDefinition);
    }

    get inputParameters() {
        return this.input;
    }

    get outputParameters() {
        return this.output;
    }

    toXML() {
        const xmlDocument = XML.loadXMLString('<process />'); // TODO: add proper namespace and so.
        this.exportNode = xmlDocument.documentElement;
        this.exportProperties('id', 'name', 'description', 'input', 'output', 'implementation');
        this.exportNode.setAttribute('implementationType', 'http://www.omg.org/spec/CMMN/ProcessType/Unspecified');
        return xmlDocument;
    }
}
