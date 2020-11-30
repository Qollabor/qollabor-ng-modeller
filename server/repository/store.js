'use strict';

const consts = require('./constant.js');
const fs = require('fs');
const pathLib = require('path');
const walkSync = require('walk-sync');
const mkdirp = require('mkdirp');
const Usage = require('./usage').Usage;
const Utilities = require('./utilities').Utilities;
const XML = require('./xml').XML;

class Store {
    constructor(repositoryPath) {
        this.repositoryPath = repositoryPath;
    }

    load(artifactName) {
        const fileName = Utilities.createAbsolutePath(this.repositoryPath, artifactName);
        const content = fs.readFileSync(fileName, { encoding: 'utf8' });
        return content;
    }

    save(artifactName, data) {
        const fileName = Utilities.createAbsolutePath(this.repositoryPath, artifactName);
        mkdirp.sync(pathLib.dirname(fileName));
        fs.writeFileSync(fileName, data);
    }

    list() {
        const files = walkSync.entries(this.repositoryPath, { directories: false, ignore: ['**/.*'] });
        const models = files.filter(file => Utilities.isKnownRepositoryExtension(pathLib.extname(file.relativePath))).map(entry => new ModelInfo(this, entry));
        const usage = new Usage(this);
        usage.analyze(models);
        usage.addUsageInformation(models);
        return models.map(modelInfo => modelInfo.apiInformation);
    }
}

class ModelInfo {
    /**
     * 
     * @param {Store} store 
     * @param {*} entry 
     */
    constructor(store, entry) {
        this.store = store;
        this.fileName = entry.relativePath;
        this.type = pathLib.extname(this.fileName).substring(1);
        this.lastModified = entry.mtime;
        this.content = store.load(this.fileName);
        this.usage = [];
        this.error = undefined;
    }

    load() {
        // if (this.fileName.indexOf('helloworld'))
        const xml = XML.parse(this.content);
        const element = xml.element;
        if (xml.hasErrors) {
            this.setError(`${this.fileName} has parse errors: ` + xml.errors);
            return undefined;
        }
        if (element && element.nodeName === this.expectedTagName) {
            return element;
        }
        if (element) {
            this.setError(`${this.fileName} is invalid: expecting <${this.expectedTagName}> instead of <${element.nodeName}>`);
        }

        return xml.element;
    }

    setError(msg) {
        this.error = msg;
        console.log(`--- ERROR --- File ${msg}`);
    }

    get expectedTagName() {
        const extension = '.' + this.type;
        if (extension == consts.CASE_EXT) return 'case';
        if (extension == consts.CASE_DIMENSION_EXT) return 'CMMNDI'
        if (extension == consts.PROCESS_EXT) return 'process';
        if (extension == consts.CASE_DEFINITION_EXT) return 'definitions'; // not quite needed here, but ok.
        if (extension == consts.HUMANTASK_EXT) return 'humantask';
        if (extension == consts.CASE_FILE_ITEM_DEFINITION_EXT) return 'caseFileItemDefinition';
        return '';
    }

    get apiInformation() {
        // Explicit contract
        return {
            fileName: this.fileName,
            type: this.type,
            lastModified: this.lastModified,
            usage: this.usage,
            error: this.error
        }
    }
}

exports.Store = Store;
exports.ModelInfo = ModelInfo;