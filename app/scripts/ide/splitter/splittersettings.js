class SplitterSettings {
    constructor() {
        this.splitters = {};
    }

    get(html) {
        const splitterId = html.attr('id');
        if (!splitterId) {
            return new AnonymousSplitterSettings();
        }
        if (!this.splitters[splitterId]) {
            this.splitters[splitterId] = {};
        }
        this.splitters[splitterId].save = () => this.save();
        return this.splitters[splitterId];
    }

    save() {
        Settings.splitters = this;
    }
}

class AnonymousSplitterSettings {
    constructor() {
        // console.log("Creating anonymous splitter")
    }
    save() {
        // console.log("Saving into anonmymous splitter")
    }
}
