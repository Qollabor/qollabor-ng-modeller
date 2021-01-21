class Vertex extends DiagramElement {
    /**
     * Returns a new Vertex object for the given Edge, containing the x and y in the v object as properties.
     * (They come as x,y props through the joint library)
     * @returns {Vertex}
     * @param {Edge} edge 
     * @param {*} v 
     */
    static convert(edge, v) {
        return new Vertex(undefined, edge.dimensions, edge, v.x, v.y);
    }

    /**
     * Simple (x,y) wrapper indicating a point in a line.
     * @param {Element} importNode 
     * @param {Dimensions} dimensions 
     * @param {XMLElementDefinition} parent 
     * @param {Number} x
     * @param {Number} y
     */
    constructor(importNode, dimensions, parent, x = undefined, y = undefined) {
        super(importNode, dimensions, parent);
        this.x = this.parseNumberAttribute('x', x);
        this.y = this.parseNumberAttribute('y', y);
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, WAYPOINT, 'x', 'y');
    }
}