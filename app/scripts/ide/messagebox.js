class MessageBox {
    /**
     * handles showing of alerts, confirms etc to user
     * @param {IDE} ide
     */
    constructor(ide) {
        this.ide = ide;
        this.html = $(
`<div class="messagebox panel panel-default">
    <div class="panel-heading">
        <button type="button" class="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
        <span>&nbsp;</span>
    </div>
    <div class="panel-body"></div>
</div>`);
        this.ide.html.append(this.html);
        this.messageBoxBody = this.html.find('.panel-body');

        //add handle click close icon header
        this.html.find('.panel-heading button').on('click', () => {
            // Remove all message content, and hide the message box
            Util.clearHTML(this.messageBoxBody);
            this.hide();
        });


        // Adjust to window resizer
        $(window).on('resize', () => this.resize());

        //make draggable
        this.html.draggable({ handle: '.panel-heading', drag: () => this.resize() });
        this.html.resizable({ handles: 'e, w' });
    }

    /**
     * shows the message box
     */
    show() {
        this.html.css('display', 'block');
        this.resize();
    }

    /**
     * hides the message box
     */
    hide() {
        this.html.css('display', 'none');
    }

    resize() {
        const boxHeight = $('body').outerHeight() - this.html.offset().top - 20;
        this.html.css('max-height', boxHeight);
    }

    /**
     * Creates a message and add to message box
     * @param {String} message    : the message
     * @param {String} messageType: success, info, warning, danger
     * @param {Number} delay      : remove message after 'delay' millisec
     */
    createMessage(message, messageType, delay) {
        this.show();

        const htmlString =
`<div class="alert alert-${messageType} alert-dismissible" role="alert">
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
    </button>
    <span>${message}</span>
</div>`

        this.messageBoxBody.append(htmlString);
        

        //attach onclick to close button
        this.messageBoxBody.find('.alert > button').on('click', () => {
            //check if last message is deleted -> close box
            //this handle fires before bootstrap handle -> test for 1
            if (this.messageBoxBody.children().length <= 1) {
                this.hide();
            }
        });

        const latestMessageNode = this.messageBoxBody.children().last();
        if (delay > 0) {
            window.setTimeout(() => {
                // Remove the message after it's timeout
                Util.removeHTML(latestMessageNode);
                // If no more messages, then hide the container too.
                if (this.messageBoxBody.children().length == 0) {
                    this.hide();
                }
            }, delay);
        }
        return latestMessageNode;
    }
}