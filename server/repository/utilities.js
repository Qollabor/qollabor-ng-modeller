'use strict';

const pathLib = require('path');
const consts = require('./constant.js');

class Utilities {
    static createAbsolutePath(rootFolder, artifactName) {
        // Check to make sure no one is reading/writing outside of the repository folder
        const fullPathOfArtifact = pathLib.resolve(rootFolder, artifactName);
        const fullPathOfRepository = pathLib.resolve(rootFolder);
        if (!fullPathOfArtifact.startsWith(fullPathOfRepository)) {
            throw new Error('Someone is trying to read outside of the repository context: ' + artifactName);
        }

        // Check for valid extension; cannot just load anything from the server
        const extension = pathLib.extname(fullPathOfArtifact);
        if (!Utilities.isKnownRepositoryExtension(extension)) {
            throw new Error('Invalid extension for file ' + artifactName);
        }
        return fullPathOfArtifact;
    }

    /**
     * Determines whether the extension is a valid one for the repository
     */
    static isKnownRepositoryExtension(extension) {
        return extension == consts.CASE_EXT
            || extension == consts.CASE_DIMENSION_EXT
            || extension == consts.PROCESS_EXT
            || extension == consts.CASE_DEFINITION_EXT
            || extension == consts.HUMANTASK_EXT
            || extension == consts.CASE_FILE_ITEM_DEFINITION_EXT;
    }
}

exports.Utilities = Utilities;

