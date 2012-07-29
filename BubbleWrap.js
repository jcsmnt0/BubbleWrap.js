// Copyright (c) 2012, Joseph Casamento
// All rights reserved.

// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
// following conditions are met:

// Redistributions of source code must retain the above copyright notice, this list of conditions and the following
// disclaimer. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and
// the following disclaimer in the documentation and/or other materials provided with the distribution. THIS SOFTWARE
// IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT
// NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO
// EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
// OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
// STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
// EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

var BubbleWrap = (function() {
	var builtInTypes =	   [ Object ,  Function ,  Array ,  Number ,  String ,  Boolean ,  RegExp ,  Date ];
	var builtInTypeNames = ['Object', 'Function', 'Array', 'Number', 'String', 'Boolean', 'RegExp', 'Date'];

	var arrayContains = function(arr, elem) {
		return arr.indexOf(elem) >= 0;
	}

	// based on method from http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
	var getType = function(thing) {
		if (arrayContains(builtInTypes, thing)) return builtInTypeNames[builtInTypes.indexOf(thing)];
		var type = Object.prototype.toString.call(thing);
		return type.substring(type.indexOf(' ') + 1, type.length - 1);
	};

	var checkValue = function(id, val, validTypes, constraints) {
		var valType;

		if (validTypes === null) {
			throw 'TypeError: ' + val + ' can\'t be assigned to constant ' + id + '.';
		}

		if (validTypes) {
			valType = getType(val);
			if (getType(validTypes) === 'Array') {
				if (!arrayContains(validTypes, valType)) {
					throw 'TypeError: ' + valType + ' ' + val + ' can\'t be assigned to ' + id +
						  '. Valid types for ' + id + ' are ' + validTypes.join(', ');
				}
			} else {
				if (validTypes !== getType(val)) {
					throw 'TypeError: ' + valType + ' ' + val + ' can\'t be assigned to ' +
						   validTypes + ' ' + id + '.';
				}
			}
		}

		var constraint, constraintCount, i;
		if (constraints) {
			if (getType(constraints) === 'Array') {
				constraintCount = constraints.length;
				for (i = 0; i < constraintCount; i++) {
					if (!constraints[i](val, id)) {
						throw 'TypeError: ' + val + ' can\'t be assigned to ' + id + ' because ' +
							  'it violates a custom constraint.';
					}
				}
			} else {
				if (!constraints(val, id)) {
					throw 'TypeError: ' + val + ' can\'t be assigned to ' + id + ' because ' +
						  'it violates a custom constraint.';
				}
			}
		}
	}

	var define = function(validTypes, constraints, value) {
		return {
			validTypes: validTypes,
			constraints: constraints,
			value: value
		}
	}

	var wrap = function(obj) {
		var ids = Object.keys(obj), idCount = ids.length;

		var i, id, definition, setter, value, validTypes, validTypeCount;
		for (i = 0; i < idCount; i++) {
			id = ids[i];

			if (obj.hasOwnProperty(id)) {
				definition = obj[id];
				var defType = getType(definition);

				if (defType === 'Function' && definition !== Function) {
					// function value (constant by default)
					value = definition;
					setter = (function(obj, id, definition) {
						return function(val) {
							checkValue(id, val, null);
							obj['_' + id] = val;
						}
					})(obj, id, definition);
				} else if (getType(definition) === 'Object' && (definition.validTypes || definition.constraints)) {
					// type definition object

					// convert valid types to type strings
					validTypes = definition.validTypes;
					if (getType(validTypes) === 'Array') {
						validTypeCount = validTypes.length;
						for (i = 0; i < validTypeCount; i++) {
							if (arrayContains(builtInTypes, validTypes[i]))
								validTypes[i] = builtInTypeNames[builtInTypes.indexOf(validTypes[i])];
							else if (getType(validTypes[i]) !== 'String')
								throw 'BubbleWrap error: ' + validTypes[i] + ' is neither a ' +
									  'built-in type nor a type name string.';
						}
					} else {
						if (arrayContains(builtInTypes, validTypes))
							validTypes = builtInTypeNames[builtInTypes.indexOf(validTypes)];
					}

					value = definition.value;
					setter = (function(obj, id, validTypes, constraints) {
						return function(val) {
							checkValue(id, val, validTypes, constraints);
							obj['_' + id] = val;
						}
					})(obj, id, validTypes, definition.constraints);
				} else if (arrayContains(builtInTypeNames, defType)) {
					// built-in type
					value = undefined;
					setter = (function(obj, id, type) {
						return function(val) {
							checkValue(id, val, type);
							obj['_' + id] = val;
						}
					})(obj, id, defType);
				} else {
					// literal value
					value = definition
					setter = (function(obj, id, type) {
						return function(val) {
							checkValue(id, val, type);
							obj['_' + id] = val;
						}
					})(obj, id, getType(definition));
				}

				Object.defineProperty(obj, '_' + id, {
					value: value || definition.value,
					writable: true
				});

				delete obj[id];

				Object.defineProperty(obj, id, {
					set: setter,
					get: (function(obj, id) {
						return function() {
							return obj['_' + id];
						}
					})(obj, id),
					enumerable: true
				});
			}
		}

		return obj;
	};

	var constraints = wrap({
		integer: function(val, id) {
			if (parseFloat(val) == parseInt(val) && !isNaN(val))
				return true;
			throw 'TypeError: ' + val + ' can\'t be assigned to integer ' + id + '.';
		},
		nonNegative: function(val, id) {
			if (val < 0)
				throw 'TypeError: ' + val + ' can\'t be assigned to non-negative ' + id + '.';
			return true;
		}
	})

	return {
		wrap: wrap,
		getType: getType,
		constraints: constraints
	};
})()