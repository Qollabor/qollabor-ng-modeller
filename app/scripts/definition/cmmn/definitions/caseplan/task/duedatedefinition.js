class DueDateDefinition extends UnnamedCMMNElementDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.expression = this.parseElement('condition', ExpressionDefinition);
        this.contextRef = this.parseAttribute('contextRef');
    }

    get contextName() {
        const context = this.caseDefinition.getElement(this.contextRef);
        return context ? context.name : '';
    }

    createExportNode(parentNode, tagName = DueDateDefinition.TAG) {
        super.createExportNode(parentNode, tagName, 'contextRef');
        if (this.expression) {
            // Hmmm... perhaps we should rename 'expression' to 'condition' ...
            this.expression.createExportNode(this.exportNode, 'condition');
        }
    }

    /**
     * @returns {ExpressionDefinition}
     */
    getExpression() {
        if (! this.expression) {
            this.expression = super.createDefinition(ExpressionDefinition);
        }
        return this.expression;
    }

    set language(newLanguage) {
        if (newLanguage) {
            this.getExpression().language = newLanguage;
        }
    }

    get language() {
        if (this.expression) return this.expression.language;
    }

    set body(newBody) {
        this.getExpression().body = newBody;
    }

    get body() {
        return this.expression ? this.expression.body : '';
    }
}
DueDateDefinition.TAG = 'duedate';
