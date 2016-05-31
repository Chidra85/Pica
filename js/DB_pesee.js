var switchTime = 2000;

$(function () {
    db = openDatabase("Pica", "1.0", "Pica", 10000);	// Create database if not exists.

    try {
        if (!window.openDatabase)  // Check if browser/device supports SQLite or not.
            alert('Database not supported !');
        else {
            manipulateDatabase_pesee();	// If supported then call function to manipulate database.
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
function manipulateDatabase_pesee() {

    $('#sauvegardePesee').on("click", obtenirPeriodePesee);


    if (typeof viewDatabase != "undefined")		// needs 'DB_view.js' implementation in HTML code to be enabled.
        viewDatabase();
    else
        console.log("La vue sur la base de donnee ne peut etre etablie... auriez vous oublie d'implementer 'DB_view.js' dans le HTML ?");
}

function obtenirPeriodePesee() {
    var idPeriode = 0;

    db.transaction(function (tx) {
        // SELECT TABLES
        tx.executeSql(selectStatement_idPeriode, [], onSuccess, onError);

        function onSuccess(tx, results) {
            // console.log(results.rows.length);
            var line = results.rows.item(0);

            idPeriode = line["id_periode"];
            console.log('id de periode : ' + idPeriode);
            obtenirIDuser(idPeriode);
        }

        function onError() {
            console.log("Error ID periode");
        }
    })
}

function obtenirIDuser(idPeriode) {
    var idUser = '';

    db.transaction(function (tx) {
        // SELECT TABLES
        tx.executeSql(selectStatement_idUser, [], onSuccess, onError);

        function onSuccess(tx, results) {
            // console.log(results.rows.length);
            var line = results.rows.item(0);

            idUser = line["email"];
            console.log('id user : ' + idUser);
            createnouvellePesee(idPeriode, idUser);
        }

        function onError() {
            console.log("Error ID periode");
        }
    })
}

// insert new user in SQLite local database AND server SQL database (if local succeeded), CALLS 'redirect()' if succeeded.
function savePesee(idPeriode) {
    console.log("\n-------INSERTION PESEE-------");

    //var userEmail = $('#inputEmail').val();
    //var userPassword = $('#inputPassword').val();
    
    var valueDate = "2016 Janvier 5";
    var bio_dechets = $('#bio_dechet').val();
    var recyclable = $('#Recyclabe').val();
    var verre = $('#Verre').val();
    var poubelle_grise = $('#Poubelle_grise').val();
    var dechetterie = $('#Dechetterie').val();

    console.log(bio_dechets);
    console.log(recyclable);
    console.log(verre);
    console.log(poubelle_grise);
    console.log(dechetterie);
    console.log(valueDate);

    db.transaction(function (tx) {
        // INSERT ROWS IN TABLES (add user in local SQLite database)
        tx.executeSql(insertStatement_fiche_pesees, [valueDate, bio_dechets, recyclable, verre, poubelle_grise, dechetterie, 5], onSuccess, onError);
        // Values to insert: [email -> TEXT]
    })
		
	
    // CALLS 'redirect()'
    function onSuccess() {
        console.log("la pesée a ete insere. (local)");

        createnouvellePesee(idPeriode, idUser);
    }

    function onError() {
        console.log("Echec : requette SQLite fausse.");
        console.log("une pesée n'a pas ete insere. (local)");
    }
}


function createnouvellePesee(idPeriode, idUser) {
    console.log("\n-------CREATION PESEE-------");

    var dateJour = moment().year()+""+moment().month()+""+1+""+moment().date();
    var bioDechets = $('#bio_dechet').val();
    var recyclable = $('#Recyclabe').val();
    var verre = $('#Verre').val();
    var poubelle_grise = $('#Poubelle_grise').val();
    var dechetterie = $('#Dechetterie').val();

    console.log(dateJour);
    console.log('nouvelle pesée');

    console.log(verre);
    console.log(dechetterie);
    /////////// AJAX ///////////
    $.ajax
        ({
            url: "http://pica.synthearecherche.com/ajax/createNewPesee",
            type: "POST",
            data: dataStruct =
            {
                idPeriode: idPeriode,
                id_user: idUser,
                valueDate: dateJour,
                bio_dechets: bioDechets,
                Recyclable: recyclable,
                Verre: verre,
                Poubelle_grise: poubelle_grise,
                dechetterie: dechetterie,
            },
            dataType: "json",
            cache: false,

            success: function (json) {
                if (json.error === 0) {
                    console.log(json.successMessage);
                    window.setTimeout(function () {
                        window.location = 'pesee.html';
                    }, switchTime);   
                    // CALL IS HERE
                }
                else {
                    console.log(json.errorMessage);
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
	 
//#------------------------------------------------------------
//# INSERT -> Table: fiche_pesees
//#------------------------------------------------------------
var insertStatement_fiche_pesees = "INSERT INTO fiche_pesees (date_du_jour, bio_dechets, recyclable, verre, poubelle_grise, dechetterie, id_periode) ";
insertStatement_fiche_pesees += "VALUES (?, ?, ?, ?, ?, ?, ?)";

var selectStatement_idPeriode = "SELECT id_periode FROM utilisateur";

var selectStatement_idUser = "SELECT email FROM utilisateur ";