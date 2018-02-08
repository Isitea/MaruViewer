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
						if ( List.findIndex( ( link => ( item ) => item.link === link )( item.link ) ) > -1 ) break;
					} else {
						if ( filtered.length > 4 ) break;
					}
					filtered.push( item );
				}
			}
			if ( filtered.length ) List = filtered;

			return filtered;
		} ).then( list => new Promise( ( resolve, reject ) => {
			let Promises = [ Promise.resolve() ];
			for ( const item of list ) {
				Promises.push( Promises[ Promises.length - 1 ]
					.then( () => new Promise( ( resolve, reject ) => Ajax( item.link, resolve ) ) )
					.then( DOCUMENT => ( {
						title: item.title,
						image: DOCUMENT.querySelector( "#vContent img" ).src,
						link: DOCUMENT.querySelector( `#vContent a[href*=http]:not([href*=${siteRecognizer}])` ).href
					} ) ) );
			}
			Promises.shift();
			Promise.all( Promises ).then( updated => resolve( updated ) );
		} ) ).then( updated => {
			ipcRenderer.send( "maru-updated", updated.reverse() );
			//console.log( updated );
		} );
}

let List = [];
setInterval( parseUpdates, 15 * 60 * 1000 );
parseUpdates();
/* //Array for test
ipcRenderer.send( "maru-updated", [ { image: 'http://marumaru.in/quickimage/3aa4eaa6c5450b8c9c64bf9f11331950.jpg',
	link: 'http://wasabisyrup.com/archives/K8Clw7zfDII',
	title: '악마 메무메무 짱 34화 ' },
{ image: 'http://marumaru.in/quickimage/3860a208084f077be342f1ab391174ec.jpg',
	link: 'http://wasabisyrup.com/archives/obEgs1LEOKc',
	title: '사랑을 모르는 우리는 0화 ' },
{ image: 'http://marumaru.in/quickimage/ee9e773058455e751e12633577ff18cd.jpg',
	link: 'http://wasabisyrup.com/archives/n5wFKFOriIs',
	title: '그런데 치기라 군은 너무달콤해 2화 ' },
{ image: 'http://marumaru.in/quickimage/e28218105ed4dd164320d1f69640af14.jpeg',
	link: 'http://wasabisyrup.com/archives/EjdNarzAOL0',
	title: '유가미 군에게는 친구가 없다 21화 ' },
{ image: 'http://marumaru.in/quickimage/f78954cfc119dc70c775b199b77cdbee.jpg',
	link: 'http://wasabisyrup.com/archives/G5BE5ggHAd8',
	title: '원피스(ONE PIECE) 894화 ' } ] );
*/