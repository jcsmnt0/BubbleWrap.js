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