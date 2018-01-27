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
		constructor ( object, id ) {
			super();
			this.Observed = Proxy.revocable( object, this );
			if ( id !== undefined && id !== null ) this.id = id;
		}

		preventDefault ( prevented, operation ) {
			if ( prevented ) {
				let blocked = new Error( "Operation blocked." );
				blocked.operation = operation;
				throw blocked;
			}
		}

		apply ( target, thisArg, ...args ) {
			let operation = "apply";
			let event = new Event( operation );
			Object.assign( event, { id: this.id, object: target, thisArg: thisArg, args: args } );
			this.dispatchEvent( event, operation );

			return Reflect.apply( target, thisArg, args );
		}
		construct ( target, ...args ) {
			let event = new Event( "construct" );
			Object.assign( event, { id: this.id, object: target, args: args } );
			preventDefault( this.dispatchEvent( event ) );

			return Reflect.construct( target, argss );
		}
		defineProperty ( target, key, descriptor ) {
			let event = new Event( "defineProperty" );
			Object.assign( event, { id: this.id, object: target, key: key, descriptor: descriptor } );
			this.dispatchEvent( event );

			return Reflect.defineProperty( target, key, descriptor );
		}
		get ( target, property, receiver ) {
			let event = new Event( "get" );
			Object.assign( event, { id: this.id, object: target, property: property, receiver: receiver } );
			this.dispatchEvent( event );

			return Reflect.get( target, property, receiver );
		}
		getOwnPropertyDescriptor ( target, propertyKey ) {
			let event = new Event( "getOwnPropertyDescriptor" );
			Object.assign( event, { id: this.id, object: target, propertyKey: propertyKey } );
			this.dispatchEvent( event );

			return Reflect.getOwnPropertyDescriptor( target, propertyKey );
		}
		has ( target, propertyKey ) {
			let event = new Event( "has" );
			Object.assign( event, { id: this.id, object: target, propertyKey: propertyKey } );
			this.dispatchEvent( event );

			return Reflect.has( target, propertyKey );
		}
		ownKeys ( target ) {
			let event = new Event( "ownKeys" );
			Object.assign( event, { id: this.id, object: target } );
			this.dispatchEvent( event );

			return Reflect.ownKeys( target );
		}
		preventExtensions ( target ) {
			let event = new Event( "preventExtensions" );
			Object.assign( event, { id: this.id, object: target } );
			this.dispatchEvent( event );

			return Reflect.preventExtensions( target );
		}
		set ( target, propertyKey, value, receiver ) {
			let event = new Event( "set" );
			Object.assign( event, { id: this.id, object: target, propertyKey: propertyKey, value: value, receiver: receiver } );
			this.dispatchEvent( event );

			return Reflect.set( target, propertyKey, value, receiver );
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