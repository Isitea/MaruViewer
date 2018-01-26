function Observer ( list = []) {
	let handler = {};
	for ( const key of list ) {
		handler[key] = ( target, key, value ) => { console.log( target, key, value ); };
	}

	return handler;
}
