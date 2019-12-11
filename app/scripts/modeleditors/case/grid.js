/**
 * Grid class contains some statics to arrange for the global settings of the grid.
 * Grid settings (size and whether visible or not) are stored in LocalStorage of the browser.
 * Also they can be modified from the IDE header above cases.
 * Grid is currently attached to the paper object of each case (see case.js).
 */

const grids = []; // List of all grid objects; forms a memory leak, in anticipation of keeping only one canvas for all cases, instead of a canvas per case.

class Grid {

    static initialize() {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        // Restore settings from local storage.
        $('#inputGridSize')[0].value = Grid.Size = Settings.gridSize;
        $('#inputShowGrid')[0].checked = Grid.Visible = Settings.gridVisibility

        // Attach listeners to the HTML with the settings.
        // These are "global" listeners, and we keep track of an array with ALL grids (so basically a memory leak, because grid objects are create in case.js)
        // Whenever a settings is modified, all grids will be informed of the change and everything will be recalculated
        $('#inputGridSize').on('change', e => Grid.Size = e.currentTarget.value);
        $('#inputGridSize').on('keydown', e => e.stopPropagation()); // Avoid backspace and delete to remove elements from the canvas
        $('#inputShowGrid').on('change', e => Grid.Visible = e.currentTarget.checked);
    }

    /**
     * Returns global grid size setting
     */
    static get Size() {
        this.initialize();
        return Grid.__size;
    }

    /**
     * Changes global grid size.
     * - Validates that it is an actual number, greater than 0.
     * - Stores the new size in local storage.
     * - Generates new background raster.
     * - Updates all grid objects with the new size.
     */
    static set Size(newSize) {
        // Only set new grid size if it is a valid value.
        if (newSize <= 0 || !Number.isInteger(Number.parseFloat(newSize)) || isNaN(newSize)) {
            ide.warning(`Grid size must be a whole number greater than zero instead of ${newSize}`);
            return;
        }
        // Store it in the settings
        Settings.gridSize = newSize;
        Grid.__size = newSize;

        // And inform all grids about the new size
        grids.forEach(grid => grid.size = newSize);
    }

    /**
     * Fetches the background image setting (whether filled with the raster or empty, depending on the visibility setting)
     */
    static get BackgroundImage () {
        return Grid.Visible ? Grid.Raster : '';
    }

    /**
     * Returns global grid visibility setting
     */
    static get Visible() {
        return Grid.__visible;
    }

    /**
     * Snaps the number to the nearest grid dot. If ctrl-key is pressed, it will not snap.
     * @param {Number} number
     * @returns {Number}
     */
    static snap(number) {
        return window.event.ctrlKey ? number : Grid.Size * Math.round(number / Grid.Size);
    }

    /**
     * Changes global grid visibility
     * - validates that it is a boolean
     * - stores it in local storage
     * - updates all grids with the new background image (visibile or not)
     */
    static set Visible(visibility) {
        if (typeof(visibility) !== 'boolean') {
            console.warn('Cannot set visibility of the grid with a value of type ' + typeof(visibility) + ', it must be of type boolean');
            return;
        }
        Settings.gridVisibility = visibility;
        Grid.__visible = visibility;
        // Change the background image
        grids.forEach(grid => grid.paper.$el.css('background-image', Grid.BackgroundImage));
        if (visibility) {
            grids.forEach(grid => grid.paper.drawGrid({ color: 'black' }));
        }
        else {
            grids.forEach(grid => grid.paper.clearGrid());
        }
    }

    static blurSetSize() {
        if ($('#inputGridSize').is(':focus')) {
            $('#inputGridSize').trigger('blur');
        }
    }

    /**
     * Helper class that adds grid structure to the jointjs paper element.
     * We can set the .size and the .visible property.
     * @param {*} paper 
     */
    constructor(paper) {
        this.paper = paper;
        // Initialize grid from global settings
        this.size = Grid.Size;
        // Register grid for changes to the settings
        grids.push(this);
    }

    /**
     * Sets a new grid size. This must be a valid number higher than 0.
     * @param {number} newSize The new size of the grid
     */
    set size(newSize) {
        // Set grid size on the JointJS paper object (joint.dia.Paper instance)
        this.paper.options.gridSize = newSize;
        Grid.Visible = Grid.__visible;

        // Set background image again, because it may have changed
        this.paper.$el.css('background-image', Grid.BackgroundImage);
    }
}