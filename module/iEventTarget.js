"use strict";
( () => {
	let moduleLoader;
	try { if ( require ) moduleLoader = "CommonJS"; } catch ( e ) {}
	try { if ( requirejs ) moduleLoader = "AMD"; } catch ( e ) {}

	let moduleExporter;
	switch ( moduleLoader ) {
		case "CommonJS":
			( ( modEx ) => { moduleExporter = modEx.moduleExporter; } )( require( "./module-exporter" ) );
			break;
		case "AMD":
			requirejs( [ './module-exporter' ], ( modEx ) => { moduleExporter = modEx; } );
			break;
		case undefined:
			break;
	}

	//Own class which mimics EventTarget object
	class iEventTarget {
		constructor () {
			this.listeners = {};
			this.oncelisteners = {};
		}

		addEventListener ( type, callback, { once, prior } = { once: false, prior: false } ) {
			if ( once ) {
				if ( !( type in this.oncelisteners ) ) this.oncelisteners[ type ] = [];
				if ( !this.oncelisteners[ type ].includes( callback ) ) {
					if ( prior ) this.oncelisteners[ type ].unshift( callback );
					else this.oncelisteners[ type ].push( callback );
				}
			} else {
				if ( !( type in this.listeners ) ) this.listeners[ type ] = [];
				if ( !this.listeners[ type ].includes( callback ) ) {
					if ( prior ) this.oncelisteners[ type ].unshift( callback );
					else this.oncelisteners[ type ].push( callback );
				}
			}
		}

		removeEventListener ( type, callback ) {
			if ( type in this.listeners ) {
				let stack = this.listeners[ type ];
				if ( stack.includes( callback ) ) stack.splice( stack.indexOf( callback ), 1 );
			}
		}

		dispatchEvent ( event ) {
			if ( event.type in this.listeners || event.type in this.oncelisteners ) {
				if ( event.type in this.oncelisteners ) {
					let stack = this.oncelisteners[ event.type ];
					while ( stack.length > 0 ) {
						stack.shift().call( this, event );
						if ( event.cancelBubble ) return !event.defaultPrevented;
					}
				}

				if ( event.type in this.listeners ) {
					let stack = this.listeners[ event.type ];
					for ( let i = 0; i < stack.length; i++ ) {
						stack[i].call( this, event );
						if ( event.cancelBubble ) return !event.defaultPrevented;
					}
				}
				return !event.defaultPrevented;
			} else return true;
		}
	}

	if ( moduleLoader === undefined ) {
		console.log( "Trying to attach window..." );
		window.iEventTarget = iEventTarget;
	} else {
		const modEx = new moduleExporter();

		modEx.export( "iEventTarget", iEventTarget );

		switch ( moduleLoader ) {
			case "CommonJS":
				modEx.build( module );
				break;
			case "AMD":
				modEx.build( define );
				break;
		}
	}
} ) ();