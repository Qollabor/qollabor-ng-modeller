const CONNECTOR = 'connector';

class Resizer {
    /**
     * implements the resizer object for the element
     * @param {CMMNElement} element
     */
    constructor(element) {
        this.element = element;

        // Create global event listeners for proper attach/detach to the scrolling of the paper
        //  Upon scrolling we also have to change the position of the resizer.
        this.scrollListener = e => this.setPosition();

        // Note: we create the HTML directly, which in general is not good for performance.
        //  However, resizer object is only created once a CMMNElement is clicked on. 
        //  So, in practice it is a OK to create it here and now.
        this.html = $(`<div class="resizebox" element="${this.element.toString()}">
    <div class="fence"></div>
</div>`);
        this.element.case.resizeContainer.append(this.html);

        //add the corner resize handles, nw = north west etc
        if (this.element.__resizable) {
            this.addResizeHandles('nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se');
        }

        // Reposition the resizer when the element is moving
        this.element.xyz_joint.on('change:position', e => this.setPosition());        
    }

    delete() {
        Util.removeHTML(this.html);
    }

    get visible() {
        return this.html.css('display') == 'block';
    }

    set visible(visible) {
        if (visible) {
            this.setPosition();
            this.setSize();
            this.element.case.paperContainer.on('scroll', this.scrollListener);
        } else {
            this.element.case.paperContainer.off('scroll', this.scrollListener);
        }
        const visibility = visible ? 'block' : 'none';
        this.html.css('display', visibility);
    }

    /** 
     * Positions resizer, coordinates are the relative coordinates in the canvas graph area.
     * So (0, 0) is the top left corner of the canvas, not of the body/document
     */
    setPosition() {
        //compensate the position of the resizer for the scroll of the paper container
        // The reason is, that the resizer's html element is outside the paper container, hence needs to accomodate to the scroll of the paper container
        const resizerLeft = this.element.shape.x - this.element.case.paperContainer.scrollLeft();
        const resizerTop = this.element.shape.y - this.element.case.paperContainer.scrollTop();

        this.html.css('left', resizerLeft);
        this.html.css('top', resizerTop);
    }

    /**
     * sets the dimensions of the resizer
     */
    setSize() {
        this.html.width(this.element.shape.width);
        this.html.height(this.element.shape.height);
    }

    /**
     * handles the moving of an element to position the resizer around the element
     * This event handler is invoked from case.js
     */
    handleMoveElement(elementView, e, x, y) {
        this.setPosition();
    }

    /**
     * handles mousedown on handle of resizer, to resize an element
     */
    handleMouseDown(e, resizeDirection) {
        e.stopPropagation();
        e.preventDefault();
        this.element.propertiesView.hide();

        //store the original dimensions
        const eA = this.element.attributes;
        this.startX = eA.position.x;
        this.startY = eA.position.y;
        this.startW = eA.size.width;
        this.startH = eA.size.height;
        //store the coordinate of mousedown
        this.downX = e.clientX;
        this.downY = e.clientY;

        $(document).on('pointermove', e => this.handleMouseMove(e, resizeDirection));
        $(document).on('pointerup', e => this.handleMouseUp(e));
    }

    /**
     * handles mousemove on handle of resizer, to resize an element
     */
    handleMouseMove(e, resizeDirection) {
        e.preventDefault();

        const jointElement = this.element.xyz_joint;

        //for new position and size. dx, dy for coordinate change
        let x, y, w, h, dx, dy;

        const jointAttributes = jointElement.attributes;
        const eX = jointAttributes.position.x;
        const eY = jointAttributes.position.y;

        const coor = this.element.case.getCursorCoordinates(e);

        //depending on the selected handle the element should resize differently
        //determine the new position/size of the element AND resizer
        switch (resizeDirection) {
        case 'nw':
            x = coor.x;
            y = coor.y;
            w = this.startX - coor.x + this.startW;
            h = this.startY - coor.y + this.startH;
            dx = x - eX;
            dy = y - eY;

            break;
        case 'n':
            x = this.startX;
            y = coor.y;
            w = this.startW;
            h = this.startY - coor.y + this.startH;
            dx = 0;
            dy = y - eY;

            break;
        case 'ne':
            x = this.startX;
            y = coor.y;
            w = coor.x - this.startX;
            h = this.startY - coor.y + this.startH;
            dx = 0;
            dy = y - eY;

            break;
        case 'w':
            x = coor.x;
            y = this.startY;
            w = this.startX - coor.x + this.startW;
            h = this.startH;
            dx = x - eX;
            dy = 0;

            break;
        case 'e':
            x = this.startX;
            y = this.startY;
            w = coor.x - this.startX;
            h = this.startH;
            dx = 0;
            dy = 0;

            break;
        case 'sw':
            x = coor.x;
            y = this.startY;
            w = this.startX - coor.x + this.startW;
            h = coor.y - this.startY;
            dx = x - eX;
            dy = 0;

            break;
        case 's':
            x = this.startX;
            y = this.startY;
            w = this.startW;
            h = coor.y - this.startY;
            dx = 0;
            dy = 0;

            break;
        case 'se':
            x = this.startX;
            y = this.startY;
            w = coor.x - this.startX;
            h = coor.y - this.startY;
            dx = 0;
            dy = 0;

            break;
        default:
            return;
        }

        // Now make resize snap to grid, unless CTRL key is pressed
        w = Grid.snap(w);
        h = Grid.snap(h);
        x = Grid.snap(x);
        y = Grid.snap(y);
        dx = Grid.snap(dx);
        dy = Grid.snap(dy);

        if (w == this.startW && h == this.startH) {
            // Nothing was resized...
            return;
        }

        //set size of element and resizer
        this.element.__resize(w, h);
        this.setSize(); // Resize the resizer as well

        //set position of element and resizer
        this.setPosition();
        jointElement.translate(dx, dy);        
    }

    /**
     * handles the mouseup after resizing
     */
    handleMouseUp(e) {
        $(document).off('pointermove');
        $(document).off('pointerup');

        // Bit ugly to do it here, but stage.__resize() during move should not immediately reset children,
        //  this logic should only happen at the end of the resize action. This avoids that resizing
        //  across nested and subnested items wrongly adopts e.g. tasks in substages.
        if (this.element instanceof Stage) {
            this.element.resetChildren();
        }

        this.element.case.editor.completeUserAction();
    }

    addResizeHandles(...handles) {
        handles.forEach(handle => {
            const html = $(`<div handle="${handle}" class="resizehandle ${handle}"><div style="cursor:${handle}-resize"></div></div>`);
            html.on('pointerdown', e => this.handleMouseDown(e, handle));
            this.html.append(html);
        });
    }
}
