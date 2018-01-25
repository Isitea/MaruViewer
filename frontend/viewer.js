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

function SearchOnMaru ( title ) {
	let acr = new acrDOM( document.querySelector( ".query-result" ) );
	acr.remove( document.querySelectorAll( ".query-result > div" ) );

	Ajax( "http://marumaru.in/?mod=search&keyword=QUERY".replace( /QUERY/gi, title ), "document", ( ev, DOCUMENT ) => {
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

function createComicInformationBox ( acrDOM, info ) {
	acrDOM.append( {
		div: {
			className: "comic-infomation-box",
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
}

//Require must before using.
const { ImageEx } = require( "../module/ImageEx" );
const { ImageExLoader } = require( "../module/ImageExLoader" );
const { acrDOM } = require( "../module/acrDOM" );
const { configIO } = require( "../module/config-io" );

function tempMain () {
	document.querySelector( ".search-panel .search-start" ).addEventListener( "click", ( e ) => {
		SearchOnMaru( document.querySelector( ".search-panel .search-query" ).value );
	} );
	//SearchOnMaru( '양아치' );
	let cfg = new configIO();
	cfg.addEventListener( "change", ( e ) => { console.log( e ); }, { once: false } );
	cfg.overwrite( { test: 1, isReal: "yes" } );
	cfg.overwrite( { isReal: "yes" } );
	console.log( cfg.get() );
	cfg.overwrite( { test: 2, isReal: "yes" } );
	cfg.overwrite( { test: 2 } );
	console.log( cfg.get() );
}
document.addEventListener( "DOMContentLoaded", tempMain );
//"maruviewer.settings.json"