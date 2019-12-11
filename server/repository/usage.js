'use strict';

const Loki = require('lokijs');
const Utilities = require('./utilities').Utilities;
const XML = require('./xml').XML;

/**
 * This class keeps track of artifacts usage.
 */
class Usage {
    constructor() {
        this.artifacts = new Map(); // artifacts are just stored in an simple object; no needs for loki
        const db = new Loki('ide_artifacts');
        this.whereUsedData = db.addCollection('where_used', { indices: ['filename', 'artifactId', 'referencedArtifactId'] });
    }

    put(artifactName, data) {
        const xml = XML.loadXMLElement(data);
        const id = xml.getAttribute('id') || artifactName;
        const name = xml.getAttribute('name') || '';
        const description = xml.getAttribute('description') || '';
        const referencedArtifacts = this._extractReferencedArtifacts(xml)
        const metadata = {id, name, description, referencedArtifacts};
        this._addWhereUsedDataForFile(artifactName, metadata);
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

    _addWhereUsedDataForFile(filename, artifact) {
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
                    filename: filename,
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
                .map(id => {return {id};}) // and return a new object with {'id': [attr-value]}

        const refs = getReferences(caseTree, 'caseTask', 'caseRef');
        refs.push(...getReferences(caseTree, 'processTask', 'processRef'))
        refs.push(...getReferences(caseTree, 'cafienne:implementation', 'humanTaskRef'))
        return refs;
    }
}

exports.Usage = Usage;
