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
        const filename = Utilities.createAbsolutePath(this.repositoryPath, artifactName);
        return fs.readFileSync(filename, { encoding: 'utf8' });
    }

    save(artifactName, data) {
        const filename = Utilities.createAbsolutePath(this.repositoryPath, artifactName);
        mkdirp.sync(pathLib.dirname(filename));
        fs.writeFileSync(filename, data);
    }

    getUsage(artifactId) {
        const usage = new Usage();
        const artifactList = this.list();
        for (let i = 0; i < artifactList.length; i++) {
            const filename = artifactList[i].filename;
            const data = this.load(filename);
            usage.put(artifactList[i].filename, data);
        }
        return usage.getUsage(artifactId);
    }

    list() {
        const response = [];
        const entries = walkSync.entries(this.repositoryPath, { directories: false, ignore: ['**/.*'] });
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const filename = entry.relativePath;
            const lastModified = entry.mtime;
            const extension = pathLib.extname(filename);
            if (Utilities.isKnownRepositoryExtension(extension)) {
                response.push({ filename, lastModified });
            } else {
                console.log("Skipping file "+filename)
            }
        }
        return response;
    }
}

exports.Store = Store;