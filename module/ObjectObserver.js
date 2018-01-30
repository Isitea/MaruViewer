"use strict";
( () => {
	let moduleLoader;
	try { if ( require ) moduleLoader = "CommonJS"; } catch ( e ) {}
	try { if ( requirejs ) moduleLoader = "AMD"; } catch ( e ) {}

	let moduleExporter, iEventTarget;
	switch ( moduleLoader ) {
		case "CommonJS":
			( ( modEx ) => { moduleExporter = modEx.moduleExporter; } )( require( "./module-exporter" ) );
			( ( modEx ) => { iEventTarget = modEx.iEventTarget; } )( require( "./iEventTarget" ) );
			break;
		case "AMD":
			requirejs( [ './module-exporter' ], ( modEx ) => { moduleExporter = modEx; } );
			requirejs( [ './iEventTarget' ], ( modEx ) => { iEventTarget = modEx; } );
			break;
		case undefined:
			iEventTarget = window.iEventTarget;
			break;
	}

	//Own class which observes Object with Proxy, which traps native execution.
	class iOO extends iEventTarget {
		constructor ( object, { id, cancelable } = { id: Date.now().toString(), cancelable: false } ) {
			super();
			this.id = Symbol.for(id);
			this[this.id] = object;
			const rev = Proxy.revocable( object, this );
			this.Observed = rev.proxy;
			this.revoke = rev.revoke;
			this.cancelable = cancelable;
		}

		broadcast ( event ) {
			if ( !this.dispatchEvent( event ) && this.cancelable ) {
				let blocked = new TypeError( "Operation blocked." );
				blocked.event = event;
				throw blocked;
			}
		}

		apply ( target, thisArg, ...args ) {
			let event = new Event( "apply" );
			event[event.type] = { id: this.id, object: target, thisArg: thisArg, args: args };
			this.broadcast( event );

			return Reflect.apply( target, thisArg, args );
		}
		construct ( target, ...args ) {
			let event = new Event( "construct" );
			event[event.type] = { id: this.id, object: target, args: args };
			this.broadcast( event );

			return Reflect.construct( target, argss );
		}
		defineProperty ( target, key, descriptor ) {
			let event = new Event( "defineProperty" );
			event[event.type] = { id: this.id, object: target, key: key, descriptor: descriptor };
			this.broadcast( event );

			return Reflect.defineProperty( target, key, descriptor );
		}
		deleteProperty ( target, propertyKey ) {
			let event = new Event( "deleteProperty" );
			event[event.type] = { id: this.id, object: target, propertyKey: propertyKey };
			this.broadcast( event );

			return Reflect.deleteProperty( target, propertyKey );
		}
		get ( target, propertyKey, receiver ) {
			let event = new Event( "get" );
			event[event.type] = { id: this.id, object: target, propertyKey: propertyKey, receiver: receiver };
			this.broadcast( event );

			return Reflect.get( target, propertyKey, receiver );
		}
		getOwnPropertyDescriptor ( target, propertyKey ) {
			let event = new Event( "getOwnPropertyDescriptor" );
			event[event.type] = { id: this.id, object: target, propertyKey: propertyKey };
			this.broadcast( event );

			return Reflect.getOwnPropertyDescriptor( target, propertyKey );
		}
		getPrototypeOf ( target ) {
			let event = new Event( "getPrototypeOf" );
			event[event.type] = { id: this.id, object: target };
			this.broadcast( event );

			return Reflect.getPrototypeOf( target );
		}
		has ( target, propertyKey ) {
			let event = new Event( "has" );
			event[event.type] = { id: this.id, object: target, propertyKey: propertyKey };
			this.broadcast( event );

			return Reflect.has( target, propertyKey );
		}
		isExtensible ( target ) {
			let event = new Event( "isExtensible" );
			event[event.type] = { id: this.id, object: target };
			this.broadcast( event );

			return Reflect.isExtensible( target );
		}
		ownKeys ( target ) {
			let event = new Event( "ownKeys" );
			event[event.type] = { id: this.id, object: target };
			this.broadcast( event );

			return Reflect.ownKeys( target );
		}
		preventExtensions ( target ) {
			let event = new Event( "preventExtensions" );
			event[event.type] = { id: this.id, object: target };
			this.broadcast( event );

			return Reflect.preventExtensions( target );
		}
		set ( target, propertyKey, value, receiver ) {
			let event = new Event( "set" );
			event[event.type] = { id: this.id, object: target, propertyKey: propertyKey, value: value, receiver: receiver };
			this.broadcast( event );

			return Reflect.set( target, propertyKey, value, receiver );
		}
		setPrototypeOf ( target, prototype ) {
			let event = new Event( "setPrototypeOf" );
			event[event.type] = { id: this.id, object: target, prototype: prototype };
			this.broadcast( event );

			return Reflect.setPrototypeOf( target, prototype );
		}
	}

	if ( moduleLoader === undefined ) {
		console.log( "Trying to attach window..." );
		window.iOO = iOO;
	} else {
		const modEx = new moduleExporter();

		modEx.export( "iOO", iOO );

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