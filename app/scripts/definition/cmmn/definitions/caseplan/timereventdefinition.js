class TimerEventDefinition extends EventListenerDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.timerExpression = this.parseElement('timerExpression', ExpressionDefinition);
        this.planItemStartTrigger = this.parseElement('planItemStartTrigger', PlanItemStartTrigger);
        this.caseFileItemStartTrigger = this.parseElement('caseFileItemStartTrigger', CaseFileItemStartTrigger);

        if (!this.planItemStartTrigger && !this.caseFileItemStartTrigger){
            //planItemStartTrigger is default
            this.planItemStartTrigger = this.getPlanItemStartTrigger();
        }
    }

    getTimerExpression() {
        if (!this.timerExpression) {
            this.timerExpression = super.createDefinition(ExpressionDefinition);
            this.timerExpression.name = undefined;
        }
        return this.timerExpression;
    }

    getCaseFileItemStartTrigger() {
        if (!this.caseFileItemStartTrigger) {
            this.caseFileItemStartTrigger = super.createDefinition(CaseFileItemStartTrigger);
            if (this.planItemStartTrigger) {
                this.planItemStartTrigger.removeDefinition();
            }
        }
        return this.caseFileItemStartTrigger;
    }

    getPlanItemStartTrigger() {
        if (!this.planItemStartTrigger) {
            this.planItemStartTrigger = super.createDefinition(PlanItemStartTrigger);
            if (this.caseFileItemStartTrigger) {
                this.caseFileItemStartTrigger.removeDefinition();
            }
        }
        return this.planItemStartTrigger;
    }

    static get prefix() {
        return 'tmr';
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'timerEvent', 'timerExpression', 'planItemStartTrigger', 'caseFileItemStartTrigger');
    }
}

class PlanItemStartTrigger extends OnPartDefinition {
    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'planItemStartTrigger');
    }
}

class CaseFileItemStartTrigger extends OnPartDefinition {
    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'caseFileItemStartTrigger');
    }
}
