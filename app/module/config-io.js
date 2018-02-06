"use strict";
//Only for Node.js
( () => {
	const { moduleExporter } = require( "./module-exporter" );
	const { iEventTarget } = require( "./iEventTarget" );
	const { iEvent: Event } = require( "./iEvent" );
	const { iOO } = require( "./ObjectObserver" );
	const jsonfile = require( 'jsonfile' );

	class configIO extends iEventTarget {
		constructor ( { file, writeOnChange } = { file: "configIO.json", writeOnChange: false } ) {
			super();
			if ( writeOnChange ) this.addEventListener( "change", ( SELF => event => { SELF.write(); } )( this ) );
			this.file = file;
			this.task = Promise.resolve( {} );
		}

		initialize ( DEFAULT = {}, reset ) {
			if ( reset ) {
				this.task.then( () => reset );
				this.write();
			} else {
				this.task = this.task.then( () => new Promise( ( resolve, reject ) => {
					jsonfile.readFile( this.file, ( err, obj ) => {
						if ( err !== null ) reject( err );
						else resolve( obj );
					} );
				} ) ).catch( err => {
					switch ( err.errno ) {
						case -4058:
							this.write();
							return DEFAULT;
						default:
							throw err;
					}
				} );
			}

			return this.task;
		}

		static merge ( target, source, recycle = false ) {
			if ( recycle )
				for ( const key of Object.keys( target ) )
					delete target[key];
			for ( const [ key, value ] of Object.entries( source ) ) {
				if ( typeof value === "object" ) target[key] = this.merge( target[key] || {}, value, false );
				else target[key] = value;
			}

			return target;
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
				data.update = json.update;
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

		replace ( data = {} ) {
			this.task = this.task.then( json => {
				let event = new Event( "change" );
				data.update = json.update;
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
			this.task = this.task.then( () => new Promise( ( resolve, reject ) => {
				jsonfile.readFile( this.file, ( err, obj ) => {
					if ( err !== null ) reject( err );
					else resolve( obj );
				} );
			} ) );

			return this;
		}

		write () {
			this.task = this.task.then( ( json ) => {
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