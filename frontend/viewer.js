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


function main () {
	function initSearch () {
		function SearchOnMaru ( title ) {
			if ( document.body.classList.contains( "running" ) ) return false;
			else { document.body.classList.add( "running" ); }
			acr.remove( document.querySelectorAll( ".query-result .content > div" ) );

			Ajax( "http://marumaru.in/?mod=search&keyword=QUERY".replace( /QUERY/gi, title ), "document",
				( ev, DOCUMENT ) => {
				document.body.classList.remove( "running" );
				let ComicList = DOCUMENT.querySelectorAll( "#rcontent #s_post .postbox > a.subject[href*=manga]" );
				if ( ComicList.length > 0 ) {
					ComicList.forEach( ( Anchor ) => {
						let info = {
							title: Anchor.querySelector( ".sbjbox" ).innerText.replace( /\s+/gi, " "),
							link: Anchor.href,
							image: ( Anchor.querySelector( ".thumb img" ) && Anchor.querySelector( ".thumb img" ).src !== undefined ? Anchor.querySelector( ".thumb img" ).src : "" )
						};
						createComicInformationBox( info );
					} );
				}
			} );
		}

		//document.querySelector( ".mode-selector[data-mode]" ).dataset.mode = "search";
		//SearchOnMaru( '양아치' );

		document.querySelector( ".search-panel .search-query" ).addEventListener( "keydown", ( e ) => {
			if ( e.code === "Enter" ) document.querySelector( ".search-panel .search-start" ).click();
		} );
		document.querySelector( ".search-panel .search-start" ).addEventListener( "click", ( e ) => {
			switch  ( document.querySelector( ".search-panel .search-select.provider" ).value ) {
				case "maru":
					SearchOnMaru( document.querySelector( ".search-panel .search-query" ).value );
					break;
			}
		} );
	}
	function initModes () {
		document.querySelector( ".filter-panel .filter-query" ).addEventListener( "keyup", ( event ) => {
			document.querySelector( "#dynamic" )
				.innerText = `.query-result .content div.comic-information-box:not([data-title${ ( event.target.value.length > 0 ? `*="${event.target.value}"` : "" ) }]) { display: none; }`;
		} );
		document.querySelector( ".mode-selector[data-mode] .mode-trigger" )
			.addEventListener( "click", e => document.querySelector( ".mode-selector[data-mode]" ).dataset.mode = e.target.dataset.mode );
		Array.prototype.slice
			.call( document.querySelectorAll( ".mode-selector[data-mode] > div.modes > div.separator > div" ) )
			.forEach( item => item.addEventListener( "click", getList ) );
		document.querySelector( ".query-result .request-more" ).addEventListener( "click", event => {
			initListBy( {
				category: Number( document.querySelector( ".query-result .request-more" ).dataset.category ),
				type: document.querySelector( ".query-result .request-more" ).dataset.type,
				page: Number( document.querySelector( ".query-result .request-more" ).dataset.page ),
				origin: document.querySelector( ".query-result .request-more" ).dataset.origin
			} );
		} );
	}
	function initListBy ( { type, page, category, origin } ) {
		if ( page === 1 ) {
			document.querySelector( ".query-result .request-more" ).click();
			acr.remove( document.querySelectorAll( ".query-result .content > div" ) );
		}
		Ajax( `${origin}?c=${category}&sort=${type}&p=${page}`, "document",
			( ev, DOCUMENT ) => {
			let ComicList;
			switch ( category ) {
				case 26:
					ComicList = DOCUMENT.querySelectorAll( "#boardList table tbody tr[cid]" );
					if ( ComicList.length > 0 ) {
						ComicList.forEach( ( Anchor ) => {
							let info = {
								title: Anchor.querySelector( "td div[cid]" ).firstChild.textContent.replace( /^\s*|\s*$/, "" ),
								link: Anchor.querySelector( "td a" ).href,
								image: Anchor.querySelector( "td .image-thumb" ).style.backgroundImage.replace( /.*?"(.+)".*/, "$1" ).replace( "thumb-", "" ).replace( /^\//, origin )
							};
							createComicInformationBox( info );
						} );
						document.querySelector( ".query-result" ).dataset.remain = true;
						document.querySelector( ".query-result .request-more" ).dataset.category = category;
						document.querySelector( ".query-result .request-more" ).dataset.type = type;
						document.querySelector( ".query-result .request-more" ).dataset.origin = origin;
						document.querySelector( ".query-result .request-more" ).dataset.page = ++page;
					} else {
						document.querySelector( ".query-result" ).dataset.remain = false;
					}
					break;
				case 40:
					ComicList = DOCUMENT.querySelectorAll( "#bbslist .gallery > .picbox" );
					if ( ComicList.length > 0 ) {
						ComicList.forEach( ( Anchor ) => {
							let info = {
								title: Anchor.querySelector( ".sbjx a" ).innerText.replace( /\s+/gi, " "),
								link: Anchor.querySelector( ".pic a" ).href,
								image: ( Anchor.querySelector( "a img" ) && Anchor.querySelector( "a img" ).src !== undefined ? Anchor.querySelector( "a img" ).src : "" )
							};
							createComicInformationBox( info );
						} );
						document.querySelector( ".query-result" ).dataset.remain = true;
						document.querySelector( ".query-result .request-more" ).dataset.category = category;
						document.querySelector( ".query-result .request-more" ).dataset.type = type;
						document.querySelector( ".query-result .request-more" ).dataset.origin = origin;
						document.querySelector( ".query-result .request-more" ).dataset.page = ++page;
					} else {
						document.querySelector( ".query-result" ).dataset.remain = false;
					}
					break;
			}
		} );
	}
	function createComicInformationBox ( info ) {
		acr.append( {
			div: {
				className: "comic-information-box",
				dataset: { link: info.link, title: info.title },
				addEventListener: {
					type: "click",
					listener: ( event ) => {
						event.path.forEach( ( item ) => {
							if ( item.classList && item.classList.contains( "comic-information-box" ) ) {
								ipcRenderer.send( "open-comic", { type: "open-comic", details: { link: item.dataset.link } } );
							}
						} );
					}
				},
				_CHILD: [
					{
						imgex: {
							className: "graphic",
							url: info.image,
							addEventListener: {
								type: "Error",
								listener: event => {
									event.preventDefault();
									event.ImageEx.url = event.ImageEx.src.replace( "quickimage/", "quickimage/thumb-" );
								}
							}
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
	function getList ( event ) {
		let mode = event.target.dataset.mode;
		document.querySelector( ".mode-selector[data-mode]" ).dataset.mode = mode;
		/*
		if ( document.body.classList.contains( "running" ) ) return false;
		else { document.body.classList.add( "running" ); }
		*/
		switch ( mode ) {
			case "search":
				document.querySelector( ".query-result" ).dataset.remain = false;
				break;
			case "recent":
				initListBy( { type: "gid", page: 1, category: 26, origin: "http://marumaru.in/" } );
				break;
			case "byName":
				initListBy( { type: "subject", page: 1, category: 40, origin: "http://marumaru.in/" } );
				break;
			case "byActivity":
				initListBy( { type: "gid", page: 1, category: 40, origin: "http://marumaru.in/" } );
				break;
		}
	}


	let acr = new acrDOM( document.querySelector( ".query-result .content" ) );

	initModes();
	initSearch();
	/*
	let cfg_RW = cfg.read( ( e ) => { console.log( "Read: ", e ); } )
		.then( () => { cfg.set( { alpha: 1, beta: 2, gamma: 3 } ) } )
		.then( () => { cfg.write( cfg.get(), ( e ) => { console.log( "Write:", e ); } ); });
		*/
}
document.addEventListener( "DOMContentLoaded", main );
