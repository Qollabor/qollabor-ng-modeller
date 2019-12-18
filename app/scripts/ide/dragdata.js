class DragData {
    /**
     * Simple helper class for dragging/dropping elements from either RepositoryBrowser or ShapeBox to the CaseModelEditor canvas.
     * @param {IDE} ide 
     * @param {*} owner // If drag data is finished, it will clear the dragData property on the owner object
     * @param {String} model 
     * @param {String} shapeType 
     * @param {String} imgURL 
     * @param {String} fileName 
     */
    constructor(ide, owner, model, shapeType, imgURL, fileName) {
        this.ide = ide;
        this.owner = owner;
        this.model = model;
        this.shapeType = shapeType;
        this.imgURL = imgURL;
        this.fileName = fileName;
        this.dragBox = $(`<div class="dragbox">
                                <img class="drag-image" src="${this.imgURL}"/>
                                <label class="drag-label">${this.model}</label>
                            </div>`);
        $('body').append(this.dragBox);

        this.escapeKeyListener = e => {
            if (e.keyCode == 27) {
                // Hide dragbox, and remove drop handler
                this.dragBox.css('display', 'none');
                this._dropHandler = () => {};
            }
        }

        // Add temporary event handlers for moving the mouse around; they will be removed when the drag data is dropped.
        $('body').on('keydown', this.escapeKeyListener);
        $('body').on('pointermove', e => this.handleMousemoveModel(e));
        $('body').on('pointerup', e => this.handleMouseupModel(e));
    }

    handleMousemoveModel(e) {
        this.ide.dragging = true;
        
        //position the drag image
        this.dragBox.offset({
            top: e.pageY,
            left: e.pageX + 10 //+10 such that cursor is not above drag image, messes up the events
        });

        //model can be dragged over properties menu or elements
        if (this.canDrop) {
            this.dragBox.addClass('drop-allowed');
            this.dragBox.removeClass('drop-not-allowed');
        } else {
            this.dragBox.addClass('drop-not-allowed');
            this.dragBox.removeClass('drop-allowed');
        }
    }

    /**
     * Registers a drop handler with the repository browser.
     * If an item from the browser is moved over the canvas, elements can register a drop handler
     * @param {Function} dropHandler
     * @param {Function} filter
     */
    setDropHandler(dropHandler, filter = undefined) {
        // @ts-ignore
        this._dropHandler = dropHandler;
        this._dropFilter = filter;
    }

    /**
     * Removes the active drop handler and filter
     */
    removeDropHandler() {
        this._dropHandler = undefined;
        this._dropFilter = undefined;
    }

    get canDrop() {
        if (!this._dropHandler) {
            // console.log("No drop handler to invoke")
            return false;
        }
        if (this._dropFilter) {
            return this._dropFilter(this.shapeType);
        }
        return true;
    }

    handleMouseupModel(e) {
        if (this.canDrop) {
            this._dropHandler(this, e);
        }
        this.cleanUp();
    }

    cleanUp() {
        this.ide.dragging = false;
        $('body').off('keydown', this.escapeKeyListener);
        $('body').off('pointermove').off('pointerup');
        this.dragBox.remove();
        this.owner.dragData = undefined;
    }
}