
class HaloDragItem extends HaloItem {
    constructor(halo, imgURL, title) {
        super(halo, imgURL, title);
        this.html.on('pointerdown', e => this.handleMouseDown(e));
    }

    /** 
     * Handles mousedown in a halo image (the images to drag e.g connector from element),
     * depending on the halo type a different action is required
     */
    handleMouseDown(e) {
        e.preventDefault();

        //get the haloType
        const haloImg = $(e.currentTarget)[0];

        // Start listening to mouse move and mouseup
        $(document).on('pointermove', e => this.handleMouseMove(e));
        $(document).on('pointerup', e => this.handleMouseUp(e));
        this.keyDownHandler = e => this.handleKeyDown(e);
        $(document).on('keydown', this.keyDownHandler);

        // Hide current properties view
        this.halo.element.propertiesView.hide();

        // Create a temporary connector to the current coordinates
        this.tempConnector = new TemporaryConnector(this.halo.element, this.coordinates);
    }

    handleKeyDown(e) {
        if (e.keyCode == 27) { // Esc key
            e.stopPropagation();
            e.preventDefault();
            this.clear();
        }
    }

    clear() {
        $(document).off('pointermove');
        $(document).off('pointerup');
        // Remove the temp connector
        this.tempConnector.remove();
    }

    /** 
     * Handles mousemove after halo mousedown
     */
    handleMouseMove(e) {
        // Move the temporary connector to current coordinates
        this.tempConnector.target = this.coordinates;
    }

    /**
     * Handles mousup after mousedown on halo
     * @param {*} e 
     * @param {String} haloType
     * @param {Function} action
     */
    handleMouseUp(e) {
        e.stopPropagation();
        e.preventDefault();
        this.clear(); // Clean up our content.
    }
}

class ConnectorHaloItem extends HaloDragItem {
    /**
     * Returns the default bar in which this item appears
     * @param {Halo} halo 
     */
    static defaultBar(halo) {
        return halo.rightBar;
    }

    constructor(halo) {
        super(halo, 'images/link_black_128.png', 'Connector');
    }

    handleMouseUp(e) {
        super.handleMouseUp(e);
        // A 'plain' connector is dragged from the halo, try to link it with the target element
        // at the position of the cursor.
        // Connectors to the case plan are not created, because that looks silly.
        //  As a matter of fact, connecting to a parent stage also still looks silly. Need to find a better solution.
        const cmmnElement = this.element.case.getItemUnderMouse(e);
        if (cmmnElement && !(cmmnElement instanceof CasePlanModel)) {
            // Note, we should connect to the source of the tempConnector, not to this.element;
            //  The reason is, that in between some other logic may have selected a new object,
            //  resulting in a new this.element.
            this.element.__connect(cmmnElement);
            this.element.case.selectedElement = cmmnElement;
        }
    }
}

class SentryHaloItem extends HaloDragItem {
    /**
     * Returns the default bar in which this item appears
     * @param {Halo} halo 
     */
    static defaultBar(halo) {
        return halo.rightBar;
    }

    constructor(halo, imgURL, title) {
        super(halo, imgURL, title);
        this.dragImage = this.element.case.html.find('.halodragimgid');
    }

    handleMouseDown(e) {
        super.handleMouseDown(e);
        this.dragImage.attr('src', this.imgURL);
        this.dragImage.css('display', 'block');
        this.positionDragImage();
    }

    handleMouseMove(e, haloType, coordinates) {
        super.handleMouseMove();
        this.positionDragImage();
    }

    clear() {
        super.clear();
        this.dragImage.css('display', 'none');
    }

    /**
     * positions the halo drag image next to the cursor
     */
    positionDragImage() {
        const x = this.coordinates.x;
        const y = this.coordinates.y;
        const w = this.dragImage.innerWidth();
        const h = this.dragImage.innerHeight();
        this.dragImage.css('top', y - h / 2);
        this.dragImage.css('left', x - w / 2);
    }

    handleMouseUp(e) {
        super.handleMouseUp(e);
        const newParent = this.element.case.getItemUnderMouse(e);
        if (newParent && newParent.__canHaveAsChild(this.haloType)) {
            const sentry = newParent.addShape(this.haloType, e);
            // Also connect the sentry with this element; will create a corresponding on-part
            this.element.__connect(sentry);
        }
    }

    /** @returns {String} */
    get haloType() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }
}

class EntryCriterionHaloItem extends SentryHaloItem {
    constructor(halo) {
        super(halo, EntryCriterion.smallImage, EntryCriterion.typeDescription);
    }

    get haloType() {
        return EntryCriterion.name;
    }
}

class ExitCriterionHaloItem extends SentryHaloItem {
    constructor(halo) {
        super(halo, ExitCriterion.smallImage, ExitCriterion.typeDescription);
    }

    get haloType() {
        return ExitCriterion.name;
    }
}