/**
 * A ModelDefinition is the base class of a model, such as CaseDefinition, ProcessDefinition, HumanTaskDefinition, CaseFileDefinitionDefinition 
 */
class ModelDefinition extends XMLElementDefinition {
    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     * @param {Element} importNode 
     * @param {DefinitionParser} definitionDocument 
     */
    constructor(importNode, definitionDocument) {
        super(importNode, undefined);
        this.definitionDocument = definitionDocument;
        this.typeCounters = new TypeCounter(this);
        /** @type {Array<XMLElementDefinition>} */
        this.elements = [];
        this.elements.push(this);

        this.id = this.parseAttribute('id');
        this.name = this.parseAttribute('name');
        this.description = this.parseAttribute('description');
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
     * A ModelDefinition must have input parameters.
     * @returns {Array<ImplementationParameterDefinition>}
     */
    get inputParameters() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * A ModelDefinition must have output parameters.
     * @returns {Array<ImplementationParameterDefinition>}
     */
    get outputParameters() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * Informs all elements in the case definition about the removal of the element
     * @param {XMLElementDefinition} removedElement 
     */
    removeDefinitionElement(removedElement) {
        // Go through other elements and tell them to say goodbye to removedElement;
        //  we do this in reverse order, to have removal from CaseDefinition as last.
        this.elements.slice().reverse().filter(e => e != removedElement).forEach(element => element.removeDefinitionReference(removedElement));
    }

    /**
     * Returns the element that has the specified identifier, or undefined.
     * If the constructor argument is specified, the element is checked against the constructor with 'instanceof'
     * @param {String} id 
     * @param {Function} constructor
     * @returns {XMLElementDefinition}
     */
    getElement(id, constructor = undefined) {
        const element = this.elements.find(element => id && element.id == id); // Filter first checks whether id is undefined;
        if (constructor && element) {
            if (element instanceof constructor) {
                return element;
            } else {
                console.warn('Found the element with id ' + id + ', but it is not of type ' + constructor.name + ' but ', element.constructor.name)
                return undefined;
            }
        } else {
            return element;
        }
    }

    getNextIdOfType(constructor) {
        return this.typeCounters.getNextIdOfType(constructor);
    }

    getNextNameOfType(constructor) {
        return this.typeCounters.getNextNameOfType(constructor);
    }

    /**
     * In CMMN some of the references are string based, and sometimes there are multiple references within the same
     * string, limited by space. This function analyzes such a string, and adds all references that could be found into the array.
     * If constructor is specified, the found elements must match (element instanceof constructor).
     * @param {String} idString 
     * @param {Array} collection 
     * @param {*} constructor
     */
    findElements(idString, collection, constructor) {
        idString = idString || '';
        idString.split(' ').forEach(reference => {
            const element = reference && this.getElement(reference, constructor);
            element && collection.push(element);
        });
        return collection;
    }

    toXML() {
        // First have all elements flatten their references. Actually would be better to not keep track of references by pointer in Definitions layer.
        this.elements.forEach(element => element.flattenReferences());

        // const xmlDocument = XML.loadXMLString('<case />'); // TODO: add proper namespace and so.
        // this.exportNode = xmlDocument.documentElement;
        // this.exportProperties('id', 'name', 'description', 'caseFile', 'casePlan', 'caseRoles', 'input', 'output');
        // // Now dump start case schema if there is one. Should we also do ampersand replacements??? Not sure. Perhaps that belongs in business logic??
        // // const startCaseSchemaValue = this.case.startCaseEditor.value.replace(/&/g, '&amp;');
        // if (this.startCaseSchema && this.startCaseSchema.trim()) {
        //     this.exportExtensionElement('cafienne:start-case-model').textContent = this.startCaseSchema;
        // }

        // // Also export the guid that is used to generate new elements in the case. This must be removed upon deployment.
        // this.exportNode.setAttribute('guid', this.typeCounters.guid);
        // return xmlDocument;
    }
}
