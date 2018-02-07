"use strict";
const siteRecognizer = "marumaru";
const siteAddress = `http://${siteRecognizer}.in`;
const { ipcRenderer } = require( "electron" );

function parseUpdates () {
	function Ajax ( url, response ) {
		let xhr = new XMLHttpRequest();
		xhr.open( "GET", url, true );
		xhr.responseType = "document";
		xhr.addEventListener( "load", () => response( xhr.response ) );

		xhr.send();
	}

	return new Promise( ( resolve, reject ) => Ajax( `${siteAddress}/?c=26&recnum=9&sort=gid&p=1`, resolve ) )
		.then( DOCUMENT => new Promise( ( resolve, reject ) => {
			let informations = [];
			DOCUMENT.querySelectorAll( "#boardList table tbody tr[cid]" ).forEach( ( Anchor ) => {
				let info = {
					title: Anchor.querySelector( "td div[cid]" ).firstChild.textContent.replace( /^\s*|\s*$/, "" ),
					link: `${siteAddress}/b/manga/${Anchor.querySelector( "td a" ).href.replace( /.+?(\d+)$/, "$1" )}`
				};
				if ( informations.length ) {
					informations.push( informations[informations.length - 1].then( () => new Promise( ( resolve, reject ) => Ajax( info.link, resolve ) )
						.then( DOCUMENT => {
							let link = DOCUMENT.querySelector( `#vContent a[href*=http]:not([href*=${siteRecognizer}])` );
							return { title: info.title, link: link.href };
						} ) ) );
				} else {
					informations.push( new Promise( ( resolve, reject ) => Ajax( info.link, resolve ) )
						.then( DOCUMENT => {
							let link = DOCUMENT.querySelector( `#vContent a[href*=http]:not([href*=${siteRecognizer}])` );
							return { title: info.title, link: link.href };
						} ) );
				}
				informations.push( new Promise( ( resolve, reject ) => Ajax( info.link, resolve ) )
					.then( DOCUMENT => {
						let link = DOCUMENT.querySelector( `#vContent a[href*=http]:not([href*=${siteRecognizer}])` );
						return { title: info.title, link: link.href };
					} ) );
			} );
			Promise.all( informations ).then( list => resolve( list ) );
		} ) ).then( list => {
			let result = [];
			for ( const item of list ) if ( item !== undefined ) result.push( item );
			list = result;
			if ( List.length ) {
				let result = [];
				for ( let i = 0; i <= list.indexOf( List[0] ); i++ ) {
					result.unshift( list[i] );
				}
				if ( result.length ) List = result;
				else List = [ list[0], list[1], list[2], list[3], list[4] ];
			} else List = [ list[0], list[1], list[2], list[3], list[4] ];

			ipcRenderer.send( "maru-updated", List );
		} );
}

let List = [];
setInterval( parseUpdates, 15 * 60 * 1000 );
parseUpdates();