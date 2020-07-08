'use strict';

const fs = require('fs');
const pathLib = require('path');
const walkSync = require('walk-sync');
const mkdirp = require('mkdirp');
const Usage = require('./usage').Usage;
const Utilities = require('./utilities').Utilities;

class Store {
    constructor(repositoryPath) {
        this.repositoryPath = repositoryPath;
    }

    load(artifactName) {
        const fileName = Utilities.createAbsolutePath(this.repositoryPath, artifactName);
        return fs.readFileSync(fileName, { encoding: 'utf8' });
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
        this.lastModified = entry.mtime;
        this.content = store.load(this.fileName);
        this.usage = [];
    }

    get apiInformation() {
        delete this.store;
        delete this.content;
        return this;
    }
}

exports.Store = Store;
exports.ModelInfo = ModelInfo;