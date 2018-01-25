function Observer ( list = []) {
	let handler = {};
	for ( const key of list ) {
		handler[key] = ( target, key, value ) => { console.log( target, key, value ); };
	}

	return handler;
}

var config = new Proxy( {}, Observer( [ "set", "deleteProperty" ] ) );
config.test = 123;
delete config.test;