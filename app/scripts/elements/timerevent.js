class TimerEvent extends EventListener {
    static get definitionClass() {
        return TimerEventDefinition;
    }

    /**
     * Creates a new TimerEventListener
     * @param {CMMNElement} parent 
     * @param {PlanItem} definition
     */
    constructor(parent, definition) {
        super(parent, definition);
    }

    /** @returns {TimerEventDefinition} */
    get planItemDefinition() {
        return this.definition.definition;
    }

    createProperties() {
        return new TimerEventProperties(this);
    }

    get imageURL() {
        return 'images/svg/timerevent.svg';       
    }

    referencesDefinitionElement(definitionId) {
        const cfiTrigger = this.planItemDefinition.caseFileItemStartTrigger;
        if (cfiTrigger && cfiTrigger.sourceRef == definitionId) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }    
}
CMMNElement.registerType(TimerEvent, 'Timer Event', 'images/svg/timerevent.svg');
