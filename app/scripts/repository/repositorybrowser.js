class RepositoryBrowser {
    /**
     * This object handles the model browser pane on the left
     * @param {IDE} ide 
     * @param {JQuery<HTMLElement>} html 
     */
    constructor(ide, html) {
        this.ide = ide;
        this.repository = this.ide.repository;

        this.html = html;
        this.html.append(
            `<div class="divModelList basicform">
                <div class="formheader">
                    <label>Repository</label>
                    <div class="btnRefresh" title="Refresh the model list">
                        <img src="images/refresh_32.png" />
                    </div>
                </div>
                <div class="formfooter">
                    <div class="divSearchBox">
                        <input style='width:100%' placeholder="Search" />
                    </div>
                </div>
                <div class="formcontainer">
                    <div class="divAccordionList">
                    </div>
                </div>
            </div>
            <div class="divCreateNewModel basicform">
                <div class="formheader formheadernoradius">
                    <label>Create Case Model</label>
                </div>
                <div class="formcontainer">
                    <div>
                        <label>Name</label>
                        <input class="inputNewModelName" type="text" />
                    </div>
                    <div>
                        <label>Description</label>
                        <input class="inputNewModelDescription" type="text" />
                    </div>
                    <button bttype="create">Create</button>
                    <button bttype="createopen">Create + Open</button>
                </div>
            </div>`);

        //set accordion for the various types of model lists
        this.accordion = this.html.find('.divAccordionList');
        this.accordion.accordion({
            heightStyle: 'fill',
            animate: false,
            activate: (e, ui) => {
                const createMessage = ui.newHeader.attr('createMessage');
                this.divModelCreator.find('.formheader label').html(createMessage);
            }
        });

        //add events search model field
        this.searchBox = this.html.find('.divSearchBox input');
        this.searchBox.on('keyup', e => this.applySearchFilter(e));
        this.searchBox.on('keydown', e => this.executeSearchFilter(e));

        // Attach window resize handler and subsequently refresh the accordion
        $(window).on('resize', () => this.accordion.accordion('refresh'));

        //set refresh handle on click
        this.html.find('.btnRefresh').on('click', () => {
            this.repository.listModels();
            this.searchBox.val('');
        });


        //add handles for creating new models
        this.divModelCreator = this.html.find('.divCreateNewModel');
        this.inputNewModelName = this.divModelCreator.find('.inputNewModelName');
        this.inputNewModelDescription = this.divModelCreator.find('.inputNewModelDescription');
        this.divModelCreator.find('button').on('click', e => this.createNewEntry(e));

        // Add handler for hash changes, that should load the new model
        $(window).on('hashchange', () => this.loadModelFromBrowserLocation());

        // Now load the repository contents, and after that optionally load the first model
        this.repository.listModels(() => this.loadModelFromBrowserLocation());
    }

    /**
     * 
     * @param {ModelEditorMetadata} type 
     */
    createModelListPanel(type) {
        return new ModelListPanel(this, this.accordion, type);
    }

    startDrag(modelName, shapeType, shapeImg, fileName) {
        this.dragData = new DragData(this.ide, this, modelName, shapeType, shapeImg, fileName);
    }

    /**
     * Registers a drop handler with the repository browser.
     * If an item from the browser is moved over the canvas, elements can register a drop handler
     * @param {Function} dropHandler
     * @param {Function} filter
     */
    setDropHandler(dropHandler, filter = undefined) {
        if (this.dragData) this.dragData.setDropHandler(dropHandler, filter);
    }

    /**
     * Removes the active drop handler and filter
     */
    removeDropHandler() {
        if (this.dragData) this.dragData.removeDropHandler();
    }

    /**
     * Creates a new model based on name and description.
     * @param {JQuery.ClickEvent} e
     */
    createNewEntry(e) {
        const buttonType = $(e.currentTarget).attr('bttype');
        const filetype = this.accordion.accordion('instance').active.attr('filetype');
        const newModelName = this.inputNewModelName.val().toString();
        const newModelDescription = this.inputNewModelDescription.val().toString();

        //check if a valid name is used
        if (!this.isValidEntryName(newModelName)) {
            return;
        }

        const fileName = newModelName + '.' + filetype;

        if (this.repository.isExistingModel(fileName)) {
            this.ide.danger('A ' + filetype + ' with this name already exists and cannot be overwritten');
            return;
        }

        this.ide.createNewModel(filetype, newModelName, newModelDescription);

        // Clear the input boxes, such that new valuess can be entered
        this.inputNewModelName.val('');
        this.inputNewModelDescription.val('');

        if (buttonType == 'createopen') {
            // Change the url to navigate into the newly created model
            window.location.hash = fileName;
        }
    }

    /**
     * Checks the window.location hash and loads the corresponding model.
     */
    loadModelFromBrowserLocation() {
        // Splice: take "myMap/myModel.case" out of something like "http://localhost:2081/#myMap/myModel.case"
        const fileName = window.location.hash.slice(1);
        this.currentFileName = fileName;
        this.refreshAccordionStatus();

        // Ask the IDE to open the model.
        // this.repository.get(fileName).load(f => this.ide.openModel(f.parseToModel()))
        // this.repository.readModel(fileName, model => this.ide.openModel(model));
        this.ide.open(fileName);
    }

    refreshAccordionStatus() {
        // Select the currently opened model. Should we also open the right accordion with it?
        //  Also: this logic must also be invoked when we refresh the contents of the accordion.
        //  That requires that we also know what the current model is.
        this.accordion.find('.model-item').removeClass('modelselected');
        this.accordion.find('.model-item[fileName="' + this.currentFileName + '"]').addClass('modelselected');
    }

    /**
     * returns true when the modelName is valid
     */
    isValidEntryName(entryName) {
        if (!entryName || entryName == '') {
            this.ide.danger('Please enter a name for the model.');
        } else if (/\s/.test(entryName)) {
            this.ide.danger('The model name should not contain spaces');
        }
        if (!/^[a-zA-Z0-9_/]+$/.test(entryName)) {
            this.ide.danger('The model name should not invalid characters (like !@#$%^&* etc)');
        } else {
            // Everything ok then, return true;
            return true;
        }
        // Something in the above tests was wrong, otherwise we would not have reached this point. So return false.
        return false;
    }

    /**
     * Runs the search text agains the models currently rendered, and hides them if not matching the search criteria
     * @param {JQuery.KeyUpEvent} e
     */
    applySearchFilter(e) {
        const searchText = this.searchBox.val().toString().toLowerCase();
        // Loop through all elements, and search for the text. The elements look like <a filetype="case" name="hcmtest" href="...">hcmtest</a>
        this.accordion.find('a').toArray().forEach(htmlElement => {
            const modelName = htmlElement.textContent.toLowerCase();
            const containsSearchText = this.hasSearchText(searchText, modelName);
            htmlElement.parentElement.style.display = containsSearchText ? 'block' : 'none';
        });
    }

    /**
     * Determines recursively whether each character of text1 is available in text2
     * @param {String} searchFor 
     * @param {String} searchIn 
     */
    hasSearchText(searchFor, searchIn) {
        if (!searchFor) { // Nothing left to search for, so found a hit
            return true;
        }
        if (!searchIn) { // Nothing left to search in, so did not find it.
            return false;
        }
        const index = searchIn.indexOf(searchFor.charAt(0));
        if (index < 0) { // Did not find any results, so returning false.
            return false;
        }
        // Continue the search in the remaining parts of text2
        const remainingText2 = searchIn.substring(index + 1, searchIn.length);
        const remainingText1 = searchFor.substring(1);
        return this.hasSearchText(remainingText1, remainingText2);
    }

    /**
     * This function executes the search filter with a follow-up action.
     * On tab, select the first model.
     * On enter, open the first model.
     * On escape, remove the search filter.
     * @param {JQuery.KeyDownEvent} e 
     */
    executeSearchFilter(e) {
        const first = this.accordion.find('a').toArray().find(element => $(element).parent().css('display') == 'block')
        if (e.keyCode == 9) { // Pressed Tab key, let's focus on first search result
            if (first) {
                $(first).trigger('focus');
                e.stopPropagation();
                e.preventDefault();
            }
        } else if (e.keyCode == 27) { // Pressed Escape key, let's undo the search filter
            this.removeSearchFilter();
        } else if (e.keyCode == 13) { // Pressed Enter key, let's open the first search result
            if (first) {
                window.location.hash = ($(first).attr('name') + '.' + $(first).attr('filetype'));
            }
        }
    }

    /**
     * Removes the active search filtering from the model list.
     */
    removeSearchFilter() {
        this.searchBox.val('');
        this.accordion.find('div').css('display', 'block');
    }
}
