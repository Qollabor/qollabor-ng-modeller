class IDEMain {
    /**
     * Constructs the footer of the IDE element.
     * @param {IDE} ide 
     */
    constructor(ide) {
        this.ide = ide;
        this.html = $(
`<div class="ide-main" id="ideMain">
    <div class="repository-browser basicbox"></div>
    <div class="model-editors"></div>
</div>`);
        this.ide.html.append(this.html);

        // Now set the pointers on the this object;
        this.repositoryBrowser = new RepositoryBrowser(ide, this.html.find('.repository-browser'));
        this.divModelEditors = this.html.find('.model-editors');

        // Make a splitter between repository browser and the fixed editors div; it should also reposition the case model editor's splitter each time
        this.splitter = new LeftSplitter(this.html, '15%');

    }
}