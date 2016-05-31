

/////////////////// DATABASE INITIALISATION ///////////////////

var db;

// Call function when page is ready for load..
$(function ()
{
	db = openDatabase("Pica", "1.0", "Pica", 10000);	// Create database if not exists.

	var htmlDebugCode = '<p>';
	htmlDebugCode += '	<br />';
	htmlDebugCode += '	<u><strong>Debug => vue complete de la base de donnee</strong></u> :';
	htmlDebugCode += '	<br /><br />';
	htmlDebugCode += '	<span id="DebugDatabaseTables"></span>';
	htmlDebugCode += '	<span id="DatabaseView"></span>';
	htmlDebugCode += '	<br /><br /><br /><br />';
	htmlDebugCode += '</p>';

	if ($('#DEBUG_DATABASE').length == 0)
	{
		console.log("La vue sur la base de donnee ne peut etre etablie... auriez vous oublie d'implementer <span id='DEBUG_DATABASE'></span> dans le HTML ?");
	}
	else
	{
		$('#DEBUG_DATABASE').html(htmlDebugCode);
	}

	try
	{
		if (!window.openDatabase)  // Check if browser/device supports SQLite or not.
			alert('Database not supported !');
		else
		{
			viewDatabase();	// If supported then call Function to view database.
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


/////////////////// TEST ZONE ///////////////////

function viewDatabase()		// CONTROLLER AUTO
{
	var tableNames = ["utilisateur", "fiche_repas", "fiche_pesees"];
	var nameIndex = 0;
	var tablesInfo = "";
	var tablesData = "";

	db.transaction(function (tx)
	{
		// SELECT TABLES
		tx.executeSql(selectStatement_utilisateur, [], onSuccess, onError);
		tx.executeSql(selectStatement_fiche_repas, [], onSuccess, onError);
		tx.executeSql(selectStatement_fiche_pesees, [], onSuccess, onError);

		function onSuccess(tx, results)
		{
			var numberOfLines = results.rows.length;
			tablesData += "<br />" + "<strong>Table : " + tableNames[nameIndex] + "</strong> : <br /><br />";

			tablesInfo += "La table '" + tableNames[nameIndex++] + "' possede " + numberOfLines + " lignes.<br />";
			$('#DebugDatabaseTables').html(tablesInfo);

			for (var i = 0; i < numberOfLines; i++)			// For each line of the current table,
			{
				var line = results.rows.item(i);			// We retreive the object representing a line of this table,
				var key;

				for (key in line)						// Then we get the key (field index name) of each field of the line,
					tablesData += "-- [" + line[key] + "] ";		// And use it as index for the line object to access field value.

				tablesData += "<br />";
			}

			$('#DatabaseView').html(tablesData);
		}

		function onError()
		{
			tablesData += "Table " + tableNames[nameIndex++] + " vide ou inexistante.<br />";
			$('#DatabaseView').html(tablesData);
		}
	})
}


/////////////////// SELECT STATEMENTS ///////////////////

//#------------------------------------------------------------
//# SELECT -> ALL
//#------------------------------------------------------------
var selectStatement_ALL = "SELECT * FROM utilisateur, fiche_repas, fiche_pesees";

//#------------------------------------------------------------
//# SELECT -> Table: utilisateur
//#------------------------------------------------------------
var selectStatement_utilisateur = "SELECT * FROM utilisateur";

//#------------------------------------------------------------
//# SELECT -> Table: fiche_repas
//#------------------------------------------------------------
var selectStatement_fiche_repas = "SELECT * FROM fiche_repas";

//#------------------------------------------------------------
//# SELECT -> Table: fiche_pesees
//#------------------------------------------------------------
var selectStatement_fiche_pesees = "SELECT * FROM fiche_pesees";




/////////////////// UPDATE STATEMENTS ///////////////////

//UPDATE Cars SET Name='Skoda Octavia' WHERE Id=3;