class Problem {
    /**
     * Creates a new problem that can render itself as HTML
     * @param {String} contextId The context in which this problem occurs. Together with the problemType.number and parameters this must be unique.
     * @param {ProblemType} problemType The template that is the basis for this problem
     * @param {Array<String>} parameters The detailed bindings that can be combined with the template to generate a specific description
     */
    constructor(contextId, problemType, parameters) {
        this.contextId = contextId;
        this.problemType = problemType;
        this.parameters = parameters;
        this.hide = false;
        this.index = this.contextId;
        this.description = problemType.descriptionTemplate;
        // Now substitute parameters into the description template
        for (let i = 0; i < parameters.length; i++) {
            this.description = this.description.replace('-par' + i + '-', parameters[i]);
        }
    }

    get id() {
        return this.problemType.number+' in '+this.contextId + '[' + this.parameters.join(',') + ']';
    }

    /**
     * Creates a copy of this object, that can be used for comparison of hidden objects
     */
    copy() {
        return new Problem(this.contextId, this.problemType, this.parameters);
    }

    isWarning() {
        return this.problemType instanceof CMMNWarning;
    }

    isError() {
        return this.problemType instanceof CMMNError;
    }

    /**
     * Generates a HTML string that can render this problem
     */
    getHTMLString() {
        return this.problemType.getHTMLString(this.description, this.contextId, this.id);
    }
}