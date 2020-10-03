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
