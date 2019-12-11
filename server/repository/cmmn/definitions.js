'use strict';

const CaseDefinition = require('./case').CaseDefinition;
const Consts = require('../constant.js');
const Store = require('../store').Store;
const XML = require('../xml').XML;

/**
 * Helper class to assemble a definitions XML for a case with it's dependencies
 */
class Definitions {
    /**
     * 
     * @param {String} rootCaseFileName 
     * @param {Store} store 
     */
    constructor(rootCaseFileName, store) {
        this.rootCaseName = rootCaseFileName.substring(0, rootCaseFileName.length - 5);
        this.store = store;

        // Storage of errors that are encountered while creating the definitions document;
        //  typically these are missing files that are referenced
        this.errors = [];

        // Cache of definitions
        /** @type {Map<String, CaseDefinition>} */
        this.loadedCases = new Map();
        this.loadedProcesses = new Map();
        this.loadedHumanTasks = new Map();
        this.loadedCaseFileDefinitions = new Map();

        // XML element that will hold the final XML
        this.definitionsElement = XML.loadXMLElement('<definitions />');

        // Creating the new CaseDefinition will validate and load all references
        this.rootCase = new CaseDefinition(this.rootCaseName, this, this.store);
    }

    /**
     * @returns {String} The filename into which this case definition with all it's contents is stored.
     */
    get deployFileName() {
        return this.rootCaseName + Consts.CASE_DEFINITION_EXT;
    }

    /**
     * Adds a case to the list of loaded cases (by it's identifier)
     * @param {*} caseDefinition
     */
    addCase(caseDefinition) {
        this.loadedCases.set(caseDefinition.identifier, caseDefinition);
    }

    /**
     * Loads the process refs that have not been loaded yet, and adds them to this definitions object
     */
    resolveProcessReferences(processRefs) {
        this._loadArtifactByIds(processRefs, this.loadedProcesses);
    }

    /**
     * Loads the process refs that have not been loaded yet, and adds them to this definitions object
     */
    resolveHumanTaskReferences(humanTaskRefs) {
        this._loadArtifactByIds(humanTaskRefs, this.loadedHumanTasks);
    }

    /**
     * Loads the process refs that have not been loaded yet, and adds them to this definitions object
     */
    resolveCaseFileDefinitionReferences(caseFileDefinitionRefs) {
        this._loadArtifactByIds(caseFileDefinitionRefs, this.loadedCaseFileDefinitions);
    }

    /**
     * Fills the Map cachedDef with filenames and their content
     * @param {String[]} refs an array with filenames of models from repository (e.g. processes refered to from processTasks)
     * @param {Map<String, Element>} cachedDefinitions Map object, a list of entries, each entry
     *   - [0] filename (ref)
     *   - [1] xml node with content of filename (element)
     */
    _loadArtifactByIds(refs, cachedDefinitions) {
        for (const ref of refs) {
            if (ref === undefined || cachedDefinitions.has(ref)) {
                // Ignore empty elements (e.g. a HumanTask need not per se have a reference)
                continue;
            }
            // Now try and load the reference; if not found, report an error
            try {
                const artifactContent = this.store.load(ref);
                const element = XML.loadXMLElement(artifactContent);
                cachedDefinitions.set(ref, element);
            } catch (err) {
                console.log('Could not load reference ' + ref);
                this.errors.push('Could not load reference ' + ref);
            }
        }
    }

    /**
     * Resolves the array of string references to sub cases; loads them if not yet done.
     * @param {*} caseRefs
     */
    resolveSubCaseReferences(caseRefs) {
        for (const caseId of caseRefs) {
            if (caseId === undefined) {
                // Ignore empty elements; they will fail in the server validation
                continue;
            }
            if (!this.loadedCases.has(caseId)) {

                const index = caseId.indexOf(Consts.CASE_EXT); // Cut it short at the first .case occurrence
                const filename = caseId.substring(0, index);

                new CaseDefinition(filename, this, this.store);
            }
        }
    }

    hasErrors() {
        return this.errors.length > 0;
    }

    getErrors() {
        return this.errors;
    }

    /**
     * Returns the contents of the file that can be deployed
     * @returns {String}
     */
    get deployContents() {
        if (this.hasErrors()) {
            throw this.errors;
        }
        this._appendCaseDefinitions();
        this._appendProcesses();
        this._appendCaseFileDefinitions();
        this._appendCMMNDI();
        return XML.printNiceXML(this.definitionsElement);
    }

    _appendCaseDefinitions() {
        for (const caseDefinition of this.loadedCases.values()) {
            // First make sure to load all the human task ref extensions
            caseDefinition.fillInHumanTaskExtensions();
            this.definitionsElement.appendChild(caseDefinition.caseElement);
        }
    }

    /*
    The <processTask> can have an processRef attribute, which refers to a process file.
    The <process> node in this file must be added to the <case> node in the CMMN definition
    */
    _appendProcesses() {
        for (const processEntry of this.loadedProcesses.entries()) {
            /*
            processEntry[0] has processRef(=process file name)
            processEntry[1] has the <process> node from the process file
            Set the process file name as the 'id' of the <process> node
            */
           processEntry[1].setAttribute('id', processEntry[0]);
           this.definitionsElement.appendChild(processEntry[1]);
        }
    }

    _appendCaseFileDefinitions() {
        for (const cfidEntry of this.loadedCaseFileDefinitions.entries()) {
            /*
            cfidEntry[0] has definitionRef(=case file definition file name)
            cfidEntry[1] has the <caseFileDefinition> node from the case file definition file
            Set the file name as the 'id' of the <process> node
            */
            cfidEntry[1].setAttribute('id',cfidEntry[0]);
            this.definitionsElement.appendChild(cfidEntry[1]);
        }
    }

    _appendCMMNDI() {
        const cmmnDiElement = this.definitionsElement.ownerDocument.createElement(Consts.CMMNDI);
        const diagram = this.definitionsElement.ownerDocument.createElement(Consts.CMMNDIAGRAM);
        cmmnDiElement.appendChild(diagram);
        for (let caseData of this.loadedCases.values()) {
              caseData.appendDiagramInformation(diagram);
        }
        this.definitionsElement.appendChild(cmmnDiElement);
    }
}

exports.Definitions = Definitions;
