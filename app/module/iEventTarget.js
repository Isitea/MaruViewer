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
			requirejs( [ './module-exporter' ], ( modEx ) => { moduleExporter = modEx.moduleExporter; } );
			break;
		case undefined:
			break;
	}

	//Own class which mimics EventTarget object
	class iEventTarget {
		constructor () {
			this.listeners = {};
			this.once = {};
			this.passive = {};
		}

		addEventListener ( type, listener, { once, prior, passive } = { once: false, prior: false, passive: false } ) {
			if ( !( type in this.listeners ) ) {
				this.listeners[ type ] = [];
				this.once[ type ] = [];
				this.passive[ type ] = [];
			}
			if ( !this.listeners[ type ].includes( listener ) ) {
				if ( prior ) this.listeners[ type ].unshift( listener );
				else this.listeners[ type ].push( listener );
				if ( once ) {
					if ( prior ) this.once[ type ].unshift( listener );
					else this.once[ type ].push( listener );
				}
				if ( passive ) {
					if ( prior ) this.passive[ type ].unshift( listener );
					else this.passive[ type ].push( listener );
				}
			}

			return this;
		}

		removeEventListenerAll ( type ) {
			if ( type in this.listeners ) {
				this.listeners[ type ] = [];
				this.once[ type ] = [];
				this.passive[ type ] = [];
			}

			return this;
		}

		removeEventListener ( type, listener ) {
			if ( type in this.listeners ) {
				let stack = this.listeners[ type ], stack_once = this.once[ type ], stack_passive = this.passive[ type ];
				if ( stack.includes( listener ) ) {
					stack.splice( stack.indexOf( listener ), 1 );
					if ( stack_once.includes( listener ) ) stack_once.splice( stack_once.indexOf( listener ), 1 );
					if ( stack_passive.includes( listener ) ) stack_passive.splice( stack_passive.indexOf( listener ), 1 );
				}
			}

			return this;
		}

		dispatchEvent ( event ) {
			if ( event.type in this.listeners ) {
				let stack = this.listeners[ event.type ], stack_once = this.once[ event.type ], stack_passive = this.passive[ event.type ];
				for ( let listener of stack ) {
					const preventDefault = event.defaultPrevented;

					if ( typeof listener === "function" ) listener.call( this, event );
					else if ( typeof listener.handleEvent === "function" ) listener.handleEvent.call( this, event );

					if ( stack_passive.includes( listener ) ) event.defaultPrevented = preventDefault;
					if ( stack_once.includes( listener ) ) this.removeEventListener( event.type, listener );

					//Currently, .stopPropagation() and .stopImmediatePropagation() were treated as same action.
					//Difference between them is a stage which effects.
					//.stopPropagation() effects on "bubbling phase", and .stopImmediatePropagation() does on "at target phase".
					//Phase is shown in .eventPhase, which can have 0(NONE), 1(CAPTURING_PHASE), 2(AT_TARGET), 3(BUBBLING_PHASE)
					//Further details on https://developer.mozilla.org/en-US/docs/Web/API/Event/eventPhase
					if ( event.cancelBubble ) return !event.defaultPrevented;
				}
			}

			return !event.defaultPrevented;
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