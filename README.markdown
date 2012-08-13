BubbleWrap.js
=============

BubbleWrap.js is a library that provides runtime type- and constraint-checking for properties of Javascript objects. Basically, it emulates the strong typing found in languages like Java and C++ by checking a value before it's assigned to a variable, and throwing an exception if it's the wrong type. It works using the [Object.defineProperty][defineProperty] method of ES5 ([see here for compatibility][compatibility]).

  [defineProperty]: https://developer-new.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/defineProperty
  [compatibility]: https://developer-new.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/defineProperty#Browser_compatibility

Usage
-----

The `BubbleWrap` method takes an object as a parameter, and type-safes its properties. The usage looks like this:

```javascript
var obj = BubbleWrap({
	a: Number,
	b: BubbleWrap.type('Object?'),
	c: false,
	d: undefined,
	e: {
		validTypes: [String, 'HTMLBodyElement', null, undefined],
		constraints: [
			function(val) {
				return val !== 'this string is not allowed!';
			},
			function(val) {
				return obj.c;
			}
		],
		value: 'default value of obj.e'
	}
	f: function(a) { return a*2; },
	g: {
		validTypes: null,
		value: Math.PI / 2
	}
})
```

Here's how that example breaks down:

### a:
`obj.a` is initially `undefined`, and can only be assigned a `Number` value (which includes `Infinity` and `NaN`, but doesn't include `null` or `undefined`). This syntax can be used with any of the ES5 native types, which are `Object`, `Function`, `Array`, `Number`, `String`, `Boolean`, `RegExp`, and `Date`.

### b:
`obj.b` is also initially `undefined`, but will accept `null` as well as any `Object`. This syntax allows for defining a variable as any built-in type, including browser-specific ones like Firefox's `HTMLBodyElement`; it can also be used without the `?` character, in which case the value will not accept null.

### c:
`obj.c` is initially `false`, and can only be assigned a `Boolean` value. This syntax can be used with any literal value or variable.

### d:
`obj.d` is initially `undefined`, and can be assigned any value at all.

### e:
The initial value of `obj.e` is `'default value of obj.e'`, and it can be assigned `null`, `undefined`, any `String`, or any `HTMLBodyElement` (a Firefox-specific type). Any assignment to `obj.e` will fail if the value being assigned to it is `'this string is not allowed'`, or if `obj.c` is false.

### f:
`obj.f` is a function that doubles its input value. Functions are constant by default, so `obj.f` can't be changed.

### g:
`obj.g` is a constant with the value `Math.PI / 2`; it can't be assigned any other value.

Other methods
-------------
* `BubbleWrap.getType(thing)`: returns the type of `thing` as a string, using a slight modification to the method from <http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/> (so that e.g. `String` returns `'String'` instead of `'Function'`).

Built-in constraints
--------------------
There are a couple constraints that come with the library:
* `BubbleWrap.constraints.integer`: only accepts integer values (including `NaN` and `Infinity`)
* `BubbleWrap.constraints.nonNegative`: only accepts positive values (including `NaN`)
* `BubbleWrap.constraints.jQuery(<type>)`: only accepts a jQuery object; if `<type>` is a string, only accepts a jQuery wrapper for of the given element type (e.g. `BubbleWrap.constraints.jQuery('div')`)

Notes
-----

* If there isn't already a global object by the name `O`, it's assigned as a shortcut for `BubbleWrap` (e.g. `O(<obj>)`, `O.constraints.integer`)
* The `validTypes` and `constraints` properties of type definitions can be either single values or arrays.
* Constraint functions are passed two values: the first is the value that's being assigned to the property, and the second is the name of the property itself (which is helpful for generating useful exception messages with `throw` if the value is rejected). If the constraint function returns `true`, the value is accepted; if it returns `false`, it's rejected with a generic message.
* An existing object can be passed to BubbleWrap.wrap, and the object itself will be modified (no need to assign the return value to a new variable).

Caveats
-------

A wrapped object can't have a property whose name is another property's name prepended with an underscore (e.g. `propName` and `_propName`).
