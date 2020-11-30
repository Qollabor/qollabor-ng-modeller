class ConstraintDefinition extends UnnamedCMMNElementDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.expression = this.parseElement('condition', ExpressionDefinition);
        this.contextRef = this.parseAttribute('contextRef');
    }

    get contextName() {
        const context = this.caseDefinition.getElement(this.contextRef);
        return context ? context.name : '';
    }

    createExportNode(parentNode, tagName) {
        super.createExportNode(parentNode, tagName, 'contextRef');
        if (this.expression) {
            // Hmmm... perhaps we should rename 'expression' to 'condition' ...
            this.expression.createExportNode(this.exportNode, 'condition');
        }
    }

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

class ExpressionDefinition extends UnnamedCMMNElementDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.language = this.parseAttribute('language', 'spel');
        const bodyElement = XML.getChildByTagName(this.importNode, 'body');
        this.body = bodyElement ? XML.getCDATANodeOrSelf(bodyElement).textContent : '';
    }

    createExportNode(parentNode, tagName) {
        super.createExportNode(parentNode, tagName, 'language');

        const bodyElement = XML.createChildElement(this.exportNode, 'body');
        const bodyCDataNode = this.exportNode.ownerDocument.createCDATASection(this.body);
        bodyElement.appendChild(bodyCDataNode);
        
    }
}