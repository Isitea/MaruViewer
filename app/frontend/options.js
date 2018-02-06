"use strict";
const { ipcRenderer } = require( "electron" );

function init (  ) {
	ipcRenderer.send( "read-options" );
	ipcRenderer.on( "read-options", ( event, settings ) => {
		for ( const [ key, value ] of Object.entries( settings ) ) {
			console.log( key, value );
			if ( document.querySelector( `#${key}` ) ) {
				if ( typeof value === "boolean" )
					if ( value ) document.querySelector( `#${key}` ).setAttribute( "checked", true );
					else document.querySelector( `#${key}` ).removeAttribute( "checked" );
				else
					document.querySelector( `#${key}` ).value = value;
			}
		}
	} );

	document.querySelector( ".Switch-Box .Apply" ).addEventListener( "click", () => {

	} );
	document.querySelector( ".Switch-Box .Reset" ).addEventListener( "click", () => {
		ipcRenderer.send( "reset-options" );
	} );
}
document.addEventListener( "DOMContentLoaded", init );