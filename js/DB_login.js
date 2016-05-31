
/////////////////// DATABASE INITIALISATION ///////////////////

var db;	// Database handle
var redirectionTimeIndex = 3000; // in ms


// Call function when DOM is ready (entry point)
$(function () 
{
	db = openDatabase("Pica", "1.0", "Pica", 10000);	// Create database if not exists.

	try
	{
		if (!window.openDatabase)  // Check if browser/device supports SQLite or not.
            $.notify("Telephone a la ramasse !", "error");
		else
		{
			manipulateDatabase();	// If supported then call function to manipulate database.
		}			
	}
	catch (e)
	{
		if (e == 2)
			// Version number mismatch.
            $.notify("ERROR", "error");
		else
            $.notify("ERROR " + e + ".", "error");
	}
})



/////////////////// DATABASE MANIPULATIONS ///////////////////

// CONTROLLER AUTO
function manipulateDatabase()
{
	resetLocalDatabase();		// Enable -> drop all local SQLite tables and recreates them (blank + placeholder value).
	$('#userConnexion').on("click", userLogin);
	$('#createUser').on("click", createNewUser);
}

function resetLocalDatabase()
{
	dropTables();
	createTables();
	//getServerData();
}

function dropTables()
{
	db.transaction(function (tx)
	{
		// DROP TABLES (IF EXISTS)
		tx.executeSql(dropStatement_fiche_pesees, [], onSuccess, onError);
		tx.executeSql(dropStatement_fiche_repas, [], onSuccess, onError);
		tx.executeSql(dropStatement_utilisateur, [], onSuccess, onError);
	})

	function onSuccess()
	{
		console.log("Requette SQLite fonctionnelle (DROP).");
	}
	function onError()
	{
		console.log("Echec : requette SQLite fausse.");
	}
}
function createTables()
{
	db.transaction(function (tx)
	{
		// CREATE TABLES (IF EXISTS)
		tx.executeSql(createStatement_utilisateur, [], onSuccess, onError);
		tx.executeSql(createStatement_fiche_repas, [], onSuccess, onError);
		tx.executeSql(createStatement_fiche_pesees, [], onSuccess, onError);
	})

	function onSuccess()
	{
		console.log("Requette SQLite fonctionnelle (CREATE).");
	}
	function onError()
	{
		console.log("Echec : requette SQLite fausse.");
	}
}
function getServerData()
{
	/////////// AJAX ///////////
	$.ajax
	({
		url: "http://pica.synthearecherche.com/ajax/getAllData",
		type: "GET",
		dataType: "json",
		cache: false,

		success: function (json)
		{
			if (json.error === 0)
			{
				console.log(json.successMessage);
				insertValues(json.utilisateurs, json.repas, json.pesees);	// CALL
			}
			else
			{
                $.notify("Impossible de se connecter !\nVerifiez votre connexion internet.", "error");
			}
		},

		statusCode:
		{
			404: function ()
			{
				console.log("page not found");
				alert("page not found");
			},

			error: function (json)
			{
				console.log('error +: ' + json);
				alert('error +: ' + json);
			}
		},
	})
}		// CALL insertValues if succeeded
function insertValues(utilisateurs, repas, pesees)
{
    var numberOfLines = 0;
    
	Object.size = function (obj)
	{
		var nbr = 0, key;
		for (key in obj)
			if (obj.hasOwnProperty(key))
				nbr++;
		return nbr;
	};

	db.transaction(function (tx)
	{
		// COPY DATA FROM SERVER TO 'fiche_repas' TABLE
		numberOfLines = Object.size(repas);
		for (var i = 0; i < numberOfLines; i++)
		{
			tx.executeSql(insertStatement_fiche_repas,
				[repas[i]["id_periode"], repas[i]["dateJour"], repas[i]["nbrPdej"],
					repas[i]["nbrDej"], repas[i]["nbrGout"], repas[i]["nbrDin"]],
				onSuccess, onError);
		}

		// COPY DATA FROM SERVER TO 'fiche_pesees' TABLE
		numberOfLines = Object.size(pesees);
		for (var i = 0; i < numberOfLines; i++)
		{
			tx.executeSql(insertStatement_fiche_pesees,
				[pesees[i]["id_periode"], pesees[i]["dateJour"], pesees[i]["Qbiodechet"],
					pesees[i]["Qrecyclable"], pesees[i]["Qverre"], pesees[i]["Qgrise"], pesees[i]["dechetterie"]],
				onSuccess, onError);
		}

		if (typeof viewDatabase != "undefined")		// needs 'DB_view.js' implementation in HTML document to be enabled.
			viewDatabase();
		else
			console.log("La vue sur la base de donnee ne peut etre etablie... auriez vous oublie d'implementer 'DB_view.js' dans le HTML ?");
	})

	function onSuccess()
	{
		console.log("Requette SQLite fonctionnelle (INSERT).");
	}
	function onError()
	{
		console.log("Echec : requette SQLite fausse (INSERT).");
	}
}


// check user aviability in server SQL database, CALLS 'insertUser()' if succeeded.
function createNewUser()
{
	console.log("\n-------CREATION UTILISATEUR-------");

	var userEmail = $('#inputEmail').val();
	
	if (!userEmail.includes(' ') && userEmail.includes('@') && userEmail.includes('.') && userEmail.length > 10)
	{
		db.transaction(function (tx)
		{
			/////////// AJAX ///////////
			$.ajax
			({
				url: "http://pica.synthearecherche.com/ajax/verifUserExists",
				type: "POST",
				data: dataStruct =
				{
					email: userEmail,
				},
				dataType: "json",
				cache: false,

				success: function (json)
				{
					if (json.error === 0)
					{
						console.log(json.successMessage);
						insertUser();	// CALL IS HERE
					}
					else
					{
						console.log(json.errorMessage);
                        $.notify("E-Mail deja creee", "error");
					}
				},

				statusCode:
				{
					404: function ()
					{
						console.log("page not found");
						alert("page not found");
					},

					error: function (json)
					{
						console.log('error +: ' + json);
						alert('error +: ' + json);
					}
				},
			})
		})
	}
	else
	{
        $.notify("E-Mail non valide", "error");
	}
}


// insert new user in SQLite local database AND server SQL database (if local succeeded), CALLS 'redirect()' if succeeded.
function insertUser()
{
	console.log("\n-------INSERTION UTILISATEUR-------");

	var userEmail = $('#inputEmail').val();
	var userPassword = $('#inputPassword').val();

	if (!userPassword.includes(' ') && userPassword.length > 3)
	{
		db.transaction(function (tx)
		{
			/////////// AJAX ///////////
			// insert user in server SQL database
			$.ajax
			({
				url: "http://pica.synthearecherche.com/ajax/createNewUser",
				type: "POST",
				data: dataStruct =
				{
					email: userEmail,
					password: userPassword
				},
				dataType: "json",
				cache: false,

				success: function (json)
				{
					if (json.error != 1)
					{
						console.log(json.successMessage);
                        $.notify("Creation du profil reussie !", "success");
					}
					else
					{
						console.log(json.errorMessage);
					}
				},

				statusCode:
				{
					404: function ()
					{
						console.log("page not found");
						alert("page not found");
					},

					error: function (json)
					{
						console.log('error +: ' + json);
						alert('error +: ' + json);
					}
				},
			})

			/////////// AJAX ///////////
			// get last user in server SQL database
			$.ajax
			({
				url: "http://pica.synthearecherche.com/ajax/getLastUser",
				type: "GET",
				dataType: "json",
				cache: false,

				success: function (json)
				{
					if (json.error === 0)
					{
						console.log(json.successMessage);
						console.log(json.utilisateur);

						insertSpecificUser(json.utilisateur);
					}
					else
					{
						$.notify("Impossible de se connecter !\nVeuillez verifier votre connexion internet.", "error");
					}
				},

				statusCode:
				{
					404: function ()
					{
						console.log("page not found");
						alert("page not found");
					},

					error: function (json)
					{
						console.log('error +: ' + json);
						alert('error +: ' + json);
					}
				},
			})
		})
	}
	else
	{
        $.notify("Mot de passe non valide ! \nAu moins 4 caracteres !", "error");
	}
	
	// CALLS 'redirect()'
	function onSuccess()
	{
		redirect();		// CALL IS HERE
	}

	function onError()
	{
		console.log("Echec : requette SQLite fausse.");
		console.log(userEmail + " n'a pas ete insere. (local)");
	}
}


// insert user in local database
function insertSpecificUser(user)
{
	db.transaction(function (tx)
	{
		tx.executeSql(dropStatement_utilisateur, [], onSuccess, onError);
		tx.executeSql(createStatement_utilisateur, [], onSuccess, onError);

		tx.executeSql(insertStatement_utilisateur,
			[user[0]["id"], user[0]["username"], 0, 0],
			onSuccess, onError);
	})

	function onSuccess()
	{
		console.log("Requette SQLite fonctionnelle (INSERT).");
	}
	function onError()
	{
		console.log("Echec : requette SQLite fausse (INSERT).");
	}

	redirect(user[0]["username"]);		// REDIRECT IS HERE
}


// check if user AND password is valid server side, CALLS 'redirect()' if succeeded.
function userLogin()
{
	console.log("\n-------LOGIN-------");

	var userEmail = $('#inputEmail').val();
	var userPassword = $('#inputPassword').val();

	/////////// AJAX ///////////
	// verify user in server SQL database
	$.ajax
	({
		url: "http://pica.synthearecherche.com/ajax/verifUserData",
		type: "POST",
		data: dataStruct =
		{
			email: userEmail,
			password: userPassword
		},
		dataType: "json",
		cache: false,

		success: function (json)
		{
			if (json.error === 0)
			{
				console.log(json.successMessage);
				userValid();
			}
			else
			{
				console.log(json.errorMessage);
                $.notify("Erreur email / mot de passe.", "error");
			}
		},

		statusCode:
		{
			404: function ()
			{
				console.log("page not found");
				alert("page not found");
			},

			error: function (json)
			{
				console.log('error +: ' + json);
				alert('error +: ' + json);
			}
		},
	})

	var userValid = function()
	{
		/////////// AJAX ///////////
		// get specific user in server SQL database
		$.ajax
		({
			url: "http://pica.synthearecherche.com/ajax/getSpecificUser",
			type: "POST",
			data: dataStruct =
			{
				email: userEmail,
			},
			dataType: "json",
			cache: false,

			success: function (json)
			{
				if (json.error === 0)
				{
					console.log(json.successMessage);
					console.log(json.utilisateur);

					insertSpecificUser(json.utilisateur);
				}
				else
				{
                    $.notify("Impossible de se connecter !\nVeuillez verifier votre connexion internet.", "error");
				}
			},

			statusCode:
			{
				404: function ()
				{
					console.log("page not found");
					alert("page not found");
				},

				error: function (json)
				{
					console.log('error +: ' + json);
					alert('error +: ' + json);
				}
			},
		})
	}
}



function redirect(userEmail)
{
	console.log(userEmail);
    $.notify("Connexion en cours...", "success");
    var object = { id: 0 };

    /////////// AJAX ///////////
    $.ajax
    ({
    	url: "http://pica.synthearecherche.com/ajax/verificationPeriodeEnCours",
        type: "POST",
        data: dataStruct =
		{
			email: userEmail,
		},
        dataType: "json",
        cache: false,

        success: function (json)
        {
        	if (json.bool_periodeEnCours === 0)
        		insertDataPeriode(json.bool_periodeEnCours, object, userEmail);
            else
        		insertDataPeriode(json.bool_periodeEnCours, json.id_periode, userEmail);
        },

        statusCode:
        {
            404: function ()
            {
                console.log("page not found");
                alert("page not found");
            },

            error: function (json)
            {
                console.log('error +: ' + json);
                alert('error +: ' + json);
            }
        },
    })
}



function insertDataPeriode(bool_periodeEnCours, id_periode, userEmail)
{
	//var idPeriode = id_periode;
	var repas;
	var pesees;
	var insertRepasPesees = 0;

	Object.size = function (obj)
	{
		var nbr = 0, key;
		for (key in obj)
			if (obj.hasOwnProperty(key))
				nbr++;
		return nbr;
	};

	if (bool_periodeEnCours == 1)
	{
		/////////// AJAX ///////////
		$.ajax
		({
			url: "http://pica.synthearecherche.com/ajax/getAllDataFromPeriod",
			type: "POST",
			data: dataStruct =
			{
				idPeriode: id_periode['id'],
			},
			dataType: "json",
			cache: false,

			success: function (json)
			{
				if (json.error === 0)
				{
					console.log(json.successMessage);
					repas = json.repas;
					pesees = json.pesees;

					insertRepasPesees = 1;
					insertion(id_periode['id']);
				}
				else
				{
					alert("Impossible de se connecter a la base de donnee !\nVeuillez verifier votre connexion internet.");
				}
			},

			statusCode:
			{
				404: function ()
				{
					console.log("page not found");
					alert("page not found");
				},

				error: function (json)
				{
					console.log('error +: ' + json);
					alert('error +: ' + json);
				}
			},
		})
	}
	else
	{
		db.transaction(function (tx)
		{
			tx.executeSql(updateStatement_addPeriodeData,
							[0, bool_periodeEnCours, userEmail],
								onSuccess, onError);

			if (insertRepasPesees == 1)
			{
				var numberOfLines = 0;

				// COPY DATA FROM SERVER TO 'fiche_repas' TABLE
				numberOfLines = Object.size(repas);
				for (var i = 0; i < numberOfLines; i++)
				{
					tx.executeSql(insertStatement_fiche_repas,
						[repas[i]["id_periode"], repas[i]["dateJour"], repas[i]["nbrPdej"],
							repas[i]["nbrDej"], repas[i]["nbrGout"], repas[i]["nbrDin"]],
						onSuccess, onError);
				}

				// COPY DATA FROM SERVER TO 'fiche_pesees' TABLE
				numberOfLines = Object.size(pesees);
				for (var i = 0; i < numberOfLines; i++)
				{
					tx.executeSql(insertStatement_fiche_pesees,
						[pesees[i]["id_periode"], pesees[i]["dateJour"], pesees[i]["Qbiodechet"],
							pesees[i]["Qrecyclable"], pesees[i]["Qverre"], pesees[i]["Qgrise"], pesees[i]["dechetterie"]],
						onSuccess, onError);
				}
			}

			window.setTimeout(function ()
			{
				window.location = "accueil.html";
			}, redirectionTimeIndex);

			if (typeof viewDatabase != "undefined")	// needs 'DB_view.js' implementation in HTML document to be enabled
				viewDatabase();
			else
				console.log("La vue sur la base de donnee ne peut etre etablie... auriez vous oublie d'implementer 'DB_view.js' dans le HTML ?");
		})

		function onSuccess()
		{
			console.log("Requette SQLite fonctionnelle (UPDATE).");
		}
		function onError()
		{
			console.log("Echec : requette SQLite fausse (UPDATE).");
		}
	}

	var insertion = function (idDeLaPeriode)
	{
		db.transaction(function (tx)
		{
			tx.executeSql(updateStatement_addPeriodeData,
							[idDeLaPeriode, bool_periodeEnCours, userEmail],
								onSuccess, onError);

			if (insertRepasPesees == 1)
			{
				var numberOfLines = 0;

				// COPY DATA FROM SERVER TO 'fiche_repas' TABLE
				numberOfLines = Object.size(repas);
				for (var i = 0; i < numberOfLines; i++)
				{
					tx.executeSql(insertStatement_fiche_repas,
						[repas[i]["id_periode"], repas[i]["dateJour"], repas[i]["nbrPdej"],
							repas[i]["nbrDej"], repas[i]["nbrGout"], repas[i]["nbrDin"]],
						onSuccess, onError);
				}

				// COPY DATA FROM SERVER TO 'fiche_pesees' TABLE
				numberOfLines = Object.size(pesees);
				for (var i = 0; i < numberOfLines; i++)
				{
					tx.executeSql(insertStatement_fiche_pesees,
						[pesees[i]["id_periode"], pesees[i]["dateJour"], pesees[i]["Qbiodechet"],
							pesees[i]["Qrecyclable"], pesees[i]["Qverre"], pesees[i]["Qgrise"], pesees[i]["dechetterie"]],
						onSuccess, onError);
				}
			}

			window.setTimeout(function ()
			{
				window.location = "accueil.html";
			}, redirectionTimeIndex);

			if (typeof viewDatabase != "undefined")	// needs 'DB_view.js' implementation in HTML document to be enabled
				viewDatabase();
			else
				console.log("La vue sur la base de donnee ne peut etre etablie... auriez vous oublie d'implementer 'DB_view.js' dans le HTML ?");
		})

		function onSuccess()
		{
			console.log("Requette SQLite fonctionnelle (UPDATE).");
		}
		function onError()
		{
			console.log("Echec : requette SQLite fausse (UPDATE).");
		}
	}

}



/////////////////// UPDATE STATEMENTS ///////////////////

//#------------------------------------------------------------
//# UPDATE -> Table: utilisateur
//#------------------------------------------------------------
var updateStatement_addPeriodeData = "UPDATE utilisateur ";
updateStatement_addPeriodeData += "SET id_periode=?, periodeEnCours=? ";
updateStatement_addPeriodeData += "WHERE email = ?";



/////////////////// DROP STATEMENTS ///////////////////

//#------------------------------------------------------------
//# DROP -> Table: fiche_pesees
//#------------------------------------------------------------
var dropStatement_fiche_pesees = "DROP TABLE IF EXISTS fiche_pesees";

//#------------------------------------------------------------
//# DROP -> Table: fiche_repas
//#------------------------------------------------------------
var dropStatement_fiche_repas = "DROP TABLE IF EXISTS fiche_repas";

//#------------------------------------------------------------
//# DROP -> Table: utilisateur
//#------------------------------------------------------------
var dropStatement_utilisateur = "DROP TABLE IF EXISTS utilisateur";



/////////////////// CREATE STATEMENTS ///////////////////

//#------------------------------------------------------------
//# CREATE -> Table: utilisateur
//#------------------------------------------------------------
var createStatement_utilisateur = "CREATE TABLE IF NOT EXISTS utilisateur ";
createStatement_utilisateur += "( ";
createStatement_utilisateur += "id               INTEGER NOT NULL , ";
createStatement_utilisateur += "email            TEXT NOT NULL , ";
createStatement_utilisateur += "id_periode       INTEGER NOT NULL , ";
createStatement_utilisateur += "periodeEnCours   INTEGER NOT NULL , ";

createStatement_utilisateur += "PRIMARY KEY (id) ";
createStatement_utilisateur += ") ";

//#------------------------------------------------------------
//# CREATE -> Table: fiche_repas
//#------------------------------------------------------------
var createStatement_fiche_repas = "CREATE TABLE IF NOT EXISTS fiche_repas ";
createStatement_fiche_repas += "( ";
createStatement_fiche_repas += "id                        INTEGER NOT NULL, ";
createStatement_fiche_repas += "id_periode                INTEGER NOT NULL, ";
createStatement_fiche_repas += "date_du_jour              TEXT NOT NULL , ";

createStatement_fiche_repas += "petit_dej				  INTEGER NOT NULL , ";
createStatement_fiche_repas += "dejeuner				  INTEGER NOT NULL , ";
createStatement_fiche_repas += "gouter					  INTEGER NOT NULL , ";
createStatement_fiche_repas += "diner					  INTEGER NOT NULL , ";

createStatement_fiche_repas += "PRIMARY KEY (id) ";
createStatement_fiche_repas += ") ";

//#------------------------------------------------------------
//# CREATE -> Table: fiche_pesees
//#------------------------------------------------------------
var createStatement_fiche_pesees = "CREATE TABLE IF NOT EXISTS fiche_pesees ";
createStatement_fiche_pesees += "( ";
createStatement_fiche_pesees += "id                            INTEGER NOT NULL, ";
createStatement_fiche_pesees += "id_periode					   INTEGER NOT NULL, ";
createStatement_fiche_pesees += "date_du_jour                  TEXT NOT NULL , ";

createStatement_fiche_pesees += "bio_dechets				   INTEGER NOT NULL , ";
createStatement_fiche_pesees += "recyclable					   INTEGER NOT NULL , ";
createStatement_fiche_pesees += "verre						   INTEGER NOT NULL , ";
createStatement_fiche_pesees += "poubelle_grise				   INTEGER NOT NULL , ";
createStatement_fiche_pesees += "dechetterie				   TEXT NOT NULL , ";

createStatement_fiche_pesees += "PRIMARY KEY (id) ";
createStatement_fiche_pesees += ") ";



/////////////////// INSERT STATEMENTS ///////////////////

//#------------------------------------------------------------
//# INSERT -> Table: utilisateur
//#------------------------------------------------------------
var insertStatement_utilisateur = "INSERT INTO utilisateur (id, email, id_periode, periodeEnCours) ";
insertStatement_utilisateur += "VALUES (?, ?, ?, ?)";

//#------------------------------------------------------------
//# INSERT -> Table: fiche_repas
//#------------------------------------------------------------
var insertStatement_fiche_repas = "INSERT INTO fiche_repas (id_periode, date_du_jour, petit_dej, dejeuner, gouter, diner) ";
insertStatement_fiche_repas += "VALUES (?, ?, ?, ?, ?, ?)";

//#------------------------------------------------------------
//# INSERT -> Table: fiche_pesees
//#------------------------------------------------------------
var insertStatement_fiche_pesees = "INSERT INTO fiche_pesees (id_periode, date_du_jour, bio_dechets, recyclable, verre, poubelle_grise, dechetterie) ";
insertStatement_fiche_pesees += "VALUES (?, ?, ?, ?, ?, ?, ?)";


/////////////////// SELECT STATEMENTS ///////////////////

//#------------------------------------------------------------
//# SELECT -> Table: utilisateur
//#------------------------------------------------------------
var selectStatement_verifyUserExists = "SELECT * FROM utilisateur WHERE email = ?";

