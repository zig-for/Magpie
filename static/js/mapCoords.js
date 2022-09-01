var newChecks = [];
var activeCheck = null;

function loadChecks() {
    for (const id in coordDict) {
        newChecks.push(coordDict[id]);
        // let checks = coordDict[id];

        // let newCheck = {
        //     id: checks[0].id,
        //     area: checks[0].area,
        //     name: checks[0].name,
        //     locations: [],
        // };

        // for (const check of checks) {
        //     let newLocation = {
        //         map: check.map,
        //         x: check.x,
        //         y: check.y,
        //         index: 0,
        //     };

        //     newCheck.locations.push(newLocation);
        // }

        // newChecks.push(newCheck);
    }
}

function checkClicked(element) {
    let id = $(`#${element.id}-id`).attr('value');
    activeCheck = newChecks.filter(x => x.id == id)[0];
    $('.check-item.active').removeClass('active');
    $(element).addClass('active');

    refreshLocationList();
}

function refreshCheckList() {
    let checkListGroup = $('#checkListGroup');

    for(const check of newChecks) {
        let item = `<div id="${check.id}" class="list-group-item check-item" onclick="checkClicked(this);">
            <p>${check.id}: ${check.area} - ${check.name}</p>
            <input class="form-input check-input" type="text" value="${check.id}" id="${check.id}-id">
            <input class="form-input check-input" type="text" value="${check.area}" id="${check.area}-area">
            <input class="form-input check-input" type="text" value="${check.name}" id="${check.area}-name">
        </div>`;

        $(checkListGroup).append(item);
    }
}

function refreshLocationList() {
    let locationListGroup = $('#checkLocationsListGroup');

    $(locationListGroup).html('');

    for (const location of activeCheck.locations) {
        let item = `<div class="list-group-item location-item">
            <p>${location.map} (${location.x}, ${location.y})</p>
        </div>`;

        locationListGroup.append(item);
    }

    drawActiveTab();
}

function drawActiveTab() {
    let activeTabId = $('ul#mapTabs button.active').attr('id');
    let button = $(`button#${activeTabId}`)[0];
    drawTab(button);
}

function drawTab(button) {
    if (activeCheck == null) {
        return;
    }

    let mapName = getMapNameFromButton(button);
    let mapImg = $(`.map[data-mapname="${mapName}"`);
    let map = $(mapImg).closest('div.tab-pane');
    let parent = $(map).find('div.map-wrapper');
    let checkSize = 24;

    $('.checkGraphic').remove();

    for (const location of activeCheck.locations) {
        if (location.map != mapName) { continue; }

        let xScale = Math.min(1, $(map).width() / $(map).find('.map').prop('naturalWidth'));
        let yScale = Math.min(1, $(map).height() / $(map).find('.map').prop('naturalHeight'));

        let xOffset = (16 * xScale - checkSize) / 2;
        let yOffset = (16 * yScale - checkSize) / 2;

        let x = location.x * xScale + xOffset;
        let y = location.y * yScale + yOffset;

        graphic = $('<div>', {
            'id': `${location.map};${location.x};${location.y}`,
            css: {
                'top': y,
                'left': x,
                'width': checkSize,
                'height': checkSize,
            },
            class: 'checkGraphic difficulty-0',
            onclick: 'graphicClick(this);',
            oncontextmenu: 'checkGraphicRightClick(this); return false;',
        });

        $(parent).append(graphic);
    }
}

function mapClick(img, event) {
    let info = getTileCoords(event, img);
    let location = {
        map: info.map,
        x: info.x,
        y: info.y,
        index: 0,
    }

    activeCheck.locations.push(location);

    refreshLocationList();
}

function graphicClick(graphic) {
    let map;
    let x;
    let y;
    [map, x, y] = $(graphic).attr('id').split(';');

    let clickedLocation = null;
    for (const location of activeCheck.locations) {
        if (location.map == map && location.x == Number(x) && location.y == Number(y)) {
            clickedLocation = location;
            break;
        }
    }

    let index = activeCheck.locations.indexOf(clickedLocation);
    activeCheck.locations.splice(index, 1);

    refreshLocationList();
}

function getTileCoords(event, element) {
    let bounds = element.getBoundingClientRect();
    let left = bounds.left;
    let top = bounds.top;
    let x = event.pageX - left - window.scrollX;
    let y = event.pageY - top - window.scrollY;
    let map = element.dataset.mapname;

    let xScale = Math.min(1, $(element).width() / $(element).prop('naturalWidth'));
    let yScale = Math.min(1, $(element).height() / $(element).prop('naturalHeight'));

    x /= xScale;
    y /= yScale;

    if (map == 'overworld') {
        x -= Math.floor(x / 160) * 2;
        y -= Math.floor(y / 128) * 2;
    }

    let targetX = Math.floor(x / 8) * 8;
    let targetY = Math.floor(y / 8) * 8;

    if (map == 'overworld') {
        xOffset = Math.floor(x / 160) * 2;
        yOffset = Math.floor(y / 128) * 2;

        targetX += xOffset;
        targetY += yOffset;
    }

    return {x: targetX,
        y: targetY,
        xScale: xScale,
        yScale: yScale,
        top: top,
        left: left,
        map: map,
    };
}

function drawCursor(event, element, window) {
    let info = getTileCoords(event, element);

    $("#cursor").css({
        'top': info.y * info.yScale + info.top,
        'left': info.x * info.xScale + info.left,
        'width': 16 * info.xScale,
        'height': 16 * info.xScale,
    });
}

function getMapNameFromButton(button) {
    let target = $(button).attr('data-bs-target');
    let img = $(`${target} img.map`);
    let mapName = $(img).attr('data-mapname');

    return mapName;
}

function copyChecks() {
    let newCheckDict = {};
    for (const check of newChecks) {
        newCheckDict[check.id] = check;
    }

    let json = JSON.stringify(newCheckDict);
    navigator.clipboard.writeText(json);
}

loadChecks();
refreshCheckList();
$("#overworldTab").click();