"use strict";
//Only for Node.js
( () => {
	const { moduleExporter } = require( "./module-exporter" );
	const { iEventTarget } = require( "./iEventTarget" );
	const { iEvent: Event } = require( "./iEvent" );
	const jsonfile = require( 'jsonfile' );

	class configIO extends iEventTarget {
		constructor ( { file = "configIO.json", writeOnChange = false, chainingObject = {} }, defaultConfiguration = {} ) {
			super();
			if ( writeOnChange ) this.addEventListener( "change", ( SELF => {
				let lastStamp = Date.now() - 500, delay = 250, lastTimer;

				function writeTimer ( event ) {
					if ( Date.now() - lastStamp > delay ) {
						lastStamp = Date.now();
						console.log( `Saved: ${lastStamp}` );
						SELF.write();
					} else {
						clearTimeout( lastTimer );
						lastTimer = setTimeout( writeTimer, delay, event );
						console.log( `Timer activate ${lastStamp}` );
					}
				}

				return writeTimer;
			} )( this ) );
			this.file = file;
			this.defaultConfiguration = defaultConfiguration;
			this.task = Promise.resolve( this.constructor.merge( chainingObject, defaultConfiguration ) );
		}

		initialize ( reset ) {
			if ( reset ) {
				this.task = this.task.then( json => this.constructor.merge( json, this.defaultConfiguration, true ) );
				this.write();
			} else {
				this.task = this.task.then( json => new Promise( ( resolve, reject ) => {
					jsonfile.readFile( this.file, ( err, obj ) => {
						if ( err !== null ) reject( err );
						else resolve( this.constructor.merge( json, obj, true ) );
					} );
				} ).catch( err => {
					switch ( err.errno ) {
						case -4058:
							this.write( );
							return json;
						default:
							throw err;
					}
				} ) );
			}

			return this;
		}

		static merge ( target, source, purge = false ) {
			if ( typeof target !== "object" ) return target;
			if ( target === source ) {
				console.log( "Equal" );
				return target;
			}
			if ( purge ) {
				for ( const key of Object.keys( target ) ) {
					delete target[key];
				}

				for ( const [ key, value ] of Object.entries( source ) ) {
					target[key] = value;
				}
			} else {
				for ( const [ key, value ] of Object.entries( source ) ) {
					if ( typeof value === "object" && typeof value === typeof target[key] ) target[ key ] = this.merge( target[ key ], value, false );
					else target[ key ] = value;
				}
			}

			return target;
		}

		addQueue ( fn ) {
			this.task = this.task.then( fn );

			return this;
		}

		get options () {
			return this.task;
		}

		remove ( keys ) {
			if ( !( keys instanceof Array ) ) keys = [ keys ];
			this.task = this.task.then( json => {
				let event = new Event( "change" );
				for ( const key of keys ) {
					if ( json[key] ) {
						this.constructor.merge( event, { details: { old: { [key]: json[key] } } } );
					}
					delete json[key];
				}
				json.update = new Date().toString();
				if ( event.details !== undefined ) this.dispatchEvent( event );

				return json;
			} );

			return this;
		}

		set ( data = {} ) {
			this.task = this.task.then( json => {
				let event = new Event( "change" );
				for ( const [ key, value ] of Object.entries( data ) ) {
					if ( json[key] ) {
						if ( json[key] !== value ) {
							this.constructor.merge( event, { details: { old: { [key]: json[key] }, new: { [key]: value } } } );
						}
					}
					else this.constructor.merge( event, { details: { new: { [key]: value } } } );
					json[key] = value;
				}
				json.update = new Date().toString();
				if ( event.details !== undefined ) {
					this.dispatchEvent( event );
				}

				return json;
			} );

			return this;
		}

		replace ( data = {} ) {
			this.task = this.task.then( json => {
				let event = new Event( "change" );
				for ( const key of Object.keys( json ) ) {
					if ( json[key] ) {
						this.constructor.merge( event, { details: { old: { [key]: json[key] } } } );
					}
					delete json[key];
				}
				for ( const [ key, value ] of Object.entries( data ) ) {
					if ( json[key] ) {
						if ( json[key] !== value ) {
							this.constructor.merge( event, { details: { old: { [key]: json[key] }, new: { [key]: value } } } );
						}
					}
					else this.constructor.merge( event, { details: { new: { [key]: value } } } );
					json[key] = value;
				}
				json.update = new Date().toString();
				if ( event.details !== undefined ) this.dispatchEvent( event );

				return json;
			} );

			return this;
		}

		read () {
			this.task = this.task.then( json => new Promise( ( resolve, reject ) => {
				jsonfile.readFile( this.file, ( err, obj ) => {
					if ( err !== null ) reject( err );
					else resolve( this.constructor.merge( json, obj, true ) );
				} );
			} ) );

			return this;
		}

		write () {
			this.task = this.task.then( json => {
				json.update = new Date().toString();

				return new Promise( ( resolve, reject ) => {
					jsonfile.writeFile( this.file, json, { spaces: 2 }, err => {
						if ( err !== null ) reject( err );
						else resolve( json );
					} );
				} );
			} );

			return this;
		}
	}

	const modEx = new moduleExporter();
	modEx.export( "configIO", configIO );
	modEx.build( module );
} ) ();