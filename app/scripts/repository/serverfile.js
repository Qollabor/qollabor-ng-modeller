class Metadata {
    constructor(json) {
        this.fileName = json.fileName;
        this.lastModified = json.lastModified;
        this.usage = json.usage;
        this.error = json.error;
        this.type = json.type;
    }
}

class ServerFile {
    /**
     * Creates a new local reference of the server file, based on the json structure given
     * by the server (serverData).
     * When created the reference does not yet hold the content. This can be loaded on 
     * demand through the load method, which can be invoked with a callback.
     * @param {Repository} repository 
     * @param {String} fileName 
     * @param {*} serverMetadata 
     */
    constructor(repository, fileName, serverMetadata = {}) {
        this.repository = repository;
        this.ide = this.repository.ide;
        this.fileName = fileName;
        this.refreshMetadata(serverMetadata);
    }

    /**
     * Refreshes the metadata of the model, based on the server side content.
     * @param {Metadata} serverMetadata 
     */
    refreshMetadata(serverMetadata) {
        this.metadata = serverMetadata;
        const dotSplitter = this.fileName.split('.');
        this.fileType = dotSplitter[dotSplitter.length - 1];
        this.name = dotSplitter.slice(0, dotSplitter.length - 1).join('');
        this.model = name; // Who uses this?
        if (this.lastModified === serverMetadata.lastModified || this.hasBeenSavedJustNow) {
            // still the same contents, but potentially a new lastmodified timestamp
            // console.log("Data of "+this.fileName+" has not changed on the server-side");
            if (this.lastModified !== serverMetadata.lastModified) {
                // console.log("Updating timestamp of "+this.fileName+" from "+new Date(this.lastModified)+" to "+new Date(serverMetadata.lastModified));
                this.lastModified = serverMetadata.lastModified;
            }
        } else {
            this.clear();
        }
        this.lastModified = serverMetadata.lastModified;
    }

    get content() {
        // if (this._content) console.warn("Retrieving content of "+this.fileName);
        return this._content;
    }

    set content(content) {
        // if (content) {
        //     console.warn("Setting the contents of "+this.fileName);
        // }
        this._content = content;
    }

    /**
     * Simple method that logs in the console where all this file is used according to the server side repository.
     * 
     */
    get usage() {
        return this.metadata.usage;
    }

    /**
     * File no longer exists in server...
     */
    deprecate() {
        // TODO: here we should check if there are any editors that are still open for this serverFile;
        //  if so, then we should show a message in those editors in an overlay, with a decision what to do.
        console.warn("Still using "+this.fileName+" ???  Better not, since it no longer exists in the server ...");
    }

    /**
     * Removes local content caches, in order to enforce reloading of the file when it's content is read.
     */
    clear() {
        if (this.content) {
            console.warn("Clearing the contents of "+this.fileName);
        }
        this.content = undefined;
    }

    /**
     * Loads the data of file, and invokes the callback there-after.
     * @param {Function} callback 
     */
    load(callback) {
        if (this.content) {
            callback(this);
            return;
        }

        const url = '/repository/load/' + this.fileName;
        const type = 'get';
        console.log('Loading ' + url);

        // Simple method for easy checking whether the functionality is still working ...
        // this.usage();

        $.ajax({ url, type,
            success: (data, status, xhr) => {
                if (xhr.responseText == '') {
                    const msg = this.fileName + ' does not exist or is an empty file in the repository';
                    console.warn(msg);
                    this.ide.info(msg);
                } else {
                    this.content = { data, status, xhr };
                    callback(this);
                }
            },
            error: (xhr, error, eThrown) => {
                console.warn('Could not open ' + url, eThrown)
                // Cut the error message short.
                const str = ('' + eThrown).split('\n')[0];
                this.ide.danger('Could not read file ' + this.fileName + ' due to an error:<div>' + str + '</div>');
            }
        });
    }

    /**
     * Uploads the XML content to the server, and invokes the callback after it.
     * Uploading to server gives also a new file list back, which we use to update the repository contents.
     * @param {Function} callback 
     */
    save(callback = undefined) {
        const xmlString = XML.prettyPrint(this.data);
        const url = '/repository/save/' + this.fileName;
        const type = 'post';
        $.ajax({ url, data: xmlString, type,
            headers: { 'content-type': 'application/xml' },
            success: (data, status, xhr) => {
                this.hasBeenSavedJustNow = true;
                this.repository.updateFileList(data);
                this.hasBeenSavedJustNow = false;
                if (typeof (callback) == 'function') {
                    callback(data, status, xhr);
                } else {
                    // Also print a timestampe of the new last modified information
                    const lmDate = new Date(this.lastModified);
                    const HHmmss = lmDate.toTimeString().substring(0, 8);
                    const millis = ('000' + lmDate.getMilliseconds()).substr(-3);

                    console.log('Uploaded ' + this.fileName + ' at ' + HHmmss + ':' + millis);
                }
            },
            error: (xhr, error, eThrown) => {
                this.ide.danger('We could not save your work due to an error in the server. Please refresh the browser and make sure the server is up and running', eThrown);
            }
        });
    }

    get data() {
        return this.content ? this.content.data : '';
    }

    set data(data) {
        this.content ? this.content.data = data : this.content = { data };
    }

    parseToModel() {
        return ModelDocument.parse(this.repository.ide, this);
    }
}
