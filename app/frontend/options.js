"use strict";
const { ipcRenderer, remote } = require( "electron" );

function init (  ) {
	ipcRenderer.on( "read-options", ( event, settings ) => {
		for ( const [ key, value ] of Object.entries( settings ) ) {
			if ( document.querySelector( `#${key}` ) ) {
				if ( typeof value === "boolean" )
					//if ( value ) document.querySelector( `#${key}` ).setAttribute( "checked", true );
					//else document.querySelector( `#${key}` ).removeAttribute( "checked" );
					if ( value ) document.querySelector( `#${key}` ).checked = true;
					else document.querySelector( `#${key}` ).checked = false;
				else {
					document.querySelector( `#${key}` ).value = value;
					document.querySelector( `#${key} + div.Switch` ).title = value;
				}
			}
		}
	} );
	ipcRenderer.send( "read-options" );
	for ( const item of document.querySelectorAll( '.Cover' ) ) {
		item.addEventListener( 'click', ( item => event => item.parentElement.parentElement.querySelector( 'input' ).checked = !item.parentElement.parentElement.querySelector( 'input' ).checked )( item) )
	}

	document.querySelector( "#path + div.Switch" ).addEventListener( "click", () => {
		new Promise( ( resolve, reject ) => remote.dialog.showOpenDialog( {
			title: "Choose directory for saving comics",
			defaultPath: ( document.querySelector( '#path' ).value.length > 0 ? document.querySelector( '#path' ).value : __dirname ),
			properties: [ "openDirectory" ]
		}, resolve ) ).then( ( paths ) => {
			if ( paths ) {
				let [ path ] = paths;
				if ( path ) {
					document.querySelector( "#path" ).value = path;
					document.querySelector( "#path + div.Switch" ).title = path;
				}
			}
		} );
	} );
	document.querySelector( ".Switch-Box .Apply" ).addEventListener( "click", () => {
		let settings = {};
		for ( const item of  document.querySelectorAll( 'input' ) ) {
			switch ( item.type ) {
				case "checkbox":
					settings[item.id] = item.checked;
					break;
				case "text":
					settings[item.id] = item.value;
					break;
			}
		}
		ipcRenderer.send( "apply-options", settings );
	} );
	document.querySelector( ".Switch-Box .Reset" ).addEventListener( "click", () => {
		ipcRenderer.send( "reset-options" );
	} );
}
document.addEventListener( "DOMContentLoaded", init );
