class Validator {
    constructor(cs) {
        this.case = cs;
        /** @type{Array<Problem>} */
        this._problems = [];
        /** @type{Array<Function>} */
        this.listeners = [];
    }

    /**
     * Adds a listener
     * @param {Function} listener 
     */
    addListener(listener) {
        this.listeners.push(listener);
    }

    /**
     * Adds a listener
     * @param {Function} listener 
     */
    removeListener(listener) {
        Util.removeFromArray(this.listeners, listener);
    }

    /** @returns {Array<Problem>} */
    get problems() {
        return this._problems;
    }

    /**
     * @returns {Array<Problem>}
     */
    get errors() {
        return this.problems.filter(p => p.isError());
    }

    /**
     * @returns {Array<Problem>}
     */
    get warnings() {
        return this.problems.filter(p => p.isWarning());
    }

    /**
     * Runs the actual validation
     */
    run() {
        this._problems = [];

        //validate the case with its' properties
        this.case.validate();
        
        // Inform all listeners that we have a whole new set of problems.
        this.listeners.forEach(listener => listener(this));
    }

    /**
     * adds a problem (with problem type number that is not valid according to the CMMN schema) to the problem list
     * ContextId is the unique identifier for the problem's location in the CMMN schema (e.g., typically CMMNElement.id)
     * @param {String} contextId
     * @param {Number} problemTypeNumber
     * @param {Array<String>} parameters
     */
    raiseProblem(contextId, problemTypeNumber, parameters) {
        //get the message for this problem
        const problemType = ProblemType.get(problemTypeNumber);

        if (!problemType) {
            console.warn('There is no problem type defined for number '+problemTypeNumber);
            return;
        }

        const problem = problemType.createProblem(contextId, parameters);
        this.problems.push(problem);
    }
}
