
var db;	// Database handle

var ptitDej = 0;
var dejeuner = 0;
var gouter = 0;
var diner = 0;


// Call function when DOM is ready (entry point)
$(function ()
{
	db = openDatabase("Pica", "1.0", "Pica", 10000);	// Create database if not exists.

	try
	{
		if (!window.openDatabase)  // Check if browser/device supports SQLite or not.
			alert('Database not supported !');
		else
		{
			manipulateDatabase_repas();	// If supported then call function to manipulate database.
		}

	}
	catch (e)
	{
		if (e == 2)
			// Version number mismatch.
			alert("Invalid database version.");
		else
			alert("Unknown error " + e + ".");
	}
})


/////////////////// DATABASE MANIPULATIONS ///////////////////

var dateMax = moment();
var dateMin = moment();
var dateEnCours = moment();
var dateFormattee = "";
var jour = "";
var mois = "";
var annee = "";

// CONTROLLER AUTO
function manipulateDatabase_repas()
{
	ObtenirDateMin();
	GererLaDate();

	htmlEventsListeners();

	if (typeof viewDatabase != "undefined")		// needs 'DB_view.js' implementation in HTML code to be enabled.
		viewDatabase();
	else
		console.log("La vue sur la base de donnee ne peut etre etablie... auriez vous oublie d'implementer 'DB_view.js' dans le HTML ?");
}


function ObtenirDateMin()
{
	var emailUtilisateur = 0;

	db.transaction(function (tx)
	{
		// SELECT TABLES
		tx.executeSql(selectStatement_emailUtilisateur, [], onSuccess, onError);

		function onSuccess(tx, results)
		{
			// console.log(results.rows.length);
			var line = results.rows.item(0);

			emailUtilisateur = line["email"];
			console.log('email utilisateur : ' + emailUtilisateur);
			obtenirDateDebut();
		}

		function onError()
		{
			console.log("Error ID utilisateur");
		}
	})

	var obtenirDateDebut = function ()
	{
		console.log("CHECK");

		/////////// AJAX ///////////
		$.ajax
		({
			url: "http://pica.synthearecherche.com/ajax/ObtenirDateDeDebut",
			type: "POST",
			data: dataStruct =
			{
				email: emailUtilisateur,
			},
			dataType: "json",
			cache: false,

			success: function (json)
			{
				if (json.error === 0)
				{
					console.log(json.successMessage);
					var dateString = moment.unix(json.date['dateDebut']).format("MM/DD/YYYY");
					console.log("La date est : " + dateString);
					dateMin = moment(dateString, "MM/DD/YYYY");
					console.log(dateMin.year() + "" + dateMin.month() + "" + 1 + "" + dateMin.date());
				}
				else
				{
					dateMin = moment();
					console.log(dateMin.year() + "" + dateMin.month() + "" + 1 + "" + dateMin.date());
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


function GererLaDate()
{
	if (dateEnCours.date() >= dateMax.date())	// gestion date max
		dateEnCours = moment(dateMax);

	if (dateEnCours.date() <= dateMin.date())	// gestion date min
		dateEnCours = moment(dateMin);

	jour = dateEnCours.date();
	mois = dateEnCours.month() + 1;
	annee = dateEnCours.year();

	if (jour < 10)
	{
		jour = '0' + jour
	}
	if (mois < 10)
	{
		mois = '0' + mois
	}
	var today = jour + '/' + mois + '/' + annee;


	dateFormattee = annee + '' + mois + '' + jour;

	$("#dateDuJour").html(today);

	MettreAJourValeurs();
}


function MettreAJourValeurs()
{
	db.transaction(function (tx)
	{
		// SELECT TABLES
		tx.executeSql(selectStatement_donneesRepas, [dateFormattee], onSuccess, onError);

		function onSuccess(tx, results)
		{
			if (results.rows.length > 0)
			{
				var line = results.rows.item(0);

				ptitDej = line['petit_dej'];
				dejeuner = line['dejeuner'];
				gouter = line['gouter'];
				diner = line['diner'];

				$("#valeurPetitDej").html(ptitDej);
				$("#valeurDejeuner").html(dejeuner);
				$("#valeurGouter").html(gouter);
				$("#valeurDiner").html(diner);
			}
			else
			{
				ptitDej = 0;
				dejeuner = 0;
				gouter = 0;
				diner = 0;

				$("#valeurPetitDej").html(ptitDej);
				$("#valeurDejeuner").html(dejeuner);
				$("#valeurGouter").html(gouter);
				$("#valeurDiner").html(diner);
			}
		}

		function onError()
		{
			
		}
	})
}

var selectStatement_donneesRepas = "SELECT petit_dej, dejeuner, gouter, diner FROM fiche_repas WHERE date_du_jour = ?";


/////////////////// EVENTS ////////////////////

$('.boutonPrecedent').on('click', function ()
{
	console.log("bouton précédent");
	dateEnCours.subtract(1, 'days');
	GererLaDate();
});

$('.boutonSuivant').on('click', function ()
{
	console.log("bouton suivant");
	dateEnCours.add(1, 'days');
	GererLaDate();
})

function htmlEventsListeners()
{
	$('#sauvegarde').on("click", obtenirPeriode);

	$('#ptitDej .boutonPlus').on("click", function () { ptitDej++; $('#valeurPetitDej').text(ptitDej); });
	$('#ptitDej .boutonMoins').on("click", function () { ptitDej--; if (ptitDej < 0) ptitDej = 0; $('#valeurPetitDej').text(ptitDej); });

	$('#dejeuner .boutonPlus').on("click", function () { dejeuner++; $('#valeurDejeuner').text(dejeuner); });
	$('#dejeuner .boutonMoins').on("click", function () { dejeuner--; if (dejeuner < 0) dejeuner = 0; $('#valeurDejeuner').text(dejeuner); });

	$('#gouter .boutonPlus').on("click", function () { gouter++; $('#valeurGouter').text(gouter); });
	$('#gouter .boutonMoins').on("click", function () { gouter--; if (gouter < 0) gouter = 0; $('#valeurGouter').text(gouter); });

	$('#diner .boutonPlus').on("click", function () { diner++; $('#valeurDiner').text(diner); });
	$('#diner .boutonMoins').on("click", function () { diner--; if (diner < 0) diner = 0; $('#valeurDiner').text(diner); });
}


function obtenirPeriode()
{
	var idPeriode = 0;

	db.transaction(function (tx)
	{
		// SELECT TABLES
		tx.executeSql(selectStatement_idPeriode, [], onSuccess, onError);

		function onSuccess(tx, results)
		{
			// console.log(results.rows.length);
			var line = results.rows.item(0);

			idPeriode = line["id_periode"];
			console.log('id de periode : ' + idPeriode);
			obtenirIDutilisateur(idPeriode);
		}

		function onError()
		{
			console.log("Error ID periode");
		}
	})
}


function obtenirIDutilisateur(idPeriode)
{
	var idUtilisateur = 0;

	db.transaction(function (tx)
	{
		// SELECT TABLES
		tx.executeSql(selectStatement_idUtilisateur, [], onSuccess, onError);

		function onSuccess(tx, results)
		{
			// console.log(results.rows.length);
			var line = results.rows.item(0);

			idUtilisateur = line["id"];
			console.log('id utilisateur : ' + idUtilisateur);
			insertRepas(idPeriode, idUtilisateur);
		}

		function onError()
		{
			console.log("Error ID utilisateur");
		}
	})
}


function insertRepas(idPeriode, idUtilisateur)
{
	console.log("\n-------INSERTION REPAS-------");

	var valueDate = annee + mois + jour;
	var valuePetitDej = $('#valeurPetitDej').text();
	var valueDejeuner = $('#valeurDejeuner').text();
	var valueGouter = $('#valeurGouter').text();
	var valueDiner = $('#valeurDiner').text();

	console.log("idPeriode : " + idPeriode);
	console.log("valueDate : " + valueDate);
	console.log("valuePetitDej : " + valuePetitDej);
	console.log("valueDejeuner : " + valueDejeuner);
	console.log("valueGouter : " + valueGouter);
	console.log("valueDiner : " + valueDiner);

	/////////// AJAX ///////////
	$.ajax
	({
		url: "http://pica.synthearecherche.com/ajax/createNewRepas",
		type: "POST",
		data: dataStruct =
		{
			idPeriode: idPeriode,
			//idUtilisateur: idUtilisateur,
			valueDate: valueDate,
			valuePetitDej: valuePetitDej,
			valueDejeuner: valueDejeuner,
			valueGouter: valueGouter,
			valueDiner: valueDiner,
		},
		dataType: "json",
		cache: false,

		success: function (json)
		{
			if (json.error === 0)
			{
				console.log(json.successMessage);

				insertRepasLocal();
			}
			else
			{
				updateRepasLocal();
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

	var insertRepasLocal = function ()
	{
		db.transaction(function (tx)
		{
			tx.executeSql(insertStatement_fiche_repas, [idPeriode, valueDate, valuePetitDej, valueDejeuner, valueGouter, valueDiner], onSuccess, onError);
		})

		function onSuccess()
		{
			console.log("Un repas a ete insere. (local)");
			//window.location = "repas.html";
			if (typeof viewDatabase != "undefined")		// needs 'DB_view.js' implementation in HTML document to be enabled.
			     viewDatabase();
		    else
			     console.log("La vue sur la base de donnee ne peut etre etablie... auriez vous oublie d'implementer 'DB_view.js' dans le HTML ?");
		}

		function onError()
		{
			console.log("Echec : requette SQLite fausse.");
			console.log("Un repas n'a pas ete insere. (local)");
		}
	}

	var updateRepasLocal = function ()
	{
		db.transaction(function (tx)
		{
			tx.executeSql(updateStatement_fiche_repas, [idPeriode, valuePetitDej, valueDejeuner, valueGouter, valueDiner, valueDate], onSuccess, onError);
		})

		function onSuccess()
		{
			console.log("Un repas a ete mis a jour. (local)");
			//window.location = "repas.html";
			if (typeof viewDatabase != "undefined")		// needs 'DB_view.js' implementation in HTML document to be enabled.
			     viewDatabase();
		    else
			     console.log("La vue sur la base de donnee ne peut etre etablie... auriez vous oublie d'implementer 'DB_view.js' dans le HTML ?");
		}

		function onError()
		{
			console.log("Echec : requette SQLite fausse.");
			console.log("Un repas n'a pas ete mis a jour. (local)");
		}
	}
}


/////////////////// INSERT STATEMENTS ///////////////////


//#------------------------------------------------------------
//# INSERT -> Table: fiche_repas
//#------------------------------------------------------------
var insertStatement_fiche_repas = "INSERT INTO fiche_repas (id_periode, date_du_jour, petit_dej, dejeuner, gouter, diner) ";
insertStatement_fiche_repas += "VALUES (?, ?, ?, ?, ?, ?)";

var updateStatement_fiche_repas = "UPDATE fiche_repas ";
updateStatement_fiche_repas += "SET id_periode=?, petit_dej=?, dejeuner=?, gouter=?, diner=? ";
updateStatement_fiche_repas += "WHERE date_du_jour = ?";


/////////////////// SELECT STATEMENTS ///////////////////


//#------------------------------------------------------------
//# SELECT -> Table: utilisateur
//#------------------------------------------------------------
var selectStatement_idPeriode = "SELECT id_periode FROM utilisateur";


var selectStatement_idUtilisateur = "SELECT id FROM utilisateur";
var selectStatement_emailUtilisateur = "SELECT email FROM utilisateur";