class Repository {
    /**
     * This object handles the interaction with the backend to load and save the various types of models.
     * It keeps a local copy of all models present in the server. This local copy is updated after each
     * save operation, since the save operation returns a list of all files in the server, along with
     * their last modified status.
     * @param {IDE} ide 
     */
    constructor(ide) {
        this.ide = ide;
        /** @type {Array<ServerFile>} */
        this.list = [];
        /** @type {Array<Function>} */
        this.listeners = [];
    }

    /**
     * Returns the list of case models in the repository
     * @returns {Array<ServerFile>}
     */
    getCases() {
        return this.list.filter(serverFile => serverFile.fileType == 'case');
    }

    /**
     * Returns the list of process implementations in the repository
     * @returns {Array<ServerFile>}
     */
    getProcesses() {
        return this.list.filter(serverFile => serverFile.fileType == 'process');
    }

    /**
     * Returns the list of human task implementations in the repository
     * @returns {Array<ServerFile>}
     */
    getHumanTasks() {
        return this.list.filter(serverFile => serverFile.fileType == 'humantask');
    }

    /**
     * Returns the list of case file item definitions in the repository
     */
    getCaseFileItemDefinitions() {
        return this.list.filter(serverFile => serverFile.fileType == 'cfid');
    }

    /**
     * Registers a listener that is invoked each time
     * the list of models in the repository is updated.
     * @param {Function} listener 
     */
    onListRefresh(listener) {
        this.listeners.push(listener);
    }

    /**
     * Invokes the backend to return a new copy of the list of models.
     * @param {Function} callback Optional callback that will be invoked after model list has been retrieved
     */
    listModels(callback = undefined) {
        $.ajax({
            url: '/repository/list',
            type: 'get',
            success: (data, status, xhr) => {
                this.updateFileList(data);
                // Callback if there is a callback.
                if (callback) callback();
            },
            error: (xhr, error, eThrown) => {
                console.error('Could not list the repository contents', eThrown)
                this.ide.danger('Could not fetch the list of models');
            }
        });
    }

    /**
     * Returns true if a model with the given name exists in the repository.
     * @param {String} fileName 
     */
    isExistingModel(fileName) {
        return this.list.find(model => model.fileName === fileName) !== undefined;
    }

    /**
     * Clears content for the model
     * @param {String} fileName 
     */
    clear(fileName) {
        if (this.isExistingModel(fileName)) {
            this.list.find(model => model.fileName === fileName).clear();
        }
    }

    /**
     * Updates the cache with the most recent 'lastModified' information from the server.
     * This includes a full list of the filenames of all models in the server, as well as the lastModified timestamp
     * of each file in the server. Based on this, the locally cached contents is removed if it is stale.
     * @param {Array<*>} newServerFileList
     */
    updateFileList(newServerFileList) {
        // Make a copy of the old list, to be able to clean up old models afterwards;
        const oldList = this.list;
        // Map the new server list into a list of structured objects. Also re-use existing objects as much as possible.
        /** @type {Array<ServerFile>} */
        this.list = newServerFileList.map(fileMetadata => {
            const fileName = fileMetadata.filename;
            const existingServerFile = this.list.find(file => file.fileName == fileName);
            if (!existingServerFile) {
                return new ServerFile(this, fileName, fileMetadata);
            } else {
                Util.removeFromArray(this.list, existingServerFile);
                existingServerFile.refreshMetadata(fileMetadata);
                return existingServerFile;
            }
        });
        // Inform elements still in old list about their deletion.
        oldList.forEach(serverFile => serverFile.deprecate());
        // Now invoke any repository listeners about the new list.
        this.listeners.forEach(listener => listener());
    }

    /**
     * Save xml file and upload to server
     * @param {String} fileName 
     * @param {*} xml 
     * @param {Function} callback 
     */
    saveXMLFile(fileName, xml, callback = undefined) {
        if (!this.isExistingModel(fileName)) { // temporary hack (i hope). creation should take care of this, instead of saving.
            this.list.push(new ServerFile(this, fileName));
        }
        const serverFile = this.list.find(serverFile => serverFile.fileName === fileName);
        serverFile.data = xml;
        serverFile.save(callback);
    }

    get(fileName) {
        return this.list.find(serverFile => serverFile.fileName === fileName);
    }

    /**
     * Reads the file from the repository, parses it into a ModelDefinition, and invokes the callback on succesfull completion
     * @param {String} fileName 
     * @param {Function} callback 
     */
    readModel(fileName, callback) {
        // TODO: we must add a check on existence of the serverfile in the local cache, and also whether it exists in the server.
        const serverFile = this.list.find(serverFile => serverFile.fileName === fileName);
        if (!serverFile) {
            console.log("Does not exist")
            return;
        }
        serverFile.load(file => {
            // Split:  divide "myMap/myMod.el.case" into ["MyMap/myMod", "el", "case"]
            const model = serverFile.parseToModel();
            callback(model);
        });
    }
}
