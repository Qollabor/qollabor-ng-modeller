class CaseTask extends Task {
    static get definitionClass() {
        return CaseTaskDefinition;
    }

    /**
     * Creates a new CaseTask element.
     * @param {CMMNElement} parent 
     * @param {PlanItem} definition
     */
    constructor(parent, definition) {
        super(parent, definition);
    }

    getImplementationList() {
        return ide.repository.getCases();
    }

    /**
     * Returns the element type image for this task
     */
    get imageURL() {
        return 'images/casetask_32.png';
    }

    get fileType() {
        return 'case';
    }
}
CMMNElement.registerType(CaseTask, 'Case Task', 'images/casetaskmenu_32.png');
