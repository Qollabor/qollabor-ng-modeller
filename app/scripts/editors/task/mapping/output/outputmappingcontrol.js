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
            new ColumnRenderer(OutputMappingDeleter),
            new ColumnRenderer(OutputParameterSelector),
            new ColumnRenderer(OutputMappingExpression),
            new ColumnRenderer(OperationSelector),
            new ColumnRenderer(MappingCFI, 'Case File Item to which the task output parameter is bound'),
            new ColumnRenderer(RequiredChanger),
            new ColumnRenderer(MappingOrderChanger)
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