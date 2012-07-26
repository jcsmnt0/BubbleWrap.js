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
		switch (obj) {
			case Function:
			case String:
			case RegExp:
			case Object:
			case Array:
			case Date:
			case Number:
			case Boolean:
				return obj.name;
		}

		var typeName = Object.prototype.toString.call(obj);
		return typeName.substring(typeName.indexOf(' ') + 1, typeName.length - 1);
	};

	var getGetter = function(obj, id) {
	   return function() { return obj['_' + id]; };
	};

	var getUntypedSetter = function(obj, id) {
		return function(val) {
			if (val == null)
				throw 'Type error: ' + id + ' can\'t be null';
			obj[id] = val;
		}
	};

	var getTypedSetter = function(obj, id) {
		var type = getType(obj[id]);

		return function(val) {
			if (val == null)
				throw 'Type error: ' + id + ' can\'t be null';

			var valType = getType(val);
			if (valType !== type)
				throw 'Type error: ' + valType + ' ' + val + ' can\'t be assigned to ' + type + ' ' + id;
		}
	}

	var arrayHas = function(arr, obj) {
		return arr.indexOf(obj) >= 0;
	};

	var wrap = function(obj) {
		var signatures = Object.keys(obj);
		var sigCount = signatures.length;

		var sigTokens, id, modifiers, setter;

		for (var sigIndex = 0; sigIndex < sigCount; sigIndex++) {
			sigTokens = signatures[sigIndex].split(' ');
			id = sigTokens[sigTokens.length - 1];
			modifiers = sigTokens.slice(0, sigTokens.length - 1);

			if (arrayHas(modifiers, 'untyped'))
				setter = getUntypedSetter(obj, id);
			else
				setter = getTypedSetter(obj, id);

			Object.defineProperty(obj, '_' + id, { value: obj[id] });

			Object.defineProperty(obj, id, {
				set: setter,
				get: function() { return obj['_' + id]; },
				enumerable: true
			});
		}

		return obj;
	};


	return {
		wrap: wrap,
		getType: getType
	}
}();