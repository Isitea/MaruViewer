"use strict";
function Ajax ( url, type = "document", response ) {
	let xhr = new XMLHttpRequest();
	xhr.open( "GET", url, true );
	xhr.responseType = type;
	//xhr.onreadystatechange = ( e ) => { console.log( e.target.readyState, e.target.responseURL,e.target.status ); };
	xhr.addEventListener( "load", ( ev ) => {
		response( ev, xhr.response );
	} );

	xhr.send();
}

//Require must before using.
//const { ImageExLoader } = require( "../module/ImageExLoader" );
const { ImageEx } = require( "../module/ImageEx" );
const { acrDOM } = require( "../module/acrDOM" );
//const { iOO } = require( "../module/ObjectObserver" );
//const { configIO } = require( "../module/config-io" );
const { ipcRenderer } = require( "electron" );

/*
let cfg = new configIO( { file: "maruviewer.settings.json" } );
cfg.addEventListener( "change", ( e ) => { console.log( e.details.old, e.details.new ); } );
cfg.get().then( r => console.log( r ) );
*/
function initSearch () {
	function SearchOnMaru ( title ) {
		if ( document.body.classList.contains( "running" ) ) return false;
		else { document.body.classList.add( "running" ); }
		let acr = new acrDOM( document.querySelector( ".query-result" ) );
		acr.remove( document.querySelectorAll( ".query-result > div" ) );

		Ajax( "http://marumaru.in/?mod=search&keyword=QUERY".replace( /QUERY/gi, title ), "document", ( ev, DOCUMENT ) => {
			document.body.classList.remove( "running" );
			let ComicList = DOCUMENT.querySelectorAll( "#rcontent #s_post .postbox > a.subject[href*=manga]" );
			if ( ComicList.length > 0 ) {
				ComicList.forEach( ( Anchor ) => {
					let info = {
						title: Anchor.querySelector( ".sbjbox" ).innerText.replace( /\s+/gi, " "),
						link: Anchor.href,
						image: ( Anchor.querySelector( ".thumb img" ) && Anchor.querySelector( ".thumb img" ).src !== undefined ? Anchor.querySelector( ".thumb img" ).src : "" )
					};
					createComicInformationBox( acr, info );
				} );
			}
		} );
	}

	SearchOnMaru( '양아치' );

	document.querySelector( ".search-panel .search-query" ).addEventListener( "keydown", ( e ) => {
		if ( e.code === "Enter" ) document.querySelector( ".search-panel .search-start" ).click();
	} );
	document.querySelector( ".search-panel .search-start" ).addEventListener( "click", ( e ) => {
		SearchOnMaru( document.querySelector( ".search-panel .search-query" ).value );
	} );
}
function createComicInformationBox ( acrDOM, info ) {
	acrDOM.append( {
		div: {
			className: "comic-information-box",
			dataset: { link: info.link },
			_CHILD: [
				{
					imgex: {
						className: "graphic",
						url: info.image
					}
				},
				{
					div: {
						className: "text",
						_CHILD: {
							div: {
								className: "first-wrap",
								_CHILD: {
									div: {
										className: "second-wrap",
										_CHILD: [
											{
												div: {
													innerText: info.title
												}
											},
											{
												div: {
													innerText: info.title
												}
											},
											{
												div: {
													innerText: info.title
												}
											}
										]
									}
								}
							}
						}
					}
				}
			]
		}
	} );
	acrDOM.node.lastChild.addEventListener( "click", ( event ) => {
		event.path.forEach( ( item ) => {
			if ( item.classList && item.classList.contains( "comic-information-box" ) ) {
				ipcRenderer.send( "open-comic", { type: "open-comic", details: { link: item.dataset.link } } );
			}
		} );
	} );
}

function initModes() {
	document.querySelector( ".mode-selector[data-mode] .mode-trigger" ).addEventListener( "click", ( e ) => {
		document.querySelector( ".mode-selector[data-mode]" ).dataset.mode = e.target.dataset.mode;
	} );
	Array.prototype.slice
		.call( document.querySelectorAll( ".mode-selector[data-mode] > div.modes > div.separator > div" ) )
		.forEach( ( item ) => {
				item.addEventListener( "click", ( e ) => {
					let mode = e.target.dataset.mode;
					document.querySelector( ".mode-selector[data-mode]" ).dataset.mode = mode;
					getList( mode );
			} );
		} );
}

function getList ( mode ) {
	console.log( mode );
}

function tempMain () {
	initSearch();
	initModes();
	/*
	let cfg_RW = cfg.read( ( e ) => { console.log( "Read: ", e ); } )
		.then( () => { cfg.set( { alpha: 1, beta: 2, gamma: 3 } ) } )
		.then( () => { cfg.write( cfg.get(), ( e ) => { console.log( "Write:", e ); } ); });
		*/
}
document.addEventListener( "DOMContentLoaded", tempMain );
