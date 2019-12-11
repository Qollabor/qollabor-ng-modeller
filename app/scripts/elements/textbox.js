class TextBox extends CMMNElement {
    /**
     * 
     * @param {Stage} stage 
     * @param {Number} x 
     * @param {Number} y 
     */
    static create(stage, x, y) {
        const shape = TextBoxShape.create(stage.definition, x, y);
        return new TextBox(stage, shape);
    }

    /**
     * Creates a new TextBox element
     * @param {Stage} parent 
     * @param {TextBoxShape} definition 
     */
    constructor(parent, definition) {
        super(parent, definition);
        this.definition = definition;
    }

    createProperties() {
        return new TextBoxProperties(this);
    }

    get markup() {
        return `<g class="scalable">
                    <rect class="cmmn-shape cmmn-border cmmn-textbox-shape" rx="5" ry="5" />
                </g>
                <text class="cmmn-text" />`;
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
}
CMMNElement.registerType(TextBox, 'Text Box', 'images/textbox_32.png');
