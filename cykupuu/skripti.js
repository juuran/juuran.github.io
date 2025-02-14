"use strict";

/*


Muuttujat ja data
-----------------
*/

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

    // options
    wheelSensitivity: 0.75,
    minZoom: 0.05,
    maxZoom: 4
});

const NAYTON_LEVEYS = 1200;
const NO_OF_GROUPS = 4;
const SIVU_MARGIN = 100;
var previouslyRemoved = [];  // säilötään, että voidaan undo'ata!
var statusbar;

class Henkilo {
    constructor(nimi, vanhempiSuhteet, lapsiSuhteet, ryhmä, level) {
        this.nimi = nimi;
        this.vanhempiSuhteet = vanhempiSuhteet;
        this.lapsiSuhteet = lapsiSuhteet;
        this.ryhmä = ryhmä;
        this.level = level;
    }
    toString() {
        return `[ Nimi: ${this.nimi}. VanhempiSuhteet: (${this.vanhempiSuhteet}). Lapsisuhteet: (${this.lapsiSuhteet}). (w=${this.ryhmä},l=${this.level}) ]`;
    }
}

const henkilodata = [
    new Henkilo("hlö0", [], [], 1, 1),      // 0    (Tässä esimerkissä nyt nimi on yksilöivä kuin id)
    new Henkilo("hlö1", [], [], 1, 1),      // 1
    new Henkilo("hlö2", [], [], 1, 2),      // 2
    new Henkilo("hlö3", [], [], 1, 2),      // 3
    new Henkilo("hlö4", [], [], 1, 2),      // 4
    new Henkilo("hlö5", [], [], 1, 2),      // 5
    new Henkilo("hlö6", [], [], 2, 2),      // 6
    new Henkilo("hlö7", [], [], 1, 3),      // 7
    new Henkilo("hlö8", [], [], 1, 3),      // 8
    new Henkilo("hlö9", [], [], 3, 1),      // 9
    new Henkilo("hlö10", [], [], 3, 1),     // 10
    new Henkilo("hlö11", [], [], 3, 3),     // 11
    new Henkilo("hlö12", [], [], 1, 4),     // 12
    new Henkilo("hlö13", [], [], 1, 4),     // 13
    new Henkilo("hlö14", [], [], 1, 4),     // 14
    new Henkilo("hlö15", [], [], 1, 4),     // 15
    new Henkilo("hlö16", [], [], 3, 2),     // 16
    new Henkilo("hlö17", [], [], 4, 3),     // 17
    new Henkilo("hlö18", [], [], 4, 3),     // 18
    new Henkilo("hlö19", [], [], 4, 3)      // 19
];

class Suhde {
    constructor(suhdeId, suhdetyyppi, yhdessä, vanhemmat, lapset) {
        this.suhdeId = suhdeId;
        this.suhdetyyppi = suhdetyyppi;
        this.yhdessä = yhdessä;
        this.vanhemmat = vanhemmat;
        this.lapset = lapset;
    }
    toString() {
        let vanhTeksti = "{";
        for (const vanhempi of this.vanhemmat) {
            vanhTeksti = vanhTeksti + " " + vanhempi.nimi + "; ";
        }
        vanhTeksti = vanhTeksti + "}";
        let lapsTeksti = "{ ";
        for (const lapsi of this.lapset) {
            lapsTeksti = lapsTeksti + " " + lapsi.nimi + "; ";
        }
        lapsTeksti = lapsTeksti + "}";

        return `${vanhTeksti} --> ${lapsTeksti}`;
    }
}

const suhdeData = [
    // yksi olio on yksittäinen suhde - suhdetyypit: "avoliitto", "avioliitto", "eronnut", "monisuhde"
    new Suhde(
        100, "avioliitto", true,
        [henkilodata[0], henkilodata[1]],
        [henkilodata[2], henkilodata[3], henkilodata[4], henkilodata[5]]),
    new Suhde(
        101, "eronnut", false,
        [henkilodata[5], henkilodata[6]],
        [henkilodata[7], henkilodata[8]]),
    new Suhde(
        102, "avioliitto", true,
        [henkilodata[9], henkilodata[10]],
        [henkilodata[6]]),
    new Suhde(
        103, "avioliitto", true,
        [henkilodata[7], henkilodata[11]],
        [henkilodata[12], henkilodata[13], henkilodata[14], henkilodata[15]]),
    new Suhde(
        104, "avioliitto", true,
        [henkilodata[6], henkilodata[16]],
        [henkilodata[17], henkilodata[18], henkilodata[19]])
];
henkilodata[0].vanhempiSuhteet.push(null); /*               */ henkilodata[0].lapsiSuhteet.push(suhdeData[0]);
henkilodata[1].vanhempiSuhteet.push(null); /*               */ henkilodata[1].lapsiSuhteet.push(suhdeData[0]);
henkilodata[2].vanhempiSuhteet.push(suhdeData[0]);
henkilodata[3].vanhempiSuhteet.push(suhdeData[0]);
henkilodata[4].vanhempiSuhteet.push(suhdeData[0]);
henkilodata[5].vanhempiSuhteet.push(suhdeData[0]); /*       */ henkilodata[5].lapsiSuhteet.push(suhdeData[1]);
henkilodata[6].vanhempiSuhteet.push(suhdeData[2]); /*       */ henkilodata[6].lapsiSuhteet.push(suhdeData[1], suhdeData[4]);
henkilodata[7].vanhempiSuhteet.push(suhdeData[1]); /*       */ henkilodata[7].lapsiSuhteet.push(suhdeData[3]);
henkilodata[8].vanhempiSuhteet.push(suhdeData[1]);
henkilodata[9].vanhempiSuhteet.push(null); /*               */ henkilodata[9].lapsiSuhteet.push(suhdeData[2]);
henkilodata[10].vanhempiSuhteet.push(null); /*              */ henkilodata[10].lapsiSuhteet.push(suhdeData[2]);
henkilodata[11].vanhempiSuhteet.push(null); /*              */ henkilodata[11].lapsiSuhteet.push(suhdeData[3]);
henkilodata[12].vanhempiSuhteet.push(suhdeData[3]);
henkilodata[13].vanhempiSuhteet.push(suhdeData[3]);
henkilodata[14].vanhempiSuhteet.push(suhdeData[3]);
henkilodata[15].vanhempiSuhteet.push(suhdeData[3]);
henkilodata[16].vanhempiSuhteet.push(null); /*              */ henkilodata[16].lapsiSuhteet.push(suhdeData[4]);
henkilodata[17].vanhempiSuhteet.push(suhdeData[4]);
henkilodata[18].vanhempiSuhteet.push(suhdeData[4]);
henkilodata[19].vanhempiSuhteet.push(suhdeData[4]);

/*


Funktiot (alustus, apufunktiot yms)
-----------------------------------
*/

function init() {
    statusbar = document.getElementById("statusbar");
    let breadthfirstLeiska = luoLeiska("breadthfirst");
    breadthfirstLeiska.run();

    document.addEventListener("keydown", nappaimienKuuntelija);
    document.addEventListener("click", valitsimenKuuntelija);
    document.addEventListener("touchstart", valitsimenKuuntelija);
    document.addEventListener("touchmove", valitsimenKuuntelija);
    document.addEventListener("touchend", valitsimenKuuntelija);
    document.addEventListener("touchcancel", valitsimenKuuntelija);
    document.getElementById("randoButton").addEventListener("click", nappiKuuntelija);
    document.getElementById("järjestäButton").addEventListener("click", nappiKuuntelija);
    document.getElementById("omaJärjestysButton").addEventListener("click", nappiKuuntelija);
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

function nappiKuuntelija(event) {
    if (event.currentTarget.id === "randoButton") {
        luoLeiska("random").run();
    }

    if (event.currentTarget.id === "järjestäButton") {
        luoLeiska("breadthfirst").run();
    }

    if (event.currentTarget.id === "omaJärjestysButton") {
        cy.remove(cy.elements(""));
        main();
    }
}

function valitsimenKuuntelija(event) {
    let valitut = cy.nodes(":selected");
    if (valitut.length === 1) {
        const tiedot = valitut[0].scratch()._itse.toString();
        statusbar.textContent = tiedot;
    }
    else if (valitut.length > 1) {
        statusbar.textContent = "Valitse vain yksi solmu näyttääksesi tietoja.";
    } else {
        statusbar.textContent = "Valitse solmu näyttääksesi tietoja.";
    }
}

/**
 * Jos tarvitsee nukkua tässä suorituksen aikana. Muista käyttää "await" avainsanan kanssa, esim. "await sleep(2);"
 * @param {*} secs Uniaika annettuna sekunteina
 */
function sleep(secs) {
    return new Promise(r => setTimeout(r, secs * 1000));
}

function luoLeiska(nimi) {
    return cy.layout({
        name: nimi,

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
        zoom: 1,
    });
}

/*


Funktiot (business-logiikka tms)
--------------------------------
*/

function luoSukupuunHenkiloData(henkilot) {
    let henks = [];

    let edellisenVanhempiSuhde = undefined;  // undefined ettei näyttäisi olevan sama nullin kanssa, mikä taas meinaa: ei tiedossa
    let monesko = 0;
    // luo solmut henkilöille
    for (const henkilo of henkilot) {
        const pystyPiste = henkilo.level * 200;

        let vaakaPiste;
        const vanhempiSuhde = henkilo.vanhempiSuhteet[0];
        if (edellisenVanhempiSuhde === vanhempiSuhde) {
            monesko++;
        } else {
            monesko = 0;
        }
        let monesta;
        if (vanhempiSuhde === null) {
            for (let lapsiSuhde of henkilo.lapsiSuhteet) {
                if (lapsiSuhde.yhdessä) {
                    monesta = lapsiSuhde.vanhemmat.length;
                }
            }
        } else {
            monesta = vanhempiSuhde.lapset.length;
        }
        let henkilönVaakaPiste;
        try {
            const kerroin = monesko / (monesta + 1);  // monesko min. 0, monesta max. x-1 ettei piirretä yli oman alueen
            henkilönVaakaPiste = (kerroin * (NAYTON_LEVEYS / NO_OF_GROUPS));
            const ryhmänVaakaPiste = laskeRyhmänVaakaPiste(henkilo.ryhmä);
            vaakaPiste = ryhmänVaakaPiste + henkilönVaakaPiste;
        } catch (e) {
            vaakaPiste = ryhmänVaakaPiste + (monesko * 10);
        }

        henks.push({
            group: 'nodes',
            data: {
                id: henkilo.nimi,
                weight: henkilo.ryhmä
            },
            scratch: {
                _itse: {
                    henkilo: henkilo,
                    vanhempiSuhteet: henkilo.vanhempiSuhteet,
                    lapsiSuhteet: henkilo.lapsiSuhteet,
                    toString: () => henkilo.toString()
                }
            },
            position: {
                x: vaakaPiste + SIVU_MARGIN,
                y: pystyPiste
            }
        });

        edellisenVanhempiSuhde = vanhempiSuhde;
    }

    return henks;
}

function luoSukupuunSuhdeData(suhteet) {
    let suhts = [];

    for (const suhde of suhteet) {
        // luo solmut suhteille
        let tempSuhdeId = suhde.suhdetyyppi + " (" + suhde.suhdeId + ")";
        const pystyPiste = (suhde.vanhemmat[0].level * 200) + 50;
        const vaakaKeskiPiste = laskeRyhmänVaakaKeskiPiste(suhde.lapset[0].ryhmä);
        suhts.push({
            group: 'nodes',
            data: {
                id: tempSuhdeId,
                weight: suhde.ryhmä
            },
            scratch: {
                _itse: {
                    suhde: suhde,
                    vanhemmat: suhde.vanhemmat,
                    lapset: suhde.lapset,
                    toString: () => suhde.toString()
                }
            },
            position: {
                x: vaakaKeskiPiste + SIVU_MARGIN,
                y: pystyPiste
            }
        });

        // luo kaaret suhteen aikuisista suhdetyyppiin
        for (const osallinen of suhde.vanhemmat) {
            suhts.push({
                group: 'edges',
                data: {
                    id: osallinen.nimi + tempSuhdeId,  // ei näy missään
                    source: osallinen.nimi,
                    target: tempSuhdeId
                },
                classes: 'round-taxi'
            });
        }

        if (suhde.lapset == null) {
            continue;
        }

        // luo kaaret suhdetyyppistä lapsiin
        for (const lapsi of suhde.lapset) {
            suhts.push({
                group: 'edges',
                data: {
                    id: tempSuhdeId + lapsi.nimi,  // ei näy missään
                    source: tempSuhdeId,
                    target: lapsi.nimi
                },
                classes: 'round-taxi'
            });
        }
    }

    return suhts;
}

function laskeRyhmänVaakaPiste(ryhmä) {
    return (NAYTON_LEVEYS / NO_OF_GROUPS) * (ryhmä - 1);
}

function laskeRyhmänVaakaKeskiPiste(ryhmä) {
    return laskeRyhmänVaakaPiste(ryhmä) + ((NAYTON_LEVEYS / NO_OF_GROUPS) * 0.5);
}

/*
 
 
Ohjelman suoritus, aka "main"
-----------------------------
*/

async function main() {
    init();
    cy.add(luoSukupuunHenkiloData(henkilodata));
    cy.add(luoSukupuunSuhdeData(suhdeData));
}

window.onload = async () => {
    main();
}
