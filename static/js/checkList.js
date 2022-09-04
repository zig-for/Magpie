function saveChecked() {
    localStorage.setItem('checkedChecks', JSON.stringify(checkedChecks));
}

function saveEntrances() {
    localStorage.setItem('entranceMapping', JSON.stringify(entranceMapping));
}

function saveLocations() {
    saveChecked();
    saveEntrances();
}

function loadLocations() {
    loadChecked();
    loadEntrances();

    refreshChecked();
}

function loadEntrances() {
    try {
        entranceMapping = JSON.parse(localStorage.getItem('entranceMapping'));
    }
    catch (err) {
    }

    if (entranceMapping == null) {
        entranceMapping = {};
    }
}

function loadChecked() {
    try {
        checkedChecks = JSON.parse(localStorage.getItem('checkedChecks'));
    }
    catch (err) {
    }

    if (checkedChecks == null) {
        checkedChecks = {};
    }
}

function getCheckedKey(area, name) {
    return `${area}-${name}`;
}

function toggleNode(node) {
    $(node).tooltip('hide');

    let checkIds = $(node).attr('data-ids').split(',');
    let toggleList = new Set();
    let outOfLogic = new Set();

    for (const checkId of checkIds) {
        let chunks = checkId.split(';');
        let id = chunks[0];
        let difficulty = chunks[1];
        let coord = coordDict[id];
        let fullName = `${coord.area}-${coord.name}`;

        if (!(fullName in checkedChecks || difficulty == 9)) {
            toggleList.add(id);
        }

        if (difficulty == 9) {
            outOfLogic.add(id);
        }
    }

    if (toggleList.size > 0) {
        toggleChecks(toggleList);
    }
    else {
        if (outOfLogic.size > 0) {
            toggleChecks(outOfLogic);
        }
        else {
            toggleChecks(new Set(checkIds.map(x => x.split(';')[0])));
        }
    }

    drawActiveTab();
}

function toggleSingleNodeCheck(check) {
    let id = $(check).attr('data-id');
    let textCheck = $(`li[data-id="${id}"`);
    $(`.checkGraphic`).tooltip('hide');
    toggleCheck(null, textCheck);
}

function toggleChecks(checks) {
    for (const id of checks) {
        let textCheck = $(`li[data-id="${id}"`);
        toggleCheck(null, textCheck, false);
    }
}

function toggleCheck(event, elements, draw=true) {
    for (const element of elements) {
        let area = $(element).attr('data-checkarea');
        let name = $(element).attr('data-checkname');
        let logic = $(element).closest(".row[data-logic]").attr('data-logic');
        let key = getCheckedKey(area, name);

        if (logic != 'Checked') {
            check = {
                name: name,
                area: area,
            };

            checkedChecks[key] = check;
            moveCheckToChecked(element);
        }
        else {
            delete checkedChecks[key];
            moveCheckFromChecked(element);
        }

        saveChecked();
    }

    preventDoubleClick(event);

    if (draw) {
        drawActiveTab();
    }
}

function moveCheckToChecked(element) {
    let logic = $(element).attr('data-logic');
    let area = $(element).attr('data-checkarea');
    let destArea = $(`[data-logic="Checked"] [data-area="${area}"]`)
    let sourceArea = $(`[data-logic="${logic}"] [data-area="${area}"]`);

    if (destArea.length == 0) {
        let destLogic = $('.row[data-logic=Checked]');
        let accordionItem = $(destLogic).closest('.accordion-item');
        let newCard = $(sourceArea).clone();

        ul = $(newCard).find('ul');
        $(ul).html('');

        $(accordionItem).removeClass('hidden');
        $(destLogic).append(newCard);

        destArea = $(`[data-logic="Checked"] [data-area="${area}"]`)
    }

    ul = $(destArea).find('ul');
    $(ul).append(element);

    if ($(sourceArea).find('ul').children().length == 0) {
        $(sourceArea).remove();
    }

    if (logic != 'In logic') {
        let sourceLogic = $(`.row[data-logic="${logic}"]`).closest('.accordion-item');
        if ($(sourceLogic).find('[data-area]').length == 0) {
            $(sourceLogic).addClass('hidden');
        }
    }
}

function moveCheckFromChecked(element) {
    let logic = $(element).attr('data-logic');
    let area = $(element).attr('data-checkarea');
    let destArea = $(`[data-logic="${logic}"] [data-area="${area}"]`);
    let sourceArea = $(`[data-logic="Checked"] [data-area="${area}"]`)

    if (destArea.length == 0) {
        let destLogic = $(`.row[data-logic="${logic}"]`);
        let accordionItem = $(destLogic).closest('.accordion-item');
        let newCard = $(sourceArea).clone();

        ul = $(newCard).find('ul');
        $(ul).html('');

        $(accordionItem).removeClass('hidden');
        $(destLogic).append(newCard);

        destArea = $(`[data-logic="${logic}"] [data-area="${area}"]`);
    }

    ul = $(destArea).find('ul');
    $(ul).append(element);

    if ($(sourceArea).find('ul').children().length == 0) {
        $(sourceArea).remove();
    }

    let sourceLogic = $(`.row[data-logic="Checked"]`).closest('.accordion-item');
    if ($(sourceLogic).find('[data-area]').length == 0) {
        $(sourceLogic).addClass('hidden');
    }
}

function refreshChecked() {
    for (let key in checkedChecks) {
        let check = checkedChecks[key];
        element = $(`li[data-checkarea="${check.area}"][data-checkname="${check.name}"]`);
        if (element.length > 0) {
            moveCheckToChecked(element[0]);
        }
    }
}

function resetLocations() {
    checkedChecks = {};
    entranceMapping = {};
    saveLocations();
}