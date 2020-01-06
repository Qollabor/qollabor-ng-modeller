class EventListener extends PlanItemView {
    /**
     * Creates a new EventListener
     * @param {CMMNElement} parent 
     * @param {PlanItem} definition
     */
    constructor(parent, definition) {
        super(parent, definition);
        //define default color
        this.__resizable = false;

        // For some unclear reason we need to have more room to the right for event listeners (the svg element seems to be off-edged)
        super.areaDistance = 30;
    }

    get markup() {
        return `<image x="0" y="0" width="32px" height="32px" xlink:href="${this.imageURL}" />
                <text class="cmmn-text" x="16" y="50" text-anchor="middle" />`;
    }

    /**
     * @returns {String}
     */
    get imageURL() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }
}
