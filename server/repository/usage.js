'use strict';

const Loki = require('lokijs');
const XML = require('./xml').XML;
const Store = require('./store').Store;
const ModelInfo = require('./store').ModelInfo;

/**
 * This class keeps track of artifacts usage.
 */
class Usage {
    /**
     * 
     * @param {Store} store 
     */
    constructor(store) {
        this.store = store;
        this.artifacts = new Map(); // artifacts are just stored in an simple object; no needs for loki
        const db = new Loki('ide_artifacts');
        this.whereUsedData = db.addCollection('where_used', { indices: ['fileName', 'artifactId', 'referencedArtifactId'] });
    }

    /**
     * Create analysis information for all models in the list. Parses them as XML, searches for referencing attributes.
     * @param {Array<ModelInfo>} models 
     */
    analyze(models) {
        models.forEach(artifact => {
            const xml = artifact.load();
            if (xml) {
                const id = xml.getAttribute('id') || artifact.fileName;
                const name = xml.getAttribute('name') || '';
                const description = xml.getAttribute('description') || '';
                const referencedArtifacts = this._extractReferencedArtifacts(xml)
                const metadata = { id, name, description, referencedArtifacts };
                this._addWhereUsedDataForFile(artifact.fileName, metadata);
            }
        });
    }

    /**
     * Extend the model information with the usage information
     * @param {Array<ModelInfo>} models 
     */
    addUsageInformation(models) {
        models.forEach(model => model.usage = this.getUsage(model.fileName));
    }

    /**
     * This method returns in which artifact <code>artifactId</code> is used.
     *
     * @param artifactId the artifactId
     */
    getUsage(artifactId) {
        return this.whereUsedData.find({ referencedArtifactId: { '$eq': artifactId } }).map(result => {
            const artifact = this.artifacts.get(result.artifactId);
            const id = result.artifactId;
            const description = artifact ? artifact.description : '';
            const name = artifact ? artifact.name : '';
            return { id, name, description };
        });
    }

    _addWhereUsedDataForFile(fileName, artifact) {
        this.artifacts.set(artifact.id, {
            id: artifact.id,
            name: artifact.name,
            description: artifact.description,
            extension: ''
        });
        if (artifact.referencedArtifacts !== undefined) {
            const nofArtifacts = artifact.referencedArtifacts.length;
            for (let i = 0; i < nofArtifacts; i++) {
                const referencedArtifact = artifact.referencedArtifacts[i];
                this.whereUsedData.insert({
                    fileName: fileName,
                    artifactId: artifact.id,
                    referencedArtifactId: referencedArtifact.id
                });
            }
        }
    }

    _extractReferencedArtifacts(caseTree) {
        /**
         * Private function searching for all elements with given tagname having a value for the specified attribute name. Returns an array with those found values.
         * @param {Element|Document} caseTree 
         * @param {String} tagName 
         * @param {String} attributeName 
         */
        const getReferences = (caseTree, tagName, attributeName) =>
            XML.findElementsWithTag(caseTree, tagName) // Search for elements with the tagname
                .map(element => element.getAttribute(attributeName)) // returns an array with the attribute values for the elements
                .filter(string => string !== undefined) // only take attributes with a value
                .map(id => Object.assign({ id })) // and return a new object with {'id': [attr-value]}

        const refs = getReferences(caseTree, 'caseTask', 'caseRef');
        refs.push(...getReferences(caseTree, 'processTask', 'processRef'))
        refs.push(...getReferences(caseTree, 'caseFileItem', 'definitionRef'));
        refs.push(...getReferences(caseTree, 'qollabor:implementation', 'humanTaskRef'))
        return refs;
    }
}

exports.Usage = Usage;
