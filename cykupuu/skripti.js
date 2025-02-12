/*
Pakolliset initiaatiot yms
*/

"use strict";

var cy = cytoscape({
    container: document.getElementById('cy'), // container to render in
    elements: [],

    style: [ // the stylesheet for the graph
        {
            selector: 'node',
            style: {
                'background-color': '#666',
                'label': 'data(id)'
            }
        },
        {
            selector: ':selected',
            style: {
                'color': 'maroon',
                'background-color': 'red'
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 3,
                'line-color': '#ccc',
                'target-arrow-color': '#ccc',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier'
            }
        },
        {
            selector: 'edge.round-taxi',
            style: {
                'curve-style': 'round-taxi',
                'taxi-direction': 'downward',
                'taxi-turn': 20,
                'taxi-turn-min-distance': 5,
                'taxi-radius': 10
            }
        }
    ],

    layout: {
        name: 'grid',
        rows: 1
    },

    // options
    zoom: 1,
    wheelSensitivity: 0.5,
    minZoom: 0.05,
    maxZoom: 4
});

var previouslyRemoved = [];  // säilötään, että voidaan undo'ata!

/*


Muuttujat ja data
*/

const henkilodata = [
    { nimi: "hlö0", suhteet: null },  // Tässä esimerkissä nyt nimi on yksilöivä kuin id
    { nimi: "hlö1", suhteet: null },
    { nimi: "hlö2", suhteet: null },
    { nimi: "hlö3", suhteet: null },
    { nimi: "hlö4", suhteet: null },
    { nimi: "hlö5", suhteet: null },
    { nimi: "hlö6", suhteet: null },
    { nimi: "hlö7", suhteet: null },
    { nimi: "hlö8", suhteet: null },
    { nimi: "hlö9", suhteet: null },
    { nimi: "hlö10", suhteet: null },
    { nimi: "hlö11", suhteet: null },
    { nimi: "hlö12", suhteet: null },
    { nimi: "hlö13", suhteet: null },
    { nimi: "hlö14", suhteet: null },
    { nimi: "hlö15", suhteet: null },
    { nimi: "hlö16", suhteet: null },
    { nimi: "hlö17", suhteet: null },
    { nimi: "hlö18", suhteet: null }
];
const suhdeData = [
    {   // yksi olio on yksittäinen suhde
        suhdeId: 100, suhdetyyppi: "parisuhde",
        osalliset: [henkilodata[0], henkilodata[1]],
        lapset: [henkilodata[2], henkilodata[3]]
    },
    {
        suhdeId: 101, suhdetyyppi: "parisuhde",
        osalliset: [henkilodata[4], henkilodata[5]],
        lapset: [henkilodata[6], henkilodata[7], henkilodata[8],]
    },
    {
        suhdeId: 102, suhdetyyppi: "eronnut",
        osalliset: [henkilodata[9], henkilodata[10]],
        lapset: [henkilodata[11]]
    },
    {
        suhdeId: 103, suhdetyyppi: "härdelli",
        osalliset: [henkilodata[12], henkilodata[13], henkilodata[14], henkilodata[15]],
        lapset: [henkilodata[16]]
    },
    {
        suhdeId: 104, suhdetyyppi: "avopari",
        osalliset: [henkilodata[17], henkilodata[18]],
        lapset: null
    },
];

henkilodata[0].suhteet = suhdeData[0];
henkilodata[1].suhteet = suhdeData[0];
henkilodata[2].suhteet = suhdeData[0];
henkilodata[3].suhteet = suhdeData[0];
henkilodata[4].suhteet = suhdeData[1];
henkilodata[5].suhteet = suhdeData[1];
henkilodata[6].suhteet = suhdeData[1];
henkilodata[7].suhteet = suhdeData[1];
henkilodata[8].suhteet = suhdeData[1];
henkilodata[9].suhteet = suhdeData[2];
henkilodata[10].suhteet = suhdeData[2];
henkilodata[11].suhteet = suhdeData[2];
henkilodata[12].suhteet = suhdeData[3];
henkilodata[13].suhteet = suhdeData[3];
henkilodata[14].suhteet = suhdeData[3];
henkilodata[15].suhteet = suhdeData[3];
henkilodata[16].suhteet = suhdeData[3];
henkilodata[17].suhteet = suhdeData[4];
henkilodata[18].suhteet = suhdeData[4];

/*


Funktiot
*/

function init() {
    document.addEventListener("keydown", nappaimienKuuntelija);
}

function nappaimienKuuntelija(event) {
    if (event.code === "Delete") {
        const nodet = cy.nodes(":selected");
        previouslyRemoved.push(cy.remove(nodet));  // käyttää jquery-mäisiä selectoreita (mutta ei itse jqueryä - riippuvuukseton)
        return;
    }
    if (event.code === "Backspace") {
        let edget = cy.edges(":selected");
        previouslyRemoved.push(cy.remove(edget));  // bäckspeissillä saa poistaa vain kaaria
        return;
    }

    if (event.code === "KeyZ" && event.ctrlKey) {
        if (previouslyRemoved.length === 0) {
            return;
        }
        previouslyRemoved.pop().restore();
    }
}

function luoLayout() {
    return cy.layout({
        name: 'breadthfirst',

        fit: true, // whether to fit the viewport to the graph
        directed: true, // whether the tree is directed downwards (or edges can point in any direction if false)
        padding: 10, // padding on fit
        circle: false, // put depths in concentric circles if true, put depths top down if false
        grid: false, // whether to create an even grid into which the DAG is placed (circle:false only)
        spacingFactor: 1.5, // positive spacing factor, larger => more space between nodes (N.B. n/a if causes overlap)
        boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
        avoidOverlap: true, // prevents node overlap, may overflow boundingBox if not enough space
        nodeDimensionsIncludeLabels: false, // Excludes the label when calculating node bounding boxes for the layout algorithm
        roots: undefined, // the roots of the trees
        depthSort: function (a, b) { return a.data('weight') - b.data('weight') }, // a sorting function to order nodes at equal depth. e.g. function(a, b){ return a.data('weight') - b.data('weight') }
        animate: false, // whether to transition the node positions
        animationDuration: 500, // duration of animation in ms if enabled
        animationEasing: undefined, // easing of animation if enabled,
        animateFilter: function (node, i) { return true; }, // a function that determines whether the node should be animated.  All nodes animated by default on animate enabled.  Non-animated nodes are positioned immediately when the layout starts
        ready: undefined, // callback on layoutready
        stop: undefined, // callback on layoutstop
        transform: function (node, position) { return position; }, // transform a given node position. Useful for changing flow direction in discrete layouts
    });
}

function luoSukupuulleData(henkilot) {
    let datat = [];
    let suhtehet = new Set();  // jos keräillään tällaiseen, miksi edes säilöä tämä henkilön sisään?

    // luo solmut henkilöille
    for (const henkilo of henkilot) {
        datat.push({
            data: {
                id: henkilo.nimi
            }
        });
        suhtehet.add(henkilo.suhteet);
    }

    let iter = suhtehet.entries();
    // luo solmut suhteille
    for (const suhde of iter) {
        let tempSuhdeId = suhde.suhdetyyppi + " (" + suhde.suhdeId + ")"
        datat.push({
            data: {
                id: tempSuhdeId
            }
        });

        // luo kaaret suhteen aikuisista suhdetyyppiin
        for (const osallinen of suhde.osalliset) {
            datat.push({
                data: {
                    id: osallinen.nimi + tempSuhdeId,  // ei näy missään
                    source: osallinen.nimi,
                    target: tempSuhdeId
                }, classes: 'round-taxi'
            });
        }

        if (suhde.lapset == null) {
            continue;
        }

        // luo kaaret suhdetyyppistä lapsiin
        for (const lapsi of suhde.lapset) {
            datat.push({
                data: {
                    id: tempSuhdeId + lapsi.nimi,  // ei näy missään
                    source: tempSuhdeId,
                    target: lapsi.nimi
                }, classes: 'round-taxi'
            });
        }
    }

    return datat;
}


/*
 
 
Ohjelman suoritus, aka "main"
*/

window.onload = () => {
    init();
    cy.add(luoSukupuulleData(henkilodata));
    let breadthfirstLayout = luoLayout();
    breadthfirstLayout.run();
}
