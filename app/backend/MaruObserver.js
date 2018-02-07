"use strict";
const siteRecognizer = "marumaru";
const siteAddress = `http://${siteRecognizer}.in`;
const { ipcRenderer } = require( "electron" );
const settings = {};

function readOptions () {
	ipcRenderer.send( "read-options" );
	ipcRenderer.on( "read-options", ( event, changed ) => {
		for ( const key of Object.keys( settings ) )
			delete settings[key];

		for ( const [ key, value ] of Object.entries( changed ) )
			settings[key] = value;
	} );
}

ipcRenderer.on( 'update-options', readOptions );
readOptions();

function parseUpdates () {
	function Ajax ( url, response ) {
		let xhr = new XMLHttpRequest();
		xhr.open( "GET", url, true );
		xhr.responseType = "document";
		xhr.addEventListener( "load", () => response( xhr.response ) );

		xhr.send();
	}

	return new Promise( ( resolve, reject ) => Ajax( `${siteAddress}/?c=26&recnum=23&sort=gid&p=1`, resolve ) )
		.then( DOCUMENT => new Promise( ( resolve, reject ) => {
			let information = [];
			DOCUMENT.querySelectorAll( "#boardList table tbody tr[cid]" ).forEach( Anchor => {
				information.push( {
					title: Anchor.querySelector( "td div[cid]" ).firstChild.textContent.replace( /^\s*|\s*$/, "" ),
					link: `${siteAddress}/b/manga/${Anchor.querySelector( "td a" ).href.replace( /.+?(\d+)$/, "$1" )}`
				} );
			} );

			resolve( information );
		} ) ).then( list => {
			let filtered = [];
			for ( const item of list ) {
				if ( item !== undefined ) {
					if ( List.length ) {
						if ( List.findIndex( ( link => ( item ) => item.link === link )( item.link ) ) > -1 ) {
							break;
						}
					}
					filtered.push( item );
				}
			}
			if ( List.length ) List = filtered;
			else List = [ filtered[0], filtered[1], filtered[2], filtered[3], filtered[4] ];

			//ipcRenderer.send( "maru-updated", List );
		} );
}

let List = [];
setInterval( parseUpdates, 15 * 60 * 1000 );
parseUpdates();

/*
if ( information.length ) {
	information.push( information[information.length - 1].then( () => new Promise( ( resolve, reject ) => Ajax( info.link, resolve ) )
		.then( DOCUMENT => {
			let link = DOCUMENT.querySelector( `#vContent a[href*=http]:not([href*=${siteRecognizer}])` );
			return { title: info.title, link: link.href };
		} ) ) );
} else {
	information.push( new Promise( ( resolve, reject ) => Ajax( info.link, resolve ) )
		.then( DOCUMENT => {
			let link = DOCUMENT.querySelector( `#vContent a[href*=http]:not([href*=${siteRecognizer}])` );
			return { title: info.title, link: link.href };
		} ) );
}
information.push( new Promise( ( resolve, reject ) => Ajax( info.link, resolve ) )
	.then( DOCUMENT => {
		let link = DOCUMENT.querySelector( `#vContent a[href*=http]:not([href*=${siteRecognizer}])` );
		return { title: info.title, link: link.href };
	} ) );
Promise.all( information ).then( list => resolve( list ) );
