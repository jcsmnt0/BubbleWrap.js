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

var BubbleWrap = function() {
	// based on method from http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
	var getType = function(obj) {
		if (isBuiltIn(obj)) return obj.name;

		var typeName = Object.prototype.toString.call(obj);
		return typeName.substring(typeName.indexOf(' ') + 1, typeName.length - 1);
	};

	var isBuiltIn = function(thing) {
		switch (thing) {
			case Function:
			case String:
			case RegExp:
			case Object:
			case Array:
			case Date:
			case Number:
			case Boolean:
				return true;
		}

		return false;
	};

	var typeCheck = function(obj, id, val, nullable) {
		if (!nullable)
			nullCheck(id, val);

		var type = getType(obj[id]);
		var valType = getType(val);

		if (valType !== type)
			throw 'TypeError: ' + valType + ' ' + val + ' can\'t be assigned to ' + type + ' ' + id;

		return val;
	};

	var nullCheck = function(id, val) {
		if (val === null || val === undefined)
			throw 'TypeError: non-nullable ' + id + ' ' + 'can\'t be ' + val + '.';

		return val;
	};

	var constraintCheck = function(obj, id, val, constraint) {
		if (!constraint(val))
			throw 'TypeError: ' + val + ' can\'t be assigned to ' + id + ' because it violates a custom constraint.';
	};

	var createSetter = function(obj, id, modifiers) {
		constant = arrayHas(modifiers, 'const');
		nullable = arrayHas(modifiers, 'nullable');
		untyped = arrayHas(modifiers, 'untyped');
		constrained = arrayHas(modifiers, 'constrained');

		if (constant) {
			return function(val) { throw 'TypeError: ' + val + ' can\'t be assigned to const ' + id + '.'; };
		} else {
			if (untyped) {
				if (nullable) {
					return function(val) { obj['_'+id] = nullCheck(val); };
				} else {
					return function(val) { obj['_'+id] = val; };
				}
			} else {
				if (constrained) {
					return function(val) { obj['_'+id] = constraintCheck(obj, id, val, obj[id]); };
				} else {
					return function(val) { obj['_'+id] = typeCheck(obj, id, val, nullable); }
				}
			}
		}
	};

	var createGetter = function(obj, id) {
		return function() { return obj['_'+id]; };
	};

	var arrayHas = function(arr, obj) {
		return arr.indexOf(obj) >= 0;
	};

	var wrap = function(obj) {
		var signatures = Object.keys(obj);
		var sigCount = signatures.length;

		var sigTokens, id, modifiers, setter;
		var constant, nullable, untyped, constrained;

		for (var sigIndex = 0; sigIndex < sigCount; sigIndex++) {
			sigTokens = signatures[sigIndex].split(' ');
			id = sigTokens[sigTokens.length - 1];
			modifiers = sigTokens.slice(0, sigTokens.length - 1);

			Object.defineProperty(obj, '_'+id, {
				value: (isBuiltIn(obj[id]) || constrained) ? undefined : obj[id],
				writable: true,
				enumerable: true
			});

			Object.defineProperty(obj, id, {
				set: createSetter(obj, id, modifiers),
				get: createGetter(obj, id),
				enumerable: true
			});
		}

		return obj;
	};


	return {
		wrap: wrap,
		getType: getType
	};
}();