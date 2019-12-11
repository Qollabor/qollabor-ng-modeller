
class Milestone extends PlanItemView {
    static get definitionClass() {
        return MilestoneDefinition;
    }

    /**
     * Creates a new Milestone object
     * @param {CMMNElement} parent 
     * @param {PlanItem} definition
     */
    constructor(parent, definition) {
        super(parent, definition);
    }

    createProperties() {
        return new MilestoneProperties(this);
    }

    get markup() {
        return `<g class="scalable">
                    <rect class="cmmn-shape cmmn-border cmmn-milestone-shape" rx="20" ry="20" width="100" height="40" />
                </g>
                <text class="cmmn-text" />
                ${this.decoratorBox}`;
    }

    get textAttributes() {
        return {
            'text': {
                ref: '.cmmn-shape',
                'ref-x': .5,
                'ref-y': .5,
                'y-alignment': 'middle',
                'x-alignment': 'middle'
            }
        };
    }

    createDecorators() {
        return [
            new Decorator(REQUIRED_IMG, () => this.definition.itemControl.requiredRule),
            new Decorator(REPETITION_IMG, () => this.definition.itemControl.repetitionRule)
        ];
    }

    /**
     * returns true when an element of type 'elementType' can be added as a child to this element
     * @param {*} elementType 
     */
    __canHaveAsChild(elementType) {
        return elementType == EntryCriterion.name;
    }
}
CMMNElement.registerType(Milestone, 'Milestone', 'images/milestone_32.png');
