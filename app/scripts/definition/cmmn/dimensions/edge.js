class Edge extends DiagramElement {
    /**
     * Create a new Edge shape that binds the two CMMNElements.
     * @param {CMMNElement} source 
     * @param {CMMNElement} target
     * @returns {Edge}
     */
    static create(source, target) {
        const edge = new Edge(undefined, source.case.caseDefinition.dimensions);
        edge.sourceId = source.id;
        edge.targetId = target.id;
        source.case.caseDefinition.dimensions.edges.push(edge);
        return edge;
    }

    /**
     * Representation of a <CMMNEdge> element
     * @param {Element} importNode 
     * @param {Dimensions} dimensions 
     * @param {XMLElementDefinition} parent 
     */
    constructor(importNode, dimensions, parent = dimensions) {
        super(importNode, dimensions, parent);
        this.sourceId = this.parseAttribute(SOURCECMMNELEMENTREF);
        this.targetId = this.parseAttribute(TARGETCMMNELEMENTREF);
        /** @type {Array<Vertex>} */
        this._vertices = this.parseElements(WAYPOINT, Vertex);
        this.label = this.parseAttribute('label', '');
    }

    get vertices() {
        return this._vertices;
    }

    set vertices(vertices) {
        this._vertices = vertices.map(v => Vertex.convert(this, v));
    }

    /**
     * Removes this edge from the dimensions.
     */
    removeDefinition() {
        Util.removeFromArray(this.dimensions.edges, this);
    }

    createExportNode(diagramNode) {
        super.createExportNode(diagramNode, CMMNEDGE, 'label', 'vertices');
        super.exportProperty(SOURCECMMNELEMENTREF, this.sourceId);
        super.exportProperty(TARGETCMMNELEMENTREF, this.targetId);
    }
}