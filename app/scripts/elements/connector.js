class Connector {
    /**
     * 
     * @param {Case} cs 
     * @param {Edge} edge 
     */
    static createConnectorFromEdge(cs, edge) {
        const findItem = (cs, edge, propertyName) => {
            const id = edge[propertyName];
            const item = cs.getItem(id);
            if (item) return item;
            // conversion of sentries
            const definitionElement = cs.caseDefinition.getElement(id);
            if (definitionElement && definitionElement instanceof SentryDefinition) {
                console.log('Found old sentry ' + id);
                const criterionDefinition = cs.caseDefinition.elements.find(element => element instanceof CriterionDefinition && element.sentryRef == id);
                if (criterionDefinition) {
                    console.log('Converting connector between sentry elements');
                    const criterionView = cs.items.find(item => item.id == criterionDefinition.id);
                    if (criterionView) {
                        edge[propertyName] = criterionView.id;
                    }
                    return criterionView;
                } else {
                    console.log('Cannot convert old sentry; apparently it has not been migrated?!');
                }
            }
        }

        const source = findItem(cs, edge, 'sourceId');
        const target = findItem(cs, edge, 'targetId');

        if (!source) {
            console.warn('Found illegal edge, without source ' + edge.sourceId, edge, target);
            return;
        }
        if (!target) {
            console.warn('Found illegal edge, without target ' + edge.targetId, edge, source);
            return;
        }
        return new Connector(cs, source, target, edge);
    }

    /**
     * Creates a connector object and an edge between the source and the target element.
     * @param {CMMNElement} source 
     * @param {CMMNElement} target 
     */
    static createConnector(source, target) {
        const edge = Edge.create(source, target);
        return new Connector(source.case, source, target, edge);
    }

    /**
     * Creates a connector (=link in jointJS) between a source and a target.
     * @param {Case} cs 
     * @param {CMMNElement} source 
     * @param {CMMNElement} target 
     * @param {Edge} edge 
     */
    constructor(cs, source, target, edge) {
        this.case = cs;
        this.source = source;
        this.target = target;
        this.edge = edge;
        this.sentry = source instanceof Sentry ? source : target instanceof Sentry ? target : undefined;

        const arrowStyle = this.sentry ? '8 3 3 3 3 3' : '5 5'

        this.xyz_joint = this.link = new joint.dia.Link({
            source: { id: this.source.xyz_joint.id },
            target: { id: this.target.xyz_joint.id },
            attrs: {
                '.connection': { 'stroke-dasharray': arrowStyle }
            }
        });

        this.link.set('vertices', edge.vertices);
        this.__setJointLabel(edge.label);

        // Temporary bridge, to make Connector align as the others. Perhaps we should make Connector extend CMMNElement
        this.link.xyz_cmmn = this;

        // Listen to the native joint event for removing, as removing a connector in the UI is initiated from joint.
        //  This opposed to how it is done in the other CMMNElements, there we have an explicit delete button ourselves.
        this.link.on('remove', cell => {
            // Remove connector from source and target, and also remove the edge from the dimensions through the case.
            source.__removeConnector(this);
            target.__removeConnector(this);
            this.case.__removeConnector(this);
            this.case.editor.completeUserAction(); // Save the case
        });

        this.link.on('change:vertices', e => {
            // Joint generates many change events, so we will not completeUserAction() each time,
            //  Instead, this is done when handlePointerUpPaper in case.js
            this.edge.vertices = e.changed.vertices;
        });

        // Render the connector in the case.
        this.case.__addConnector(this);
        // Inform both source and target about this new connector; just adds it to their connector collections.
        source.__addConnector(this);
        target.__addConnector(this);
        // Now inform source that it has connected to target
        source.__connectedTo(target);
        // And inform target that source has connected to it
        target.__connectedFrom(source);
    }

    __setJointLabel(text) {
        this.link.label(0, {
            attrs: {
                text: { text: text, 'font-size': 'smaller' }
            }
        });
    }

    /**
     * Set/get the label of the connector
     * @param {String} text
     */
    set label(text) {
        this.edge.label = text;
        this.__setJointLabel(text);
    }

    get label() {
        return this.edge.label;
    }

    mouseEnter() {
        // On mouse enter of a 'sentry' linked connector, we will show the standard event if it is not yet visible.
        //  It is hidden again on mouseout
        this.formerLabel = this.label;
        if (this.label || ! this.sentry) return;
        const onPart = this.sentry.__getOnPart(this);
        this.__setJointLabel(onPart.standardEvent);
    }

    mouseLeave() {
        this.__setJointLabel(this.formerLabel);
    }

    /**
     * Returns true if the connector is connected to a cmmn element with the specified id (either as source or target).
     * Note: this does not indicate whether it is connected at the source or the target end of the connector.
     * @param {String} id 
     * @returns {Boolean} Whether or not one of the sides of the connector is an element having the specified id.
     */
    hasElementWithId(id) {
        return this.source.id == id || this.target.id == id;
    }

    /**
     * Removes this connector
     */
    remove() {
        this.link.remove();
    }
}

class TemporaryConnector {
    /**
     * Creates a temporary connector (=link in jointJS) from the source to a set of target coordinates
     * @param {CMMNElement} source 
     * @param {*} coordinates 
     */
    constructor(source, coordinates) {
        this.source = source;
        this.link = new joint.dia.Link({
            source: { id: source.xyz_joint.id },
            target: coordinates,
            attrs: {
                '.connection': { 'stroke': 'blue' }
            }
        });
        this.link.xyz_cmmn = this;
        source.case.graph.addCells([this.link]);
    }

    mouseEnter() {    }

    mouseLeave() {    }

    /**
     * Removes this temporary connector
     */
    remove() {
        this.link.remove();
    }

    /**
     * Changes the end point of the temporary connector. This is done typically on mouse move.
     */
    set target(coordinates) {
        this.link.set('target', coordinates);
    }
}