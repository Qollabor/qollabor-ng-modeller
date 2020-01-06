class ProcessTask extends Task {
    static get definitionClass() {
        return ProcessTaskDefinition;
    }

    /**
     * Creates a new ProcessTask element.
     * @param {CMMNElement} parent 
     * @param {PlanItem} definition
     */
    constructor(parent, definition) {
        super(parent, definition);
    }

    getImplementationList() {
        return ide.repository.getProcesses();
    }

    /**
     * Returns the element type image for this task
     */
    get imageURL() {
        return 'images/svg/processtask.svg';
    }

    get fileType() {
        return 'process';
    }
}
CMMNElement.registerType(ProcessTask, 'Process Task', 'images/svg/processtaskmenu.svg', 'images/processtaskmenu_32.png');
