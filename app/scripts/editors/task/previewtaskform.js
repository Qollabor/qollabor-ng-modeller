class PreviewTaskForm extends StandardForm {
    /**
     * Editor for the content of the extension element <start-case-schema>
     * @param {ModelEditor} editor
     * @param {HumanTask} task
     */
    constructor(editor, task, dataGetter = undefined) {
        super(editor, 'Task Preview', 'task-preview');
        this.task = task;
    }
    
    get label() {
        const name = this.task ? this.task.name : this.modelEditor.modelName;
        return 'Task Preview - ' + name;
    }

    renderData() {
        this.htmlContainer.html('<div class="taskpreview"></div>');
        
        const divPreview = this.htmlContainer.find('.taskpreview');
        const form = this.task.planItemDefinition.implementationModel && this.task.planItemDefinition.implementationModel.taskModel;
        const taskModel = form.taskModel || '';

        const parseResult = Util.parseJSON(taskModel);
        const validJSON = parseResult.object;
        if (validJSON) {
            validJSON.options = { focus : false };
            validJSON.error = e => {
                divPreview.attr('style', 'border: 2px solid orange')
                const msg = `The task definition has an error: ${e.message}`;
                divPreview.attr('title', msg);
            } // Ignore any errors.
            this.htmlContainer.find('.taskpreview').alpaca(validJSON);
        } else {
            divPreview.html(`<h3 style="color:red;font-weight: bold;">${parseResult.description}</h3>`);
        }
    }
}