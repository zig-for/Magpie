function checkGraphicMouseEnter(element) {
    if ($(element).hasClass('animate__fadeOut')) {
        return;
    }

    let tooltip = bootstrap.Tooltip.getInstance(element);

    if (tooltip._isShown()) {
        return;
    }

    tooltip.show();

    if($(element).hasClass('connector')
       && $(element).is('[data-connected-to')) {
        let child = $(element).children()[0];
        let label = $(child).attr('data-connector-label');
        let selector = `[data-connector-label="${label}"]`;
        $(selector).connections({ class: 'entrance-to connector-line' });
        $(selector).connections({ class: 'outer-entrance-connection connector-line' });
    }
}

function checkGraphicMouseLeave(element) {
    if (!hasAttr(element, 'data-pinned')) {
        let tooltip = bootstrap.Tooltip.getInstance(element);
        tooltip.hide();
        $('connection.connector-line').connections('remove');
    }
}

function entranceClicked(element) {
    let destId = $(element).attr('data-entrance-id');

    if (entranceDict[graphicalMapSource].type == 'connector') {
        openConnectorDialog(destId);
    }
    else {
        connectEntrances(graphicalMapSource, destId);
    }
}

function nodePrimary(element) { 
    if (graphicalMapSource != null) {
        entranceClicked(element);
        return;
    }

    toggleNode(element);
}

function nodeSecondary(element) {
    closeOtherTooltips(element);

    if (graphicalMapSource != null) {
        entranceClicked(element);
        return;
    }


    if (hasAttr(element, 'data-pinned')) {
        $(element).removeAttr('data-pinned');
    }
    else {
        $(element).attr('data-pinned', true);
    }

    updateTooltip(element);

}

function checkGraphicLeftClick(element) {
    if ($(element).hasClass('animate__fadeOut')) {
        return;
    }

    if (localSettings.swapMouseButtons) {
        nodeSecondary(element);
    }
    else {
        nodePrimary(element);
    }
}

function checkGraphicRightClick(element) {
    if ($(element).hasClass('animate__fadeOut')) {
        return;
    }

    if (localSettings.swapMouseButtons) {
        nodePrimary(element);
    }
    else {
        nodeSecondary(element);
    }
}

function connectorMouseMove(event) {
    let mouseTracker = $('#mouseTracker');

    if (mouseTracker.length == 0) {
        mouseTracker = $('<div>', {
            id: 'mouseTracker',
            css: {
                left: event.pageX,
                top: event.pageY,
                position: 'absolute',
                'pointer-events': 'none',
                width: 1,
                height: 1,
            }
        });

        $('#firstRow').append(mouseTracker);

        let source = $(`[data-entrance-id="${graphicalMapSource}"]`);
        $(source).connections({ class: 'entrance-from', to: $(mouseTracker) });
        $(source).connections({ class: 'outer-entrance-connection', to: $(mouseTracker) });
    }

    $(mouseTracker).css({
        left: event.pageX,
        top: event.pageY,
    });

    $(mouseTracker).connections('update');
}

function keyDown(e) {
    if (e.ctrlKey && e.key == 'z') {
        undo();
    }
    else if ((e.ctrlKey && e.shiftKey && e.key == 'Z')
             || (e.ctrlKey && e.key == 'y')) {
        redo();
    }
    else if (e.key == 'Escape' && graphicalMapSource != null) {
        endGraphicalConnection();
    }
}