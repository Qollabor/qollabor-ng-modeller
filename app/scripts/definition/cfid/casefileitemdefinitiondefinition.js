const UNSPECIFIED = 'Unspecified';
const UNSPECIFIED_URI = 'http://www.omg.org/spec/CMMN/DefinitionType/Unspecified';

const XMLELEMENT = 'XMLElement';
const XMLELEMENT_URI = 'http://www.omg.org/spec/CMMN/DefinitionType/XSDElement';

const UNKNOWN = 'Unknown';
const UNKNOWN_URI = 'http://www.omg.org/spec/CMMN/DefinitionType/Unknown';

class CaseFileDefinitionDefinition extends ModelDefinition {
    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     * @param {Element} importNode 
     * @param {ModelDocument} definitionDocument 
     */
    constructor(importNode, definitionDocument) {
        super(importNode, definitionDocument);
        this.id = this.parseAttribute('id');
        this.name = this.parseAttribute('name');
        this.description = this.parseAttribute('description');
        this.definitionType = this.parseAttribute('definitionType', UNSPECIFIED_URI);
        this.importRef = this.parseAttribute('import', '');
        this.structureRef = this.parseAttribute('structure', '');
        this.properties = this.parseElements('property', PropertyDefinition)
        switch (this.definitionType) {
            case XMLELEMENT_URI: {
            }
            case UNKNOWN_URI: {
                // Nothing to be done
            }
            case UNSPECIFIED_URI: {
            }
        }
    }
    
    get editor() {
        return;
    }

    get inputParameters() {
        console.warn('Case file has no input/output contract');
        return [];
    }

    get outputParameters() {
        console.warn('Case file has no input/output contract');
        return [];
    }

    toXML() {
        const xmlDocument = XML.loadXMLString('<caseFileItemDefinition />'); // TODO: add proper namespace and so.
        this.exportNode = xmlDocument.documentElement;
        if (this.definitionType == XMLELEMENT_URI) {
            this.exportProperties('id', 'name', 'definitionType', 'structureRef', 'importRef');
        } else if (this.definitionType == UNKNOWN_URI) {
            this.exportProperties('id', 'name', 'definitionType');
        } else if (this.definitionType == UNSPECIFIED_URI) {
            this.exportProperties('id', 'name', 'definitionType', 'properties');
        }
        return xmlDocument;
    }
}