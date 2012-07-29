BubbleWrap.js
=============

BubbleWrap.js is a library that provides runtime type- and constraint-checking for properties of Javascript objects. Basically, it emulates the strong typing found in languages like Java and C++ by checking a value before it's assigned to a variable, and throwing an error if it's the wrong type. It works using the [Object.defineProperty][defineProperty] method of ES5 ([see here for compatibility][compatibility]).

  [defineProperty]: https://developer-new.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/defineProperty
  [compatibility]: https://developer-new.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/defineProperty#Browser_compatibility

Usage
-----

The `BubbleWrap.wrap` method takes an object as a parameter, and type-safes its properties. The usage looks like this:

```javascript
var obj = BubbleWrap.wrap({
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
`obj.f` is a function that doubles its input value. Any attempt to change its value will fail.

### g:
`obj.g` is a constant with the value `Math.PI / 2`; it can't be assigned any other value.

Notes
-----

* The `validTypes` and `constraints` properties of type definitions can be either single values or arrays.
* Constraint functions are passed two values: the first is the value that's being assigned to the property, and the second is the name of the property itself (which is helpful for generating useful error messages with `throw` if the value is rejected). If the constraint function returns `true`, the value is accepted; if it returns `false`, it's rejected with a generic error message. There are also a couple constraints that come with the library:
  * `BubbleWrap.constraints.integer`: rejects any value that's not an integer (including NaN and Infinity)
  * `BubbleWrap.constraints.nonNegative`: rejects any value less than 0 (accepts NaN)

Caveats
-------

A wrapped object can't have a property whose name is another property's name prepended with an underscore (e.g. `propName` and `_propName`).