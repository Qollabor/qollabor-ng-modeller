const BLOCKINGHUMANTASK_IMG = 'images/svg/blockinghumantask.svg';
const NONBLOCKINGHUMANTASK_IMG = 'images/svg/nonblockinghumantask.svg';
class HumanTask extends Task {
    static get definitionClass() {
        return HumanTaskDefinition;
    }
    
    /**
     * Creates a new HumanTask element.
     * @param {CMMNElement} parent 
     * @param {PlanItem} definition
     */
    constructor(parent, definition) {
        super(parent, definition);
    }

    /** @returns {HumanTaskDefinition} */
    get planItemDefinition() {
        return this.definition.definition;
    }

    getImplementationList() {
        return ide.repository.getHumanTasks();
    }

    createProperties() {
        return new HumanTaskProperties(this);
    }

    /**
     * This method may only be invoked from within a human task planning table
     * @param {PlanItem} definition 
     */
    addDiscretionaryItem(definition) {
        this.parent.addDiscretionaryItem(definition);
    }

    /**
     * Returns the element type image for this task
     */
    get imageURL() {
        return this.planItemDefinition.isBlocking ? BLOCKINGHUMANTASK_IMG : NONBLOCKINGHUMANTASK_IMG;
    }

    get fileType() {
        return 'humantask';
    }

    referencesDefinitionElement(definitionId) {
        if (definitionId == this.planItemDefinition.performerRef) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }
}
CMMNElement.registerType(HumanTask, 'Human Task', 'images/svg/blockinghumantaskmenu.svg', 'images/humantaskmenu_32.png');
