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
            new ColumnRenderer(OutputMappingDeleter, '', '25px', 'Delete mapping'),
            new ColumnRenderer(OutputParameterSelector, 'Model Output Parameter', '160px', 'Output parameter of the underlying model'),
            new ColumnRenderer(MappingExpression, 'Transformation', '', 'Expression executed when the task completes or fails\nTakes the value from the output parameter, transforms it and puts it in the task output parameter\nand then binds that to the case file item'),
            new ColumnRenderer(OperationSelector, 'Operation', '65px'),
            new ColumnRenderer(MappingCFI, 'Case File Item', '150px', 'Case File Item to which the task output parameter is bound'),
            new ColumnRenderer(RequiredChanger, 'R', '20px', 'Required - Indicates that this parameter must have a value upon completing the task'),
            new ColumnRenderer(MappingOrderChanger, 'Order', '38px', 'Parameter assignment order')
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