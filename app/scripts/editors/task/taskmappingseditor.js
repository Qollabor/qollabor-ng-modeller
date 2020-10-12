class TaskMappingsEditor extends StandardForm {
    /**
     * @param {Task} task 
     */
    constructor(task) {
        super(task.editor, 'Edit mappings of task ' + task.definition.name, 'tableeditorform', 'mappingform');
        this.task = task;
    }

    renderHead() {
        super.renderHead();
        this.htmlContainer.html(
`<div class="task-mappings">
    <div class="input-mappings">
        <h4>Input Mappings</h4>
        <div class="containerbox"></div>
    </div>
    <div class="output-mappings">
        <h4>Output Mappings</h4>
        <div class="containerbox"></div>
    </div>
</div>`);
        const inputMappingsContainer = this.htmlContainer.find('.input-mappings .containerbox');
        const numInputMappings = this.task.planItemDefinition.inputMappings.length;
        const numOutputMappings = this.task.planItemDefinition.outputMappings.length;
        const rowHeight = 32;
        const h4height = 100;
        // Input and output height are determined by the number of parameters of the task
        const inputHeight = rowHeight * numInputMappings + h4height;
        const outputHeight = rowHeight * numOutputMappings + h4height;
        // Control height is determined by the mappings (+ 1 extra) plus the header menu bar of the form.
        const controlHeight = inputHeight + outputHeight + 2 * rowHeight + 20;
        // console.log("I: "+inputHeight+", O: "+outputHeight + ", C: "+controlHeight)
        this.inputMappings = new InputMappingControl(this, inputMappingsContainer);
        const outputMappingsContainer = this.htmlContainer.find('.output-mappings .containerbox');
        this.outputMappings = new OutputMappingControl(this, outputMappingsContainer);
        inputMappingsContainer.css('height', inputHeight + 'px');
        outputMappingsContainer.css('height', outputHeight + 'px');
        this.htmlContainer.css('height', controlHeight + 'px');
        this.htmlContainer.parent().css('height', (controlHeight + 20) +'px');
        this.splitter = new BottomSplitter(this.htmlContainer.find('.task-mappings'), inputHeight+'px', 100);
        this.splitter.bar.addClass('separator task-mappings-separator');
    }

    renderData() {
        this.inputMappings.renderTable();
        this.outputMappings.renderTable();
    }

    refresh() {
        if (this._html) {
            this.renderForm();
        }
    }
}
