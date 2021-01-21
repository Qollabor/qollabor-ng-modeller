'use strict';

const Consts = require('../constant.js');
const XML = require('../xml').XML;
const Definitions = require('./definitions').Definitions;
const Store = require('../store').Store;

class CaseDefinition {
    /**
     * 
     * @param {String} caseName 
     * @param {Definitions} definitionsDocument 
     * @param {Store} store 
     */
    constructor(caseName, definitionsDocument, store) {
        this.definitionsDocument = definitionsDocument;

        // First, load and parse the XML of the case file.
        const caseContent = store.load(caseName + Consts.CASE_EXT);
        this.caseElement = XML.loadXMLElement(caseContent);

        // CMMN Modeler stores a guid in the case definition for generating IDs for new elements added to the case;
        //  Here, we remove this guid.
        this.caseElement.removeAttribute('guid');

        // Now first register ourselves with the definitions document, in order to have the proper order with the loading of the referenced subcases
        //  and to avoid recursive loops
        this.identifier = this.caseElement.getAttribute('id');
        this.definitionsDocument.addCase(this);

        // Find out the process that this case refers to and add them to the definitions document
        const processRefs = this.findReferences('processTask', 'processRef');
        definitionsDocument.resolveProcessReferences(processRefs);

        // Add task references
        const humanTaskRefs = this.findReferences('cafienne:implementation', 'humanTaskRef');
        definitionsDocument.resolveHumanTaskReferences(humanTaskRefs);

        // Add case file definition references
        const caseFileDefinitionRefs = this.findReferences('caseFileItem', 'definitionRef');
        definitionsDocument.resolveCaseFileDefinitionReferences(caseFileDefinitionRefs);

        // Now load and parse the accompanying dimensions file with the CMMN DI format
        const dimensionsContent = store.load(caseName + Consts.CASE_DIMENSION_EXT);
        this.dimensionsTree = XML.loadXMLElement(dimensionsContent);

        // ... and finally add the sub cases
        const caseRefs = this.findReferences('caseTask', 'caseRef');
        definitionsDocument.resolveSubCaseReferences(caseRefs);
    }

    /* returns all external references in this case of a certain type
    - elementName   : search for elements with this name
    - referenceAttributeName  : name of xml attribute that holds the reference
    */
    findReferences(elementName, referenceAttributeName) {
        return XML.findElementsWithTag(this.caseElement, elementName).map(element => element.getAttribute(referenceAttributeName)).filter(string => string !== '');
    }

    appendDiagramInformation(diagramElement) {
        // Just read the shapes from the 'local' diagramElement and copy (or is it move?) them into the 'global' diagramElement
        const localCMMNDiagramElement = this.dimensionsTree.getElementsByTagName(Consts.CMMNDIAGRAM)[0];
        const shapeElements = localCMMNDiagramElement.childNodes;
        for (let i = 0; i < shapeElements.length; i++) {
            const shapeElement = shapeElements[i].cloneNode(true);
            diagramElement.appendChild(shapeElement);
        }
    }

    fillInHumanTaskExtensions() {
        XML.findElementsWithTag(this.caseElement, 'humanTask').forEach(task => this.fillInHumanTask(task));
    }

    fillInHumanTask(humanTaskElement) {
        const taskName = humanTaskElement.getAttribute('name');

        //get <cafienne:implementation> node inside the <humanTask> node
        const extensionElements = XML.findChildrenWithTag(humanTaskElement, 'extensionElements');
        if (extensionElements.length === 0) {
            console.log('Human task ' + taskName + ' does not have a custom implementation');
            return;
        }

        const extensionElement = extensionElements[0];
        const implementationNodes = XML.findChildrenWithTag(extensionElement, 'cafienne:implementation');
        if (implementationNodes.length === 0) {
            console.log('Human task ' + taskName + ' does not have a custom implementation');
            return;
        }

        const implementationNode = implementationNodes[0];
        const ref = implementationNode.getAttribute('humanTaskRef');
        if (ref === '') {
            console.log('Human task ' + taskName + ' does not have a reference to a custom implementation');
            return;
        }

        //get content from humantask model with name 'ref'
        const humanTaskDefinition = this.definitionsDocument.loadedHumanTasks.get(ref);
        if (humanTaskDefinition === undefined) {
            console.log('Cannot find the human task reference ' + ref);
            return;
        }

        //locate <cafienne:implementation> node in the humantask model (external file)
        const humanTaskImplementationNodes = humanTaskDefinition.getElementsByTagName('cafienne:implementation');
        if (humanTaskImplementationNodes.length == 0) {
            console.log('The human task ' + ref + ' does not contain a cafienne:implementation node');
            return;
        }

        // Now clone the task implementation, so that it can be re-used across multiple tasks
        const humanTaskImplementation = humanTaskImplementationNodes[0];
        const clonedHumanTaskImplementation = humanTaskImplementation.cloneNode(true);
        // Keep the reference for sake of reverse engineering a deployed model
        clonedHumanTaskImplementation.setAttribute('humanTaskRef', ref);

        const validatorRef = implementationNode.getAttribute('validatorRef');
        if (validatorRef) {
            clonedHumanTaskImplementation.setAttribute('validatorRef', validatorRef);
            this.definitionsDocument.resolveProcessReferences([validatorRef]);
        }
        
        // Now move the parameterMapping children from the case model into the human task
        //  Note: this should first clone the human task into the case model, otherwise we get
        //  all parameter mappings spread across all human tasks ...
        XML.findElementsWithTag(implementationNode, 'duedate').forEach(duedate => clonedHumanTaskImplementation.appendChild(duedate.cloneNode(true)));
        XML.findElementsWithTag(implementationNode, 'assignment').forEach(assignment => clonedHumanTaskImplementation.appendChild(assignment.cloneNode(true)));
        XML.findElementsWithTag(implementationNode, 'parameterMapping').forEach(mapping => clonedHumanTaskImplementation.appendChild(mapping.cloneNode(true)));

        // Now swap the elements in the case tree
        extensionElement.removeChild(implementationNode);
        extensionElement.appendChild(clonedHumanTaskImplementation);
    }
}

exports.CaseDefinition = CaseDefinition;
