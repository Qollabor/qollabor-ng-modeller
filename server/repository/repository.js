'use strict';

const fs = require('fs');
const pathLib = require('path');
const mkdirp = require('mkdirp');
const Definitions = require('./cmmn/definitions').Definitions;
const Store = require('./store').Store;
const Utilities = require('./utilities').Utilities;
const Upgrade = require('./upgrade').Upgrade;

class Repository {
    constructor(repositoryPath, deployPath) {
        console.log('========== Creating new Repository("' + repositoryPath + '", "' + deployPath + '")');
        this.repositoryPath = pathLib.resolve(repositoryPath);
        console.log('- sources location: ' + this.repositoryPath);
        this.deployPath = pathLib.resolve(deployPath);
        console.log('-  deploy location: ' + this.deployPath); // Intentional double space to align both configuration values
        console.log('===================');
        this.store = new Store(this.repositoryPath);
        new Upgrade(this.store).start();
    }

    load(artifactName) {
        return this.store.load(artifactName);
    }

    save(artifactName, data) {
        return this.store.save(artifactName, data);
    }

    composeDefinitionsDocument(artifactName) {
        return new Definitions(artifactName, this.store);
    }

    deploy(artifactName) {
        const definitions = this.composeDefinitionsDocument(artifactName);
        if (definitions.hasErrors()) {
            throw new Error('Cannot deploy ' + artifactName + ' due to ' + definitions.getErrors());
        }
        const file = Utilities.createAbsolutePath(this.deployPath, definitions.deployFileName);
        mkdirp.sync(pathLib.dirname(file));
        fs.writeFileSync(file, definitions.deployContents);
        return file;
    }

    list() {
        return this.store.list();
    }
}

exports.Repository = Repository;
