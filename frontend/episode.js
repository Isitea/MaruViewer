"use strict";

/**
 * cleanMaruComic.js clean comic page from ads.
 * @author Isitea<isitea@isitea.net>
 */

const { ImageEx } = require( "../module/ImageEx" );
const { ImageExLoader } = require( "../module/ImageExLoader" );
const { acrDOM } = require( "../module/acrDOM" );
const { ipcRenderer } = require( "electron" );

function Ajax ( url, type = "document", response ) {
	let xhr = new XMLHttpRequest();
	xhr.open( "GET", url, true );
	xhr.responseType = type;
	xhr.addEventListener( "load", ( ev ) => {
		response( ev, xhr.response );
	} );

	xhr.send();
}

function Wasabisyrup ( DOCUMENT, ORIGIN, DOCUMENT_RESPONSE ) {
	function Constructor ( contentBox, iManager, config ) {
		function History () {
			let _SELF = this, vHack = dom.create( { "div": { "className": "hack-box" } } );

			this.getHistory = () => {
				DOCUMENT.body.removeEventListener( "mouseover", _SELF.getHistory );
				ipcRenderer.once( "history", _SELF.showHistory );
				new Promise( ( resolve, reject ) => { setTimeout( () => { resolve(); }, 0 ); } ).then( () => { ipcRenderer.send( "capture" ); } )
			};
			this.showHistory = ( type, message ) => {
				if ( message.visited === undefined ) return;
				let visited = message.visited;
				dom.remove( vHack );
				let list = DOCUMENT.body.querySelectorAll( '.dropdown a' );
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
				DOCUMENT.body.addEventListener( "mouseover", _SELF.getHistory );
			};
			this.hackBox = () => { return vHack };
			this.cancel = () => {
				dom.remove( vHack );
			};
		}

		function ProgressBar ( Complete = () => {} ) {
			let Bar, complete = dom.create( { "div": { "className": "complete" } } ), remain = dom.create( { "div": { "className": "remain" } } );
			Bar = dom.append( [ complete, remain ], dom.create( { "div": { "className": "progress" } } ) );

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
			}, DOCUMENT.body );

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
							DOCUMENT.body.classList.add( "FitToWindow", "Hide" );
							Pager.setPage( --page );
							break;
						case "ArrowDown":
							e.preventDefault();
							DOCUMENT.body.classList.add( "FitToWindow", "Hide" );
							Pager.setPage( ++page );
							break;
						case "ArrowLeft":
							DOCUMENT.body.querySelector( ".controller .backward" ).click();
							break;
						case "ArrowRight":
							DOCUMENT.body.querySelector( ".controller .forward" ).click();
							break;
						case "KeyD":
							_SELF.download();
							break;
						case "KeyF":
							DOCUMENT.body.classList.toggle( "FitToWindow" );
							Pager.setPage( page );
							break;
						case "KeyH":
							DOCUMENT.body.classList.toggle( "Hide" );
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
							this.valu = iManager.episode( e.target.value );
							break;
						default:
					}
				}

				this.EditModeStart = () => {
					DOCUMENT.querySelector( ".functionBox .EditProp" ).classList.add( "EditMode" );
					DOCUMENT.querySelector( ".dropdown .dropbtn .title" ).removeAttribute( "disabled" );
					DOCUMENT.querySelector( ".dropdown .dropbtn .episode" ).removeAttribute( "disabled" );
					DOCUMENT.querySelector( ".dropdown .dropbtn .title" ).addEventListener( "focusout", ApplyProp );
					DOCUMENT.querySelector( ".dropdown .dropbtn .episode" ).addEventListener( "focusout", ApplyProp );
					config.onChanges( { "KeyControl": { newValue: false } }, "local" );
				};
				this.EditModeEnd = () => {
					DOCUMENT.querySelector( ".functionBox .EditProp" ).classList.remove( "EditMode" );
					DOCUMENT.querySelector( ".dropdown .dropbtn .title" ).setAttribute( "disabled", true );
					DOCUMENT.querySelector( ".dropdown .dropbtn .episode" ).setAttribute( "disabled", true );
					DOCUMENT.querySelector( ".dropdown .dropbtn .title" ).removeEventListener( "focusout", ApplyProp );
					DOCUMENT.querySelector( ".dropdown .dropbtn .episode" ).removeEventListener( "focusout", ApplyProp );
					config.load();
				};
			}

			let _SELF = this, mouse = new Mouse();

			this.attach = ( type ) => {
				switch ( type ) {
					case "keyboard":
						DOCUMENT.addEventListener( "keydown", Keyboard );
						break;
					case "mouse":
						DOCUMENT.querySelector( ".functionBox .Download" ).addEventListener( "click", _SELF.download );
						DOCUMENT.querySelector( ".functionBox .EditProp" ).addEventListener( "click", mouse.EditModeStart );
						DOCUMENT.querySelector( ".functionBox .EditApply" ).addEventListener( "click", mouse.EditModeEnd );
						break;
					default:
				}
			};
			this.detach = ( type ) => {
				switch ( type ) {
					case "keyboard":
						DOCUMENT.removeEventListener( "keydown", Keyboard );
						break;
					case "mouse":
						dom.remove( DOCUMENT.querySelector( ".functionBox" ) );
						break;
					default:
				}
			};
			this.download = () => {
				if ( DOCUMENT.querySelector( ".functionBox" ) === null ) return;
				Progress.Element().classList.add( "downloading" );
				_SELF.detach( "mouse" );
				iManager.download( ( config.read( 'AutoNext' ) ? DOCUMENT.querySelector( 'a.forward' ) : undefined ) );
			};
			this.onChanges = ( config ) => {
				if ( config.read( "KeyControl" ) )  _SELF.attach( "keyboard" );
				else _SELF.detach( "keyboard" );
			};
			this.onComplete = () => {
				if ( config.read( 'AutoDownload' ) ) _SELF.download();
			};
		}

		let sel = DOCUMENT.querySelectorAll( ".list-articles" )[ 0 ].querySelectorAll( "option" );
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
								openLink( event.target.href );
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
								{ "div": { "className": "Download", "_CHILD": { "img": { "src": "" } } } },
								{ "div": { "className": "EditProp", "_CHILD": { "img": { "src": "" } } } },
								{ "div": { "className": "EditApply", "_CHILD": { "img": { "src": "" } } } }
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
								openLink( event.target.href );
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
		let vHistory = new History();
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
							openLink( event.target.href );
						},
						option: { once: true }
					}, {
						type: "click",
						listener: event => event.preventDefault()
					} ]
				}
			}, dropdown );
			vHistory.add( ORIGIN + "/archives/" + sel[ i ].value );
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

		DOCUMENT.documentElement.replaceChild( dom.append( [ vHistory.hackBox(), controller, contentBox ], { "body": {} } ), DOCUMENT.body );
		Pager = new Positioner();
		Ctrl.attach( "mouse" );

		config.setResponse( Ctrl.onChanges ).onChanges( {}, "local" );

		/* History box
		if ( location.origin === ORIGIN ) {
			if ( DOCUMENT.hasFocus() ) vHistory.getHistory();
			else vHistory.listen();
		} else {
			vHistory.cancel();
		}
		*/
		setTimeout( function () {
			DOCUMENT.body.querySelector( ".controller .dropdown .selected" ).scrollIntoView( true );
			DOCUMENT.body.querySelector( ".controller .dropdown .dropdown-content" ).style.cssText = "";
			if ( DOCUMENT_RESPONSE ) DOCUMENT_RESPONSE( DOCUMENT );
		}, 100 );
	}

	function cleanUp ( config ) {
		function DOMParser ( item, response ) {
			if ( item.dataset.signature && item.dataset.key ) {
				let oReq = new XMLHttpRequest();
				oReq.open( "GET", location.href.replace( /archives/ig, 'assets' ) + '/1.json?signature=' + encodeURIComponent( item.dataset.signature ) + '&key=' + encodeURIComponent( item.dataset.key ), true );
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

		if ( DOCUMENT.querySelectorAll( ".pass-box" ).length ) {
			DOCUMENT.querySelectorAll( ".pass-box [name=pass]" )[ 0 ].value = "qndxkr";
			if ( DOCUMENT.querySelectorAll( ".g-recaptcha[data-size=invisible]" ) || DOCUMENT.querySelectorAll( ".g-recaptcha" ) === null ) {
				//DOCUMENT.querySelectorAll( ".pass-box form" )[ 0 ].submit();
				dom.append( { "script": { "defer": true, "innerHTML": "grecaptcha.execute();" } }, DOCUMENT.body );
			} else {

			}
		} else {
			DOMParser( DOCUMENT.querySelector( ".gallery-template" ), ( list ) => {
				list.forEach( ( src ) => { iManager.load( ORIGIN + src ); } );
				new Constructor( dom.create( { "div": { "className": "contentBox" } } ), iManager, config );
			} );
		}
	}

	let dom = new acrDOM();
	let iManager = new contentManager( DOCUMENT, DOCUMENT.title.match( /\s*(.+)\s+\|\s/i )[ 1 ] );
	new configManager( cleanUp );
}

function init () {
	ipcRenderer.on( "open-link", ( type, event ) => {
		Ajax( event.link, "document",
			( event, DOCUMENT ) => {
				new Wasabisyrup( DOCUMENT, event.target.responseURL.replace( /^(.+?\/\/.+?)\/.+$/gi, "$1" ), ( DOC ) => {
					document.body.parentNode.replaceChild( DOC.body, document.body )
				} );
			} );
	} );
}
function openLink ( uri ) {
	if ( !uri.match( /#$/g ) ) {
		Ajax( uri, "document",
			( event, DOCUMENT ) => {
				new Wasabisyrup( DOCUMENT, uri.replace( /^(.+?\/\/.+?)\/.+$/gi, "$1" ), ( DOC ) => {
					document.body.parentNode.replaceChild( DOC.body, document.body );
				} );
			} );
	}
}
init();
if ( location.href.match( 'wasabisyrup' ) ) { new Wasabisyrup( document, location.origin ); }