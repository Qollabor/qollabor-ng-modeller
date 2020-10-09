'use strict';

/**
 * This class implements the logic to call the repository REST service to debug a case instance.
 *
 * @constructor
 */
class Debugger extends StandardForm {
    /**
     * 
     * @param {CaseModelEditor} editor 
     */
    constructor(editor) {
        super(editor, 'Debugger', 'debug-form');
        this.eventTypeFilter = '';
        this.eventNameFilter = '';
    }

    renderData() {
        this.htmlContainer.html(
            `<div>
    <div>
        <label>Case instance</label>
        <input class="caseInstanceId" type="text"></input>
        <button class="btnShowEvents">Show Events</button>
        <input style="margin-left:20px;margin-top:10px" id="hd" class="inputHideDetails" type="checkbox" checked></input>
        <label for="hd">Hide/show event user details</label>
    </div>
    <span class="debug_timestamp"></span>
    <div sid="${this.case.name}-debugger-splitter" class="debug-container">
        <div class="event-list">
            <label>Events</label>
            <div class="tableDiv">
                <table>
                    <tr>
                        <td><strong>Nr</strong></td>
                        <td><strong>Type</strong></td>
                        <td><strong>Time</strong></td>
                    </tr>
                </table>
            </div>
        </div>
        <div class="event-content">
            <label class="debugFormLabel"></label>
            <div class="codeMirrorSource debugFormContent" />
        </div>
    </div>
</div>`);

        this.html.find('.caseInstanceId').val(localStorage.getItem('debug-case-id'))
        this.login = JSON.parse(localStorage.getItem('login') || '{}')
        this.html.find('.inputHideDetails').prop('checked', this.hideDetails);

        this.html.find('.btnShowEvents').on('click', () => this.showEvents());
        this.html.find('.inputHideDetails').on('change', e => this.hideDetails = e.currentTarget.checked);

        this.splitter = new RightSplitter(this.html.find('.debug-container'), '150px');
        this.eventTable = this.html.find('.tableDiv');

        // Add code mirror for decent printing
        this.codeMirrorEventViewer = CodeMirrorConfig.createJSONEditor(this.htmlContainer.find('.debugFormContent'));

        this.keyDownHandler = e => this.handleKeyDown(e);

        // Scan for pasted text. It can upload and re-engineer a deployed model into a set of files
        this.html.find('.event-content').on('paste', e => this.handlePasteText(e));
    }

    /**
     * 
     * @param {JQuery.Event} e 
     */
    handlePasteText(e) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
        const pastedText = e.originalEvent.clipboardData.getData('text/plain');
        try {
            const potentialEvents = JSON.parse(pastedText);
            this.events = potentialEvents;
        } catch (error) {
            console.log("Cannot paste text events")
            return false;
        }
    }

    /**
     * 
     * @param {JQuery.ChangeEvent} e 
     */
    searchWith(e) {
        const searchBox = $(e.currentTarget);
        const searchText = searchBox.val();
        const filterName = searchBox.attr('filter');
        this[filterName] = searchText;
        this.renderEvents();
    }

    /**
     * Determines recursively whether each character of text1 is available in text2
     * @param {String} searchFor 
     * @param {String} searchIn 
     */
    hasSearchText(searchFor, searchIn) {
        if (!searchFor) { // Nothing left to search for, so found a hit
            return true;
        }
        if (!searchIn) { // Nothing left to search in, so did not find it.
            return false;
        }
        searchFor = searchFor.toLowerCase();
        searchIn = searchIn.toLowerCase();
        const index = searchIn.indexOf(searchFor.charAt(0));
        if (index < 0) { // Did not find any results, so returning false.
            return false;
        }
        // Continue the search in the remaining parts of text2
        const remainingText2 = searchIn.substring(index + 1, searchIn.length);
        const remainingText1 = searchFor.substring(1);
        return this.hasSearchText(remainingText1, remainingText2);
    }    

    /**
     * @returns {Boolean}
     */
    get hideDetails() {
        const hide = localStorage.getItem('hideDetails') === 'true';
        return hide;
    }

    set hideDetails(show) {
        localStorage.setItem('hideDetails', show.toString());
    }

    /**
     * 
     * @param {JQuery.KeyDownEvent} e 
     */
    handleKeyDown(e) {
        if (e.keyCode == 38) { // arrow up
            if (this.selectedEventId) {
                if (this.selectedEventId == this.events.length) {
                    // console.log("At the beginning of the table")
                    return;
                }
                const tr = this.eventTable.find(`tr[event-nr='${this.selectedEventId}']`);
                if (tr.length) {
                    // console.log("Keying up one");
                    this.selectEvent(tr[0].previousElementSibling)
                } else {

                }
            } else {
                const lastEvent = this.events.length;
                if (lastEvent) { // If there are events, select the last one (because table is showing reversed list)
                    this.selectEvent(this.eventTable.find(`tr[event-nr='${lastEvent}']`)[0])
                }
            }
        } else if (e.keyCode == 40) { // arrow down
            if (this.selectedEventId) {
                if (this.selectedEventId == 0) {
                    // console.log("At the end of the table")
                    return;
                }
                const tr = this.eventTable.find(`tr[event-nr='${this.selectedEventId}']`);
                if (tr.length) {
                    // console.log("Keying down one");
                    this.selectEvent(tr[0].nextElementSibling);
                }
            } else {
                const lastEvent = this.events.length;
                if (lastEvent) { // If there are events, select the last one (because table is showing reversed list)
                    this.selectEvent(this.eventTable.find(`tr[event-nr='${lastEvent - 1}']`)[0])
                }
            }
        }
    }

    move() {
        // CaseModelEditor moves the movable editor upon keypress (up/down). But we want to use that keypress ourselves, hence ignore the casemodeleditor with this override
        // console.log("Ignoring the move ;)")
    }

    onShow() {
        this.html.css('height', '100%');
        this.html.css('width', '100%');
        this.html.css('top', '0px');
        this.html.css('left', '0px');

        $(document.body).off('keydown', this.keyDownHandler);
        $(document.body).on('keydown', this.keyDownHandler);
        this.html.find('.btnShowEvents').focus();
    }

    onHide() {
        $(document.body).off('keydown', this.keyDownHandler);
        this.selectedEventId = undefined;
    }

    _setDeployedTimestamp(text) {
        this.html.find('.debug_timestamp').text(text);
    }

    _setContent(label, content) {
        this.html.find('.debugFormLabel').text(label);
        this.codeMirrorEventViewer.setValue(content);
        this.codeMirrorEventViewer.refresh();
    }

    get events() {
        return this._events;
    }

    /**
     * @param {Array<*>} events 
     */
    set events(events) {
        this._events = events;
        this.pics = events.filter(event => event.type === 'PlanItemCreated');
        console.log(`Found ${events.length} events`)
        this.renderEvents();

        const picPrinter = (pic, index) => {
            return `${index}: ${pic.content.type}[${pic.content.name + '.' + pic.content.planitem.index}]`;
        }
        if (this.pics.length > 0) { // Otherwise probably a tenant is rendered
            console.log(`Case has ${this.pics.length} plan items:\n ${this.pics.map(picPrinter).join('\n ')}`);
        }
    }

    getStage(event) {
        const stageId = event.content.stageId;
        if (! stageId) {
            return "TOP";
        }
        const stagePIC = this.pics.find(pic => pic.content.planItemId === stageId);
        if (!stagePIC) {
            return "missing stage "+ stageId
        }
        return stagePIC.content.name + "." + stagePIC.content.planitem.index;
    }

    getEventName(event) {
        const planItemId = event.content.planItemId || event.content.taskId;
        if (!planItemId) return '';
        // console.log("Searching for event with id "+planItemId)
        const eventWithName = this.getPlanItemName(planItemId);
        const eventIndex = this.getIndex(eventWithName);
        // console.log("Event with name: "+(eventWithName ? (eventWithName.content.name) : 'none'));
        return eventWithName;
    }

    getPlanItemName(planItemId) {
        const pic = this.pics.find(p => p.content.planItemId === planItemId);
        if (pic) {
            return pic.content.name + '.' + pic.content.planitem.index;
        } else {
            return '';
        }

    }

    getIndex(eventWithName) {
        if (! eventWithName) return '';
        if (! eventWithName.content) return '';
        if (! eventWithName.content.planitem) return '';
        const index = eventWithName.content.planitem.index;
        if (index) {
            return '.' + index;
        } else {
            return '.0';
        }
    }

    renderEvents() {
        const renderedBefore = this.eventTable.find('tr').length > 1;
        const startMsg = this.events.length > 0 ? '' : 'If there are no events, check case instance id and context variables';
        this._setContent('', startMsg);
        Util.clearHTML(this.eventTable);

        const getBackgroundColor = event => {
            if (event.type !== 'PlanItemTransitioned') return '';
            if (event.content.currentState == 'Failed') return 'color: red; font-weight: bold';
            if (event.content.currentState == 'Completed') return 'color: green; font-weight: bold';
            if (event.content.currentState == 'Terminated') return 'color: darkblue; font-weight: bold';
        }

        const eventTypes = this.eventTypeFilter.split(' ');
        const eventNames = this.eventNameFilter.split(' ');

        const applyFilter = event => {
            const eventType = event.type;
            const eventName = this.getEventName(event);
            const hasOneOfEventTypes = eventTypes[0] == '' || eventTypes.find(type => this.hasSearchText(type, eventType));
            const hasOneOfEventNames = eventNames[0] == '' || eventNames.find(name => this.hasSearchText(name, eventName));
            return hasOneOfEventTypes && hasOneOfEventNames;
        }

        let currentTimestamp = '';
        let numTransactions = 0;

        const eventSelection = this.events.filter(applyFilter);
        const newRows = eventSelection.map(event => {
            const timestamp = event.content.modelEvent.timestamp ? event.content.modelEvent.timestamp : event.type.indexOf('Modified') >=0 ? event.content.lastModified : '';
            let timestampString = timestamp;
            if (! currentTimestamp) { // bootstrap
                currentTimestamp = timestamp;
                numTransactions = 1;
                timestampString = `<strong>${timestamp}</strong>`;
            }
            if (currentTimestamp != timestamp) {
                currentTimestamp = timestamp;
                numTransactions++;
                timestampString = `<strong>${timestamp}</strong>`;
            }
            const bgc = getBackgroundColor(event);
            return `<tr event-nr="${event.nr - 1}">
                <td>${event.nr}</td>
                <td style="${bgc}">${event.type}</td>
                <td>${this.getEventName(event)}</td>
                <td>${timestampString}</td>
            </tr>\n`
        }).reverse().join('');
        this.eventTable.html(`<table>
            <tr>
                <td><strong>Nr</strong><br/><div>count: ${eventSelection.length}</div></td>
                <td><strong>Type</strong><br/><input type="text"  filter="eventTypeFilter" value="${this.eventTypeFilter}" /></td>
                <td><strong>Name</strong><br/><input type="text" filter="eventNameFilter" value="${this.eventNameFilter}" /></td>
                <td><strong>Time</strong><div>batches: ${numTransactions}</div></td>
            </tr>
            ${newRows}
        </table>`);
        this.eventTable.find('tr').on('click', e => this.selectEvent(e.currentTarget));
        this.eventTable.find('input[filter]').on('change', e => this.searchWith(e));

        if (this.eventTable.width() < this.eventTable.find('table').width()) {
            this.splitter.repositionSplitter(this.eventTable.find('table').width() + 20);
        }
        if (!renderedBefore) this.splitter.repositionSplitter(this.eventTable.find('table').width() + 70);
    }

    get selectedEventId() {
        return this._evtId;
    }

    set selectedEventId(id) {
        this._evtId = id;
    }

    /**
     * @param {Element} tr
     */
    selectEvent(tr) {
        const eventId = $(tr).attr('event-nr');
        if (eventId) {
            this.selectedEventId = eventId;
            const event = this.events[eventId];
            if (event.type === 'CaseDefinitionApplied') {
                console.group('CaseDefinition');
                console.log(event.content.definition.source);
                console.groupEnd();
            }
            this.eventTable.find('tr').css('background-color', '')
            $(tr).css('background-color', 'rgb(156, 175, 226)');
            const content = JSON.parse(JSON.stringify(event.content));
            if (this.hideDetails) {
                delete content.modelEvent;
                delete content.caseInstanceId;
            }
            this._setContent('', JSON.stringify(content, undefined, 3));
        }
    }

    showEvents() {
        // if (!this.token) {
            // this.getJWTToken(() => this.loadEvents())
        // } else {
            this.loadEvents();
        // }
    }

    loadEvents() {
        const caseInstanceId = this.html.find('.caseInstanceId').val();
        localStorage.setItem('debug-case-id', caseInstanceId.toString());
        $.get('/repository/api/events/' + caseInstanceId)
            .done(data => this.events = data)
            .fail(data => ide.danger(data.responseText));
    }
}