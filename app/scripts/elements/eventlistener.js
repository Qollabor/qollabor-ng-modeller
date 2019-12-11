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
        return `<circle class="cmmn-shape cmmn-border cmmn-eventlistener-outershape" transform="translate(16,16)" r="16"/>
                <circle class="cmmn-border cmmn-eventlistener-innershape" transform="translate(16,16)" r="12"/>
                <image x="8" y="8" width="16" height="16" xlink:href="${this.imageURL}" />
                <text class="cmmn-text" x="10" y="45" text-anchor="middle" />`;
    }

    /**
     * @returns {String}
     */
    get imageURL() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }
}
