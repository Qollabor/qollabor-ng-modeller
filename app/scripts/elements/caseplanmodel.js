const MINTEXTWIDTHCPM = 200;
const CPM_WIDTH = 800;
const CPM_HEIGHT = 500;
const CPM_TAB_HEIGHT = 22;

class CasePlanModel extends Stage {
    static get definitionClass() {
        return CasePlanDefinition;
    }

    /**
     * Creates a new CasePlan model
     * @param {*} parent Must be the Case object itself.
     * @param {CasePlanDefinition} definition 
     */
    constructor(parent, definition) {
        super(parent, definition);
    }

    /** @returns {CasePlanDefinition} */
    get planItemDefinition() {
        // A case plan is both a plan item and a planitem definition
        //  It is also a stage, and a stage has distinctive plan item and planitem definition.
        //  Inside stage, we set a pointer to this.definition and this.planItemDefinition, pointing to this.definition.definition
        //  However, for case plan, there is no definition.definition, rather the case plan is the definition.definition itself.
        //  But stage is not aware of that, and relies on a planItemDefinition being present; hence we overwrite the property here.
        return this.definition;
    }

    createProperties() {
        return new CasePlanProperties(this);
    }

    createHalo() {
        return new CasePlanHalo(this);
    }

    nearElementBorder(e) {
        // We are overriding "nearElementBorder", in order to have a broader top border match on the inside for the caseplan model
        // The reason is that the case plan halo is then shown earlier. Just for convenience.
        const borderDistanceOutside = 3;
        const borderDistanceInside = 20;

        const x = e.clientX;
        const y = e.clientY;

        const offset = this.html.offset();
        const left = offset.left;
        const right = offset.left + this.shape.width;
        const top = offset.top;
        const bottom = offset.top + this.shape.height;

        const near = (a, b) => a >= (b - borderDistanceInside) && a <= (b + borderDistanceOutside);
        return near(left, x) || near(x, right) || near(top, y) || near(top+24, y) || near(y, bottom);
    }

    get __planningTablePosition() {
        return { x: 280, y: 13 };
    }

    surrounds(element) {
        // Avoid the Stage.acquireChildren method to throw out elements outside the case plan (even though visually they can be dragged outside)
        return element != this;
    }

    get markup() {
        return `<g>
                    <polyline class="cmmn-shape cmmn-border cmmn-caseplan-header-shape" points="10,${CPM_TAB_HEIGHT} 15,0 250,0 255,${CPM_TAB_HEIGHT}" />
                    <text class="cmmn-bold-text" font-size="12" />
                    <rect class="cmmn-shape cmmn-border cmmn-caseplan-shape" x="0" y="${CPM_TAB_HEIGHT}" width="${this.shape.width}" height="${this.shape.height - CPM_TAB_HEIGHT}"/>
                </g>
                ${this.decoratorBox}`;
    }

    get textAttributes() {
        return {
            'text': {
                'ref': '.cmmn-shape',
                'ref-x': .5,
                'ref-y': 18,
                'x-alignment': 'middle',
                'y-alignment': 'bottom'
            }
        };
    }

    createDecorators() {
        return [
            new Decorator(AUTOCOMPLETE_IMG, () => this.planItemDefinition.autoComplete),
        ];
    }

    /**
     * Override of basic resize method.
     * @param {*} w 
     * @param {*} h 
     */
    __resize(w, h) {
        super.__resize(w, h);
        // The rect must also be given some new dimensions
        this.html.find('.cmmn-border').attr('width', this.shape.width);
        this.html.find('.cmmn-border').attr('height', this.shape.height - CPM_TAB_HEIGHT);
    }

    __delete() {
        super.__delete();
        delete this.case.casePlanModel;
    }

    /**
     * returns true when an element of type 'elementType' can be added as a child to this element
     */
    __canHaveAsChild(elementType) {
        // Case plan can have all items of stage, except for entry criterion
        if (elementType == EntryCriterion.name) return false;
        return super.__canHaveAsChild(elementType);
    }

    createCMMNChild(cmmnType, x, y) {
        if (cmmnType == ExitCriterion) {
            return this.__addCMMNChild(new ExitCriterion(this, this.definition.createExitCriterion(x, y)));
        } else {
            return super.createCMMNChild(cmmnType, x, y);
        }
    }
}
CMMNElement.registerType(CasePlanModel, 'Case Plan', 'images/caseplanmodel_32.png');
