var nodes = {};

function removeNodes() {
    removeNodeTooltips();
    $('.check-graphic').remove();
}

function createCheck(checkElement, mapName) {
    let id = $(checkElement).attr('data-check-id');
    return new Check(id,
                     $(checkElement).attr('data-behind_keys') == 'True',
                     Number($(checkElement).attr('data-difficulty')),
                     coordDict[id].locations,
                     mapName,
                     $(checkElement).attr('data-vanilla') == 'true',
                     checkContents[id],
    );
}

function createNodes(map, mapName) {
    nodes = {};

    let scaling = getMapScaling(map);

    // We're in the special entrance connecting mode
    if (graphicalMapSource != null) {
        createEntranceNodes(graphicalMapChoices, scaling, true);
        return;
    }

    if (randomizedEntrances.length > 0 && mapName == 'overworld') {
        if (args.randomstartlocation && !Entrance.isFound(startHouse)) {
            createEntranceNodes(startLocations, scaling);
        }
        else {
            createEntranceNodes(randomizedEntrances, scaling);
        }
    }

    let checks = $('li[data-logic]').toArray()
                    .map(x => createCheck(x, mapName))
                    .filter(x => x.shouldDraw());

    for (const check of checks) {
        for (const coord of check.locations) {
            if ((['advanced', 'expert', 'insanity'].includes(args.entranceshuffle)
                 && coord.indirect)
                || (args.entranceshuffle == 'simple'
                    && coord.indirect
                    && coord.inSimpleEntrance)) {
                continue;
            }

            let coordString = MapNode.nodeId(coord, scaling);

            if (!(coordString in nodes)) {
                nodes[coordString] = new MapNode(coord, scaling);
            }

            nodes[coordString].checks.push(check);
        }
    }

    distributeChecks();

    for (const key in nodes) {
        let node = nodes[key];
        node.update();

        if (node.canBeHidden()) {
            delete nodes[key];
        }
    }
}

function createEntranceNodes(entrances, scaling, update=false) {
    for (const entrance of entrances) {
        let entranceData = entranceDict[entrance];
        let coordString = MapNode.nodeId(entranceData.locations[0], scaling);

        if (!(coordString in nodes)) {
            let node = new MapNode(entranceData.locations[0], scaling, entranceData.id);
            
            if (node.entrance != null && !node.entrance.shouldDraw()) {
                node.hideMe = true;
            }

            nodes[coordString] = node;

            if (update) {
                node.update();
            }
        }
    }
}

function distributeChecks() {
    let checksByEntrance = {'landfill': [], 'bk_shop': []};
    let checksByConnector = {};
    let entrancesByConnector = {};
    let remappedNodes = [];
    let connectorsByCheckId = {};
    let shuffleConnectors = ['advanced', 'expert', 'insanity'].includes(args.entranceshuffle);

    connectors.map(connector => connector.checks.map(checkId => connectorsByCheckId[checkId] = connector));

    for (const key in nodes) {
        let node = nodes[key];

        if(node.entrance == null 
           && shuffleConnectors
           && node.checks.some(x => x.id in connectorsByCheckId)) {
            let connector = connectorsByCheckId[node.checks[0].id];
            node.entrance = new Entrance(connector.entrances[0]);
            node.hideMe = true;
        }

        if (node.entrance == null) {
            continue;
        }

        let entranceId = node.entrance.id;
        if (shuffleConnectors
            && node.entrance.isConnector()) {
            let connector = node.entrance.metadata.connector;
            if (!(connector in checksByConnector)) {
                checksByConnector[connector] = new Set();
                entrancesByConnector[connector] = new Set();
            }

            node.checks.map(x => checksByConnector[connector].add(x));
            entrancesByConnector[connector].add(entranceId);
        }
        else {
            checksByEntrance[entranceId] = node.checks;
        }

        if (!node.entrance.isMapped()) {
            if (args.entranceshuffle != 'none'
                || (node.entrance.canBeStart()
                    && !Entrance.isFound(startHouse))) {
                node.checks = [];
            }
        }

        if (node.entrance.isMapped()) {
            remappedNodes.push(node);
        }
    }

    for (const connector in entrancesByConnector) {
        for (const entranceId of entrancesByConnector[connector]) {
            checksByEntrance[entranceId] = Array.from(checksByConnector[connector]);
        }
    }

    for (const node of remappedNodes) {
        node.checks = checksByEntrance[node.entrance.connectedTo()];
    }
}

function drawNodes(mapName, animate=true) {
    let mapImg = $(`.map[data-mapname="${mapName}"`);

    if ($(mapImg).width() <= 100) {
        $(mapImg).on('load', function () { drawNodes(mapName, animate); });
        return;
    }

    animate = animate
              && localSettings.animateChecks
              && !skipNextAnimation;
    
    skipNextAnimation = false;

    $('.check-graphic.animate__fadeOut').remove();

    updateReverseMap();

    let map = $(mapImg).closest('div.map-container');
    let parent = $(map).find('div.map-wrapper');
    createNodes(map, mapName);

    for (const nodeId in nodes) {
        let node = nodes[nodeId];
        let classes = node.iconClasses();

        node.updateAnimationClasses(classes, parent, animate);
        node.updateEntranceAttrs();
        node.updateOverlay();

        $(node.graphic).attr({
            'class': classes.join(' '),
            'data-difficulty': node.difficulty,
        })

        updateTooltip(node.graphic);
    }

    removeOldNodes();
}

function removeOldNodes() {
    let oldNodeIds = $('.check-graphic').toArray()
                         .map(x => $(x).attr('data-node-id'))
                         .filter(x => !(x in nodes));

    for (const staleNodeId of oldNodeIds) {
        let node = $(`[data-node-id="${staleNodeId}"]`);
        $(node).tooltip('hide');
        $(node).removeClass('animate__bounceInDown');
        $(node).addClass('animate__fadeOut');
    }
}