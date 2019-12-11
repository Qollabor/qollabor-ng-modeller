class VerticalSplitter extends Splitter {
    // Vertical splitter does not support minimize and restore as of now.


    get sizeAttribute() {
        return 'height';
    }

    get orientation() {
        return 'vertical';
    }

    get clientPosition() {
        return 'clientY';
    }
}

class BottomSplitter extends VerticalSplitter {
    get direction() {
        return 'bottom';
    }

    get positionAttribute() {
        return 'top';
    }

    get oppositePositionAttribute() {
        return 'bottom';
    }
}

class TopSplitter extends VerticalSplitter {
    get direction() {
        return 'top';
    }

    get positionAttribute() {
        return 'bottom';
    }

    get oppositePositionAttribute() {
        return 'top';
    }
}