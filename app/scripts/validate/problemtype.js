class ProblemType {
    /**
     * Returns the problem type with the specified number
     * @returns {ProblemType}
     */
    static get(number) {
        return ProblemType.list.find(n => n.number == number);        
    }

    static showAll() {
        ProblemType.list.forEach(n => n.isHidden = false);
    }

    constructor(number, descriptionTemplate, image) {
        this.number = number;
        this.descriptionTemplate = descriptionTemplate;
        this.image = image;
    }

    /**
     * @param {Boolean} bHide
     */
    set isHidden(bHide) {
        ValidateForm.Settings.hideProblemType(this.number, bHide);
    }

    get isHidden() {
        return ValidateForm.Settings.isHiddenProblemType(this.number);
    }

    /**
     * Creates a validation problem within the context of this case.
     * @param {String} contextId 
     * @param {Array<String>} parameters 
     */
    createProblem(contextId, parameters) {
        return new Problem(contextId, this, parameters);
    }

    getHTMLString(description, contextId, problemId) {
        const htmlString = `<div class="problemrow" problemId="${problemId}" contextId="${contextId}" problemType="${this.number}">
	<div class="hideproblem">
        <input type="checkbox" hideType="all"></input>
	</div>
    <div class="hideproblem">
		<input type="checkbox" hideType="this"></input>
	</div>
	<div class="problemtype" title="${this.number}">
		<img src="${this.image}"></img>
	</div>
	<div class="problemdescription">
        ${description}
	</div>
</div>`;
        return htmlString;
    }

    /**
     * @returns {Array<ProblemType>}
     */
    static get list() {
        if (! ProblemType._list) {
            ProblemType._list = [
                new CMMNWarning(0, 'CMMN Element of type -par0- ("-par1-") has no name.'),
                new CMMNWarning(1, 'No name defined for -par0- in case "-par1-" with property "-par2-".'),
                new CMMNWarning(2, 'No description defined for -par0- in case "-par1-".'),
                new CMMNWarning(3, 'No implementation attached to task "-par0-" in case "-par1-" '),
                new CMMNWarning(4, 'No process property defined for process task "-par0-" in case "-par1-" '),
                new CMMNError(5, 'Non-blocking task "-par0-" in case "-par1-" has an exit sentry, this is not allowed.'),
                new CMMNError(6, 'Non-blocking task "-par0-" in case "-par1-" has output parameters, this is not allowed.'),
                new CMMNError(7, 'The -par2- mapping parameters of task "-par0-" in case "-par1-" misses a source or target.'),
                new CMMNError(8, 'Non-blocking human task "-par0-" in case "-par1-" has a planning table, this is not allowed.'),
                new CMMNError(9, 'Stage "-par0-" in case "-par1-" has a plan item definition reference -par2-, this is not allowed.'),
                new CMMNError(10, 'The property "-par3-" of -par0- "-par1-" in case "-par2-" is not defined.'),
                new CMMNWarning(11, 'The property "-par3-" of -par0- "-par1-" in case "-par2-" is not defined.'),
                new CMMNWarning(12, 'The stage "-par0-" in case "-par1-" has the property autocomplete=FALSE. It is appropriate that this stage contains discretionary elements'),
                new CMMNWarning(13, 'The stage "-par0-" in case "-par1-" contains zero or one plan item, this is allowed but should be avoided '),
                new CMMNError(14, 'The -par0- of element "-par1-"  in case "-par2-" has neither an ifPart, nor an onPart (planItem or case file item)'),
                new CMMNError(15, 'The -par0- of element "-par1-"  in case "-par2-" has an onPart case file item entry without a reference to a case file item)'),
                new CMMNWarning(16, 'The -par0- of element "-par1-"  in case "-par2-" has no expression in the ifPart.'),
                new CMMNError(17, 'The case "-par0-" has no Case Plan Model, please add. '),
                new CMMNError(18, 'Circular case reference found. From Case Task "-par0-" in case "-par1-" to case "-par2-". This can be a indirect circular refence, via many cases'),
                new CMMNWarning(19, 'The -par0- "-par1-" in case "-par2-" has a planning table but no discretionary items'),
                new CMMNError(20, 'The discretionary element "-par0-" in case "-par1-" is not connected or contained by an element with a planning table.'),
                new CMMNError(21, 'The element "-par0-" in case "-par1-" is discretionary to more than one element (with a planning table).'),
                new CMMNError(22, 'Stage "-par0-" in case "-par1-" must not be discretionary to human task "-par2-" that is contained by the stage (nested in).'),
                new CMMNError(23, 'The -par0- of discretionary element "-par1-" in case "-par2-" has an onPart planItem reference to element "-par3-", that is outside the parent stage/case plan model "-par4-". This is not allowed'),
                new CMMNError(24, 'The element "-par0-" in case "-par1-" has a -par2- rule without a -par3-'),
                new CMMNWarning(25, 'The planning table of element "-par0-" in case "-par1-" has an applicability rule without an expression (rule)'),
                new CMMNWarning(28, 'The -par0- of element "-par1-"  in case "-par2-" has an onPart case file item entry without a standard event'),
                new CMMNError(29, 'The planning table of element "-par0-" in case "-par1-" has an applicability rule without a name'),
                new CMMNWarning(30, 'The case file item element with parent "-par0-" in case "-par1-" has no case file item'),
                new CMMNError(31, 'The case file item "-par0-" in case "-par1-" has no definition.'),
                new CMMNWarning(32, 'The case file item definition "-par0-" with definition type "-par1-" has no Structure Ref.'),
                new CMMNWarning(33, 'The case file item definition "-par0-" with definition type "-par1-" has a property with no name.'),
                new CMMNWarning(34, 'The -par0- of element "-par1-"  in case "-par2-" has an onPart plan item row with no element reference'),
                new CMMNWarning(35, 'The -par0- of element "-par1-"  in case "-par2-" has an onPart plan item row with no standard event'),
                new CMMNError(36, 'The -par0- of element "-par1-"  in case "-par2-" has an onPart plan item element ("-par3-") which is discretionary. This is not allowed.'),
                new CMMNWarning(37, 'The -par2- mapping of element "-par0-"  in case "-par1-" has empty task parameter(s)'),
                new CMMNError(38, 'Case "-par0-" has no Case File Items. Each case should at least have one.'),
                new CMMNWarning(39, 'The element "-par0-" in case "-par1-" has a -par2- rule without a -par3-'),
                new CMMNWarning(40, 'The element "-par0-" in case "-par1-" has an empty authorized role')
            ];
        }
        return ProblemType._list;
    }
}

class CMMNWarning extends ProblemType {
    constructor(number, description) {
        super(number, description, 'images/warningproblem_32.png');
    }
}

class CMMNError extends ProblemType {
    constructor(number, description) {
        super(number, description, 'images/errorproblem_32.png');
    }
}
