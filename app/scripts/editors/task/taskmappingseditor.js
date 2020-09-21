class TaskMappingsEditor extends StandardForm {
    /**
     * @param {Task} task 
     */
    constructor(task) {
        super(task.case, 'Edit mappings of task ' + task.definition.name, 'tableeditorform', 'mappingform');
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
        console.log("I: "+inputHeight+", O: "+outputHeight + ", C: "+controlHeight)
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

    open() {
        this.visible = true;
    }

    /**
     * Closes the editor form (hides it)
     */
    close() {
        this.visible = false;
    }

    refresh() {
        if (this._html) {
            this.renderForm();
        }
    }
}

class MappingControl extends TableRenderer {
    /**
     * 
     * @param {TaskMappingsEditor} editor 
     * @param {JQuery<HTMLElement>} htmlParent 
     */
    constructor(editor, htmlParent) {
        super(editor.task.case, htmlParent);
        this.editor = editor;
        this.task = editor.task;
        this.taskDefinition = this.task.planItemDefinition;
    }

    /**
     * @returns {Array<ParameterMappingDefinition>} The task input parameters (for usage in the parameters editor)
     */
    get data() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }
}

class InputMappingControl extends MappingControl {
    constructor(editor, htmlParent) {
        super(editor, htmlParent);
    }

    /**
     * @returns {Array<ParameterDefinition>} The task input parameters (for usage in the parameters editor)
     */
    get parameters() {
        return this.taskDefinition.inputs;
    }

    get data() {
        return this.taskDefinition.inputMappings;
    }

    get columns() {
        return [
            new ColumnRenderer('', '25px', 'Remove mapping', InputMappingDeleter),
            new ColumnRenderer('Case File Item', '150px', 'Case File Item that binds to the input parameter of the task', MappingCFI),
            new ColumnRenderer('Input Task Parameter', '100px', 'Name of the input parameter of the task', InputParameterNameChanger),
            new ColumnRenderer('Transformation', '', 'Expression executed when the task becomes active\nTakes the value from the task parameter, transforms it and puts it in the model input parameter', MappingExpression),
            new ColumnRenderer('Model Input Parameter', '160px', 'Input parameter for the underlying model', InputParameterSelector),
            new ColumnRenderer('Order', '38px', 'Parameter assignment order', MappingOrderChanger)
        ];
    }

    /**
     * 
     * @param {ParameterMappingDefinition} mapping 
     */
    addRenderer(mapping = undefined) {
        if (mapping) {
            return new MappingRow(this, mapping);
        }
    }
}

class OutputMappingControl extends MappingControl {
    constructor(editor, htmlParent) {
        super(editor, htmlParent);
    }

    /**
     * @returns {Array<ParameterDefinition>} The task input parameters (for usage in the parameters editor)
     */
    get parameters() {
        return this.taskDefinition.outputs;
    }

    get data() {
        // Sort the output mappings such that the empty mapping (that is the one without a sourceRef) is shown last
        return this.taskDefinition.outputMappings.sort((m1, m2) => {
            if (m1.sourceRef && m2.sourceRef) return 0;
            if (m1.sourceRef) return -1;
            return 1;
        });
    }

    get columns() {
        return [
            new ColumnRenderer('', '25px', 'Delete mapping', OutputMappingDeleter),
            new ColumnRenderer('Model Output Parameter', '160px', 'Output parameter of the underlying model', OutputParameterSelector),
            new ColumnRenderer('Transformation', '', 'Expression executed when the task completes or fails\nTakes the value from the output parameter, transforms it and puts it in the task output parameter\nand then binds that to the case file item', MappingExpression),
            new ColumnRenderer('Output Task Parameter', '100px', 'Name of the output parameter of this task', OutputParameterNameChanger),
            new ColumnRenderer('Case File Item', '150px', 'Case File Item to which the task output parameter is bound', MappingCFI),
            new ColumnRenderer('R', '20px', 'Required - Indicates that this parameter must have a value upon completing the task', RequiredChanger),
            new ColumnRenderer('Order', '38px', 'Parameter assignment order', MappingOrderChanger)
        ];
    }

    /**
     * 
     * @param {ParameterMappingDefinition} mapping 
     */
    addRenderer(mapping = undefined) {
        if (mapping == undefined) {
            if (this.taskDefinition.outputMappings.find(m => !m.sourceRef && !m.targetRef && !m.body)) {
                // console.log("Not adding last renderer ...")
                return;
            }
        }

        return new MappingRow(this, mapping);
    }
}

class MappingRow extends RowRenderer {
    /**
     * @param {MappingControl} control 
     * @param {ParameterMappingDefinition} mapping 
     */
    constructor(control, mapping) {
        super(control, mapping);
        this.control = control;
        this.editor = control;
        mapping = this.element = mapping ? mapping : this.createElement();
    }

    get taskParameterName() {
        const parameter = this.mapping.taskParameter;
        return parameter ? parameter.name : '';
    }

    /** @returns {TaskDefinition} */
    get taskDefinition() {
        return this.control.taskDefinition;
    }

    /** @returns {ParameterMappingDefinition} */
    get mapping() {
        // Just to have some typesafe reference
        return this.element;
    }

    /**
     * @returns {ParameterMappingDefinition}
     */
    createElement() {
        return this.taskDefinition.createMapping();
    }

    /**
     * Moves the item and it's corresponding HTML up in the list (if it is not the first one)
     * @param {ParameterMappingDefinition} mapping 
     */
    up(mapping) {
        if (this.isEmpty()) {
            return;
        }
        // Search in collection of "inputMappings" or "outputMappings", not in "mappings"
        //  Reason is: mappings is the 'real' collection, and there we need to swap.
        //  However, in mappings, swapping with next or previous may actually swap with a mapping of a different type (namely output and input mappings are not ordered on type)
        //  Therefore we check our location in "our" type of mappings, and pick next or previous from that. Actual swapping is then done on the respective locations within the 'mappings' collection.
        const collection = this.control.data;
        const index = collection.indexOf(mapping);
        if (index > 0) {
            const previousMappingOfThisType = collection[index - 1];
            this.swap(mapping, previousMappingOfThisType);
            this.done();
        }
    }

    /**
     * Moves the item and it's corresponding HTML down in the list (if it is not the last one)
     * @param {ParameterMappingDefinition} mapping 
     */
    down(mapping) {
        if (this.isEmpty()) {
            return;
        }
        const collection = this.control.data;
        const index = collection.indexOf(mapping);
        if (index < collection.length - 1) {
            const nextMappingOfThisType = collection[index + 1];
            this.swap(mapping, nextMappingOfThisType);
            this.done();
        }
    }

    /**
     * @param {ParameterMappingDefinition} mapping1 
     * @param {ParameterMappingDefinition} mapping2 
     */
    swap(mapping1, mapping2) {
        /** @type {TaskDefinition} */
        const taskDefinition = mapping1.parent;
        const mappings = taskDefinition.mappings;

        const indexMapping1 = mappings.indexOf(mapping1);
        const indexMapping2 = mappings.indexOf(mapping2);
        mappings[indexMapping1] = mapping2;
        mappings[indexMapping2] = mapping1;
    }

    done() {
        this.case.editor.completeUserAction();
        this.control.refresh();
    }
}
