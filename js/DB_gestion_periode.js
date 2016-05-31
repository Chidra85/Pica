// fonction pour gerer une période

/////////////////// DATABASE INITIALISATION ///////////////////
var db;	// Database handle
var switchTime = 200; // in ms
var userEmail = "";

// Call function when DOM is ready (entry point)
$(function () {
    db = openDatabase("Pica", "1.0", "Pica", 10000);	// Create database if not exists.

    try {
        if (!window.openDatabase)  // Check if browser/device supports SQLite or not.
            alert('Database not supported !');
        else {
            manipulateDatabase_GestionPeriode();	// If supported then call function to manipulate database.
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

function manipulateDatabase_GestionPeriode() {
    console.log("manipulateDatabase_GestionPeriode");

    if (typeof viewDatabase != "undefined")
        viewDatabase();
    else
        console.log("La vue sur la base de donnee ne peut etre etablie... auriez vous oublie d'implementer 'DB_view.js' dans le HTML ?");

    GestionPeriode();
}


function GestionPeriode() {
    var periode = 0;

    db.transaction(function (tx) {
        // SELECT TABLES
        tx.executeSql(selectStatement_getIdAndEmail, [], onSuccess, onError);

        function onSuccess(tx, results) {
            var line = results.rows.item(0);

            userEmail = line["email"];

            $('#identifiant').text('ID: ' + userEmail + ' (' + line["id"] + ')');
            console.log(userEmail);
        }

        function onError() {
            console.log("Error Email");
        }
    })

    db.transaction(function (tx) {
        // SELECT TABLES
        tx.executeSql(selectStatement_periodeEnCours, [], onSuccess, onError);

        function onSuccess(tx, results) {
            // console.log(results.rows.length);
            var line = results.rows.item(0);

            periode = line["periodeEnCours"];
            console.log('periode en cours ' + periode);

            if (periode === 0) {

                console.log("message");
                $('#gestion_periode').css('background-color', 'blue').val('Demarrer une nouvelle période');
                $('#gestion_periode').on("click", creerPeriode);
            }
            else {
                console.log('else');
				var element = document.getElementById("text");
				element.innerHTML = "Penses à noter les informations dans REPAS tous les jours. Et quand tu jettes une poubelle, enregistre son poids dans PESEES";
                $('#gestion_periode').css('background-color', 'red').val('Terminer période');
                $('#gestion_periode').on("click", terminerPeriode);
            }
        }

        function onError() {
            console.log("Error Email");
        }
    })



}

// fonction pour creer une période
function creerPeriode() {

    console.log("creerPeriode");
    demarrerPeriode();

    function demarrerPeriode() {
        
        /////////// AJAX ///////////
        console.log(userEmail);
        var dataStruct = {
            identifiant: userEmail
        }
        $.ajax
            ({
                url: "http://pica.synthearecherche.com/ajax/demarrerPeriode",
                type: "POST",
                data: dataStruct,
                dataType: "json",
                cache: false,

                success: function (json) {
                    console.log(json);
                    if (json.error === 0) {

                        console.log('donnée demarrer periode');
                        insertIdPeriode(1, json.idPeriode);
                        console.log(json.message);
                    }
                    else {
                        console.log("erreur d'arrêt");

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
    }

}

function terminerPeriode() {
	console.log("terminerPeriode");
	arretPeriode();

    function arretPeriode(userMail) {
        /////////// AJAX ///////////
        console.log(userMail);
        var object = { id: 0 };

        $.ajax
            ({
                url: "http://pica.synthearecherche.com/ajax/arretPeriode",
                type: "POST",
                data: dataStruct = {
                    identifiant: userEmail
                },
                dataType: "json",
                cache: false,

                success: function (json) {
                    if (json.error === 0) {
                        console.log(json.message);
                        insertIdPeriode(0, object);
                    }
                    else {
                        console.log("erreur d'arrêt");

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
    }
}

function insertIdPeriode(bool_periodeEnCours, idPeriode) {
    console.log(idPeriode);

    db.transaction(function (tx) {
        tx.executeSql(updateStatement_addPeriodeData,
            [idPeriode['id'], bool_periodeEnCours, userEmail],
            onSuccess, onError);

        if (typeof viewDatabase != "undefined")	// needs 'DB_view.js' implementation in HTML document to be enabled
            viewDatabase();
        else
            console.log("La vue sur la base de donnee ne peut etre etablie... auriez vous oublie d'implementer 'DB_view.js' dans le HTML ?");
    })

    function onSuccess() {
        window.setTimeout(function () {
            window.location = 'accueil.html';
        }, switchTime);

        console.log("Requette SQLite fonctionnelle (UPDATE).");
    }
    function onError() {
        console.log("Echec : requette SQLite fausse (UPDATE).");
    }
}



var selectStatement_getIdAndEmail = "SELECT id, email FROM utilisateur";
var selectStatement_periodeEnCours = "SELECT periodeEnCours FROM utilisateur";
var selectStatement_getUserEmail = "SELECT email FROM utilisateur";


/////////////////// UPDATE STATEMENTS ///////////////////

//#------------------------------------------------------------
//# UPDATE -> Table: Periode
//#------------------------------------------------------------
var updateStatement_addPeriodeData = "UPDATE utilisateur ";
updateStatement_addPeriodeData += "SET id_periode=?, periodeEnCours=? ";
updateStatement_addPeriodeData += "WHERE email = ?";



