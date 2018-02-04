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
			function onChange ( event ) {
				let details = event[event.type], changes;
				switch ( event.type ) {
					case "set":
						if ( details.object[details.propertyKey] !== details.value ) {
							changes = {
								old: { [details.propertyKey]: details.object[details.propertyKey] },
								new: { [details.propertyKey]: details.value }
							}
						}
						break;
					case "deleteProperty":
						if ( details.object[details.propertyKey] !== undefined ) {
							changes = {
								old: { [details.propertyKey]: details.object[details.propertyKey] },
								new: { [details.propertyKey]: undefined }
							}
						}
						break;
				}
				if ( changes !== undefined ) {
					let event = new Event( "change" );
					Object.assign( event, { details: changes } );
					SELF.dispatchEvent.call( SELF, event );
				}
			}

			super();
			this.iOO = new iOO( {} );
			const SELF = this;
			this.iOO.addEventListener( "set", onChange );
			this.iOO.addEventListener( "deleteProperty", onChange );
			if ( writeOnChange ) this.addEventListener( "change", ( event ) => {
				this.write( this.config );
			} );
			this.config = this.iOO.Observed;
			this.file = file;
			this.task = Promise.resolve();
			this.read();
		}

		get ( keys = [] ) {
			return this.task.then( json => {
				if ( !( keys instanceof Array ) ) keys = [ keys ];
				if ( keys.length === 0 ) return Object.assign( {}, this.config );
				else {
					let result = {};
					for ( const key of keys )
						if ( this.config[key] !== undefined )
							Object.assign( result, { [key]: this.config[key] } );

					return result;
				}
			} );
		}

		set set ( data ) {
			Object.assign( this.config, data );
		}

		set replace ( data ) {
			for ( const key of Object.keys( this.config ) ) {
				if ( !( key in data ) ) {
					delete this.config[ key ];
				}
			}
			Object.assign( this.config, data );
		}

		read () {
			this.task = this.task.then( () => new Promise( ( resolve, reject ) => {
				jsonfile.readFile( this.file, ( err, obj ) => {
					if ( err !== null ) reject( err );
					else resolve( obj );
				} );
			} ) ).catch( err => new Promise( ( resolve, reject ) => {
				switch ( err.errno ) {
					case -4058:
						this.write().then( obj => resolve( obj ), reject );
						break;
					default:
						console.log( err );
						reject( err );
						break;
				}
			} ) ).then( json => {
				for ( const key of Object.keys( json ) ) this.iOO.addEventListener( "set", e => e.stopImmediatePropagation(), { once: true, prior: true } );
				Object.assign( this.config, json );

				return json;
			} );

			return this.task;
		};
		write ( json = this.iOO[this.iOO.id] ) {
			Object.assign( json, { update: new Date().toString() } );
			return new Promise( ( resolve, reject ) => {
				jsonfile.writeFile( this.file, json, { spaces: 2 }, ( err ) => {
					if ( err !== null ) resolve( json );
					else reject( err );
				} );
			} );
		};
	}

	const modEx = new moduleExporter();
	modEx.export( "configIO", configIO );
	modEx.build( module );
} ) ();