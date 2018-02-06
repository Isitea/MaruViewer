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
console.log( global );
console.log( window );