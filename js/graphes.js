/////////////////// DATABASE INITIALISATION ///////////////////

var db;	// Database handle
var redirectionTimeIndex = 2000; // in ms


// Call function when DOM is ready (entry point)
$(function () {
    db = openDatabase("Pica", "1.0", "Pica", 10000);	// Create database if not exists.

    try {
        if (!window.openDatabase)  // Check if browser/device supports SQLite or not.
            alert('Database not supported !');
        else {
            manipulateDatabaseChart();	// If supported then call function to manipulate database.
        }

    }
    catch (e) {
        if (e == 2)
            // Version number mismatch.
            alert("Invalid database version.");
        else
            alert("Unknown error " + e + ".");
    }
})



/////////////////// DATABASE MANIPULATIONS ///////////////////

// CONTROLLER AUTO
function manipulateDatabaseChart() {


    if (typeof viewDatabase != "undefined")		// needs 'DB_view.js' implementation in HTML document to be enabled.
        viewDatabase();
    else
        console.log("La vue sur la base de donnee ne peut etre etablie... auriez vous oublie d'implementer 'DB_view.js' dans le HTML ?");

    obtenirValeursGraphe();

}


function obtenirValeursGraphe() {

    var idPeriode;
    db.transaction(function (tx) {
        // SELECT TABLES
        tx.executeSql(selectStatement_idPeriode, [], onSuccess, onError);

        function onSuccess(tx, results) {
            var line = results.rows.item(0);

            console.log(line["id_periode"]);

            if (line["id_periode"] != 0) {

                console.log('utilisateur avec donneés');
                line = results.rows.item(0);
                idPeriode = line["id_periode"];
                console.log(idPeriode);
                calculerMoyenne();
            } else {
                console.log('sans login sans donneés');
                var canvas = document.getElementById("doughnut");
                var ctx = canvas.getContext("2d");
                ctx.font = "1.5em Comic Sans MS";
                ctx.fillStyle = "red";
                ctx.textAlign = "center";
                ctx.fillText(" Veuillez créer une période ", canvas.width / 2, canvas.height / 2);
            }
        }

        function onError() {
            console.log("Error id_periode");
        }
    });

    var calculerMoyenne = function () {
        var bio_dechets;
        var recyclable;
        var verre;
        var poubelle_grise;

        $.ajax
            ({
                url: "http://pica.synthearecherche.com/ajax/mamoyenne",
                type: "POST",
                data: dataStruct = {
                    id_periode: idPeriode
                },
                dataType: "json",
                cache: false,

                success: function (json) {
                    console.log(json);
                    if (json.error === 0) {
                        console.log('moyenne obtenu');

                        bio_dechets = json.TBiodechet;
                        recyclable = json.TRecyclable;
                        verre = json.TVerre;
                        poubelle_grise = json.TGrise;

                        creerGraphe(bio_dechets, recyclable, verre, poubelle_grise);
                        pourcentageMoyenne(bio_dechets, recyclable, verre, poubelle_grise);
                    }
                    else {
                        console.log("erreur moyenne");
                        var canvas = document.getElementById("doughnut");
                        var ctx = canvas.getContext("2d");
                        ctx.font = "1.5em Comic Sans MS";
                        ctx.fillStyle = "red";
                        ctx.textAlign = "center";
                        ctx.fillText(" Veuillez saisir une pesée", canvas.width / 2, canvas.height / 2);


                    }
                },

                statusCode:
                {
                    404: function () {
                        console.log("page not found");
                        alert("page not found");
                    },

                    error: function (json) {
                        console.log('error +: ' + json);
                        alert('error +: ' + json);
                    }
                },
            });
    }
}


function creerGraphe(bio_dechets, recyclable, verre, poubelle_grise) {

    var doughnutData = [
        {
            value: bio_dechets,
            color: "#F7464A",
            highlight: "#FF5A5E",
            label: "bio dechets"
        },
        {
            value: recyclable,
            color: "#46BFBD",
            highlight: "#5AD3D1",
            label: "recyclable"
        },
        {
            value: verre,
            color: "#FDB45C",
            highlight: "#FFC870",
            label: "verre"
        },
        {
            value: poubelle_grise,
            color: "#949FB1",
            highlight: "#A8B3C5",
            label: "poubelle grise"
        },

    ];

    viewDoughnut(doughnutData);

}


function viewDoughnut(doughnutData) {
     
    // doughnut chart options
    var doughnutOptions = {
        responsive: true
    }
    // get doughnut chart canvas
    var doughnut = document.getElementById("doughnut").getContext("2d");
    new Chart(doughnut).Doughnut(doughnutData, doughnutOptions);


    console.log('affiche les valeurs du doughnut');

}


function pourcentageMoyenne(bio_dechets, recyclable, verre, poubelle_grise) {

    var sommeTotalDechet = Math.floor(bio_dechets + recyclable + verre + poubelle_grise);
    console.log('la somme total des dechets est de' + sommeTotalDechet);


    var PourcentageBio_dechet = Math.round(Math.floor(bio_dechets * 100) / sommeTotalDechet);
    var PourcentageRecyclable = Math.round(Math.floor(recyclable * 100) / sommeTotalDechet);
    var PourcentageVerre = Math.round(Math.floor(verre * 100) / sommeTotalDechet);
    var PourcentagePoubelle_grise = Math.round(Math.floor(poubelle_grise * 100) / sommeTotalDechet);

    // affichage de la moyenne 
    var moyenneNationale;


    $.ajax
        ({
            url: "http://pica.synthearecherche.com/ajax/moyenne_nationale",
            type: "GET",

            dataType: "json",
            cache: false,

            success: function (json) {
                console.log(json);
                if (json.error === 0) {
                    console.log(json.valeur);

                    moyenneNationale = json.valeur;

                    $('#moy_national').html(moyenneNationale + '<br/>moy. nationale');
                }
                else {
                    console.log("erreur moyenne");
                }
            },

            statusCode:
            {
                404: function () {
                    console.log("page not found");
                    alert("page not found");
                },

                error: function (json) {
                    console.log('error +: ' + json);
                    alert('error +: ' + json);
                }
            },
        })
            
    //affichage du nombre d'utilisateurs
    var nombre_utilisateur_Pica;

    $.ajax
        ({
            url: "http://pica.synthearecherche.com/ajax/nombre_utilisateurs_pica",
            type: "GET",

            dataType: "json",
            cache: false,

            success: function (json) {
                console.log(json);
                if (json.error === 0) {

                    nombre_utilisateur_Pica = json.nombre_utilisateurs;

                    $('#utilisateur_pica').html(nombre_utilisateur_Pica + '<br/>utilisateurs pica');
                }
                else {
                    console.log("erreur nombre uitlisateurs");
                }
            },

            statusCode:
            {
                404: function () {
                    console.log("page not found nombre utilisateurs");
                    alert("page not found");
                },

                error: function (json) {
                    console.log('error +: ' + json);
                    alert('error +: ' + json);
                }
            },
        })


    console.log('le pourcentage des bio déchets est de' + PourcentageBio_dechet);
    $('#bio_dechets').html(PourcentageBio_dechet + '%' + '<br/>bio déchet').css('background-color', '#F7464A');
    $('#recyclable').html(PourcentageRecyclable + '%' + '<br/>recyclable').css('background-color', '#5AD3D1');
    $('#verre').html(PourcentageVerre + '%' + '<br/>verre').css('background-color', '#FDB45C');
    $('#poubelle_grise').html(PourcentagePoubelle_grise + '%' + '<br/>Poubelle grise').css('background-color', '#949FB1');

    $('#mon_chiffre').html(sommeTotalDechet + '<br/>mon chiffre');
    document.getElementById('mon_chiffre').style.color = '#81B29F';

    $('#utilisateur_pica').html(sommeTotalDechet + '<br/>utilisateur pica');
}



function recuperer_id_periode() {

    var idPeriode;
    db.transaction(function (tx) {
        // SELECT TABLES
        tx.executeSql(selectStatement_idPeriode, [], onSuccess, onError);

        function onSuccess(tx, results) {
            var line = results.rows.item(0);

            idPeriode = line["id_periode"];
            console.log(idPeriode);
            return idPeriode;
        }

        function onError() {
            console.log("Error id_periode");
        }
    })


}


var selectStatement_idPeriode = "SELECT id_periode FROM utilisateur";
    