"use strict";
function Ajax ( url, type = "document", response ) {
	let xhr = new XMLHttpRequest();
	xhr.open( "GET", url, true );
	xhr.responseType = type;
	//xhr.onreadystatechange = ( e ) => { console.log( e.target.readyState, e.target.responseURL,e.target.status ); };
	xhr.addEventListener( "load", ( ev ) => {
		response( ev, xhr.response );
	} );
	xhr.addEventListener( "error", e => {
		console.dir( e );
	} );

	try { xhr.send(); }
	catch ( e ) {
		console.dir( e );
	}
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
	function initContent () {
		document.querySelector( ".filter-panel .filter-query" ).addEventListener( "keyup", filter );
		document.querySelector( ".query-result" ).addEventListener( "wheel", virtualScroll, { passive: true } );
		window.addEventListener( "resize", () => virtualScroll( 0 ) );
	}
	function virtualScroll ( sign, starting ) {
		const n = parseInt( window.innerWidth / 200 ) * parseInt( ( window.innerHeight - 32 - 64 ) / 300 );
		document.querySelector( ".query-result .list-shown.prev" ).classList.remove( "exist" );
		document.querySelector( ".query-result .list-shown.next" ).classList.remove( "exist" );
		if ( filtered.length > n ) {
			let index = filtered.findIndex( item => !item.classList.contains( "filtered-hidden" ) );
			if ( typeof sign !== "number" ) sign = Math.sign( sign.wheelDeltaY );
			//console.log( `n: ${n}, index: ${index}, length: ${filtered.length}`);
			switch ( sign ) {
				case -1:
					if ( index + n < filtered.length ) {
						filtered[index].classList.toggle( "filtered-hidden" );
						filtered[index + n].classList.toggle( "filtered-hidden" );
					}
					break;
				case 1:
					if ( index > 0 ) {
						filtered[index - 1].classList.toggle( "filtered-hidden" );
						filtered[index - 1 + n].classList.toggle( "filtered-hidden" );
					}
					break;
				case 0:
					let count = 0;
					if ( typeof starting === "number" ) {
						index = starting;
						for ( let i = 0; i < filtered.length && i < index; i++ ) {
							filtered[i].classList.add( "filtered-hidden" );
						}
					}
					for ( let i = index; i < filtered.length && i < index + n; i++ ) {
						filtered[i].classList.remove( "filtered-hidden" );
						count++;
					}
					for ( let i = index + n; i < filtered.length && index + n < filtered.length; i++ ) {
						filtered[i].classList.add( "filtered-hidden" );
					}
					if ( count < n ) {
						for ( let i = n - count;  i > 0 && index - i >= 0; i-- ) {
							filtered[index - i].classList.remove( "filtered-hidden" );
						}
					}
					break;
			}
			index = filtered.findIndex( item => !item.classList.contains( "filtered-hidden" ) );
			if ( index > 0 ) {
				document.querySelector( ".query-result .list-shown.prev" ).classList.add( "exist" );
			} else {
				document.querySelector( ".query-result .list-shown.prev" ).classList.remove( "exist" );
			}
			if ( index + n < filtered.length ) {
				document.querySelector( ".query-result .list-shown.next" ).classList.add( "exist" );
			} else {
				document.querySelector( ".query-result .list-shown.next" ).classList.remove( "exist" );
			}
		}
		else {
			for ( let i = 0;  i < filtered.length; i++ ) {
				filtered[i].classList.remove( "filtered-hidden" );
			}
		}
		//console.log( filtered );
	}
	function initSearch ( origin ) {
		function SearchOnMaru ( title ) {
			if ( document.body.classList.contains( "running" ) ) return false;
			else { document.body.classList.add( "running" ); }
			acr.remove( document.querySelectorAll( ".query-result .content > div" ) );

			Ajax( `${origin}?mod=search&keyword=QUERY`.replace( /QUERY/gi, title ), "document",
				( ev, DOCUMENT ) => {
				document.body.classList.remove( "running" );
				let ComicList = DOCUMENT.querySelectorAll( "#rcontent #s_post .postbox > a.subject[href*=manga]" ), Contents = [];
				if ( ComicList.length > 0 ) {
					ComicList.forEach( ( Anchor ) => {
						let info = {
							title: Anchor.querySelector( ".sbjbox" ).innerText.replace( /\s+/gi, " "),
							link: Anchor.href,
							image: ( Anchor.querySelector( ".thumb img" ) && Anchor.querySelector( ".thumb img" ).src !== undefined ? Anchor.querySelector( ".thumb img" ).src : "" ),
							origin: origin
						};
						Contents.push( createComicInformationBox( info ) );
					} );
					acr.append( Contents );
				}
				filter();
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
		document.querySelector( ".mode-selector[data-mode] .mode-trigger" )
			.addEventListener( "click", e => {
				e.path.forEach( ( item ) => {
					if ( item.classList && item.classList.contains( "mode-trigger" ) ) {
						document.querySelector( ".mode-selector[data-mode]" ).dataset.mode = item.dataset.mode;
					}
				} );
			} );
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
	function initListBy ( { type, page, category, origin, rows = 30 } ) {
		if ( document.body.classList.contains( "running" ) ) return false;
		else { document.body.classList.add( "running" ); }
		//recnum 1 ~ 199:fetch counts
		Ajax( `${origin}?c=${category}&recnum=${rows}&sort=${type}&p=${page}`, "document",
			( ev, DOCUMENT ) => {
			document.body.classList.remove( "running" );
			let ComicList, Contents = [];
			switch ( category ) {
				case 26:
					ComicList = DOCUMENT.querySelectorAll( "#boardList table tbody tr[cid]" );
					if ( ComicList.length > 0 ) {
						ComicList.forEach( ( Anchor ) => {
							let info = {
								title: Anchor.querySelector( "td div[cid]" ).firstChild.textContent.replace( /^\s*|\s*$/, "" ),
								link: Anchor.querySelector( "td a" ).href,
								image: Anchor.querySelector( "td .image-thumb" ).style.backgroundImage.replace( /.*?"(.+)".*/, "$1" ).replace( "thumb-", "" ).replace( /^\//, origin ),
								origin: origin
							};
							Contents.push( createComicInformationBox( info ) );
						} );
						acr.append( Contents );
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
								image: ( Anchor.querySelector( "a img" ) && Anchor.querySelector( "a img" ).src !== undefined ? Anchor.querySelector( "a img" ).src : "" ),
								origin: origin
							};
							Contents.push( createComicInformationBox( info ) );
						} );
						acr.append( Contents );
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
			filter( page - 1 );
		} );
	}
	function filter ( event ) {
		let filter = document.querySelector( ".filter-panel .filter-query" ).value.replace( /^\s+|\s+$/g, "" );
		document.querySelector( "#dynamic" )
			.innerText = `.query-result .content div.comic-information-box:not([data-title${ ( filter.length > 0 ? `*="${filter}"` : "" ) }]) { display: none; }`;
		getFiltered( filter, event );
	}
	function getFiltered ( keyword, flag ) {
		if ( typeof flag === "number" ) flag = filtered.findIndex( item => !item.classList.contains( "filtered-hidden" ) );
		filtered.forEach( item => item.classList.remove( "filtered-hidden" ) );
		filtered = Array.prototype.slice.call( document.querySelectorAll( `.query-result .content div.comic-information-box[data-title${ ( keyword.length > 0 ? `*="${ keyword }"` : "" ) }]` ) );
		virtualScroll( 0, ( flag === -1 ? undefined : flag ) );
	}
	function createComicInformationBox ( info ) {
		let element = acr.create( {
			div: {
				className: "comic-information-box",
				dataset: { link: info.link, title: info.title },
				addEventListener: [ {
					type: "click",
					listener: event => {
						event.path.forEach( ( item ) => {
							if ( item.classList && item.classList.contains( "comic-information-box" ) ) {
								getComicInformation( item.dataset.link, info.origin );
							}
						} );
					}
				} ],
				_CHILD: [
					{
						imgex: {
							className: "graphic",
							url: info.image,
							addEventListener: [ {
								type: "Error",
								listener: event => {
									event.preventDefault();
									event.ImageEx.url = event.ImageEx.src.replace( "quickimage/", "quickimage/thumb-" );
								},
								option: { once: true }
							} ]
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

		return element;
	}
	function getList ( event ) {
		let mode;
		for ( const item of event.path ) {
			if ( item.dataset && item.dataset.mode ) {
				mode = item.dataset.mode;
				break;
			}
		}
		document.querySelector( ".mode-selector[data-mode]" ).dataset.mode = mode;
		acr.remove( document.querySelectorAll( ".query-result .content > div" ) );
		filtered = [];

		switch ( mode ) {
			case "search":
				document.querySelector( ".query-result" ).dataset.remain = false;
				break;
			case "recent":
				initListBy( { type: "gid", page: 1, category: 26, origin: ORIGIN } );
				break;
			case "byName":
				initListBy( { type: "subject", page: 1, category: 40, origin: ORIGIN } );
				break;
			case "byActivity":
				initListBy( { type: "gid", page: 1, category: 40, origin: ORIGIN } );
				break;
		}
	}
	function getComicInformation ( link, origin ) {
		//console.log( `${origin}b/manga/${link.replace( /.+?(\d+)$/, "$1" )}` );
		parseComicInfo( `${origin}b/manga/${link.replace( /.+?(\d+)$/, "$1" )}` );
	}
	function parseComicInfo ( url ) {
		Ajax( url, "document",
			( ev, DOCUMENT ) => {
				let info = {
					title: DOCUMENT.querySelector( ".subject" ).innerText.replace( /^\s+|\s+$/g, "" ),
					image: DOCUMENT.querySelector( "#vContent img" ).src,
					link: [],
					others: []
				};
				for ( let link of DOCUMENT.querySelectorAll( "#vContent a[href*=http]:not([href*=marumaru])" ) ) {
					info.link.push( { title: link.innerText, link: link.href } );
				}
				let links = [];
				for ( const link of DOCUMENT.querySelectorAll( "#vContent a[href*=marumaru]:not([href*=tag]):not([href*=score]):not([href*=request])" ) )
					if ( link.innerText.replace( /^\s+|\s+$/g, "" ).length > 0 ) links.push( link );
				if ( links.length ) {
					info.others.push( {
						info: "Previous episodes",
						image: info.image,
						link: links[0].href
					} );
					ipcRenderer.send( "open-episode", { type: "open-episode", details: { link: info.link[0].link } } );
					if ( settings.sameAuthor ) parseComicInfo( info.others[0].link );
				} else {
					for ( let link of DOCUMENT.querySelectorAll( "#vContent .picbox" ) ) {
						info.others.push( {
							title: link.querySelector( ".sbjx" ).innerText.replace( /^\s+|\s+$/g, "" ),
							link: link.querySelector( ".sbjx a" ).href,
							image: link.querySelector( ".pic img" ).src,
						} );
					}
					if ( info.others.length ) ipcRenderer.send( "open-comic", { type: "open-comic", details: info } );
					else ipcRenderer.send( "open-episode", { type: "open-episode", details: { link: info.link[0].link } } );
				}
			} );
	}
	function readOptions () {
		ipcRenderer.send( "read-options" );
		ipcRenderer.on( "read-options", ( event, changed ) => {
			for ( const key of Object.keys( settings ) )
				delete settings[key];

			for ( const [ key, value ] of Object.entries( changed ) )
				settings[key] = value;
		} );
	}

	let acr = new acrDOM( document.querySelector( ".query-result .content" ) );
	let filtered = [], ORIGIN = "http://marumaru.in/";
	const settings = {};

	ipcRenderer.on( 'update-options', readOptions );
	readOptions();

	initContent();
	initModes();
	initSearch( ORIGIN );
	/*
	let cfg_RW = cfg.read( ( e ) => { console.log( "Read: ", e ); } )
		.then( () => { cfg.set( { alpha: 1, beta: 2, gamma: 3 } ) } )
		.then( () => { cfg.write( cfg.get(), ( e ) => { console.log( "Write:", e ); } ); });
		*/
}
document.addEventListener( "DOMContentLoaded", main );
