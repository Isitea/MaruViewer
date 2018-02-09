"use strict";

/**
 * cleanMaruComic.js clean comic page from ads.
 * @author Isitea<isitea@isitea.net>
 */

const { ImageEx } = require( "../module/ImageEx" );
const { ImageExLoader } = require( "../module/ImageExLoader" );
const { acrDOM } = require( "../module/acrDOM" );
const { ipcRenderer } = require( "electron" );
const siteRecognizer = "marumaru";
let previousTitle;

function Ajax ( url, type = "document", response ) {
	let xhr = new XMLHttpRequest();
	xhr.open( "GET", url, true );
	xhr.responseType = type;
	xhr.addEventListener( "load", ( ev ) => {
		response( ev, xhr.response );
	} );

	xhr.send();
}

function Wasabisyrup ( DOCUMENT, ORIGIN, DOCUMENT_RESPONSE, ORIGINAL_URI ) {
	function Constructor ( contentBox, iManager ) {
		function History () {
			let _SELF = this, vHack = dom.create( { "div": { "className": "hack-box" } } );

			this.getHistory = () => {
				BODY.removeEventListener( "mouseover", _SELF.getHistory );
				ipcRenderer.once( "history", _SELF.showHistory );
				new Promise( ( resolve, reject ) => { setTimeout( () => { resolve(); }, 0 ); } ).then( () => { ipcRenderer.send( "capture" ); } )
			};
			this.showHistory = ( type, message ) => {
				if ( message.visited === undefined ) return;
				let visited = message.visited;
				dom.remove( vHack );
				let list = BODY.querySelectorAll( '.dropdown a' );
				visited.forEach( ( item ) => {
					list[item].classList.add( "visited" );
				} );
			};

			this.add = ( link ) => {
				dom.append( {
					"div": {
						'_CHILD': {
							"a": {
								"href": link,
								"innerText": "█"
							}
						}
					}
				}, vHack );
			};
			this.listen = () => {
				BODY.addEventListener( "mouseover", _SELF.getHistory );
			};
			this.hackBox = () => { return vHack };
			this.cancel = () => {
				dom.remove( vHack );
			};
		}

		function ProgressBar ( Complete = () => {} ) {
			let Bar, complete = dom.create( { "div": { "className": "complete" } } ), remain = dom.create( { "div": { "className": "remain" } } );
			Bar = dom.append( [ complete, remain ], { "div": { "className": "progress" } } );

			this.show = ( ratio ) => {
				complete.style.width = ratio + "%";
				remain.style.width = ( 100 - ratio ) + "%";

				if ( ratio === 100 ) Complete();
			};
			this.setComplete = ( fn ) => { Complete = fn; };
			this.Element = () => { return Bar; }
		}
		//iManager, contentBox, dom
		function Positioner () {
			let _SELF = this;

			this.setPage = ( n ) => {
				let index = n - 1, Count = iManager.counts();
				index = ( index <= 0 ? 0 : ( Count <= index ? Count - 1 : index ) );
				iManager.getItem( index ).scrollIntoView();
				_SELF.showPage();
			};
			this.getPage = () => {
				let list = contentBox.querySelectorAll( "img" );
				for ( let view = 0; view < list.length; view++ ) if ( contentBox.scrollTop + contentBox.offsetHeight / 2 < list[ view ].offsetTop ) return view;
				return list.length;
			};
			this.showPage = () => {
				if ( document.querySelector( "#currentPage" ) ) document.querySelector( "#currentPage" ).innerText = _SELF.getPage();
			};
			contentBox.addEventListener( "scroll", _SELF.showPage );

			dom.append( {
				"div": {
					"className": "pageView",
					"_CHILD": [
						{ "span": { "id": "currentPage", innerText: "1" } },
						"/",
						{ "span": { "id": "totalPage", "innerText": iManager.counts() } }
					]
				}
			}, BODY );

			_SELF.showPage();
		}
		//iManager, Progress, config
		function Controller () {
			function Keyboard ( e ) {
				let page = Pager.getPage();
				if ( e.altKey ) return;
				if ( e.code.match( /Arrow/g ) || e.code == "KeyD" || e.code == "KeyF" || e.code == "KeyH" ) {
					//e.preventDefault();
					//e.stopPropagation();
					switch ( e.code ) {
						case "ArrowUp":
							e.preventDefault();
							BODY.classList.add( "FitToWindow", "Hide" );
							Pager.setPage( --page );
							break;
						case "ArrowDown":
							e.preventDefault();
							BODY.classList.add( "FitToWindow", "Hide" );
							Pager.setPage( ++page );
							break;
						case "ArrowLeft":
							BODY.querySelector( ".controller .backward" ).click();
							break;
						case "ArrowRight":
							BODY.querySelector( ".controller .forward" ).click();
							break;
						case "KeyD":
							_SELF.download();
							break;
						case "KeyF":
							BODY.classList.toggle( "FitToWindow" );
							Pager.setPage( page );
							break;
						case "KeyH":
							BODY.classList.toggle( "Hide" );
							Pager.setPage( page );
							break;
					}
				}
			}
			function Mouse () {
				function ApplyProp ( e ) {
					switch  ( e.target.className ) {
						case "title":
							this.value = iManager.title( "", e.target.value );
							break;
						case "episode":
							this.value = iManager.episode( e.target.value );
							break;
						default:
					}
				}

				this.EditModeStart = () => {
					document.querySelector( ".functionBox .EditProp" ).setAttribute( "disabled", true );
					document.querySelector( ".functionBox .EditApply" ).removeAttribute( "disabled" );
					document.querySelector( ".dropdown .dropbtn .title" ).removeAttribute( "disabled" );
					document.querySelector( ".dropdown .dropbtn .episode" ).removeAttribute( "disabled" );
					document.querySelector( ".dropdown .dropbtn .title" ).addEventListener( "focusout", ApplyProp );
					document.querySelector( ".dropdown .dropbtn .episode" ).addEventListener( "focusout", ApplyProp );
				};
				this.EditModeEnd = () => {
					document.querySelector( ".functionBox .EditApply" ).setAttribute( "disabled", true );
					document.querySelector( ".functionBox .EditProp" ).removeAttribute( "disabled" );
					document.querySelector( ".dropdown .dropbtn .title" ).setAttribute( "disabled", true );
					document.querySelector( ".dropdown .dropbtn .episode" ).setAttribute( "disabled", true );
					document.querySelector( ".dropdown .dropbtn .title" ).removeEventListener( "focusout", ApplyProp );
					document.querySelector( ".dropdown .dropbtn .episode" ).removeEventListener( "focusout", ApplyProp );
				};
			}

			let _SELF = this, mouse = new Mouse();

			this.attach = ( type ) => {
				switch ( type ) {
					case "keyboard":
						BODY.addEventListener( "keydown", Keyboard );
						break;
					case "mouse":
						BODY.querySelector( ".functionBox .Download" ).addEventListener( "click", _SELF.download );
						BODY.querySelector( ".functionBox .Automatic" ).addEventListener( "click", e => document.body.dataset.automatic = Number( !Number( document.body.dataset.automatic ) ) );
						BODY.querySelector( ".functionBox .EditProp" ).addEventListener( "click", mouse.EditModeStart );
						BODY.querySelector( ".functionBox .EditApply" ).addEventListener( "click", mouse.EditModeEnd );
						break;
					default:
				}
			};
			this.detach = ( type ) => {
				switch ( type ) {
					case "keyboard":
						BODY.removeEventListener( "keydown", Keyboard );
						break;
					case "mouse":
						dom.remove( document.querySelector( ".functionBox" ) );
						break;
					default:
				}
			};
			this.download = () => {
				if ( !document.querySelector( ".downloadble" ) ) return alert( "Try after" );
				if ( document.querySelector( ".functionBox" ) === null ) return;
				Progress.Element().classList.add( "downloading" );
				_SELF.detach( "mouse" );
				iManager.download( ( !!Number( document.body.dataset.automatic ) ? document.querySelector( 'a.forward' ) : undefined ) );
			};
			this.onComplete = () => {
				Progress.Element().classList.add( "downloadable" );
				if ( !!Number( document.body.dataset.automatic ) ) _SELF.download();
			};
		}
		let sel = BODY.querySelectorAll( ".list-articles" )[ 0 ].querySelectorAll( "option" );
		let Ctrl = new Controller(), Progress = new ProgressBar(), Pager;
		Progress.setComplete( Ctrl.onComplete );
		let controller = dom.create( {
			'div': {
				'className': 'controller',
				"_CHILD": [
					{ "a": {
						"className": "backward fas fa-angle-left",
						addEventListener: [ {
							type: "click",
							listener: ( event ) => {
								event.preventDefault();
								event.stopImmediatePropagation();
								openEpisode( null, { link: event.target.href } );
							},
							option: { once: true }
						}, {
							type: "click",
							listener: event => event.preventDefault()
						} ]
					} },
					{
						"div": {
							"className": "functionBox",
							"_CHILD": [
								{ "div": { "className": "Download fas fa-download", "title": "Download this episode" } },
								{ "div": { "className": "Automatic fas fa-truck", "title": "and after all" } },
								{ "div": { "className": "EditProp fas fa-edit", "title": "Make comic title and episode name editable" } },
								{ "div": { "className": "EditApply fas fa-check", "title": "Apply edited comic title and episode name", "disabled": true } }
							]
						}
					},
					{
						"div": {
							"className": "dropdown",
							"_CHILD": [
								{ "div": { "className": "dropbtn" } },
								{ "div": { "className": "dropdown-content" } },
								Progress.Element()
							]
						}
					},
					{ "a": {
						"className": "forward fas fa-angle-right",
						addEventListener: [ {
							type: "click",
							listener: ( event ) => {
								event.preventDefault();
								event.stopImmediatePropagation();
								openEpisode( null, { link: event.target.href } );
							},
							option: { once: true }
						}, {
							type: "click",
							listener: event => event.preventDefault()
						} ]
					} }
				]
			}
		} );
		//let vHistory = new History();
		let dropdown = controller.querySelector( '.dropdown-content' );
		for ( let i = 0; i < sel.length; i++ ) {
			dom.append( {
				"a": {
					"_CHILD": { "div": {} },
					"className": ( sel[ i ].selected ? "selected " : " " ),
					"href": ORIGIN + "/archives/" + sel[ i ].value,
					"innerText": sel[ i ].innerText.replace( /^\s+|\s+$/gi, "" ),
					addEventListener: [ {
						type: "click",
						listener: ( event ) => {
							event.preventDefault();
							event.stopImmediatePropagation();
							openEpisode( null, { link: event.target.href } );
						},
						option: { once: true }
					}, {
						type: "click",
						listener: event => event.preventDefault()
					} ]
				}
			}, dropdown );
			//vHistory.add( ORIGIN + "/archives/" + sel[ i ].value );
			if ( sel[ i ].selected ) {
				controller.querySelector( ".backward" ).href = ( sel[ i - 1 ] ? ORIGIN + "/archives/" + sel[ i - 1 ].value : "#" );
				controller.querySelector( ".forward" ).href = ( sel[ i + 1 ] ? ORIGIN + "/archives/" + sel[ i + 1 ].value : "#" );
				iManager.episode( sel[ i ].innerText );
			}
		}
		dom.append( [
			{ "input": { "className": "title", "type": "text", "value": iManager.title(), "disabled": "true" } },
			{ "input": { "className": "episode", "type": "text", "value": iManager.episode(), "disabled": "true" } }
		], controller.querySelector( ".dropdown .dropbtn" ) );
		controller.querySelector( ".dropdown .dropdown-content" ).style.cssText = "display: block; opacity: 0;";
		iManager.setResponse( Progress.show );
		iManager.place( contentBox );

		dom.remove( DOCUMENT.querySelectorAll( "body > *" ) );
		//dom.append( [ vHistory.hackBox(), controller, contentBox ], BODY );
		dom.append( [ controller, contentBox ], BODY );
		Pager = new Positioner();
		Ctrl.attach( "mouse" );

		/* History box
		if ( location.origin === ORIGIN ) {
			if ( DOCUMENT.hasFocus() ) vHistory.getHistory();
			else vHistory.listen();
		} else {
			vHistory.cancel();
		}
		*/
		document.body.addEventListener( "mouseover", e => {
			controller.querySelector( ".dropdown .selected" ).scrollIntoView( true );
			controller.querySelector( ".dropdown .dropdown-content" ).style.cssText = "";
		}, { once: true } );

		if ( previousTitle !== "Episode" ) {
			iManager.title( "", previousTitle );
			BODY.querySelector( ".dropdown .dropbtn .title" ).value = previousTitle;
		}
		DOCUMENT_RESPONSE( DOCUMENT );
	}

	function cleanUp () {
		function DOMParser ( item, response ) {
			if ( item.dataset.signature && item.dataset.key ) {
				let oReq = new XMLHttpRequest();
				oReq.open( "GET", ORIGINAL_URI.replace( /archives/ig, 'assets' ) + '/1.json?signature=' + encodeURIComponent( item.dataset.signature ) + '&key=' + encodeURIComponent( item.dataset.key ), true );
				oReq.responseType = "json";
				oReq.onload = ( oEvent ) => {
					response( oReq.response.sources );
				};

				oReq.send();
			} else {
				let list = item.querySelectorAll( 'img' );
				let sources = [];
				list.forEach( ( item ) => {
					sources.push( item.dataset.src );
				} );

				response( sources );
			}
		}

		if ( BODY.querySelectorAll( ".pass-box" ).length ) {
			BODY.querySelectorAll( ".pass-box [name=pass]" )[ 0 ].value = "qndxkr";
			if ( BODY.querySelectorAll( ".g-recaptcha[data-size=invisible]" ) || BODY.querySelectorAll( ".g-recaptcha" ) === null ) {
				dom.append( {
					iframe: {
						src: ORIGINAL_URI,
						addEventListener: [ {
							type: "load",
							listener: e => {
								let link = e.path[0].contentWindow.location.href;
								if( ORIGINAL_URI !== link ) {
									dom.remove( e.path[0] );
									openEpisode( null, { link } );
								}
							}
						}, {
							type: "load",
							listener: ( e ) => {
								e.stopImmediatePropagation();
								let _w = e.path[0].contentWindow, _d = _w.document;
								_d.querySelector( ".pass-box [name=pass]" ).value = "qndxkr";
								_d.body.style.overflow = "hidden";
								_d.querySelector( ".pass-box" ).style
									.cssText = 'width: 100vw, height: 100vh; position: fixed; top: 0; left: 0; z-index: 999999999; background: black;';
								e.path[0].style.opacity = "1";
								setTimeout( () => _w.grecaptcha.execute(), 250 );
							},
							option: { once: true }
						} ]
					}
				}, document.body );
			}
		} else {
			DOMParser( BODY.querySelector( ".gallery-template" ), ( list ) => {
				list.forEach( ( src ) => { iManager.load( ORIGIN + src ); } );
				new Constructor( dom.create( { "div": { "className": "contentBox" } } ), iManager );
			} );
		}
	}

	previousTitle = document.body.dataset.title || "Episode";
	const dom = new acrDOM(), BODY = DOCUMENT.body;
	const iManager = new contentManager( DOCUMENT.title.match( /\s*(.+)\s+\|\s/i )[ 1 ], ORIGINAL_URI );
	cleanUp()
}

function init () {
	document.body.dataset.automatic = 0;
	ipcRenderer.on( "open-episode-link", openEpisode );
	ipcRenderer.on( "open-comic-link", openComic );
}
class ComicInfomation {
	constructor ( { details } ) {
		function parseComicInfo ( url ) {
			return new Promise( ( resolve, reject ) => {
				Ajax( url, "document",
					( ev, DOCUMENT ) => {
						let info = {
							title: DOCUMENT.querySelector( ".subject" ).innerText.replace( /^\s+|\s+$/g, "" ),
							image: DOCUMENT.querySelector( "#vContent img" ).src,
							link: [],
							others: []
						};
						let links = DOCUMENT.querySelectorAll( `#vContent a[href*=${siteRecognizer}]:not([href*=tag]):not([href*=score]):not([href*=request])` );
						for ( let link of DOCUMENT.querySelectorAll( `#vContent a[href*=http]:not([href*=${siteRecognizer}])` ) ) {
							info.link.push( { title: link.innerText, link: link.href } );
						}
						if ( links.length === 1 ) {
							info.others.push( {
								info: "Previous episodes",
								image: info.image,
								link: links[0].href
							} );
						} else {
							for ( let link of DOCUMENT.querySelectorAll( "#vContent .picbox" ) ) {
								info.others.push( {
									title: link.querySelector( ".sbjx" ).innerText.replace( /^\s+|\s+$/g, "" ),
									link: link.querySelector( ".sbjx a" ).href,
									image: link.querySelector( ".pic img" ).src,
								} );
							}
						}
						resolve( info );
					} );
			} );
		}

		document.title = "Same authors";
		let acr = new acrDOM();
		let controller = acr.create( {
			'div': {
				'className': 'controller',
				"_CHILD": [
					{
						"div": {
							"className": "dropdown comic-title",
							"_CHILD": [
								{ "div": { "className": "dropbtn comic-title", "innerText": `Episode list of ${details.title}`, } },
								{ "div": { "className": "dropdown-content" } }
							]
						}
					}
				]
			}
		} );

		let dropdown = controller.querySelector( '.dropdown-content' );
		for ( const info of details.link ) {
			acr.append( {
				"a": {
					"href": "#",
					"innerText": info.title,
					addEventListener: [ {
						type: "click",
						listener: ( link => event => ipcRenderer.send( "open-episode", { type: "open-episode", details: { link: link } } ) ) ( info.link )
					}, {
						type: "click",
						listener: event => event.preventDefault()
					} ]
				}
			}, dropdown );
		}
		controller.querySelector( ".dropdown .dropdown-content" ).style.cssText = "display: block; opacity: 0;";
		acr.append( controller );

		document.body.addEventListener( "mouseover", e => {
			dropdown.querySelector( ":last-child" ).scrollIntoView( true );
			controller.querySelector( ".dropdown .dropdown-content" ).style.cssText = "";
		}, { once: true } );

		acr.change( { div: { className: "SameAuthors" } } ).change( { div: { className: "wrap" } } );
		for ( const info of details.others ) {
			acr.append( {
				div: {
					className: "comic-information-box",
					dataset: { link: info.link, title: info.title },
					addEventListener: [ {
						type: "click",
						listener: ( link =>
								event =>
									parseComicInfo( link )
										.then( info => openComic( "open-comic", { details: info } ) ) )( info.link ),
						option: { once: true }
					} ],
					_CHILD: [
						{ imgex: { className: "graphic", url: info.image } },
						{
							div: {
								className: "text",
								_CHILD: {
									div: {
										className: "first-wrap",
										_CHILD: {
											div: { className: "second-wrap", _CHILD: [ { div: { innerText: info.title } }, { div: { innerText: info.title } }, { div: { innerText: info.title } } ] }
										}
									}
								}
							}
						}
					]
				}
			} );
		}
	}
}
function openComic ( type, details ) {
	acrDOM.remove( document.querySelectorAll( "body > *" ) );
	new ComicInfomation( details );
}
function openEpisode ( type, { link } ) {
	if ( !link.match( /#$/g ) ) {
		Ajax( link, "document",
			( event, DOCUMENT ) => {
				acrDOM.remove( document.querySelectorAll( "body > *" ) );
				new Wasabisyrup( DOCUMENT, link.replace( /^(.+?\/\/.+?)\/.+$/gi, "$1" ), ( DOC ) => {
					acrDOM.append( DOC.querySelectorAll( "body > *" ), document.body );
				}, event.target.responseURL );
			} );
	}
}
init();
