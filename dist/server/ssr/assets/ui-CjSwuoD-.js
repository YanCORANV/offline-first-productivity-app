import { c as __exportAll, l as __toESM, n as require_jsx_runtime, o as require_react, s as __commonJSMin } from "../index.js";
//#region node_modules/rrule/dist/esm/weekday.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var ALL_WEEKDAYS = [
	"MO",
	"TU",
	"WE",
	"TH",
	"FR",
	"SA",
	"SU"
];
var Weekday = function() {
	function Weekday(weekday, n) {
		if (n === 0) throw new Error("Can't create weekday with n == 0");
		this.weekday = weekday;
		this.n = n;
	}
	Weekday.fromStr = function(str) {
		return new Weekday(ALL_WEEKDAYS.indexOf(str));
	};
	Weekday.prototype.nth = function(n) {
		return this.n === n ? this : new Weekday(this.weekday, n);
	};
	Weekday.prototype.equals = function(other) {
		return this.weekday === other.weekday && this.n === other.n;
	};
	Weekday.prototype.toString = function() {
		var s = ALL_WEEKDAYS[this.weekday];
		if (this.n) s = (this.n > 0 ? "+" : "") + String(this.n) + s;
		return s;
	};
	Weekday.prototype.getJsWeekday = function() {
		return this.weekday === 6 ? 0 : this.weekday + 1;
	};
	return Weekday;
}();
//#endregion
//#region node_modules/rrule/dist/esm/helpers.js
var isPresent = function(value) {
	return value !== null && value !== void 0;
};
var isNumber = function(value) {
	return typeof value === "number";
};
var isWeekdayStr = function(value) {
	return typeof value === "string" && ALL_WEEKDAYS.includes(value);
};
var isArray = Array.isArray;
/**
* Simplified version of python's range()
*/
var range = function(start, end) {
	if (end === void 0) end = start;
	if (arguments.length === 1) {
		end = start;
		start = 0;
	}
	var rang = [];
	for (var i = start; i < end; i++) rang.push(i);
	return rang;
};
var repeat = function(value, times) {
	var i = 0;
	var array = [];
	if (isArray(value)) for (; i < times; i++) array[i] = [].concat(value);
	else for (; i < times; i++) array[i] = value;
	return array;
};
var toArray = function(item) {
	if (isArray(item)) return item;
	return [item];
};
function padStart(item, targetLength, padString) {
	if (padString === void 0) padString = " ";
	var str = String(item);
	targetLength = targetLength >> 0;
	if (str.length > targetLength) return String(str);
	targetLength = targetLength - str.length;
	if (targetLength > padString.length) padString += repeat(padString, targetLength / padString.length);
	return padString.slice(0, targetLength) + String(str);
}
/**
* Python like split
*/
var split = function(str, sep, num) {
	var splits = str.split(sep);
	return num ? splits.slice(0, num).concat([splits.slice(num).join(sep)]) : splits;
};
/**
* closure/goog/math/math.js:modulo
* Copyright 2006 The Closure Library Authors.
* The % operator in JavaScript returns the remainder of a / b, but differs from
* some other languages in that the result will have the same sign as the
* dividend. For example, -1 % 8 == -1, whereas in some other languages
* (such as Python) the result would be 7. This function emulates the more
* correct modulo behavior, which is useful for certain applications such as
* calculating an offset index in a circular list.
*
* @param {number} a The dividend.
* @param {number} b The divisor.
* @return {number} a % b where the result is between 0 and b (either 0 <= x < b
* or b < x <= 0, depending on the sign of b).
*/
var pymod = function(a, b) {
	var r = a % b;
	return r * b < 0 ? r + b : r;
};
/**
* @see: <http://docs.python.org/library/functions.html#divmod>
*/
var divmod = function(a, b) {
	return {
		div: Math.floor(a / b),
		mod: pymod(a, b)
	};
};
var empty = function(obj) {
	return !isPresent(obj) || obj.length === 0;
};
/**
* Python-like boolean
*
* @return {Boolean} value of an object/primitive, taking into account
* the fact that in Python an empty list's/tuple's
* boolean value is False, whereas in JS it's true
*/
var notEmpty = function(obj) {
	return !empty(obj);
};
/**
* Return true if a value is in an array
*/
var includes = function(arr, val) {
	return notEmpty(arr) && arr.indexOf(val) !== -1;
};
//#endregion
//#region node_modules/rrule/dist/esm/dateutil.js
var datetime = function(y, m, d, h, i, s) {
	if (h === void 0) h = 0;
	if (i === void 0) i = 0;
	if (s === void 0) s = 0;
	return new Date(Date.UTC(y, m - 1, d, h, i, s));
};
/**
* General date-related utilities.
* Also handles several incompatibilities between JavaScript and Python
*
*/
var MONTH_DAYS = [
	31,
	28,
	31,
	30,
	31,
	30,
	31,
	31,
	30,
	31,
	30,
	31
];
/**
* Number of milliseconds of one day
*/
var ONE_DAY = 1e3 * 60 * 60 * 24;
/**
* Python uses 1-Jan-1 as the base for calculating ordinals but we don't
* want to confuse the JS engine with milliseconds > Number.MAX_NUMBER,
* therefore we use 1-Jan-1970 instead
*/
var ORDINAL_BASE = datetime(1970, 1, 1);
/**
* Python: MO-SU: 0 - 6
* JS: SU-SAT 0 - 6
*/
var PY_WEEKDAYS = [
	6,
	0,
	1,
	2,
	3,
	4,
	5
];
var isLeapYear = function(year) {
	return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
};
var isDate = function(value) {
	return value instanceof Date;
};
var isValidDate = function(value) {
	return isDate(value) && !isNaN(value.getTime());
};
/**
* @see: <http://www.mcfedries.com/JavaScript/DaysBetween.asp>
*/
var daysBetween = function(date1, date2) {
	var differencems = date1.getTime() - date2.getTime();
	return Math.round(differencems / ONE_DAY);
};
/**
* @see: <http://docs.python.org/library/datetime.html#datetime.date.toordinal>
*/
var toOrdinal = function(date) {
	return daysBetween(date, ORDINAL_BASE);
};
/**
* @see - <http://docs.python.org/library/datetime.html#datetime.date.fromordinal>
*/
var fromOrdinal = function(ordinal) {
	return new Date(ORDINAL_BASE.getTime() + ordinal * ONE_DAY);
};
var getMonthDays = function(date) {
	var month = date.getUTCMonth();
	return month === 1 && isLeapYear(date.getUTCFullYear()) ? 29 : MONTH_DAYS[month];
};
/**
* @return {Number} python-like weekday
*/
var getWeekday = function(date) {
	return PY_WEEKDAYS[date.getUTCDay()];
};
/**
* @see: <http://docs.python.org/library/calendar.html#calendar.monthrange>
*/
var monthRange = function(year, month) {
	var date = datetime(year, month + 1, 1);
	return [getWeekday(date), getMonthDays(date)];
};
/**
* @see: <http://docs.python.org/library/datetime.html#datetime.datetime.combine>
*/
var combine = function(date, time) {
	time = time || date;
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds()));
};
var clone = function(date) {
	return new Date(date.getTime());
};
var cloneDates = function(dates) {
	var clones = [];
	for (var i = 0; i < dates.length; i++) clones.push(clone(dates[i]));
	return clones;
};
/**
* Sorts an array of Date or Time objects
*/
var sort = function(dates) {
	dates.sort(function(a, b) {
		return a.getTime() - b.getTime();
	});
};
var timeToUntilString = function(time, utc) {
	if (utc === void 0) utc = true;
	var date = new Date(time);
	return [
		padStart(date.getUTCFullYear().toString(), 4, "0"),
		padStart(date.getUTCMonth() + 1, 2, "0"),
		padStart(date.getUTCDate(), 2, "0"),
		"T",
		padStart(date.getUTCHours(), 2, "0"),
		padStart(date.getUTCMinutes(), 2, "0"),
		padStart(date.getUTCSeconds(), 2, "0"),
		utc ? "Z" : ""
	].join("");
};
var untilStringToDate = function(until) {
	var bits = /^(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})Z?)?$/.exec(until);
	if (!bits) throw new Error("Invalid UNTIL value: ".concat(until));
	return new Date(Date.UTC(parseInt(bits[1], 10), parseInt(bits[2], 10) - 1, parseInt(bits[3], 10), parseInt(bits[5], 10) || 0, parseInt(bits[6], 10) || 0, parseInt(bits[7], 10) || 0));
};
var dateTZtoISO8601 = function(date, timeZone) {
	return date.toLocaleString("sv-SE", { timeZone }).replace(" ", "T") + "Z";
};
var dateInTimeZone = function(date, timeZone) {
	var localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	var dateInLocalTZ = new Date(dateTZtoISO8601(date, localTimeZone));
	var tzOffset = new Date(dateTZtoISO8601(date, timeZone !== null && timeZone !== void 0 ? timeZone : "UTC")).getTime() - dateInLocalTZ.getTime();
	return new Date(date.getTime() - tzOffset);
};
//#endregion
//#region node_modules/rrule/dist/esm/iterresult.js
/**
* This class helps us to emulate python's generators, sorta.
*/
var IterResult = function() {
	function IterResult(method, args) {
		this.minDate = null;
		this.maxDate = null;
		this._result = [];
		this.total = 0;
		this.method = method;
		this.args = args;
		if (method === "between") {
			this.maxDate = args.inc ? args.before : /* @__PURE__ */ new Date(args.before.getTime() - 1);
			this.minDate = args.inc ? args.after : new Date(args.after.getTime() + 1);
		} else if (method === "before") this.maxDate = args.inc ? args.dt : /* @__PURE__ */ new Date(args.dt.getTime() - 1);
		else if (method === "after") this.minDate = args.inc ? args.dt : new Date(args.dt.getTime() + 1);
	}
	/**
	* Possibly adds a date into the result.
	*
	* @param {Date} date - the date isn't necessarly added to the result
	* list (if it is too late/too early)
	* @return {Boolean} true if it makes sense to continue the iteration
	* false if we're done.
	*/
	IterResult.prototype.accept = function(date) {
		++this.total;
		var tooEarly = this.minDate && date < this.minDate;
		var tooLate = this.maxDate && date > this.maxDate;
		if (this.method === "between") {
			if (tooEarly) return true;
			if (tooLate) return false;
		} else if (this.method === "before") {
			if (tooLate) return false;
		} else if (this.method === "after") {
			if (tooEarly) return true;
			this.add(date);
			return false;
		}
		return this.add(date);
	};
	/**
	*
	* @param {Date} date that is part of the result.
	* @return {Boolean} whether we are interested in more values.
	*/
	IterResult.prototype.add = function(date) {
		this._result.push(date);
		return true;
	};
	/**
	* 'before' and 'after' return only one date, whereas 'all'
	* and 'between' an array.
	*
	* @return {Date,Array?}
	*/
	IterResult.prototype.getValue = function() {
		var res = this._result;
		switch (this.method) {
			case "all":
			case "between": return res;
			default: return res.length ? res[res.length - 1] : null;
		}
	};
	IterResult.prototype.clone = function() {
		return new IterResult(this.method, this.args);
	};
	return IterResult;
}();
//#endregion
//#region node_modules/tslib/tslib.es6.mjs
/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
var extendStatics = function(d, b) {
	extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
		d.__proto__ = b;
	} || function(d, b) {
		for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
	};
	return extendStatics(d, b);
};
function __extends(d, b) {
	if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
	extendStatics(d, b);
	function __() {
		this.constructor = d;
	}
	d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
var __assign = function() {
	__assign = Object.assign || function __assign(t) {
		for (var s, i = 1, n = arguments.length; i < n; i++) {
			s = arguments[i];
			for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
		}
		return t;
	};
	return __assign.apply(this, arguments);
};
function __spreadArray(to, from, pack) {
	if (pack || arguments.length === 2) {
		for (var i = 0, l = from.length, ar; i < l; i++) if (ar || !(i in from)) {
			if (!ar) ar = Array.prototype.slice.call(from, 0, i);
			ar[i] = from[i];
		}
	}
	return to.concat(ar || Array.prototype.slice.call(from));
}
//#endregion
//#region node_modules/rrule/dist/esm/callbackiterresult.js
/**
* IterResult subclass that calls a callback function on each add,
* and stops iterating when the callback returns false.
*/
var CallbackIterResult = function(_super) {
	__extends(CallbackIterResult, _super);
	function CallbackIterResult(method, args, iterator) {
		var _this = _super.call(this, method, args) || this;
		_this.iterator = iterator;
		return _this;
	}
	CallbackIterResult.prototype.add = function(date) {
		if (this.iterator(date, this._result.length)) {
			this._result.push(date);
			return true;
		}
		return false;
	};
	return CallbackIterResult;
}(IterResult);
//#endregion
//#region node_modules/rrule/dist/esm/nlp/i18n.js
var ENGLISH = {
	dayNames: [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday"
	],
	monthNames: [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December"
	],
	tokens: {
		SKIP: /^[ \r\n\t]+|^\.$/,
		number: /^[1-9][0-9]*/,
		numberAsText: /^(one|two|three)/i,
		every: /^every/i,
		"day(s)": /^days?/i,
		"weekday(s)": /^weekdays?/i,
		"week(s)": /^weeks?/i,
		"hour(s)": /^hours?/i,
		"minute(s)": /^minutes?/i,
		"month(s)": /^months?/i,
		"year(s)": /^years?/i,
		on: /^(on|in)/i,
		at: /^(at)/i,
		the: /^the/i,
		first: /^first/i,
		second: /^second/i,
		third: /^third/i,
		nth: /^([1-9][0-9]*)(\.|th|nd|rd|st)/i,
		last: /^last/i,
		for: /^for/i,
		"time(s)": /^times?/i,
		until: /^(un)?til/i,
		monday: /^mo(n(day)?)?/i,
		tuesday: /^tu(e(s(day)?)?)?/i,
		wednesday: /^we(d(n(esday)?)?)?/i,
		thursday: /^th(u(r(sday)?)?)?/i,
		friday: /^fr(i(day)?)?/i,
		saturday: /^sa(t(urday)?)?/i,
		sunday: /^su(n(day)?)?/i,
		january: /^jan(uary)?/i,
		february: /^feb(ruary)?/i,
		march: /^mar(ch)?/i,
		april: /^apr(il)?/i,
		may: /^may/i,
		june: /^june?/i,
		july: /^july?/i,
		august: /^aug(ust)?/i,
		september: /^sep(t(ember)?)?/i,
		october: /^oct(ober)?/i,
		november: /^nov(ember)?/i,
		december: /^dec(ember)?/i,
		comma: /^(,\s*|(and|or)\s*)+/i
	}
};
//#endregion
//#region node_modules/rrule/dist/esm/nlp/totext.js
/**
* Return true if a value is in an array
*/
var contains = function(arr, val) {
	return arr.indexOf(val) !== -1;
};
var defaultGetText = function(id) {
	return id.toString();
};
var defaultDateFormatter = function(year, month, day) {
	return "".concat(month, " ").concat(day, ", ").concat(year);
};
/**
*
* @param {RRule} rrule
* Optional:
* @param {Function} gettext function
* @param {Object} language definition
* @constructor
*/
var ToText = function() {
	function ToText(rrule, gettext, language, dateFormatter) {
		if (gettext === void 0) gettext = defaultGetText;
		if (language === void 0) language = ENGLISH;
		if (dateFormatter === void 0) dateFormatter = defaultDateFormatter;
		this.text = [];
		this.language = language || ENGLISH;
		this.gettext = gettext;
		this.dateFormatter = dateFormatter;
		this.rrule = rrule;
		this.options = rrule.options;
		this.origOptions = rrule.origOptions;
		if (this.origOptions.bymonthday) {
			var bymonthday = [].concat(this.options.bymonthday);
			var bynmonthday = [].concat(this.options.bynmonthday);
			bymonthday.sort(function(a, b) {
				return a - b;
			});
			bynmonthday.sort(function(a, b) {
				return b - a;
			});
			this.bymonthday = bymonthday.concat(bynmonthday);
			if (!this.bymonthday.length) this.bymonthday = null;
		}
		if (isPresent(this.origOptions.byweekday)) {
			var byweekday = !isArray(this.origOptions.byweekday) ? [this.origOptions.byweekday] : this.origOptions.byweekday;
			var days = String(byweekday);
			this.byweekday = {
				allWeeks: byweekday.filter(function(weekday) {
					return !weekday.n;
				}),
				someWeeks: byweekday.filter(function(weekday) {
					return Boolean(weekday.n);
				}),
				isWeekdays: days.indexOf("MO") !== -1 && days.indexOf("TU") !== -1 && days.indexOf("WE") !== -1 && days.indexOf("TH") !== -1 && days.indexOf("FR") !== -1 && days.indexOf("SA") === -1 && days.indexOf("SU") === -1,
				isEveryDay: days.indexOf("MO") !== -1 && days.indexOf("TU") !== -1 && days.indexOf("WE") !== -1 && days.indexOf("TH") !== -1 && days.indexOf("FR") !== -1 && days.indexOf("SA") !== -1 && days.indexOf("SU") !== -1
			};
			var sortWeekDays = function(a, b) {
				return a.weekday - b.weekday;
			};
			this.byweekday.allWeeks.sort(sortWeekDays);
			this.byweekday.someWeeks.sort(sortWeekDays);
			if (!this.byweekday.allWeeks.length) this.byweekday.allWeeks = null;
			if (!this.byweekday.someWeeks.length) this.byweekday.someWeeks = null;
		} else this.byweekday = null;
	}
	/**
	* Test whether the rrule can be fully converted to text.
	*
	* @param {RRule} rrule
	* @return {Boolean}
	*/
	ToText.isFullyConvertible = function(rrule) {
		var canConvert = true;
		if (!(rrule.options.freq in ToText.IMPLEMENTED)) return false;
		if (rrule.origOptions.until && rrule.origOptions.count) return false;
		for (var key in rrule.origOptions) {
			if (contains([
				"dtstart",
				"tzid",
				"wkst",
				"freq"
			], key)) return true;
			if (!contains(ToText.IMPLEMENTED[rrule.options.freq], key)) return false;
		}
		return canConvert;
	};
	ToText.prototype.isFullyConvertible = function() {
		return ToText.isFullyConvertible(this.rrule);
	};
	/**
	* Perform the conversion. Only some of the frequencies are supported.
	* If some of the rrule's options aren't supported, they'll
	* be omitted from the output an "(~ approximate)" will be appended.
	*
	* @return {*}
	*/
	ToText.prototype.toString = function() {
		var gettext = this.gettext;
		if (!(this.options.freq in ToText.IMPLEMENTED)) return gettext("RRule error: Unable to fully convert this rrule to text");
		this.text = [gettext("every")];
		this[RRule$1.FREQUENCIES[this.options.freq]]();
		if (this.options.until) {
			this.add(gettext("until"));
			var until = this.options.until;
			this.add(this.dateFormatter(until.getUTCFullYear(), this.language.monthNames[until.getUTCMonth()], until.getUTCDate()));
		} else if (this.options.count) this.add(gettext("for")).add(this.options.count.toString()).add(this.plural(this.options.count) ? gettext("times") : gettext("time"));
		if (!this.isFullyConvertible()) this.add(gettext("(~ approximate)"));
		return this.text.join("");
	};
	ToText.prototype.HOURLY = function() {
		var gettext = this.gettext;
		if (this.options.interval !== 1) this.add(this.options.interval.toString());
		this.add(this.plural(this.options.interval) ? gettext("hours") : gettext("hour"));
	};
	ToText.prototype.MINUTELY = function() {
		var gettext = this.gettext;
		if (this.options.interval !== 1) this.add(this.options.interval.toString());
		this.add(this.plural(this.options.interval) ? gettext("minutes") : gettext("minute"));
	};
	ToText.prototype.DAILY = function() {
		var gettext = this.gettext;
		if (this.options.interval !== 1) this.add(this.options.interval.toString());
		if (this.byweekday && this.byweekday.isWeekdays) this.add(this.plural(this.options.interval) ? gettext("weekdays") : gettext("weekday"));
		else this.add(this.plural(this.options.interval) ? gettext("days") : gettext("day"));
		if (this.origOptions.bymonth) {
			this.add(gettext("in"));
			this._bymonth();
		}
		if (this.bymonthday) this._bymonthday();
		else if (this.byweekday) this._byweekday();
		else if (this.origOptions.byhour) this._byhour();
	};
	ToText.prototype.WEEKLY = function() {
		var gettext = this.gettext;
		if (this.options.interval !== 1) this.add(this.options.interval.toString()).add(this.plural(this.options.interval) ? gettext("weeks") : gettext("week"));
		if (this.byweekday && this.byweekday.isWeekdays) if (this.options.interval === 1) this.add(this.plural(this.options.interval) ? gettext("weekdays") : gettext("weekday"));
		else this.add(gettext("on")).add(gettext("weekdays"));
		else if (this.byweekday && this.byweekday.isEveryDay) this.add(this.plural(this.options.interval) ? gettext("days") : gettext("day"));
		else {
			if (this.options.interval === 1) this.add(gettext("week"));
			if (this.origOptions.bymonth) {
				this.add(gettext("in"));
				this._bymonth();
			}
			if (this.bymonthday) this._bymonthday();
			else if (this.byweekday) this._byweekday();
			if (this.origOptions.byhour) this._byhour();
		}
	};
	ToText.prototype.MONTHLY = function() {
		var gettext = this.gettext;
		if (this.origOptions.bymonth) {
			if (this.options.interval !== 1) {
				this.add(this.options.interval.toString()).add(gettext("months"));
				if (this.plural(this.options.interval)) this.add(gettext("in"));
			}
			this._bymonth();
		} else {
			if (this.options.interval !== 1) this.add(this.options.interval.toString());
			this.add(this.plural(this.options.interval) ? gettext("months") : gettext("month"));
		}
		if (this.bymonthday) this._bymonthday();
		else if (this.byweekday && this.byweekday.isWeekdays) this.add(gettext("on")).add(gettext("weekdays"));
		else if (this.byweekday) this._byweekday();
	};
	ToText.prototype.YEARLY = function() {
		var gettext = this.gettext;
		if (this.origOptions.bymonth) {
			if (this.options.interval !== 1) {
				this.add(this.options.interval.toString());
				this.add(gettext("years"));
			}
			this._bymonth();
		} else {
			if (this.options.interval !== 1) this.add(this.options.interval.toString());
			this.add(this.plural(this.options.interval) ? gettext("years") : gettext("year"));
		}
		if (this.bymonthday) this._bymonthday();
		else if (this.byweekday) this._byweekday();
		if (this.options.byyearday) this.add(gettext("on the")).add(this.list(this.options.byyearday, this.nth, gettext("and"))).add(gettext("day"));
		if (this.options.byweekno) this.add(gettext("in")).add(this.plural(this.options.byweekno.length) ? gettext("weeks") : gettext("week")).add(this.list(this.options.byweekno, void 0, gettext("and")));
	};
	ToText.prototype._bymonthday = function() {
		var gettext = this.gettext;
		if (this.byweekday && this.byweekday.allWeeks) this.add(gettext("on")).add(this.list(this.byweekday.allWeeks, this.weekdaytext, gettext("or"))).add(gettext("the")).add(this.list(this.bymonthday, this.nth, gettext("or")));
		else this.add(gettext("on the")).add(this.list(this.bymonthday, this.nth, gettext("and")));
	};
	ToText.prototype._byweekday = function() {
		var gettext = this.gettext;
		if (this.byweekday.allWeeks && !this.byweekday.isWeekdays) this.add(gettext("on")).add(this.list(this.byweekday.allWeeks, this.weekdaytext));
		if (this.byweekday.someWeeks) {
			if (this.byweekday.allWeeks) this.add(gettext("and"));
			this.add(gettext("on the")).add(this.list(this.byweekday.someWeeks, this.weekdaytext, gettext("and")));
		}
	};
	ToText.prototype._byhour = function() {
		var gettext = this.gettext;
		this.add(gettext("at")).add(this.list(this.origOptions.byhour, void 0, gettext("and")));
	};
	ToText.prototype._bymonth = function() {
		this.add(this.list(this.options.bymonth, this.monthtext, this.gettext("and")));
	};
	ToText.prototype.nth = function(n) {
		n = parseInt(n.toString(), 10);
		var nth;
		var gettext = this.gettext;
		if (n === -1) return gettext("last");
		var npos = Math.abs(n);
		switch (npos) {
			case 1:
			case 21:
			case 31:
				nth = npos + gettext("st");
				break;
			case 2:
			case 22:
				nth = npos + gettext("nd");
				break;
			case 3:
			case 23:
				nth = npos + gettext("rd");
				break;
			default: nth = npos + gettext("th");
		}
		return n < 0 ? nth + " " + gettext("last") : nth;
	};
	ToText.prototype.monthtext = function(m) {
		return this.language.monthNames[m - 1];
	};
	ToText.prototype.weekdaytext = function(wday) {
		var weekday = isNumber(wday) ? (wday + 1) % 7 : wday.getJsWeekday();
		return (wday.n ? this.nth(wday.n) + " " : "") + this.language.dayNames[weekday];
	};
	ToText.prototype.plural = function(n) {
		return n % 100 !== 1;
	};
	ToText.prototype.add = function(s) {
		this.text.push(" ");
		this.text.push(s);
		return this;
	};
	ToText.prototype.list = function(arr, callback, finalDelim, delim) {
		var _this = this;
		if (delim === void 0) delim = ",";
		if (!isArray(arr)) arr = [arr];
		var delimJoin = function(array, delimiter, finalDelimiter) {
			var list = "";
			for (var i = 0; i < array.length; i++) {
				if (i !== 0) if (i === array.length - 1) list += " " + finalDelimiter + " ";
				else list += delimiter + " ";
				list += array[i];
			}
			return list;
		};
		callback = callback || function(o) {
			return o.toString();
		};
		var realCallback = function(arg) {
			return callback && callback.call(_this, arg);
		};
		if (finalDelim) return delimJoin(arr.map(realCallback), delim, finalDelim);
		else return arr.map(realCallback).join(delim + " ");
	};
	return ToText;
}();
//#endregion
//#region node_modules/rrule/dist/esm/nlp/parsetext.js
var Parser = function() {
	function Parser(rules) {
		this.done = true;
		this.rules = rules;
	}
	Parser.prototype.start = function(text) {
		this.text = text;
		this.done = false;
		return this.nextSymbol();
	};
	Parser.prototype.isDone = function() {
		return this.done && this.symbol === null;
	};
	Parser.prototype.nextSymbol = function() {
		var best;
		var bestSymbol;
		this.symbol = null;
		this.value = null;
		do {
			if (this.done) return false;
			var rule = void 0;
			best = null;
			for (var name_1 in this.rules) {
				rule = this.rules[name_1];
				var match = rule.exec(this.text);
				if (match) {
					if (best === null || match[0].length > best[0].length) {
						best = match;
						bestSymbol = name_1;
					}
				}
			}
			if (best != null) {
				this.text = this.text.substr(best[0].length);
				if (this.text === "") this.done = true;
			}
			if (best == null) {
				this.done = true;
				this.symbol = null;
				this.value = null;
				return;
			}
		} while (bestSymbol === "SKIP");
		this.symbol = bestSymbol;
		this.value = best;
		return true;
	};
	Parser.prototype.accept = function(name) {
		if (this.symbol === name) {
			if (this.value) {
				var v = this.value;
				this.nextSymbol();
				return v;
			}
			this.nextSymbol();
			return true;
		}
		return false;
	};
	Parser.prototype.acceptNumber = function() {
		return this.accept("number");
	};
	Parser.prototype.expect = function(name) {
		if (this.accept(name)) return true;
		throw new Error("expected " + name + " but found " + this.symbol);
	};
	return Parser;
}();
function parseText(text, language) {
	if (language === void 0) language = ENGLISH;
	var options = {};
	var ttr = new Parser(language.tokens);
	if (!ttr.start(text)) return null;
	S();
	return options;
	function S() {
		ttr.expect("every");
		var n = ttr.acceptNumber();
		if (n) options.interval = parseInt(n[0], 10);
		if (ttr.isDone()) throw new Error("Unexpected end");
		switch (ttr.symbol) {
			case "day(s)":
				options.freq = RRule$1.DAILY;
				if (ttr.nextSymbol()) {
					AT();
					F();
				}
				break;
			case "weekday(s)":
				options.freq = RRule$1.WEEKLY;
				options.byweekday = [
					RRule$1.MO,
					RRule$1.TU,
					RRule$1.WE,
					RRule$1.TH,
					RRule$1.FR
				];
				ttr.nextSymbol();
				AT();
				F();
				break;
			case "week(s)":
				options.freq = RRule$1.WEEKLY;
				if (ttr.nextSymbol()) {
					ON();
					AT();
					F();
				}
				break;
			case "hour(s)":
				options.freq = RRule$1.HOURLY;
				if (ttr.nextSymbol()) {
					ON();
					F();
				}
				break;
			case "minute(s)":
				options.freq = RRule$1.MINUTELY;
				if (ttr.nextSymbol()) {
					ON();
					F();
				}
				break;
			case "month(s)":
				options.freq = RRule$1.MONTHLY;
				if (ttr.nextSymbol()) {
					ON();
					F();
				}
				break;
			case "year(s)":
				options.freq = RRule$1.YEARLY;
				if (ttr.nextSymbol()) {
					ON();
					F();
				}
				break;
			case "monday":
			case "tuesday":
			case "wednesday":
			case "thursday":
			case "friday":
			case "saturday":
			case "sunday":
				options.freq = RRule$1.WEEKLY;
				options.byweekday = [RRule$1[ttr.symbol.substr(0, 2).toUpperCase()]];
				if (!ttr.nextSymbol()) return;
				while (ttr.accept("comma")) {
					if (ttr.isDone()) throw new Error("Unexpected end");
					var wkd = decodeWKD();
					if (!wkd) throw new Error("Unexpected symbol " + ttr.symbol + ", expected weekday");
					options.byweekday.push(RRule$1[wkd]);
					ttr.nextSymbol();
				}
				AT();
				MDAYs();
				F();
				break;
			case "january":
			case "february":
			case "march":
			case "april":
			case "may":
			case "june":
			case "july":
			case "august":
			case "september":
			case "october":
			case "november":
			case "december":
				options.freq = RRule$1.YEARLY;
				options.bymonth = [decodeM()];
				if (!ttr.nextSymbol()) return;
				while (ttr.accept("comma")) {
					if (ttr.isDone()) throw new Error("Unexpected end");
					var m = decodeM();
					if (!m) throw new Error("Unexpected symbol " + ttr.symbol + ", expected month");
					options.bymonth.push(m);
					ttr.nextSymbol();
				}
				ON();
				F();
				break;
			default: throw new Error("Unknown symbol");
		}
	}
	function ON() {
		var on = ttr.accept("on");
		var the = ttr.accept("the");
		if (!(on || the)) return;
		do {
			var nth = decodeNTH();
			var wkd = decodeWKD();
			var m = decodeM();
			if (nth) if (wkd) {
				ttr.nextSymbol();
				if (!options.byweekday) options.byweekday = [];
				options.byweekday.push(RRule$1[wkd].nth(nth));
			} else {
				if (!options.bymonthday) options.bymonthday = [];
				options.bymonthday.push(nth);
				ttr.accept("day(s)");
			}
			else if (wkd) {
				ttr.nextSymbol();
				if (!options.byweekday) options.byweekday = [];
				options.byweekday.push(RRule$1[wkd]);
			} else if (ttr.symbol === "weekday(s)") {
				ttr.nextSymbol();
				if (!options.byweekday) options.byweekday = [
					RRule$1.MO,
					RRule$1.TU,
					RRule$1.WE,
					RRule$1.TH,
					RRule$1.FR
				];
			} else if (ttr.symbol === "week(s)") {
				ttr.nextSymbol();
				var n = ttr.acceptNumber();
				if (!n) throw new Error("Unexpected symbol " + ttr.symbol + ", expected week number");
				options.byweekno = [parseInt(n[0], 10)];
				while (ttr.accept("comma")) {
					n = ttr.acceptNumber();
					if (!n) throw new Error("Unexpected symbol " + ttr.symbol + "; expected monthday");
					options.byweekno.push(parseInt(n[0], 10));
				}
			} else if (m) {
				ttr.nextSymbol();
				if (!options.bymonth) options.bymonth = [];
				options.bymonth.push(m);
			} else return;
		} while (ttr.accept("comma") || ttr.accept("the") || ttr.accept("on"));
	}
	function AT() {
		if (!ttr.accept("at")) return;
		do {
			var n = ttr.acceptNumber();
			if (!n) throw new Error("Unexpected symbol " + ttr.symbol + ", expected hour");
			options.byhour = [parseInt(n[0], 10)];
			while (ttr.accept("comma")) {
				n = ttr.acceptNumber();
				if (!n) throw new Error("Unexpected symbol " + ttr.symbol + "; expected hour");
				options.byhour.push(parseInt(n[0], 10));
			}
		} while (ttr.accept("comma") || ttr.accept("at"));
	}
	function decodeM() {
		switch (ttr.symbol) {
			case "january": return 1;
			case "february": return 2;
			case "march": return 3;
			case "april": return 4;
			case "may": return 5;
			case "june": return 6;
			case "july": return 7;
			case "august": return 8;
			case "september": return 9;
			case "october": return 10;
			case "november": return 11;
			case "december": return 12;
			default: return false;
		}
	}
	function decodeWKD() {
		switch (ttr.symbol) {
			case "monday":
			case "tuesday":
			case "wednesday":
			case "thursday":
			case "friday":
			case "saturday":
			case "sunday": return ttr.symbol.substr(0, 2).toUpperCase();
			default: return false;
		}
	}
	function decodeNTH() {
		switch (ttr.symbol) {
			case "last":
				ttr.nextSymbol();
				return -1;
			case "first":
				ttr.nextSymbol();
				return 1;
			case "second":
				ttr.nextSymbol();
				return ttr.accept("last") ? -2 : 2;
			case "third":
				ttr.nextSymbol();
				return ttr.accept("last") ? -3 : 3;
			case "nth":
				var v = parseInt(ttr.value[1], 10);
				if (v < -366 || v > 366) throw new Error("Nth out of range: " + v);
				ttr.nextSymbol();
				return ttr.accept("last") ? -v : v;
			default: return false;
		}
	}
	function MDAYs() {
		ttr.accept("on");
		ttr.accept("the");
		var nth = decodeNTH();
		if (!nth) return;
		options.bymonthday = [nth];
		ttr.nextSymbol();
		while (ttr.accept("comma")) {
			nth = decodeNTH();
			if (!nth) throw new Error("Unexpected symbol " + ttr.symbol + "; expected monthday");
			options.bymonthday.push(nth);
			ttr.nextSymbol();
		}
	}
	function F() {
		if (ttr.symbol === "until") {
			var date = Date.parse(ttr.text);
			if (!date) throw new Error("Cannot parse until date:" + ttr.text);
			options.until = new Date(date);
		} else if (ttr.accept("for")) {
			options.count = parseInt(ttr.value[0], 10);
			ttr.expect("number");
		}
	}
}
//#endregion
//#region node_modules/rrule/dist/esm/types.js
var Frequency;
(function(Frequency) {
	Frequency[Frequency["YEARLY"] = 0] = "YEARLY";
	Frequency[Frequency["MONTHLY"] = 1] = "MONTHLY";
	Frequency[Frequency["WEEKLY"] = 2] = "WEEKLY";
	Frequency[Frequency["DAILY"] = 3] = "DAILY";
	Frequency[Frequency["HOURLY"] = 4] = "HOURLY";
	Frequency[Frequency["MINUTELY"] = 5] = "MINUTELY";
	Frequency[Frequency["SECONDLY"] = 6] = "SECONDLY";
})(Frequency || (Frequency = {}));
function freqIsDailyOrGreater(freq) {
	return freq < Frequency.HOURLY;
}
//#endregion
//#region node_modules/rrule/dist/esm/nlp/index.js
/**
*
* Implementation of RRule.fromText() and RRule::toText().
*
*
* On the client side, this file needs to be included
* when those functions are used.
*
*/
/**
* Will be able to convert some of the below described rules from
* text format to a rule object.
*
*
* RULES
*
* Every ([n])
* day(s)
* | [weekday], ..., (and) [weekday]
* | weekday(s)
* | week(s)
* | month(s)
* | [month], ..., (and) [month]
* | year(s)
*
*
* Plus 0, 1, or multiple of these:
*
* on [weekday], ..., (or) [weekday] the [monthday], [monthday], ... (or) [monthday]
*
* on [weekday], ..., (and) [weekday]
*
* on the [monthday], [monthday], ... (and) [monthday] (day of the month)
*
* on the [nth-weekday], ..., (and) [nth-weekday] (of the month/year)
*
*
* Plus 0 or 1 of these:
*
* for [n] time(s)
*
* until [date]
*
* Plus (.)
*
*
* Definitely no supported for parsing:
*
* (for year):
* in week(s) [n], ..., (and) [n]
*
* on the [yearday], ..., (and) [n] day of the year
* on day [yearday], ..., (and) [n]
*
*
* NON-TERMINALS
*
* [n]: 1, 2 ..., one, two, three ..
* [month]: January, February, March, April, May, ... December
* [weekday]: Monday, ... Sunday
* [nth-weekday]: first [weekday], 2nd [weekday], ... last [weekday], ...
* [monthday]: first, 1., 2., 1st, 2nd, second, ... 31st, last day, 2nd last day, ..
* [date]:
* - [month] (0-31(,) ([year])),
* - (the) 0-31.(1-12.([year])),
* - (the) 0-31/(1-12/([year])),
* - [weekday]
*
* [year]: 0000, 0001, ... 01, 02, ..
*
* Definitely not supported for parsing:
*
* [yearday]: first, 1., 2., 1st, 2nd, second, ... 366th, last day, 2nd last day, ..
*
* @param {String} text
* @return {Object, Boolean} the rule, or null.
*/
var fromText = function(text, language) {
	if (language === void 0) language = ENGLISH;
	return new RRule$1(parseText(text, language) || void 0);
};
var common = [
	"count",
	"until",
	"interval",
	"byweekday",
	"bymonthday",
	"bymonth"
];
ToText.IMPLEMENTED = [];
ToText.IMPLEMENTED[Frequency.HOURLY] = common;
ToText.IMPLEMENTED[Frequency.MINUTELY] = common;
ToText.IMPLEMENTED[Frequency.DAILY] = ["byhour"].concat(common);
ToText.IMPLEMENTED[Frequency.WEEKLY] = common;
ToText.IMPLEMENTED[Frequency.MONTHLY] = common;
ToText.IMPLEMENTED[Frequency.YEARLY] = ["byweekno", "byyearday"].concat(common);
var toText = function(rrule, gettext, language, dateFormatter) {
	return new ToText(rrule, gettext, language, dateFormatter).toString();
};
var isFullyConvertible = ToText.isFullyConvertible;
//#endregion
//#region node_modules/rrule/dist/esm/datetime.js
var Time = function() {
	function Time(hour, minute, second, millisecond) {
		this.hour = hour;
		this.minute = minute;
		this.second = second;
		this.millisecond = millisecond || 0;
	}
	Time.prototype.getHours = function() {
		return this.hour;
	};
	Time.prototype.getMinutes = function() {
		return this.minute;
	};
	Time.prototype.getSeconds = function() {
		return this.second;
	};
	Time.prototype.getMilliseconds = function() {
		return this.millisecond;
	};
	Time.prototype.getTime = function() {
		return (this.hour * 60 * 60 + this.minute * 60 + this.second) * 1e3 + this.millisecond;
	};
	return Time;
}();
var DateTime = function(_super) {
	__extends(DateTime, _super);
	function DateTime(year, month, day, hour, minute, second, millisecond) {
		var _this = _super.call(this, hour, minute, second, millisecond) || this;
		_this.year = year;
		_this.month = month;
		_this.day = day;
		return _this;
	}
	DateTime.fromDate = function(date) {
		return new this(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.valueOf() % 1e3);
	};
	DateTime.prototype.getWeekday = function() {
		return getWeekday(new Date(this.getTime()));
	};
	DateTime.prototype.getTime = function() {
		return new Date(Date.UTC(this.year, this.month - 1, this.day, this.hour, this.minute, this.second, this.millisecond)).getTime();
	};
	DateTime.prototype.getDay = function() {
		return this.day;
	};
	DateTime.prototype.getMonth = function() {
		return this.month;
	};
	DateTime.prototype.getYear = function() {
		return this.year;
	};
	DateTime.prototype.addYears = function(years) {
		this.year += years;
	};
	DateTime.prototype.addMonths = function(months) {
		this.month += months;
		if (this.month > 12) {
			var yearDiv = Math.floor(this.month / 12);
			var monthMod = pymod(this.month, 12);
			this.month = monthMod;
			this.year += yearDiv;
			if (this.month === 0) {
				this.month = 12;
				--this.year;
			}
		}
	};
	DateTime.prototype.addWeekly = function(days, wkst) {
		if (wkst > this.getWeekday()) this.day += -(this.getWeekday() + 1 + (6 - wkst)) + days * 7;
		else this.day += -(this.getWeekday() - wkst) + days * 7;
		this.fixDay();
	};
	DateTime.prototype.addDaily = function(days) {
		this.day += days;
		this.fixDay();
	};
	DateTime.prototype.addHours = function(hours, filtered, byhour) {
		if (filtered) this.hour += Math.floor((23 - this.hour) / hours) * hours;
		for (;;) {
			this.hour += hours;
			var _a = divmod(this.hour, 24), dayDiv = _a.div, hourMod = _a.mod;
			if (dayDiv) {
				this.hour = hourMod;
				this.addDaily(dayDiv);
			}
			if (empty(byhour) || includes(byhour, this.hour)) break;
		}
	};
	DateTime.prototype.addMinutes = function(minutes, filtered, byhour, byminute) {
		if (filtered) this.minute += Math.floor((1439 - (this.hour * 60 + this.minute)) / minutes) * minutes;
		for (;;) {
			this.minute += minutes;
			var _a = divmod(this.minute, 60), hourDiv = _a.div, minuteMod = _a.mod;
			if (hourDiv) {
				this.minute = minuteMod;
				this.addHours(hourDiv, false, byhour);
			}
			if ((empty(byhour) || includes(byhour, this.hour)) && (empty(byminute) || includes(byminute, this.minute))) break;
		}
	};
	DateTime.prototype.addSeconds = function(seconds, filtered, byhour, byminute, bysecond) {
		if (filtered) this.second += Math.floor((86399 - (this.hour * 3600 + this.minute * 60 + this.second)) / seconds) * seconds;
		for (;;) {
			this.second += seconds;
			var _a = divmod(this.second, 60), minuteDiv = _a.div, secondMod = _a.mod;
			if (minuteDiv) {
				this.second = secondMod;
				this.addMinutes(minuteDiv, false, byhour, byminute);
			}
			if ((empty(byhour) || includes(byhour, this.hour)) && (empty(byminute) || includes(byminute, this.minute)) && (empty(bysecond) || includes(bysecond, this.second))) break;
		}
	};
	DateTime.prototype.fixDay = function() {
		if (this.day <= 28) return;
		var daysinmonth = monthRange(this.year, this.month - 1)[1];
		if (this.day <= daysinmonth) return;
		while (this.day > daysinmonth) {
			this.day -= daysinmonth;
			++this.month;
			if (this.month === 13) {
				this.month = 1;
				++this.year;
				if (this.year > 9999) return;
			}
			daysinmonth = monthRange(this.year, this.month - 1)[1];
		}
	};
	DateTime.prototype.add = function(options, filtered) {
		var freq = options.freq, interval = options.interval, wkst = options.wkst, byhour = options.byhour, byminute = options.byminute, bysecond = options.bysecond;
		switch (freq) {
			case Frequency.YEARLY: return this.addYears(interval);
			case Frequency.MONTHLY: return this.addMonths(interval);
			case Frequency.WEEKLY: return this.addWeekly(interval, wkst);
			case Frequency.DAILY: return this.addDaily(interval);
			case Frequency.HOURLY: return this.addHours(interval, filtered, byhour);
			case Frequency.MINUTELY: return this.addMinutes(interval, filtered, byhour, byminute);
			case Frequency.SECONDLY: return this.addSeconds(interval, filtered, byhour, byminute, bysecond);
		}
	};
	return DateTime;
}(Time);
//#endregion
//#region node_modules/rrule/dist/esm/parseoptions.js
function initializeOptions$1(options) {
	var invalid = [];
	var keys = Object.keys(options);
	for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
		var key = keys_1[_i];
		if (!includes(defaultKeys, key)) invalid.push(key);
		if (isDate(options[key]) && !isValidDate(options[key])) invalid.push(key);
	}
	if (invalid.length) throw new Error("Invalid options: " + invalid.join(", "));
	return __assign({}, options);
}
function parseOptions(options) {
	var opts = __assign(__assign({}, DEFAULT_OPTIONS$1), initializeOptions$1(options));
	if (isPresent(opts.byeaster)) opts.freq = RRule$1.YEARLY;
	if (!(isPresent(opts.freq) && RRule$1.FREQUENCIES[opts.freq])) throw new Error("Invalid frequency: ".concat(opts.freq, " ").concat(options.freq));
	if (!opts.dtstart) opts.dtstart = new Date((/* @__PURE__ */ new Date()).setMilliseconds(0));
	if (!isPresent(opts.wkst)) opts.wkst = RRule$1.MO.weekday;
	else if (isNumber(opts.wkst)) {} else opts.wkst = opts.wkst.weekday;
	if (isPresent(opts.bysetpos)) {
		if (isNumber(opts.bysetpos)) opts.bysetpos = [opts.bysetpos];
		for (var i = 0; i < opts.bysetpos.length; i++) {
			var v = opts.bysetpos[i];
			if (v === 0 || !(v >= -366 && v <= 366)) throw new Error("bysetpos must be between 1 and 366, or between -366 and -1");
		}
	}
	if (!(Boolean(opts.byweekno) || notEmpty(opts.byweekno) || notEmpty(opts.byyearday) || Boolean(opts.bymonthday) || notEmpty(opts.bymonthday) || isPresent(opts.byweekday) || isPresent(opts.byeaster))) switch (opts.freq) {
		case RRule$1.YEARLY:
			if (!opts.bymonth) opts.bymonth = opts.dtstart.getUTCMonth() + 1;
			opts.bymonthday = opts.dtstart.getUTCDate();
			break;
		case RRule$1.MONTHLY:
			opts.bymonthday = opts.dtstart.getUTCDate();
			break;
		case RRule$1.WEEKLY:
			opts.byweekday = [getWeekday(opts.dtstart)];
			break;
	}
	if (isPresent(opts.bymonth) && !isArray(opts.bymonth)) opts.bymonth = [opts.bymonth];
	if (isPresent(opts.byyearday) && !isArray(opts.byyearday) && isNumber(opts.byyearday)) opts.byyearday = [opts.byyearday];
	if (!isPresent(opts.bymonthday)) {
		opts.bymonthday = [];
		opts.bynmonthday = [];
	} else if (isArray(opts.bymonthday)) {
		var bymonthday = [];
		var bynmonthday = [];
		for (var i = 0; i < opts.bymonthday.length; i++) {
			var v = opts.bymonthday[i];
			if (v > 0) bymonthday.push(v);
			else if (v < 0) bynmonthday.push(v);
		}
		opts.bymonthday = bymonthday;
		opts.bynmonthday = bynmonthday;
	} else if (opts.bymonthday < 0) {
		opts.bynmonthday = [opts.bymonthday];
		opts.bymonthday = [];
	} else {
		opts.bynmonthday = [];
		opts.bymonthday = [opts.bymonthday];
	}
	if (isPresent(opts.byweekno) && !isArray(opts.byweekno)) opts.byweekno = [opts.byweekno];
	if (!isPresent(opts.byweekday)) opts.bynweekday = null;
	else if (isNumber(opts.byweekday)) {
		opts.byweekday = [opts.byweekday];
		opts.bynweekday = null;
	} else if (isWeekdayStr(opts.byweekday)) {
		opts.byweekday = [Weekday.fromStr(opts.byweekday).weekday];
		opts.bynweekday = null;
	} else if (opts.byweekday instanceof Weekday) if (!opts.byweekday.n || opts.freq > RRule$1.MONTHLY) {
		opts.byweekday = [opts.byweekday.weekday];
		opts.bynweekday = null;
	} else {
		opts.bynweekday = [[opts.byweekday.weekday, opts.byweekday.n]];
		opts.byweekday = null;
	}
	else {
		var byweekday = [];
		var bynweekday = [];
		for (var i = 0; i < opts.byweekday.length; i++) {
			var wday = opts.byweekday[i];
			if (isNumber(wday)) {
				byweekday.push(wday);
				continue;
			} else if (isWeekdayStr(wday)) {
				byweekday.push(Weekday.fromStr(wday).weekday);
				continue;
			}
			if (!wday.n || opts.freq > RRule$1.MONTHLY) byweekday.push(wday.weekday);
			else bynweekday.push([wday.weekday, wday.n]);
		}
		opts.byweekday = notEmpty(byweekday) ? byweekday : null;
		opts.bynweekday = notEmpty(bynweekday) ? bynweekday : null;
	}
	if (!isPresent(opts.byhour)) opts.byhour = opts.freq < RRule$1.HOURLY ? [opts.dtstart.getUTCHours()] : null;
	else if (isNumber(opts.byhour)) opts.byhour = [opts.byhour];
	if (!isPresent(opts.byminute)) opts.byminute = opts.freq < RRule$1.MINUTELY ? [opts.dtstart.getUTCMinutes()] : null;
	else if (isNumber(opts.byminute)) opts.byminute = [opts.byminute];
	if (!isPresent(opts.bysecond)) opts.bysecond = opts.freq < RRule$1.SECONDLY ? [opts.dtstart.getUTCSeconds()] : null;
	else if (isNumber(opts.bysecond)) opts.bysecond = [opts.bysecond];
	return { parsedOptions: opts };
}
function buildTimeset(opts) {
	var millisecondModulo = opts.dtstart.getTime() % 1e3;
	if (!freqIsDailyOrGreater(opts.freq)) return [];
	var timeset = [];
	opts.byhour.forEach(function(hour) {
		opts.byminute.forEach(function(minute) {
			opts.bysecond.forEach(function(second) {
				timeset.push(new Time(hour, minute, second, millisecondModulo));
			});
		});
	});
	return timeset;
}
//#endregion
//#region node_modules/rrule/dist/esm/parsestring.js
function parseString(rfcString) {
	var options = rfcString.split("\n").map(parseLine).filter(function(x) {
		return x !== null;
	});
	return __assign(__assign({}, options[0]), options[1]);
}
function parseDtstart(line) {
	var options = {};
	var dtstartWithZone = /DTSTART(?:;TZID=([^:=]+?))?(?::|=)([^;\s]+)/i.exec(line);
	if (!dtstartWithZone) return options;
	var tzid = dtstartWithZone[1], dtstart = dtstartWithZone[2];
	if (tzid) options.tzid = tzid;
	options.dtstart = untilStringToDate(dtstart);
	return options;
}
function parseLine(rfcString) {
	rfcString = rfcString.replace(/^\s+|\s+$/, "");
	if (!rfcString.length) return null;
	var header = /^([A-Z]+?)[:;]/.exec(rfcString.toUpperCase());
	if (!header) return parseRrule(rfcString);
	var key = header[1];
	switch (key.toUpperCase()) {
		case "RRULE":
		case "EXRULE": return parseRrule(rfcString);
		case "DTSTART": return parseDtstart(rfcString);
		default: throw new Error("Unsupported RFC prop ".concat(key, " in ").concat(rfcString));
	}
}
function parseRrule(line) {
	var options = parseDtstart(line.replace(/^RRULE:/i, ""));
	line.replace(/^(?:RRULE|EXRULE):/i, "").split(";").forEach(function(attr) {
		var _a = attr.split("="), key = _a[0], value = _a[1];
		switch (key.toUpperCase()) {
			case "FREQ":
				options.freq = Frequency[value.toUpperCase()];
				break;
			case "WKST":
				options.wkst = Days[value.toUpperCase()];
				break;
			case "COUNT":
			case "INTERVAL":
			case "BYSETPOS":
			case "BYMONTH":
			case "BYMONTHDAY":
			case "BYYEARDAY":
			case "BYWEEKNO":
			case "BYHOUR":
			case "BYMINUTE":
			case "BYSECOND":
				var num = parseNumber(value);
				var optionKey = key.toLowerCase();
				options[optionKey] = num;
				break;
			case "BYWEEKDAY":
			case "BYDAY":
				options.byweekday = parseWeekday(value);
				break;
			case "DTSTART":
			case "TZID":
				var dtstart = parseDtstart(line);
				options.tzid = dtstart.tzid;
				options.dtstart = dtstart.dtstart;
				break;
			case "UNTIL":
				options.until = untilStringToDate(value);
				break;
			case "BYEASTER":
				options.byeaster = Number(value);
				break;
			default: throw new Error("Unknown RRULE property '" + key + "'");
		}
	});
	return options;
}
function parseNumber(value) {
	if (value.indexOf(",") !== -1) return value.split(",").map(parseIndividualNumber);
	return parseIndividualNumber(value);
}
function parseIndividualNumber(value) {
	if (/^[+-]?\d+$/.test(value)) return Number(value);
	return value;
}
function parseWeekday(value) {
	return value.split(",").map(function(day) {
		if (day.length === 2) return Days[day];
		var parts = day.match(/^([+-]?\d{1,2})([A-Z]{2})$/);
		if (!parts || parts.length < 3) throw new SyntaxError("Invalid weekday string: ".concat(day));
		var n = Number(parts[1]);
		var wday = Days[parts[2]].weekday;
		return new Weekday(wday, n);
	});
}
//#endregion
//#region node_modules/rrule/dist/esm/datewithzone.js
var DateWithZone = function() {
	function DateWithZone(date, tzid) {
		if (isNaN(date.getTime())) throw new RangeError("Invalid date passed to DateWithZone");
		this.date = date;
		this.tzid = tzid;
	}
	Object.defineProperty(DateWithZone.prototype, "isUTC", {
		get: function() {
			return !this.tzid || this.tzid.toUpperCase() === "UTC";
		},
		enumerable: false,
		configurable: true
	});
	DateWithZone.prototype.toString = function() {
		var datestr = timeToUntilString(this.date.getTime(), this.isUTC);
		if (!this.isUTC) return ";TZID=".concat(this.tzid, ":").concat(datestr);
		return ":".concat(datestr);
	};
	DateWithZone.prototype.getTime = function() {
		return this.date.getTime();
	};
	DateWithZone.prototype.rezonedDate = function() {
		if (this.isUTC) return this.date;
		return dateInTimeZone(this.date, this.tzid);
	};
	return DateWithZone;
}();
//#endregion
//#region node_modules/rrule/dist/esm/optionstostring.js
function optionsToString(options) {
	var rrule = [];
	var dtstart = "";
	var keys = Object.keys(options);
	var defaultKeys = Object.keys(DEFAULT_OPTIONS$1);
	for (var i = 0; i < keys.length; i++) {
		if (keys[i] === "tzid") continue;
		if (!includes(defaultKeys, keys[i])) continue;
		var key = keys[i].toUpperCase();
		var value = options[keys[i]];
		var outValue = "";
		if (!isPresent(value) || isArray(value) && !value.length) continue;
		switch (key) {
			case "FREQ":
				outValue = RRule$1.FREQUENCIES[options.freq];
				break;
			case "WKST":
				if (isNumber(value)) outValue = new Weekday(value).toString();
				else outValue = value.toString();
				break;
			case "BYWEEKDAY":
				key = "BYDAY";
				outValue = toArray(value).map(function(wday) {
					if (wday instanceof Weekday) return wday;
					if (isArray(wday)) return new Weekday(wday[0], wday[1]);
					return new Weekday(wday);
				}).toString();
				break;
			case "DTSTART":
				dtstart = buildDtstart(value, options.tzid);
				break;
			case "UNTIL":
				outValue = timeToUntilString(value, !options.tzid);
				break;
			default: if (isArray(value)) {
				var strValues = [];
				for (var j = 0; j < value.length; j++) strValues[j] = String(value[j]);
				outValue = strValues.toString();
			} else outValue = String(value);
		}
		if (outValue) rrule.push([key, outValue]);
	}
	var rules = rrule.map(function(_a) {
		var key = _a[0], value = _a[1];
		return "".concat(key, "=").concat(value.toString());
	}).join(";");
	var ruleString = "";
	if (rules !== "") ruleString = "RRULE:".concat(rules);
	return [dtstart, ruleString].filter(function(x) {
		return !!x;
	}).join("\n");
}
function buildDtstart(dtstart, tzid) {
	if (!dtstart) return "";
	return "DTSTART" + new DateWithZone(new Date(dtstart), tzid).toString();
}
//#endregion
//#region node_modules/rrule/dist/esm/cache.js
function argsMatch(left, right) {
	if (Array.isArray(left)) {
		if (!Array.isArray(right)) return false;
		if (left.length !== right.length) return false;
		return left.every(function(date, i) {
			return date.getTime() === right[i].getTime();
		});
	}
	if (left instanceof Date) return right instanceof Date && left.getTime() === right.getTime();
	return left === right;
}
var Cache = function() {
	function Cache() {
		this.all = false;
		this.before = [];
		this.after = [];
		this.between = [];
	}
	/**
	* @param {String} what - all/before/after/between
	* @param {Array,Date} value - an array of dates, one date, or null
	* @param {Object?} args - _iter arguments
	*/
	Cache.prototype._cacheAdd = function(what, value, args) {
		if (value) value = value instanceof Date ? clone(value) : cloneDates(value);
		if (what === "all") this.all = value;
		else {
			args._value = value;
			this[what].push(args);
		}
	};
	/**
	* @return false - not in the cache
	* @return null  - cached, but zero occurrences (before/after)
	* @return Date  - cached (before/after)
	* @return []    - cached, but zero occurrences (all/between)
	* @return [Date1, DateN] - cached (all/between)
	*/
	Cache.prototype._cacheGet = function(what, args) {
		var cached = false;
		var argsKeys = args ? Object.keys(args) : [];
		var findCacheDiff = function(item) {
			for (var i = 0; i < argsKeys.length; i++) {
				var key = argsKeys[i];
				if (!argsMatch(args[key], item[key])) return true;
			}
			return false;
		};
		var cachedObject = this[what];
		if (what === "all") cached = this.all;
		else if (isArray(cachedObject)) for (var i = 0; i < cachedObject.length; i++) {
			var item = cachedObject[i];
			if (argsKeys.length && findCacheDiff(item)) continue;
			cached = item._value;
			break;
		}
		if (!cached && this.all) {
			var iterResult = new IterResult(what, args);
			for (var i = 0; i < this.all.length; i++) if (!iterResult.accept(this.all[i])) break;
			cached = iterResult.getValue();
			this._cacheAdd(what, cached, args);
		}
		return isArray(cached) ? cloneDates(cached) : cached instanceof Date ? clone(cached) : cached;
	};
	return Cache;
}();
//#endregion
//#region node_modules/rrule/dist/esm/masks.js
var M365MASK = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], repeat(1, 31), true), repeat(2, 28), true), repeat(3, 31), true), repeat(4, 30), true), repeat(5, 31), true), repeat(6, 30), true), repeat(7, 31), true), repeat(8, 31), true), repeat(9, 30), true), repeat(10, 31), true), repeat(11, 30), true), repeat(12, 31), true), repeat(1, 7), true);
var M366MASK = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], repeat(1, 31), true), repeat(2, 29), true), repeat(3, 31), true), repeat(4, 30), true), repeat(5, 31), true), repeat(6, 30), true), repeat(7, 31), true), repeat(8, 31), true), repeat(9, 30), true), repeat(10, 31), true), repeat(11, 30), true), repeat(12, 31), true), repeat(1, 7), true);
var M28 = range(1, 29);
var M29 = range(1, 30);
var M30 = range(1, 31);
var M31 = range(1, 32);
var MDAY366MASK = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], M31, true), M29, true), M31, true), M30, true), M31, true), M30, true), M31, true), M31, true), M30, true), M31, true), M30, true), M31, true), M31.slice(0, 7), true);
var MDAY365MASK = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], M31, true), M28, true), M31, true), M30, true), M31, true), M30, true), M31, true), M31, true), M30, true), M31, true), M30, true), M31, true), M31.slice(0, 7), true);
var NM28 = range(-28, 0);
var NM29 = range(-29, 0);
var NM30 = range(-30, 0);
var NM31 = range(-31, 0);
var NMDAY366MASK = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], NM31, true), NM29, true), NM31, true), NM30, true), NM31, true), NM30, true), NM31, true), NM31, true), NM30, true), NM31, true), NM30, true), NM31, true), NM31.slice(0, 7), true);
var NMDAY365MASK = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], NM31, true), NM28, true), NM31, true), NM30, true), NM31, true), NM30, true), NM31, true), NM31, true), NM30, true), NM31, true), NM30, true), NM31, true), NM31.slice(0, 7), true);
var M366RANGE = [
	0,
	31,
	60,
	91,
	121,
	152,
	182,
	213,
	244,
	274,
	305,
	335,
	366
];
var M365RANGE = [
	0,
	31,
	59,
	90,
	120,
	151,
	181,
	212,
	243,
	273,
	304,
	334,
	365
];
var WDAYMASK = (function() {
	var wdaymask = [];
	for (var i = 0; i < 55; i++) wdaymask = wdaymask.concat(range(7));
	return wdaymask;
})();
//#endregion
//#region node_modules/rrule/dist/esm/iterinfo/yearinfo.js
function rebuildYear(year, options) {
	var firstyday = datetime(year, 1, 1);
	var yearlen = isLeapYear(year) ? 366 : 365;
	var nextyearlen = isLeapYear(year + 1) ? 366 : 365;
	var yearordinal = toOrdinal(firstyday);
	var yearweekday = getWeekday(firstyday);
	var result = __assign(__assign({
		yearlen,
		nextyearlen,
		yearordinal,
		yearweekday
	}, baseYearMasks(year)), { wnomask: null });
	if (empty(options.byweekno)) return result;
	result.wnomask = repeat(0, yearlen + 7);
	var firstwkst;
	var wyearlen;
	var no1wkst = firstwkst = pymod(7 - yearweekday + options.wkst, 7);
	if (no1wkst >= 4) {
		no1wkst = 0;
		wyearlen = result.yearlen + pymod(yearweekday - options.wkst, 7);
	} else wyearlen = yearlen - no1wkst;
	var div = Math.floor(wyearlen / 7);
	var mod = pymod(wyearlen, 7);
	var numweeks = Math.floor(div + mod / 4);
	for (var j = 0; j < options.byweekno.length; j++) {
		var n = options.byweekno[j];
		if (n < 0) n += numweeks + 1;
		if (!(n > 0 && n <= numweeks)) continue;
		var i = void 0;
		if (n > 1) {
			i = no1wkst + (n - 1) * 7;
			if (no1wkst !== firstwkst) i -= 7 - firstwkst;
		} else i = no1wkst;
		for (var k = 0; k < 7; k++) {
			result.wnomask[i] = 1;
			i++;
			if (result.wdaymask[i] === options.wkst) break;
		}
	}
	if (includes(options.byweekno, 1)) {
		var i = no1wkst + numweeks * 7;
		if (no1wkst !== firstwkst) i -= 7 - firstwkst;
		if (i < yearlen) for (var j = 0; j < 7; j++) {
			result.wnomask[i] = 1;
			i += 1;
			if (result.wdaymask[i] === options.wkst) break;
		}
	}
	if (no1wkst) {
		var lnumweeks = void 0;
		if (!includes(options.byweekno, -1)) {
			var lyearweekday = getWeekday(datetime(year - 1, 1, 1));
			var lno1wkst = pymod(7 - lyearweekday.valueOf() + options.wkst, 7);
			var lyearlen = isLeapYear(year - 1) ? 366 : 365;
			var weekst = void 0;
			if (lno1wkst >= 4) {
				lno1wkst = 0;
				weekst = lyearlen + pymod(lyearweekday - options.wkst, 7);
			} else weekst = yearlen - no1wkst;
			lnumweeks = Math.floor(52 + pymod(weekst, 7) / 4);
		} else lnumweeks = -1;
		if (includes(options.byweekno, lnumweeks)) for (var i = 0; i < no1wkst; i++) result.wnomask[i] = 1;
	}
	return result;
}
function baseYearMasks(year) {
	var yearlen = isLeapYear(year) ? 366 : 365;
	var wday = getWeekday(datetime(year, 1, 1));
	if (yearlen === 365) return {
		mmask: M365MASK,
		mdaymask: MDAY365MASK,
		nmdaymask: NMDAY365MASK,
		wdaymask: WDAYMASK.slice(wday),
		mrange: M365RANGE
	};
	return {
		mmask: M366MASK,
		mdaymask: MDAY366MASK,
		nmdaymask: NMDAY366MASK,
		wdaymask: WDAYMASK.slice(wday),
		mrange: M366RANGE
	};
}
//#endregion
//#region node_modules/rrule/dist/esm/iterinfo/monthinfo.js
function rebuildMonth(year, month, yearlen, mrange, wdaymask, options) {
	var result = {
		lastyear: year,
		lastmonth: month,
		nwdaymask: []
	};
	var ranges = [];
	if (options.freq === RRule$1.YEARLY) if (empty(options.bymonth)) ranges = [[0, yearlen]];
	else for (var j = 0; j < options.bymonth.length; j++) {
		month = options.bymonth[j];
		ranges.push(mrange.slice(month - 1, month + 1));
	}
	else if (options.freq === RRule$1.MONTHLY) ranges = [mrange.slice(month - 1, month + 1)];
	if (empty(ranges)) return result;
	result.nwdaymask = repeat(0, yearlen);
	for (var j = 0; j < ranges.length; j++) {
		var rang = ranges[j];
		var first = rang[0];
		var last = rang[1] - 1;
		for (var k = 0; k < options.bynweekday.length; k++) {
			var i = void 0;
			var _a = options.bynweekday[k], wday = _a[0], n = _a[1];
			if (n < 0) {
				i = last + (n + 1) * 7;
				i -= pymod(wdaymask[i] - wday, 7);
			} else {
				i = first + (n - 1) * 7;
				i += pymod(7 - wdaymask[i] + wday, 7);
			}
			if (first <= i && i <= last) result.nwdaymask[i] = 1;
		}
	}
	return result;
}
//#endregion
//#region node_modules/rrule/dist/esm/iterinfo/easter.js
function easter(y, offset) {
	if (offset === void 0) offset = 0;
	var a = y % 19;
	var b = Math.floor(y / 100);
	var c = y % 100;
	var d = Math.floor(b / 4);
	var e = b % 4;
	var f = Math.floor((b + 8) / 25);
	var g = Math.floor((b - f + 1) / 3);
	var h = Math.floor(19 * a + b - d - g + 15) % 30;
	var i = Math.floor(c / 4);
	var k = c % 4;
	var l = Math.floor(32 + 2 * e + 2 * i - h - k) % 7;
	var m = Math.floor((a + 11 * h + 22 * l) / 451);
	var month = Math.floor((h + l - 7 * m + 114) / 31);
	var day = (h + l - 7 * m + 114) % 31 + 1;
	var date = Date.UTC(y, month - 1, day + offset);
	return [Math.ceil((date - Date.UTC(y, 0, 1)) / (1e3 * 60 * 60 * 24))];
}
//#endregion
//#region node_modules/rrule/dist/esm/iterinfo/index.js
var Iterinfo = function() {
	function Iterinfo(options) {
		this.options = options;
	}
	Iterinfo.prototype.rebuild = function(year, month) {
		var options = this.options;
		if (year !== this.lastyear) this.yearinfo = rebuildYear(year, options);
		if (notEmpty(options.bynweekday) && (month !== this.lastmonth || year !== this.lastyear)) {
			var _a = this.yearinfo, yearlen = _a.yearlen, mrange = _a.mrange, wdaymask = _a.wdaymask;
			this.monthinfo = rebuildMonth(year, month, yearlen, mrange, wdaymask, options);
		}
		if (isPresent(options.byeaster)) this.eastermask = easter(year, options.byeaster);
	};
	Object.defineProperty(Iterinfo.prototype, "lastyear", {
		get: function() {
			return this.monthinfo ? this.monthinfo.lastyear : null;
		},
		enumerable: false,
		configurable: true
	});
	Object.defineProperty(Iterinfo.prototype, "lastmonth", {
		get: function() {
			return this.monthinfo ? this.monthinfo.lastmonth : null;
		},
		enumerable: false,
		configurable: true
	});
	Object.defineProperty(Iterinfo.prototype, "yearlen", {
		get: function() {
			return this.yearinfo.yearlen;
		},
		enumerable: false,
		configurable: true
	});
	Object.defineProperty(Iterinfo.prototype, "yearordinal", {
		get: function() {
			return this.yearinfo.yearordinal;
		},
		enumerable: false,
		configurable: true
	});
	Object.defineProperty(Iterinfo.prototype, "mrange", {
		get: function() {
			return this.yearinfo.mrange;
		},
		enumerable: false,
		configurable: true
	});
	Object.defineProperty(Iterinfo.prototype, "wdaymask", {
		get: function() {
			return this.yearinfo.wdaymask;
		},
		enumerable: false,
		configurable: true
	});
	Object.defineProperty(Iterinfo.prototype, "mmask", {
		get: function() {
			return this.yearinfo.mmask;
		},
		enumerable: false,
		configurable: true
	});
	Object.defineProperty(Iterinfo.prototype, "wnomask", {
		get: function() {
			return this.yearinfo.wnomask;
		},
		enumerable: false,
		configurable: true
	});
	Object.defineProperty(Iterinfo.prototype, "nwdaymask", {
		get: function() {
			return this.monthinfo ? this.monthinfo.nwdaymask : [];
		},
		enumerable: false,
		configurable: true
	});
	Object.defineProperty(Iterinfo.prototype, "nextyearlen", {
		get: function() {
			return this.yearinfo.nextyearlen;
		},
		enumerable: false,
		configurable: true
	});
	Object.defineProperty(Iterinfo.prototype, "mdaymask", {
		get: function() {
			return this.yearinfo.mdaymask;
		},
		enumerable: false,
		configurable: true
	});
	Object.defineProperty(Iterinfo.prototype, "nmdaymask", {
		get: function() {
			return this.yearinfo.nmdaymask;
		},
		enumerable: false,
		configurable: true
	});
	Iterinfo.prototype.ydayset = function() {
		return [
			range(this.yearlen),
			0,
			this.yearlen
		];
	};
	Iterinfo.prototype.mdayset = function(_, month) {
		var start = this.mrange[month - 1];
		var end = this.mrange[month];
		var set = repeat(null, this.yearlen);
		for (var i = start; i < end; i++) set[i] = i;
		return [
			set,
			start,
			end
		];
	};
	Iterinfo.prototype.wdayset = function(year, month, day) {
		var set = repeat(null, this.yearlen + 7);
		var i = toOrdinal(datetime(year, month, day)) - this.yearordinal;
		var start = i;
		for (var j = 0; j < 7; j++) {
			set[i] = i;
			++i;
			if (this.wdaymask[i] === this.options.wkst) break;
		}
		return [
			set,
			start,
			i
		];
	};
	Iterinfo.prototype.ddayset = function(year, month, day) {
		var set = repeat(null, this.yearlen);
		var i = toOrdinal(datetime(year, month, day)) - this.yearordinal;
		set[i] = i;
		return [
			set,
			i,
			i + 1
		];
	};
	Iterinfo.prototype.htimeset = function(hour, _, second, millisecond) {
		var _this = this;
		var set = [];
		this.options.byminute.forEach(function(minute) {
			set = set.concat(_this.mtimeset(hour, minute, second, millisecond));
		});
		sort(set);
		return set;
	};
	Iterinfo.prototype.mtimeset = function(hour, minute, _, millisecond) {
		var set = this.options.bysecond.map(function(second) {
			return new Time(hour, minute, second, millisecond);
		});
		sort(set);
		return set;
	};
	Iterinfo.prototype.stimeset = function(hour, minute, second, millisecond) {
		return [new Time(hour, minute, second, millisecond)];
	};
	Iterinfo.prototype.getdayset = function(freq) {
		switch (freq) {
			case Frequency.YEARLY: return this.ydayset.bind(this);
			case Frequency.MONTHLY: return this.mdayset.bind(this);
			case Frequency.WEEKLY: return this.wdayset.bind(this);
			case Frequency.DAILY: return this.ddayset.bind(this);
			default: return this.ddayset.bind(this);
		}
	};
	Iterinfo.prototype.gettimeset = function(freq) {
		switch (freq) {
			case Frequency.HOURLY: return this.htimeset.bind(this);
			case Frequency.MINUTELY: return this.mtimeset.bind(this);
			case Frequency.SECONDLY: return this.stimeset.bind(this);
		}
	};
	return Iterinfo;
}();
//#endregion
//#region node_modules/rrule/dist/esm/iter/poslist.js
function buildPoslist(bysetpos, timeset, start, end, ii, dayset) {
	var poslist = [];
	for (var j = 0; j < bysetpos.length; j++) {
		var daypos = void 0;
		var timepos = void 0;
		var pos = bysetpos[j];
		if (pos < 0) {
			daypos = Math.floor(pos / timeset.length);
			timepos = pymod(pos, timeset.length);
		} else {
			daypos = Math.floor((pos - 1) / timeset.length);
			timepos = pymod(pos - 1, timeset.length);
		}
		var tmp = [];
		for (var k = start; k < end; k++) {
			var val = dayset[k];
			if (!isPresent(val)) continue;
			tmp.push(val);
		}
		var i = void 0;
		if (daypos < 0) i = tmp.slice(daypos)[0];
		else i = tmp[daypos];
		var time = timeset[timepos];
		var res = combine(fromOrdinal(ii.yearordinal + i), time);
		if (!includes(poslist, res)) poslist.push(res);
	}
	sort(poslist);
	return poslist;
}
//#endregion
//#region node_modules/rrule/dist/esm/iter/index.js
function iter(iterResult, options) {
	var dtstart = options.dtstart, freq = options.freq, interval = options.interval, until = options.until, bysetpos = options.bysetpos;
	var count = options.count;
	if (count === 0 || interval === 0) return emitResult(iterResult);
	var counterDate = DateTime.fromDate(dtstart);
	var ii = new Iterinfo(options);
	ii.rebuild(counterDate.year, counterDate.month);
	var timeset = makeTimeset(ii, counterDate, options);
	for (;;) {
		var _a = ii.getdayset(freq)(counterDate.year, counterDate.month, counterDate.day), dayset = _a[0], start = _a[1], end = _a[2];
		var filtered = removeFilteredDays(dayset, start, end, ii, options);
		if (notEmpty(bysetpos)) {
			var poslist = buildPoslist(bysetpos, timeset, start, end, ii, dayset);
			for (var j = 0; j < poslist.length; j++) {
				var res = poslist[j];
				if (until && res > until) return emitResult(iterResult);
				if (res >= dtstart) {
					var rezonedDate = rezoneIfNeeded(res, options);
					if (!iterResult.accept(rezonedDate)) return emitResult(iterResult);
					if (count) {
						--count;
						if (!count) return emitResult(iterResult);
					}
				}
			}
		} else for (var j = start; j < end; j++) {
			var currentDay = dayset[j];
			if (!isPresent(currentDay)) continue;
			var date = fromOrdinal(ii.yearordinal + currentDay);
			for (var k = 0; k < timeset.length; k++) {
				var time = timeset[k];
				var res = combine(date, time);
				if (until && res > until) return emitResult(iterResult);
				if (res >= dtstart) {
					var rezonedDate = rezoneIfNeeded(res, options);
					if (!iterResult.accept(rezonedDate)) return emitResult(iterResult);
					if (count) {
						--count;
						if (!count) return emitResult(iterResult);
					}
				}
			}
		}
		if (options.interval === 0) return emitResult(iterResult);
		counterDate.add(options, filtered);
		if (counterDate.year > 9999) return emitResult(iterResult);
		if (!freqIsDailyOrGreater(freq)) timeset = ii.gettimeset(freq)(counterDate.hour, counterDate.minute, counterDate.second, 0);
		ii.rebuild(counterDate.year, counterDate.month);
	}
}
function isFiltered(ii, currentDay, options) {
	var bymonth = options.bymonth, byweekno = options.byweekno, byweekday = options.byweekday, byeaster = options.byeaster, bymonthday = options.bymonthday, bynmonthday = options.bynmonthday, byyearday = options.byyearday;
	return notEmpty(bymonth) && !includes(bymonth, ii.mmask[currentDay]) || notEmpty(byweekno) && !ii.wnomask[currentDay] || notEmpty(byweekday) && !includes(byweekday, ii.wdaymask[currentDay]) || notEmpty(ii.nwdaymask) && !ii.nwdaymask[currentDay] || byeaster !== null && !includes(ii.eastermask, currentDay) || (notEmpty(bymonthday) || notEmpty(bynmonthday)) && !includes(bymonthday, ii.mdaymask[currentDay]) && !includes(bynmonthday, ii.nmdaymask[currentDay]) || notEmpty(byyearday) && (currentDay < ii.yearlen && !includes(byyearday, currentDay + 1) && !includes(byyearday, -ii.yearlen + currentDay) || currentDay >= ii.yearlen && !includes(byyearday, currentDay + 1 - ii.yearlen) && !includes(byyearday, -ii.nextyearlen + currentDay - ii.yearlen));
}
function rezoneIfNeeded(date, options) {
	return new DateWithZone(date, options.tzid).rezonedDate();
}
function emitResult(iterResult) {
	return iterResult.getValue();
}
function removeFilteredDays(dayset, start, end, ii, options) {
	var filtered = false;
	for (var dayCounter = start; dayCounter < end; dayCounter++) {
		var currentDay = dayset[dayCounter];
		filtered = isFiltered(ii, currentDay, options);
		if (filtered) dayset[currentDay] = null;
	}
	return filtered;
}
function makeTimeset(ii, counterDate, options) {
	var freq = options.freq, byhour = options.byhour, byminute = options.byminute, bysecond = options.bysecond;
	if (freqIsDailyOrGreater(freq)) return buildTimeset(options);
	if (freq >= RRule$1.HOURLY && notEmpty(byhour) && !includes(byhour, counterDate.hour) || freq >= RRule$1.MINUTELY && notEmpty(byminute) && !includes(byminute, counterDate.minute) || freq >= RRule$1.SECONDLY && notEmpty(bysecond) && !includes(bysecond, counterDate.second)) return [];
	return ii.gettimeset(freq)(counterDate.hour, counterDate.minute, counterDate.second, counterDate.millisecond);
}
//#endregion
//#region node_modules/rrule/dist/esm/rrule.js
var Days = {
	MO: new Weekday(0),
	TU: new Weekday(1),
	WE: new Weekday(2),
	TH: new Weekday(3),
	FR: new Weekday(4),
	SA: new Weekday(5),
	SU: new Weekday(6)
};
var DEFAULT_OPTIONS$1 = {
	freq: Frequency.YEARLY,
	dtstart: null,
	interval: 1,
	wkst: Days.MO,
	count: null,
	until: null,
	tzid: null,
	bysetpos: null,
	bymonth: null,
	bymonthday: null,
	bynmonthday: null,
	byyearday: null,
	byweekno: null,
	byweekday: null,
	bynweekday: null,
	byhour: null,
	byminute: null,
	bysecond: null,
	byeaster: null
};
var defaultKeys = Object.keys(DEFAULT_OPTIONS$1);
/**
*
* @param {Options?} options - see <http://labix.org/python-dateutil/#head-cf004ee9a75592797e076752b2a889c10f445418>
* - The only required option is `freq`, one of RRule.YEARLY, RRule.MONTHLY, ...
* @constructor
*/
var RRule$1 = function() {
	function RRule(options, noCache) {
		if (options === void 0) options = {};
		if (noCache === void 0) noCache = false;
		this._cache = noCache ? null : new Cache();
		this.origOptions = initializeOptions$1(options);
		var parsedOptions = parseOptions(options).parsedOptions;
		this.options = parsedOptions;
	}
	RRule.parseText = function(text, language) {
		return parseText(text, language);
	};
	RRule.fromText = function(text, language) {
		return fromText(text, language);
	};
	RRule.fromString = function(str) {
		return new RRule(RRule.parseString(str) || void 0);
	};
	RRule.prototype._iter = function(iterResult) {
		return iter(iterResult, this.options);
	};
	RRule.prototype._cacheGet = function(what, args) {
		if (!this._cache) return false;
		return this._cache._cacheGet(what, args);
	};
	RRule.prototype._cacheAdd = function(what, value, args) {
		if (!this._cache) return;
		return this._cache._cacheAdd(what, value, args);
	};
	/**
	* @param {Function} iterator - optional function that will be called
	* on each date that is added. It can return false
	* to stop the iteration.
	* @return Array containing all recurrences.
	*/
	RRule.prototype.all = function(iterator) {
		if (iterator) return this._iter(new CallbackIterResult("all", {}, iterator));
		var result = this._cacheGet("all");
		if (result === false) {
			result = this._iter(new IterResult("all", {}));
			this._cacheAdd("all", result);
		}
		return result;
	};
	/**
	* Returns all the occurrences of the rrule between after and before.
	* The inc keyword defines what happens if after and/or before are
	* themselves occurrences. With inc == True, they will be included in the
	* list, if they are found in the recurrence set.
	*
	* @return Array
	*/
	RRule.prototype.between = function(after, before, inc, iterator) {
		if (inc === void 0) inc = false;
		if (!isValidDate(after) || !isValidDate(before)) throw new Error("Invalid date passed in to RRule.between");
		var args = {
			before,
			after,
			inc
		};
		if (iterator) return this._iter(new CallbackIterResult("between", args, iterator));
		var result = this._cacheGet("between", args);
		if (result === false) {
			result = this._iter(new IterResult("between", args));
			this._cacheAdd("between", result, args);
		}
		return result;
	};
	/**
	* Returns the last recurrence before the given datetime instance.
	* The inc keyword defines what happens if dt is an occurrence.
	* With inc == True, if dt itself is an occurrence, it will be returned.
	*
	* @return Date or null
	*/
	RRule.prototype.before = function(dt, inc) {
		if (inc === void 0) inc = false;
		if (!isValidDate(dt)) throw new Error("Invalid date passed in to RRule.before");
		var args = {
			dt,
			inc
		};
		var result = this._cacheGet("before", args);
		if (result === false) {
			result = this._iter(new IterResult("before", args));
			this._cacheAdd("before", result, args);
		}
		return result;
	};
	/**
	* Returns the first recurrence after the given datetime instance.
	* The inc keyword defines what happens if dt is an occurrence.
	* With inc == True, if dt itself is an occurrence, it will be returned.
	*
	* @return Date or null
	*/
	RRule.prototype.after = function(dt, inc) {
		if (inc === void 0) inc = false;
		if (!isValidDate(dt)) throw new Error("Invalid date passed in to RRule.after");
		var args = {
			dt,
			inc
		};
		var result = this._cacheGet("after", args);
		if (result === false) {
			result = this._iter(new IterResult("after", args));
			this._cacheAdd("after", result, args);
		}
		return result;
	};
	/**
	* Returns the number of recurrences in this set. It will have go trough
	* the whole recurrence, if this hasn't been done before.
	*/
	RRule.prototype.count = function() {
		return this.all().length;
	};
	/**
	* Converts the rrule into its string representation
	*
	* @see <http://www.ietf.org/rfc/rfc2445.txt>
	* @return String
	*/
	RRule.prototype.toString = function() {
		return optionsToString(this.origOptions);
	};
	/**
	* Will convert all rules described in nlp:ToText
	* to text.
	*/
	RRule.prototype.toText = function(gettext, language, dateFormatter) {
		return toText(this, gettext, language, dateFormatter);
	};
	RRule.prototype.isFullyConvertibleToText = function() {
		return isFullyConvertible(this);
	};
	/**
	* @return a RRule instance with the same freq and options
	* as this one (cache is not cloned)
	*/
	RRule.prototype.clone = function() {
		return new RRule(this.origOptions);
	};
	RRule.FREQUENCIES = [
		"YEARLY",
		"MONTHLY",
		"WEEKLY",
		"DAILY",
		"HOURLY",
		"MINUTELY",
		"SECONDLY"
	];
	RRule.YEARLY = Frequency.YEARLY;
	RRule.MONTHLY = Frequency.MONTHLY;
	RRule.WEEKLY = Frequency.WEEKLY;
	RRule.DAILY = Frequency.DAILY;
	RRule.HOURLY = Frequency.HOURLY;
	RRule.MINUTELY = Frequency.MINUTELY;
	RRule.SECONDLY = Frequency.SECONDLY;
	RRule.MO = Days.MO;
	RRule.TU = Days.TU;
	RRule.WE = Days.WE;
	RRule.TH = Days.TH;
	RRule.FR = Days.FR;
	RRule.SA = Days.SA;
	RRule.SU = Days.SU;
	RRule.parseString = parseString;
	RRule.optionsToString = optionsToString;
	return RRule;
}();
//#endregion
//#region node_modules/rrule/dist/esm/iterset.js
function iterSet(iterResult, _rrule, _exrule, _rdate, _exdate, tzid) {
	var _exdateHash = {};
	var _accept = iterResult.accept;
	function evalExdate(after, before) {
		_exrule.forEach(function(rrule) {
			rrule.between(after, before, true).forEach(function(date) {
				_exdateHash[Number(date)] = true;
			});
		});
	}
	_exdate.forEach(function(date) {
		var zonedDate = new DateWithZone(date, tzid).rezonedDate();
		_exdateHash[Number(zonedDate)] = true;
	});
	iterResult.accept = function(date) {
		var dt = Number(date);
		if (isNaN(dt)) return _accept.call(this, date);
		if (!_exdateHash[dt]) {
			evalExdate(/* @__PURE__ */ new Date(dt - 1), new Date(dt + 1));
			if (!_exdateHash[dt]) {
				_exdateHash[dt] = true;
				return _accept.call(this, date);
			}
		}
		return true;
	};
	if (iterResult.method === "between") {
		evalExdate(iterResult.args.after, iterResult.args.before);
		iterResult.accept = function(date) {
			var dt = Number(date);
			if (!_exdateHash[dt]) {
				_exdateHash[dt] = true;
				return _accept.call(this, date);
			}
			return true;
		};
	}
	for (var i = 0; i < _rdate.length; i++) {
		var zonedDate = new DateWithZone(_rdate[i], tzid).rezonedDate();
		if (!iterResult.accept(new Date(zonedDate.getTime()))) break;
	}
	_rrule.forEach(function(rrule) {
		iter(iterResult, rrule.options);
	});
	var res = iterResult._result;
	sort(res);
	switch (iterResult.method) {
		case "all":
		case "between": return res;
		case "before": return res.length && res[res.length - 1] || null;
		default: return res.length && res[0] || null;
	}
}
//#endregion
//#region node_modules/rrule/dist/esm/rrulestr.js
/**
* RRuleStr
* To parse a set of rrule strings
*/
var DEFAULT_OPTIONS = {
	dtstart: null,
	cache: false,
	unfold: false,
	forceset: false,
	compatible: false,
	tzid: null
};
function parseInput(s, options) {
	var rrulevals = [];
	var rdatevals = [];
	var exrulevals = [];
	var exdatevals = [];
	var parsedDtstart = parseDtstart(s);
	var dtstart = parsedDtstart.dtstart;
	var tzid = parsedDtstart.tzid;
	splitIntoLines(s, options.unfold).forEach(function(line) {
		var _a;
		if (!line) return;
		var _b = breakDownLine(line), name = _b.name, parms = _b.parms, value = _b.value;
		switch (name.toUpperCase()) {
			case "RRULE":
				if (parms.length) throw new Error("unsupported RRULE parm: ".concat(parms.join(",")));
				rrulevals.push(parseString(line));
				break;
			case "RDATE":
				var rdateTzid = ((_a = /RDATE(?:;TZID=([^:=]+))?/i.exec(line)) !== null && _a !== void 0 ? _a : [])[1];
				if (rdateTzid && !tzid) tzid = rdateTzid;
				rdatevals = rdatevals.concat(parseRDate(value, parms));
				break;
			case "EXRULE":
				if (parms.length) throw new Error("unsupported EXRULE parm: ".concat(parms.join(",")));
				exrulevals.push(parseString(value));
				break;
			case "EXDATE":
				exdatevals = exdatevals.concat(parseRDate(value, parms));
				break;
			case "DTSTART": break;
			default: throw new Error("unsupported property: " + name);
		}
	});
	return {
		dtstart,
		tzid,
		rrulevals,
		rdatevals,
		exrulevals,
		exdatevals
	};
}
function buildRule(s, options) {
	var _a = parseInput(s, options), rrulevals = _a.rrulevals, rdatevals = _a.rdatevals, exrulevals = _a.exrulevals, exdatevals = _a.exdatevals, dtstart = _a.dtstart, tzid = _a.tzid;
	var noCache = options.cache === false;
	if (options.compatible) {
		options.forceset = true;
		options.unfold = true;
	}
	if (options.forceset || rrulevals.length > 1 || rdatevals.length || exrulevals.length || exdatevals.length) {
		var rset_1 = new RRuleSet(noCache);
		rset_1.dtstart(dtstart);
		rset_1.tzid(tzid || void 0);
		rrulevals.forEach(function(val) {
			rset_1.rrule(new RRule$1(groomRruleOptions(val, dtstart, tzid), noCache));
		});
		rdatevals.forEach(function(date) {
			rset_1.rdate(date);
		});
		exrulevals.forEach(function(val) {
			rset_1.exrule(new RRule$1(groomRruleOptions(val, dtstart, tzid), noCache));
		});
		exdatevals.forEach(function(date) {
			rset_1.exdate(date);
		});
		if (options.compatible && options.dtstart) rset_1.rdate(dtstart);
		return rset_1;
	}
	var val = rrulevals[0] || {};
	return new RRule$1(groomRruleOptions(val, val.dtstart || options.dtstart || dtstart, val.tzid || options.tzid || tzid), noCache);
}
function rrulestr$1(s, options) {
	if (options === void 0) options = {};
	return buildRule(s, initializeOptions(options));
}
function groomRruleOptions(val, dtstart, tzid) {
	return __assign(__assign({}, val), {
		dtstart,
		tzid
	});
}
function initializeOptions(options) {
	var invalid = [];
	var keys = Object.keys(options);
	var defaultKeys = Object.keys(DEFAULT_OPTIONS);
	keys.forEach(function(key) {
		if (!includes(defaultKeys, key)) invalid.push(key);
	});
	if (invalid.length) throw new Error("Invalid options: " + invalid.join(", "));
	return __assign(__assign({}, DEFAULT_OPTIONS), options);
}
function extractName(line) {
	if (line.indexOf(":") === -1) return {
		name: "RRULE",
		value: line
	};
	var _a = split(line, ":", 1);
	return {
		name: _a[0],
		value: _a[1]
	};
}
function breakDownLine(line) {
	var _a = extractName(line), name = _a.name, value = _a.value;
	var parms = name.split(";");
	if (!parms) throw new Error("empty property name");
	return {
		name: parms[0].toUpperCase(),
		parms: parms.slice(1),
		value
	};
}
function splitIntoLines(s, unfold) {
	if (unfold === void 0) unfold = false;
	s = s && s.trim();
	if (!s) throw new Error("Invalid empty string");
	if (!unfold) return s.split(/\s/);
	var lines = s.split("\n");
	var i = 0;
	while (i < lines.length) {
		var line = lines[i] = lines[i].replace(/\s+$/g, "");
		if (!line) lines.splice(i, 1);
		else if (i > 0 && line[0] === " ") {
			lines[i - 1] += line.slice(1);
			lines.splice(i, 1);
		} else i += 1;
	}
	return lines;
}
function validateDateParm(parms) {
	parms.forEach(function(parm) {
		if (!/(VALUE=DATE(-TIME)?)|(TZID=)/.test(parm)) throw new Error("unsupported RDATE/EXDATE parm: " + parm);
	});
}
function parseRDate(rdateval, parms) {
	validateDateParm(parms);
	return rdateval.split(",").map(function(datestr) {
		return untilStringToDate(datestr);
	});
}
//#endregion
//#region node_modules/rrule/dist/esm/rruleset.js
function createGetterSetter(fieldName) {
	var _this = this;
	return function(field) {
		if (field !== void 0) _this["_".concat(fieldName)] = field;
		if (_this["_".concat(fieldName)] !== void 0) return _this["_".concat(fieldName)];
		for (var i = 0; i < _this._rrule.length; i++) {
			var field_1 = _this._rrule[i].origOptions[fieldName];
			if (field_1) return field_1;
		}
	};
}
var RRuleSet = function(_super) {
	__extends(RRuleSet, _super);
	/**
	*
	* @param {Boolean?} noCache
	* The same stratagy as RRule on cache, default to false
	* @constructor
	*/
	function RRuleSet(noCache) {
		if (noCache === void 0) noCache = false;
		var _this = _super.call(this, {}, noCache) || this;
		_this.dtstart = createGetterSetter.apply(_this, ["dtstart"]);
		_this.tzid = createGetterSetter.apply(_this, ["tzid"]);
		_this._rrule = [];
		_this._rdate = [];
		_this._exrule = [];
		_this._exdate = [];
		return _this;
	}
	RRuleSet.prototype._iter = function(iterResult) {
		return iterSet(iterResult, this._rrule, this._exrule, this._rdate, this._exdate, this.tzid());
	};
	/**
	* Adds an RRule to the set
	*
	* @param {RRule}
	*/
	RRuleSet.prototype.rrule = function(rrule) {
		_addRule(rrule, this._rrule);
	};
	/**
	* Adds an EXRULE to the set
	*
	* @param {RRule}
	*/
	RRuleSet.prototype.exrule = function(rrule) {
		_addRule(rrule, this._exrule);
	};
	/**
	* Adds an RDate to the set
	*
	* @param {Date}
	*/
	RRuleSet.prototype.rdate = function(date) {
		_addDate(date, this._rdate);
	};
	/**
	* Adds an EXDATE to the set
	*
	* @param {Date}
	*/
	RRuleSet.prototype.exdate = function(date) {
		_addDate(date, this._exdate);
	};
	/**
	* Get list of included rrules in this recurrence set.
	*
	* @return List of rrules
	*/
	RRuleSet.prototype.rrules = function() {
		return this._rrule.map(function(e) {
			return rrulestr$1(e.toString());
		});
	};
	/**
	* Get list of excluded rrules in this recurrence set.
	*
	* @return List of exrules
	*/
	RRuleSet.prototype.exrules = function() {
		return this._exrule.map(function(e) {
			return rrulestr$1(e.toString());
		});
	};
	/**
	* Get list of included datetimes in this recurrence set.
	*
	* @return List of rdates
	*/
	RRuleSet.prototype.rdates = function() {
		return this._rdate.map(function(e) {
			return new Date(e.getTime());
		});
	};
	/**
	* Get list of included datetimes in this recurrence set.
	*
	* @return List of exdates
	*/
	RRuleSet.prototype.exdates = function() {
		return this._exdate.map(function(e) {
			return new Date(e.getTime());
		});
	};
	RRuleSet.prototype.valueOf = function() {
		var result = [];
		if (!this._rrule.length && this._dtstart) result = result.concat(optionsToString({ dtstart: this._dtstart }));
		this._rrule.forEach(function(rrule) {
			result = result.concat(rrule.toString().split("\n"));
		});
		this._exrule.forEach(function(exrule) {
			result = result.concat(exrule.toString().split("\n").map(function(line) {
				return line.replace(/^RRULE:/, "EXRULE:");
			}).filter(function(line) {
				return !/^DTSTART/.test(line);
			}));
		});
		if (this._rdate.length) result.push(rdatesToString("RDATE", this._rdate, this.tzid()));
		if (this._exdate.length) result.push(rdatesToString("EXDATE", this._exdate, this.tzid()));
		return result;
	};
	/**
	* to generate recurrence field such as:
	* DTSTART:19970902T010000Z
	* RRULE:FREQ=YEARLY;COUNT=2;BYDAY=TU
	* RRULE:FREQ=YEARLY;COUNT=1;BYDAY=TH
	*/
	RRuleSet.prototype.toString = function() {
		return this.valueOf().join("\n");
	};
	/**
	* Create a new RRuleSet Object completely base on current instance
	*/
	RRuleSet.prototype.clone = function() {
		var rrs = new RRuleSet(!!this._cache);
		this._rrule.forEach(function(rule) {
			return rrs.rrule(rule.clone());
		});
		this._exrule.forEach(function(rule) {
			return rrs.exrule(rule.clone());
		});
		this._rdate.forEach(function(date) {
			return rrs.rdate(new Date(date.getTime()));
		});
		this._exdate.forEach(function(date) {
			return rrs.exdate(new Date(date.getTime()));
		});
		return rrs;
	};
	return RRuleSet;
}(RRule$1);
function _addRule(rrule, collection) {
	if (!(rrule instanceof RRule$1)) throw new TypeError(String(rrule) + " is not RRule instance");
	if (!includes(collection.map(String), String(rrule))) collection.push(rrule);
}
function _addDate(date, collection) {
	if (!(date instanceof Date)) throw new TypeError(String(date) + " is not Date instance");
	if (!includes(collection.map(Number), Number(date))) {
		collection.push(date);
		sort(collection);
	}
}
function rdatesToString(param, rdates, tzid) {
	var isUTC = !tzid || tzid.toUpperCase() === "UTC";
	var header = isUTC ? "".concat(param, ":") : "".concat(param, ";TZID=").concat(tzid, ":");
	var dateString = rdates.map(function(rdate) {
		return timeToUntilString(rdate.valueOf(), isUTC);
	}).join(",");
	return "".concat(header).concat(dateString);
}
//#endregion
//#region node_modules/rrule/dist/esm/index.js
var esm_exports = /* @__PURE__ */ __exportAll({
	ALL_WEEKDAYS: () => ALL_WEEKDAYS,
	Frequency: () => Frequency,
	RRule: () => RRule$1,
	RRuleSet: () => RRuleSet,
	Weekday: () => Weekday,
	datetime: () => datetime,
	rrulestr: () => rrulestr$1
});
//#endregion
//#region lib/domain.ts
var { RRule, rrulestr } = Reflect.get(esm_exports, "default") ?? esm_exports;
var MORANDI_COLORS = [
	"#AFC3D4",
	"#D7A6A1",
	"#D8C39F",
	"#AFC4B1",
	"#B9B2CC",
	"#A9C4C0",
	"#C9B9A9",
	"#C6C1BA"
];
var DEFAULT_ITEM_TYPES = [
	{
		id: "research",
		name: "科研",
		color: MORANDI_COLORS[0]
	},
	{
		id: "deadline",
		name: "Deadline",
		color: MORANDI_COLORS[1]
	},
	{
		id: "temporary",
		name: "临时",
		color: MORANDI_COLORS[2]
	},
	{
		id: "music",
		name: "音乐",
		color: MORANDI_COLORS[4]
	},
	{
		id: "course",
		name: "课程",
		color: MORANDI_COLORS[3]
	}
];
function normalizeItemTypes(itemTypes) {
	const current = itemTypes ?? [];
	return [...DEFAULT_ITEM_TYPES.map((fallback) => current.find((item) => item.id === fallback.id) ?? fallback), ...current.filter((item) => !DEFAULT_ITEM_TYPES.some((fallback) => fallback.id === item.id))];
}
function normalizeFragmentMinutes(eligibleMinutes, legacyBucket) {
	if (Array.isArray(eligibleMinutes)) {
		const normalized = [...new Set(eligibleMinutes.map(Number).filter((value) => value === 15 || value === 30 || value === 60 || value === 90))].sort((a, b) => a - b);
		if (normalized.length) return normalized;
	}
	if (legacyBucket === "10") return [15];
	if (legacyBucket === "30") return [30];
	if (legacyBucket === "60") return [60];
	return [90];
}
var DEFAULT_SETTINGS = {
	id: "main",
	version: 0,
	timezone: "Asia/Shanghai",
	defaultWakeTime: "08:00",
	defaultSleepTime: "00:30",
	calendarDisplayStart: "08:00",
	calendarDisplayEnd: "02:00",
	sleepOverrides: {},
	inboxAgeHours: 48,
	cloudCursor: 0,
	notificationState: "unknown",
	itemTypes: DEFAULT_ITEM_TYPES,
	currentGoalId: null,
	lastProjectByGoal: {}
};
function newId(prefix = "") {
	const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
	return prefix ? `${prefix}_${id}` : id;
}
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function localDateKey(date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function sameLocalDay(value, date) {
	if (!value) return false;
	return localDateKey(new Date(value)) === localDateKey(date);
}
function startOfLocalDay(date) {
	const next = new Date(date);
	next.setHours(0, 0, 0, 0);
	return next;
}
function startOfWeek(date) {
	const result = startOfLocalDay(date);
	const day = result.getDay();
	const offset = day === 0 ? -6 : 1 - day;
	result.setDate(result.getDate() + offset);
	return result;
}
function daysFrom(start, count) {
	return Array.from({ length: count }, (_, index) => {
		const day = new Date(start);
		day.setDate(start.getDate() + index);
		return day;
	});
}
function toDateTimeLocal(value) {
	if (!value) return "";
	const date = new Date(value);
	return (/* @__PURE__ */ new Date(date.getTime() - date.getTimezoneOffset() * 6e4)).toISOString().slice(0, 16);
}
function fromDateTimeLocal(value) {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
function parseRepeatPreset(preset, startAt, recurrenceEndAt) {
	if (preset === "none" || !startAt) return null;
	const start = new Date(startAt);
	const dayCodes = [
		RRule.SU,
		RRule.MO,
		RRule.TU,
		RRule.WE,
		RRule.TH,
		RRule.FR,
		RRule.SA
	];
	const options = { dtstart: start };
	if (recurrenceEndAt) {
		const until = /* @__PURE__ */ new Date(`${recurrenceEndAt}T23:59:59`);
		if (!Number.isNaN(until.getTime())) options.until = until;
	}
	if (preset === "daily") options.freq = RRule.DAILY;
	if (preset === "weekdays") {
		options.freq = RRule.WEEKLY;
		options.byweekday = [
			RRule.MO,
			RRule.TU,
			RRule.WE,
			RRule.TH,
			RRule.FR
		];
	}
	if (preset === "weekly") {
		options.freq = RRule.WEEKLY;
		options.byweekday = [dayCodes[start.getDay()]];
	}
	if (preset === "monthly") {
		options.freq = RRule.MONTHLY;
		options.bymonthday = start.getDate();
	}
	return new RRule(options).toString();
}
function courseWeekdayForDate(dateKey) {
	const [year, month, day] = dateKey.split("-").map(Number);
	return (new Date(year, month - 1, day).getDay() + 6) % 7;
}
function firstCourseDateOnOrAfter(startDate, weekdays) {
	if (!startDate || !weekdays.length) return startDate;
	const [year, month, day] = startDate.split("-").map(Number);
	const start = new Date(year, month - 1, day);
	const startWeekday = (start.getDay() + 6) % 7;
	const offset = Math.min(...weekdays.map((weekday) => (weekday - startWeekday + 7) % 7));
	start.setDate(start.getDate() + offset);
	return localDateKey(start);
}
function makeCourseRecurrenceRule(startAt, weekdays, recurrenceEndAt) {
	if (!startAt || !weekdays.length) return null;
	const dayCodes = [
		RRule.MO,
		RRule.TU,
		RRule.WE,
		RRule.TH,
		RRule.FR,
		RRule.SA,
		RRule.SU
	];
	const byweekday = [...new Set(weekdays)].filter((weekday) => weekday >= 0 && weekday <= 6).sort((a, b) => a - b).map((weekday) => dayCodes[weekday]);
	if (!byweekday.length) return null;
	const options = {
		dtstart: new Date(startAt),
		freq: RRule.WEEKLY,
		byweekday
	};
	if (recurrenceEndAt) options.until = /* @__PURE__ */ new Date(`${recurrenceEndAt}T23:59:59`);
	return new RRule(options).toString();
}
function recurrenceWeekdays(recurrenceRule) {
	if (!recurrenceRule) return [];
	try {
		return [...new Set(rrulestr(recurrenceRule).options.byweekday ?? [])].filter((weekday) => weekday >= 0 && weekday <= 6).sort((a, b) => a - b);
	} catch {
		return [];
	}
}
var recurrenceRuleCache = /* @__PURE__ */ new Map();
function expandRecurrence(recurrenceRule, rangeStart, rangeEnd) {
	if (!recurrenceRule) return [];
	try {
		let parsed = recurrenceRuleCache.get(recurrenceRule);
		if (!parsed) {
			parsed = rrulestr(recurrenceRule);
			if (recurrenceRuleCache.size >= 256) recurrenceRuleCache.delete(recurrenceRuleCache.keys().next().value);
			recurrenceRuleCache.set(recurrenceRule, parsed);
		}
		return parsed.between(rangeStart, rangeEnd, true);
	} catch {
		return [];
	}
}
function recurrenceOnLocalDay(recurrenceRule, date) {
	if (!recurrenceRule) return null;
	const start = startOfLocalDay(date);
	const end = new Date(start);
	end.setDate(end.getDate() + 1);
	return expandRecurrence(recurrenceRule, start, /* @__PURE__ */ new Date(end.getTime() - 1))[0] ?? null;
}
function taskDateAnchors(task) {
	if (task.taskKind === "assignment") {
		const anchors = [];
		const scheduledInstant = task.scheduledStartAt ? new Date(task.scheduledStartAt).getTime() : null;
		const duplicatesScheduled = (at) => scheduledInstant !== null && new Date(at).getTime() === scheduledInstant;
		if (task.scheduledStartAt) anchors.push({
			kind: "scheduled",
			at: task.scheduledStartAt,
			timed: true,
			usesDuration: true,
			recurring: true
		});
		if (task.desiredCompletionAt && !duplicatesScheduled(task.desiredCompletionAt) && (!task.actualDeadlineAt || !sameLocalDay(task.desiredCompletionAt, new Date(task.actualDeadlineAt)))) anchors.push({
			kind: "desired",
			at: task.desiredCompletionAt,
			timed: true,
			usesDuration: false,
			recurring: false
		});
		if (task.actualDeadlineAt && !duplicatesScheduled(task.actualDeadlineAt)) anchors.push({
			kind: "deadline",
			at: task.actualDeadlineAt,
			timed: true,
			usesDuration: false,
			recurring: false
		});
		if (!anchors.length && task.dueAt) anchors.push({
			kind: "due",
			at: task.dueAt,
			timed: false,
			usesDuration: false,
			recurring: true
		});
		return anchors;
	}
	const direct = task.scheduledStartAt ?? task.dueAt;
	if (!direct) return [];
	return [{
		kind: task.scheduledStartAt ? "scheduled" : "due",
		at: direct,
		timed: Boolean(task.scheduledStartAt),
		usesDuration: Boolean(task.scheduledStartAt),
		recurring: true
	}];
}
function taskOccurrencesOnDay(task, date) {
	if (task.planningState === "draft") return [];
	return taskDateAnchors(task).flatMap((anchor) => {
		if (sameLocalDay(anchor.at, date)) return [{
			anchor,
			occurrenceAt: anchor.at
		}];
		if (!anchor.recurring) return [];
		const occurrence = recurrenceOnLocalDay(task.recurrenceRule, date);
		return occurrence ? [{
			anchor,
			occurrenceAt: occurrence.toISOString()
		}] : [];
	});
}
function taskOccurrenceOnDay(task, date) {
	return taskOccurrencesOnDay(task, date)[0]?.occurrenceAt ?? null;
}
function eventOccurrenceOnDay(event, date) {
	if ((event.excludedOccurrenceKeys ?? []).includes(localDateKey(date))) return null;
	if (sameLocalDay(event.startAt, date)) return event.startAt;
	return recurrenceOnLocalDay(event.recurrenceRule, date)?.toISOString() ?? null;
}
function isTaskOccurrenceCompleted(task, occurrenceAt) {
	return (task.completedOccurrenceKeys ?? []).includes(localDateKey(new Date(occurrenceAt)));
}
function formatTime(value) {
	if (!value) return "";
	return new Intl.DateTimeFormat("zh-CN", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	}).format(new Date(value));
}
function formatShortDate(value) {
	if (!value) return "";
	return new Intl.DateTimeFormat("zh-CN", {
		month: "short",
		day: "numeric"
	}).format(new Date(value));
}
function formatFullDate(date) {
	return new Intl.DateTimeFormat("zh-CN", {
		month: "long",
		day: "numeric",
		weekday: "long"
	}).format(date);
}
//#endregion
//#region lib/planning/project-outline.ts
function parseProjectOutline(input) {
	const candidates = [];
	const depthIndexes = [];
	const body = input.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?/, "");
	for (const raw of body.split(/\r?\n/)) {
		if (!raw.trim()) continue;
		if (/^\s*#\s+/.test(raw) && candidates.length === 0) continue;
		const leading = raw.match(/^\s*/)?.[0] ?? "";
		const bullet = raw.match(/^\s*(?:[-*+]|\d+[.)])\s+/);
		const heading = raw.match(/^\s*(#{1,6})\s+/);
		const checkpoint = /^\s*[-*+]\s+\[[ xX]\]\s+/.test(raw);
		const title = raw.replace(/^\s*(?:#{1,6}\s+|[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)/, "").trim();
		if (!title) continue;
		const depth = heading ? Math.max(0, heading[1].length - 1) : Math.floor(leading.replace(/\t/g, "  ").length / 2);
		while (depthIndexes.length > depth) depthIndexes.pop();
		const parentIndex = depth === 0 ? null : depthIndexes[depth - 1] ?? null;
		const warning = depth > 0 && parentIndex == null ? "缩进缺少上级，将暂时放在根节点" : !bullet && !heading && leading.length === 0 ? "未识别到列表标记" : void 0;
		const index = candidates.length;
		candidates.push({
			id: `outline-${index}`,
			title,
			depth: parentIndex == null ? 0 : depth,
			parentIndex,
			checkpoint,
			warning
		});
		depthIndexes[depth] = index;
	}
	return candidates;
}
function parseProjectMarkdown(input) {
	const errors = [];
	const frontmatter = input.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
	const metadata = /* @__PURE__ */ new Map();
	if (frontmatter) for (const line of frontmatter[1].split(/\r?\n/)) {
		const match = line.match(/^([a-zA-Z]+):\s*(.+)$/);
		if (match) metadata.set(match[1].toLowerCase(), match[2].trim());
	}
	else errors.push("缺少文件开头的 Goal 和 Project 信息");
	const project = metadata.get("project") ?? input.match(/^\s*#\s+(.+)$/m)?.[1]?.trim() ?? "";
	const goal = metadata.get("goal") ?? "";
	if (!goal) errors.push("没有写明 goal");
	if (!project) errors.push("没有写明 project");
	const candidates = parseProjectOutline(input);
	if (!candidates.length) errors.push("没有识别到任何 Bullet Point");
	for (const candidate of candidates) if (candidate.warning) errors.push(`${candidate.title}：${candidate.warning}`);
	const parentIndexes = new Set(candidates.map((candidate) => candidate.parentIndex).filter((index) => index != null));
	candidates.forEach((candidate, index) => {
		if (!parentIndexes.has(index) && candidate.checkpoint === false) {
			candidate.warning = "叶子节点应使用 - [ ]";
			errors.push(`${candidate.title}：叶子节点应使用 - [ ]`);
		}
	});
	return {
		goal,
		project,
		candidates,
		errors: [...new Set(errors)]
	};
}
//#endregion
//#region lib/planning/project-tree.ts
function buildProjectTreeIndex(nodes) {
	const activeNodes = nodes.filter((node) => !node.deletedAt);
	const childrenByParentId = /* @__PURE__ */ new Map();
	for (const node of activeNodes) {
		const children = childrenByParentId.get(node.parentId) ?? [];
		children.push(node);
		childrenByParentId.set(node.parentId, children);
	}
	for (const children of childrenByParentId.values()) children.sort((a, b) => a.order - b.order);
	const leafIds = new Set(activeNodes.filter((node) => !childrenByParentId.get(node.id)?.length).map((node) => node.id));
	const progressByNodeId = /* @__PURE__ */ new Map();
	const visiting = /* @__PURE__ */ new Set();
	const progressFor = (node) => {
		const cached = progressByNodeId.get(node.id);
		if (cached) return cached;
		if (visiting.has(node.id)) return {
			completed: 0,
			total: 0
		};
		visiting.add(node.id);
		const children = childrenByParentId.get(node.id) ?? [];
		const progress = children.length ? children.reduce((total, child) => {
			const childProgress = progressFor(child);
			total.completed += childProgress.completed;
			total.total += childProgress.total;
			return total;
		}, {
			completed: 0,
			total: 0
		}) : {
			completed: node.status === "completed" ? 1 : 0,
			total: 1
		};
		visiting.delete(node.id);
		progressByNodeId.set(node.id, progress);
		return progress;
	};
	for (const node of activeNodes) progressFor(node);
	return {
		childrenByParentId,
		leafIds,
		progressByNodeId
	};
}
function nodeChildren(nodes, parentId) {
	return nodes.filter((node) => node.parentId === parentId && !node.deletedAt).sort((a, b) => a.order - b.order);
}
function isLeafNode(nodeId, nodes) {
	return !nodes.some((node) => node.parentId === nodeId && !node.deletedAt);
}
function collectDescendants(nodeId, nodes) {
	const result = [];
	const queue = [nodeId];
	while (queue.length) {
		const parent = queue.shift();
		for (const child of nodes.filter((node) => node.parentId === parent && !node.deletedAt)) {
			result.push(child);
			queue.push(child.id);
		}
	}
	return result;
}
function wouldCreateCycle(nodeId, candidateParentId, nodes) {
	if (!candidateParentId) return false;
	if (nodeId === candidateParentId) return true;
	return collectDescendants(nodeId, nodes).some((node) => node.id === candidateParentId);
}
function taskTitleForBlock(block, tasks, nodes) {
	return block.sourceType === "task" ? tasks.find((task) => task.id === block.sourceId)?.title ?? "已删除任务" : nodes.find((node) => node.id === block.sourceId)?.title ?? "已删除项目任务";
}
function projectPath(nodeId, nodes, projects, goals) {
	const node = nodes.find((item) => item.id === nodeId);
	if (!node) return "";
	const project = projects.find((item) => item.id === node.projectId);
	const goal = goals.find((item) => item.id === project?.goalId);
	const names = [];
	let current = node.parentId ? nodes.find((item) => item.id === node.parentId) : void 0;
	while (current) {
		names.unshift(current.title);
		current = current.parentId ? nodes.find((item) => item.id === current?.parentId) : void 0;
	}
	return [
		goal?.name,
		project?.title,
		...names
	].filter(Boolean).join(" › ");
}
//#endregion
//#region lib/planning/timeline.ts
function resolveTimelineWindow(date, displayStart, displayEnd, intervals = []) {
	const atClock = (clock) => {
		const [hour, minute] = clock.split(":").map(Number);
		const result = new Date(date);
		result.setHours(hour, minute, 0, 0);
		return result;
	};
	const configuredStart = atClock(displayStart);
	const configuredEnd = atClock(displayEnd);
	if (configuredEnd <= configuredStart) configuredEnd.setDate(configuredEnd.getDate() + 1);
	let start = configuredStart;
	let end = configuredEnd;
	for (const interval of intervals) {
		const intervalStart = new Date(interval.startAt);
		const intervalEnd = new Date(interval.endAt);
		if (Number.isNaN(intervalStart.getTime()) || Number.isNaN(intervalEnd.getTime())) continue;
		if (intervalStart < start) start = intervalStart;
		if (intervalEnd > end) end = intervalEnd;
	}
	return {
		start,
		end,
		totalMinutes: Math.max(1, (end.getTime() - start.getTime()) / 6e4)
	};
}
function timelineOffsetMinutes(value, window) {
	return ((value instanceof Date ? value : new Date(value)).getTime() - window.start.getTime()) / 6e4;
}
/** Calendar uses the exact display window selected in Settings. */
function buildCalendarTimelineScale(startMinute, endMinute, pixelsPerTwoHours = 56) {
	const safeEnd = Math.max(startMinute + 120, endMinute);
	const height = (safeEnd - startMinute) / 120 * pixelsPerTwoHours;
	const scale = {
		startMinute,
		endMinute: safeEnd,
		height,
		segments: [{
			startMinute,
			endMinute: safeEnd,
			top: 0,
			height,
			isGap: false
		}]
	};
	const markerMinutes = [];
	for (let minute = startMinute; minute <= safeEnd; minute += 120) markerMinutes.push(minute);
	if (markerMinutes.at(-1) !== safeEnd) markerMinutes.push(safeEnd);
	return {
		scale,
		markerMinutes
	};
}
/**
* Keeps event duration spatially meaningful while collapsing long empty
* stretches into a clearly labelled gap. The result remains reversible so
* Calendar drag/drop can keep its 15-minute precision.
*/
function buildCompactTimelineScale(startMinute, endMinute, occupied, hourHeight, gapThresholdMinutes = 20) {
	const safeEnd = Math.max(startMinute + 1, endMinute);
	const merged = occupied.map((interval) => ({
		startMinute: Math.max(startMinute, Math.min(safeEnd, interval.startMinute)),
		endMinute: Math.max(startMinute, Math.min(safeEnd, interval.endMinute))
	})).filter((interval) => interval.endMinute > interval.startMinute).sort((a, b) => a.startMinute - b.startMinute).reduce((result, interval) => {
		const previous = result.at(-1);
		if (!previous || interval.startMinute > previous.endMinute) result.push({ ...interval });
		else previous.endMinute = Math.max(previous.endMinute, interval.endMinute);
		return result;
	}, []);
	const rawSegments = [];
	let cursor = startMinute;
	for (const interval of merged) {
		if (interval.startMinute > cursor) rawSegments.push({
			startMinute: cursor,
			endMinute: interval.startMinute,
			isGap: true
		});
		rawSegments.push({
			...interval,
			isGap: false
		});
		cursor = interval.endMinute;
	}
	if (cursor < safeEnd) rawSegments.push({
		startMinute: cursor,
		endMinute: safeEnd,
		isGap: true
	});
	if (!rawSegments.length) rawSegments.push({
		startMinute,
		endMinute: safeEnd,
		isGap: true
	});
	let top = 0;
	const segments = rawSegments.map((segment) => {
		const duration = segment.endMinute - segment.startMinute;
		const naturalHeight = duration / 60 * hourHeight;
		const height = segment.isGap && duration > gapThresholdMinutes ? Math.min(54, Math.max(34, 30 + Math.log2(duration / gapThresholdMinutes) * 6)) : segment.isGap ? naturalHeight : Math.max(28, naturalHeight);
		const result = {
			...segment,
			top,
			height
		};
		top += height;
		return result;
	});
	return {
		startMinute,
		endMinute: safeEnd,
		height: top,
		segments
	};
}
function compactTimelineY(minute, scale) {
	const clamped = Math.max(scale.startMinute, Math.min(scale.endMinute, minute));
	const segment = scale.segments.find((candidate) => clamped >= candidate.startMinute && clamped <= candidate.endMinute) ?? scale.segments.at(-1);
	if (!segment) return 0;
	const duration = Math.max(1, segment.endMinute - segment.startMinute);
	return segment.top + (clamped - segment.startMinute) / duration * segment.height;
}
function compactTimelineMinuteAtY(y, scale) {
	const clamped = Math.max(0, Math.min(scale.height, y));
	const segment = scale.segments.find((candidate) => clamped >= candidate.top && clamped <= candidate.top + candidate.height) ?? scale.segments.at(-1);
	if (!segment) return scale.startMinute;
	const ratio = segment.height ? (clamped - segment.top) / segment.height : 0;
	return segment.startMinute + ratio * (segment.endMinute - segment.startMinute);
}
function formatGapDuration(minutes) {
	const rounded = Math.max(0, Math.round(minutes));
	const hours = Math.floor(rounded / 60);
	const remainder = rounded % 60;
	if (!hours) return `${remainder}m`;
	if (!remainder) return `${hours}h`;
	return `${hours}h ${remainder}m`;
}
//#endregion
//#region lib/planning/recommendations.ts
function recommendationTargetDate(now = /* @__PURE__ */ new Date()) {
	const target = new Date(now);
	target.setHours(12, 0, 0, 0);
	return target;
}
function freeTimeRanges(date, wakeTime, sleepTime, events, blocks, tasks = [], minimumMinutes = 20) {
	const key = localDateKey(date);
	if (tasks.some((task) => {
		if (task.status !== "open" || !task.isAllDay) return false;
		const occurrence = taskOccurrenceOnDay(task, date);
		return Boolean(occurrence && !isTaskOccurrenceCompleted(task, occurrence));
	})) return [];
	const fromClock = (clock) => {
		const [hour, minute] = clock.split(":").map(Number);
		const result = new Date(date);
		result.setHours(hour, minute, 0, 0);
		return result;
	};
	const start = fromClock(wakeTime);
	const end = fromClock(sleepTime);
	if (end <= start) end.setDate(end.getDate() + 1);
	const occupied = [
		...events.filter((event) => event.status !== "completed").flatMap((event) => {
			const occurrence = eventOccurrenceOnDay(event, date);
			if (!occurrence) return [];
			const duration = new Date(event.endAt).getTime() - new Date(event.startAt).getTime();
			return [[new Date(occurrence), new Date(new Date(occurrence).getTime() + duration)]];
		}),
		...blocks.filter((block) => block.date === key && block.status === "planned" && block.startAt).map((block) => [new Date(block.startAt), new Date(block.endAt ?? new Date(new Date(block.startAt).getTime() + 60 * 6e4).toISOString())]),
		...tasks.filter((task) => task.status === "open" && task.scheduledStartAt && localDateKey(new Date(task.scheduledStartAt)) === key).map((task) => [new Date(task.scheduledStartAt), new Date(new Date(task.scheduledStartAt).getTime() + (task.durationMinutes ?? 0) * 6e4)])
	].map(([a, b]) => [new Date(Math.max(a.getTime(), start.getTime())), new Date(Math.min(b.getTime(), end.getTime()))]).filter(([a, b]) => b > a).sort((a, b) => a[0].getTime() - b[0].getTime());
	const merged = [];
	for (const interval of occupied) {
		const last = merged.at(-1);
		if (last && interval[0] <= last[1]) last[1] = new Date(Math.max(last[1].getTime(), interval[1].getTime()));
		else merged.push([new Date(interval[0]), new Date(interval[1])]);
	}
	const result = [];
	let cursor = start;
	for (const [busyStart, busyEnd] of merged) {
		if (busyStart > cursor) result.push({
			startAt: cursor.toISOString(),
			endAt: busyStart.toISOString(),
			minutes: Math.round((busyStart.getTime() - cursor.getTime()) / 6e4)
		});
		if (busyEnd > cursor) cursor = busyEnd;
	}
	if (cursor < end) result.push({
		startAt: cursor.toISOString(),
		endAt: end.toISOString(),
		minutes: Math.round((end.getTime() - cursor.getTime()) / 6e4)
	});
	return result.filter((range) => range.minutes >= minimumMinutes);
}
function recommendationLimit(ranges) {
	const largest = Math.max(0, ...ranges.map((range) => range.minutes));
	if (largest < 20) return 0;
	if (largest < 60) return 1;
	if (largest < 120) return 2;
	return 3;
}
function buildAdvanceCandidates({ tasks, projectNodes, projects, goals, scheduleBlocks, targetDate, now = /* @__PURE__ */ new Date() }) {
	const todayKey = localDateKey(now);
	const targetDateKey = localDateKey(targetDate);
	const scheduledIds = new Set(scheduleBlocks.filter((block) => block.status === "planned" && block.date >= todayKey && !block.deletedAt).map((block) => block.sourceId));
	const futureDirectTasks = new Set(tasks.filter((task) => task.scheduledStartAt && new Date(task.scheduledStartAt) >= startOfLocalDay(now)).map((task) => task.id));
	const parentNodeIds = new Set(projectNodes.map((node) => node.parentId).filter((id) => Boolean(id)));
	const nodesById = new Map(projectNodes.map((node) => [node.id, node]));
	const projectsById = new Map(projects.map((project) => [project.id, project]));
	const goalsById = new Map(goals.map((goal) => [goal.id, goal]));
	const pathFor = (node) => {
		const project = projectsById.get(node.projectId);
		const goal = project ? goalsById.get(project.goalId) : void 0;
		const names = [];
		let current = node.parentId ? nodesById.get(node.parentId) : void 0;
		while (current) {
			names.unshift(current.title);
			current = current.parentId ? nodesById.get(current.parentId) : void 0;
		}
		return [
			goal?.name,
			project?.title,
			...names
		].filter(Boolean).join(" › ");
	};
	const daysUntil = (date) => date ? Math.ceil(((/* @__PURE__ */ new Date(`${date}T12:00:00`)).getTime() - targetDate.getTime()) / 864e5) : null;
	const projectScore = (projectId, focused) => {
		const remaining = daysUntil(projectsById.get(projectId)?.plannedEndDate);
		return (focused ? 100 : 0) + (remaining == null ? 0 : remaining <= 0 ? 45 : remaining <= 7 ? 30 : remaining <= 14 ? 15 : 0);
	};
	const nodeCandidates = projectNodes.flatMap((node) => {
		const project = projectsById.get(node.projectId);
		if (!project || project.status !== "active" || node.status !== "open" || !node.isFocused || parentNodeIds.has(node.id) || scheduledIds.has(node.id)) return [];
		return [{
			id: node.id,
			title: node.title,
			caption: pathFor(node),
			source: node,
			needsContinuousTime: Boolean(node.needsContinuousTime),
			isFragmentFriendly: Boolean(node.isFragmentFriendly),
			score: projectScore(project.id, node.isFocused),
			startsLater: Boolean(project.plannedStartDate && project.plannedStartDate > targetDateKey)
		}];
	});
	const taskCandidates = tasks.flatMap((task) => {
		if (task.status !== "open" || task.isAllDay || scheduledIds.has(task.id) || futureDirectTasks.has(task.id)) return [];
		const anchor = task.taskKind === "assignment" ? task.actualDeadlineAt ?? task.desiredCompletionAt : task.dueAt;
		const remaining = anchor ? Math.ceil((new Date(anchor).getTime() - targetDate.getTime()) / 864e5) : null;
		return [{
			id: task.id,
			title: task.title,
			caption: task.taskKind === "assignment" ? remaining != null ? `Deadline · ${remaining <= 0 ? "已到期" : `还有 ${remaining} 天`}` : "Deadline · 尚未安排执行" : task.planningState === "draft" ? "待落实事项" : "尚未安排执行时间",
			source: task,
			needsContinuousTime: Boolean(task.needsContinuousTime),
			isFragmentFriendly: Boolean(task.isFragmentFriendly),
			score: remaining == null ? 0 : remaining <= 0 ? 40 : remaining <= 3 ? 25 : remaining <= 7 ? 12 : 0,
			startsLater: false
		}];
	});
	return [...nodeCandidates, ...taskCandidates].sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "zh-CN"));
}
function recommendCandidatesForGaps(candidates, ranges) {
	const limit = recommendationLimit(ranges);
	if (!limit) return [];
	const largestGap = Math.max(0, ...ranges.map((range) => range.minutes));
	const fragmentedDay = ranges.filter((range) => range.minutes >= 20 && range.minutes < 60).length >= 2;
	const fitScore = (candidate) => {
		if (candidate.startsLater) return Number.NEGATIVE_INFINITY;
		if (candidate.needsContinuousTime && largestGap < 120) return Number.NEGATIVE_INFINITY;
		if (largestGap >= 120) return candidate.needsContinuousTime ? 100 : candidate.isFragmentFriendly ? 10 : 25;
		if (largestGap < 60) return candidate.isFragmentFriendly ? 90 : 10;
		return candidate.isFragmentFriendly ? 35 : 20;
	};
	return candidates.map((candidate) => ({
		candidate,
		rank: candidate.score + fitScore(candidate) + (fragmentedDay && candidate.isFragmentFriendly ? 60 : 0)
	})).filter((entry) => Number.isFinite(entry.rank)).sort((a, b) => b.rank - a.rank || a.candidate.title.localeCompare(b.candidate.title, "zh-CN")).slice(0, limit).map((entry) => entry.candidate);
}
//#endregion
//#region lib/planning/project-markdown.ts
function buildChatGptContext(goal, project, nodes) {
	const lines = [
		buildProjectMarkdown(goal, project, nodes),
		"",
		"---",
		""
	];
	lines.push("请与我讨论并完善这个 Project。最后只返回一份完整 Markdown，保持原有 frontmatter、缩进和 Checklist 格式。");
	return lines.join("\n");
}
function buildProjectMarkdown(goal, project, nodes) {
	const lines = [
		"---",
		`goal: ${goal.name}`,
		`project: ${project.title}`,
		"---",
		"",
		`# ${project.title}`,
		""
	];
	const visit = (parentId, depth) => {
		for (const node of nodeChildren(nodes.filter((item) => item.projectId === project.id), parentId)) {
			const bullet = isLeafNode(node.id, nodes) ? `- [${node.status === "completed" ? "x" : " "}]` : "-";
			lines.push(`${"  ".repeat(depth)}${bullet} ${node.title}`);
			visit(node.id, depth + 1);
		}
	};
	visit(null, 0);
	return lines.join("\n");
}
//#endregion
//#region lib/planning/course-tasks.ts
function nextCourseTaskSlot(courseStartAt, courseEndAt, tasks) {
	const courseStart = new Date(courseStartAt).getTime();
	const courseEnd = new Date(courseEndAt).getTime();
	let cursor = courseStart;
	for (const task of tasks) {
		if (!task.scheduledStartAt) continue;
		const taskStart = new Date(task.scheduledStartAt).getTime();
		if (taskStart < courseStart || taskStart >= courseEnd) continue;
		const taskEnd = taskStart + (task.durationMinutes ?? 0) * 6e4;
		cursor = Math.max(cursor, taskEnd);
	}
	if (cursor >= courseEnd) cursor = courseStart;
	const availableMinutes = Math.max(0, Math.floor((courseEnd - cursor) / 6e4));
	return {
		startAt: new Date(cursor).toISOString(),
		durationMinutes: availableMinutes >= 5 ? Math.min(30, availableMinutes) : null
	};
}
//#endregion
//#region node_modules/dexie/import-wrapper-prod.mjs
var import_dexie_min = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(e, t) {
		"object" == typeof exports && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t) : (e = "undefined" != typeof globalThis ? globalThis : e || self).Dexie = t();
	})(exports, function() {
		"use strict";
		var s = function(e, t) {
			return (s = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, t) {
				e.__proto__ = t;
			} || function(e, t) {
				for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n]);
			})(e, t);
		};
		var _ = function() {
			return (_ = Object.assign || function(e) {
				for (var t, n = 1, r = arguments.length; n < r; n++) for (var i in t = arguments[n]) Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
				return e;
			}).apply(this, arguments);
		};
		function i(e, t, n) {
			if (n || 2 === arguments.length) for (var r, i = 0, o = t.length; i < o; i++) !r && i in t || ((r = r || Array.prototype.slice.call(t, 0, i))[i] = t[i]);
			return e.concat(r || Array.prototype.slice.call(t));
		}
		var f = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof self ? self : "undefined" != typeof window ? window : global, O = Object.keys, x = Array.isArray;
		function a(t, n) {
			return "object" != typeof n || O(n).forEach(function(e) {
				t[e] = n[e];
			}), t;
		}
		"undefined" == typeof Promise || f.Promise || (f.Promise = Promise);
		var c = Object.getPrototypeOf, n = {}.hasOwnProperty;
		function m(e, t) {
			return n.call(e, t);
		}
		function r(t, n) {
			"function" == typeof n && (n = n(c(t))), ("undefined" == typeof Reflect ? O : Reflect.ownKeys)(n).forEach(function(e) {
				l(t, e, n[e]);
			});
		}
		var u = Object.defineProperty;
		function l(e, t, n, r) {
			u(e, t, a(n && m(n, "get") && "function" == typeof n.get ? {
				get: n.get,
				set: n.set,
				configurable: !0
			} : {
				value: n,
				configurable: !0,
				writable: !0
			}, r));
		}
		function o(t) {
			return { from: function(e) {
				return t.prototype = Object.create(e.prototype), l(t.prototype, "constructor", t), { extend: r.bind(null, t.prototype) };
			} };
		}
		var h = Object.getOwnPropertyDescriptor;
		var d = [].slice;
		function b(e, t, n) {
			return d.call(e, t, n);
		}
		function p(e, t) {
			return t(e);
		}
		function y(e) {
			if (!e) throw new Error("Assertion Failed");
		}
		function v(e) {
			f.setImmediate ? setImmediate(e) : setTimeout(e, 0);
		}
		function g(e, t) {
			if ("string" == typeof t && m(e, t)) return e[t];
			if (!t) return e;
			if ("string" != typeof t) {
				for (var n = [], r = 0, i = t.length; r < i; ++r) {
					var o = g(e, t[r]);
					n.push(o);
				}
				return n;
			}
			var a = t.indexOf(".");
			if (-1 !== a) {
				var u = e[t.substr(0, a)];
				return null == u ? void 0 : g(u, t.substr(a + 1));
			}
		}
		function w(e, t, n) {
			if (e && void 0 !== t && !("isFrozen" in Object && Object.isFrozen(e))) if ("string" != typeof t && "length" in t) {
				y("string" != typeof n && "length" in n);
				for (var r = 0, i = t.length; r < i; ++r) w(e, t[r], n[r]);
			} else {
				var o, a, u = t.indexOf(".");
				-1 !== u ? (o = t.substr(0, u), "" === (a = t.substr(u + 1)) ? void 0 === n ? x(e) && !isNaN(parseInt(o)) ? e.splice(o, 1) : delete e[o] : e[o] = n : w(u = !(u = e[o]) || !m(e, o) ? e[o] = {} : u, a, n)) : void 0 === n ? x(e) && !isNaN(parseInt(t)) ? e.splice(t, 1) : delete e[t] : e[t] = n;
			}
		}
		function k(e) {
			var t, n = {};
			for (t in e) m(e, t) && (n[t] = e[t]);
			return n;
		}
		var t = [].concat;
		function P(e) {
			return t.apply([], e);
		}
		var e = "BigUint64Array,BigInt64Array,Array,Boolean,String,Date,RegExp,Blob,File,FileList,FileSystemFileHandle,FileSystemDirectoryHandle,ArrayBuffer,DataView,Uint8ClampedArray,ImageBitmap,ImageData,Map,Set,CryptoKey".split(",").concat(P([
			8,
			16,
			32,
			64
		].map(function(t) {
			return [
				"Int",
				"Uint",
				"Float"
			].map(function(e) {
				return e + t + "Array";
			});
		}))).filter(function(e) {
			return f[e];
		}), K = new Set(e.map(function(e) {
			return f[e];
		}));
		var E = null;
		function S(e) {
			E = /* @__PURE__ */ new WeakMap();
			e = function e(t) {
				if (!t || "object" != typeof t) return t;
				var n = E.get(t);
				if (n) return n;
				if (x(t)) {
					n = [], E.set(t, n);
					for (var r = 0, i = t.length; r < i; ++r) n.push(e(t[r]));
				} else if (K.has(t.constructor)) n = t;
				else {
					var o, a = c(t);
					for (o in n = a === Object.prototype ? {} : Object.create(a), E.set(t, n), t) m(t, o) && (n[o] = e(t[o]));
				}
				return n;
			}(e);
			return E = null, e;
		}
		var j = {}.toString;
		function A(e) {
			return j.call(e).slice(8, -1);
		}
		var C = "undefined" != typeof Symbol ? Symbol.iterator : "@@iterator", T = "symbol" == typeof C ? function(e) {
			var t;
			return null != e && (t = e[C]) && t.apply(e);
		} : function() {
			return null;
		};
		function I(e, t) {
			t = e.indexOf(t);
			return 0 <= t && e.splice(t, 1), 0 <= t;
		}
		var q = {};
		function D(e) {
			var t, n, r, i;
			if (1 === arguments.length) {
				if (x(e)) return e.slice();
				if (this === q && "string" == typeof e) return [e];
				if (i = T(e)) {
					for (n = []; !(r = i.next()).done;) n.push(r.value);
					return n;
				}
				if (null == e) return [e];
				if ("number" != typeof (t = e.length)) return [e];
				for (n = new Array(t); t--;) n[t] = e[t];
				return n;
			}
			for (t = arguments.length, n = new Array(t); t--;) n[t] = arguments[t];
			return n;
		}
		var B = "undefined" != typeof Symbol ? function(e) {
			return "AsyncFunction" === e[Symbol.toStringTag];
		} : function() {
			return !1;
		}, R = [
			"Unknown",
			"Constraint",
			"Data",
			"TransactionInactive",
			"ReadOnly",
			"Version",
			"NotFound",
			"InvalidState",
			"InvalidAccess",
			"Abort",
			"Timeout",
			"QuotaExceeded",
			"Syntax",
			"DataClone"
		], F = [
			"Modify",
			"Bulk",
			"OpenFailed",
			"VersionChange",
			"Schema",
			"Upgrade",
			"InvalidTable",
			"MissingAPI",
			"NoSuchDatabase",
			"InvalidArgument",
			"SubTransaction",
			"Unsupported",
			"Internal",
			"DatabaseClosed",
			"PrematureCommit",
			"ForeignAwait"
		].concat(R), M = {
			VersionChanged: "Database version changed by other database connection",
			DatabaseClosed: "Database has been closed",
			Abort: "Transaction aborted",
			TransactionInactive: "Transaction has already completed or failed",
			MissingAPI: "IndexedDB API missing. Please visit https://tinyurl.com/y2uuvskb"
		};
		function N(e, t) {
			this.name = e, this.message = t;
		}
		function L(e, t) {
			return e + ". Errors: " + Object.keys(t).map(function(e) {
				return t[e].toString();
			}).filter(function(e, t, n) {
				return n.indexOf(e) === t;
			}).join("\n");
		}
		function U(e, t, n, r) {
			this.failures = t, this.failedKeys = r, this.successCount = n, this.message = L(e, t);
		}
		function V(e, t) {
			this.name = "BulkError", this.failures = Object.keys(t).map(function(e) {
				return t[e];
			}), this.failuresByPos = t, this.message = L(e, this.failures);
		}
		o(N).from(Error).extend({ toString: function() {
			return this.name + ": " + this.message;
		} }), o(U).from(N), o(V).from(N);
		var z = F.reduce(function(e, t) {
			return e[t] = t + "Error", e;
		}, {}), W = N, Y = F.reduce(function(e, n) {
			var r = n + "Error";
			function t(e, t) {
				this.name = r, e ? "string" == typeof e ? (this.message = "".concat(e).concat(t ? "\n " + t : ""), this.inner = t || null) : "object" == typeof e && (this.message = "".concat(e.name, " ").concat(e.message), this.inner = e) : (this.message = M[n] || r, this.inner = null);
			}
			return o(t).from(W), e[n] = t, e;
		}, {});
		Y.Syntax = SyntaxError, Y.Type = TypeError, Y.Range = RangeError;
		var $ = R.reduce(function(e, t) {
			return e[t + "Error"] = Y[t], e;
		}, {});
		var Q = F.reduce(function(e, t) {
			return -1 === [
				"Syntax",
				"Type",
				"Range"
			].indexOf(t) && (e[t + "Error"] = Y[t]), e;
		}, {});
		function G() {}
		function X(e) {
			return e;
		}
		function H(t, n) {
			return null == t || t === X ? n : function(e) {
				return n(t(e));
			};
		}
		function J(e, t) {
			return function() {
				e.apply(this, arguments), t.apply(this, arguments);
			};
		}
		function Z(i, o) {
			return i === G ? o : function() {
				var e = i.apply(this, arguments);
				void 0 !== e && (arguments[0] = e);
				var t = this.onsuccess, n = this.onerror;
				this.onsuccess = null, this.onerror = null;
				var r = o.apply(this, arguments);
				return t && (this.onsuccess = this.onsuccess ? J(t, this.onsuccess) : t), n && (this.onerror = this.onerror ? J(n, this.onerror) : n), void 0 !== r ? r : e;
			};
		}
		function ee(n, r) {
			return n === G ? r : function() {
				n.apply(this, arguments);
				var e = this.onsuccess, t = this.onerror;
				this.onsuccess = this.onerror = null, r.apply(this, arguments), e && (this.onsuccess = this.onsuccess ? J(e, this.onsuccess) : e), t && (this.onerror = this.onerror ? J(t, this.onerror) : t);
			};
		}
		function te(i, o) {
			return i === G ? o : function(e) {
				var t = i.apply(this, arguments);
				a(e, t);
				var n = this.onsuccess, r = this.onerror;
				this.onsuccess = null, this.onerror = null;
				e = o.apply(this, arguments);
				return n && (this.onsuccess = this.onsuccess ? J(n, this.onsuccess) : n), r && (this.onerror = this.onerror ? J(r, this.onerror) : r), void 0 === t ? void 0 === e ? void 0 : e : a(t, e);
			};
		}
		function ne(e, t) {
			return e === G ? t : function() {
				return !1 !== t.apply(this, arguments) && e.apply(this, arguments);
			};
		}
		function re(i, o) {
			return i === G ? o : function() {
				var e = i.apply(this, arguments);
				if (e && "function" == typeof e.then) {
					for (var t = this, n = arguments.length, r = new Array(n); n--;) r[n] = arguments[n];
					return e.then(function() {
						return o.apply(t, r);
					});
				}
				return o.apply(this, arguments);
			};
		}
		Q.ModifyError = U, Q.DexieError = N, Q.BulkError = V;
		var ie = "undefined" != typeof location && /^(http|https):\/\/(localhost|127\.0\.0\.1)/.test(location.href);
		function oe(e) {
			ie = e;
		}
		var ae = {}, ue = 100, e = "undefined" == typeof Promise ? [] : function() {
			var e = Promise.resolve();
			if ("undefined" == typeof crypto || !crypto.subtle) return [
				e,
				c(e),
				e
			];
			var t = crypto.subtle.digest("SHA-512", new Uint8Array([0]));
			return [
				t,
				c(t),
				e
			];
		}(), R = e[0], F = e[1], e = e[2], F = F && F.then, se = R && R.constructor, ce = !!e;
		var le = function(e, t) {
			be.push([e, t]), he && (queueMicrotask(Se), he = !1);
		}, fe = !0, he = !0, de = [], pe = [], ye = X, ve = {
			id: "global",
			global: !0,
			ref: 0,
			unhandleds: [],
			onunhandled: G,
			pgp: !1,
			env: {},
			finalize: G
		}, me = ve, be = [], ge = 0, we = [];
		function _e(e) {
			if ("object" != typeof this) throw new TypeError("Promises must be constructed via new");
			this._listeners = [], this._lib = !1;
			var t = this._PSD = me;
			if ("function" != typeof e) {
				if (e !== ae) throw new TypeError("Not a function");
				this._state = arguments[1], this._value = arguments[2], !1 === this._state && Oe(this, this._value);
				return;
			}
			this._state = null, this._value = null, ++t.ref, function t(r, e) {
				try {
					e(function(n) {
						if (null === r._state) {
							if (n === r) throw new TypeError("A promise cannot be resolved with itself.");
							var e = r._lib && je();
							n && "function" == typeof n.then ? t(r, function(e, t) {
								n instanceof _e ? n._then(e, t) : n.then(e, t);
							}) : (r._state = !0, r._value = n, Pe(r)), e && Ae();
						}
					}, Oe.bind(null, r));
				} catch (e) {
					Oe(r, e);
				}
			}(this, e);
		}
		var xe = {
			get: function() {
				var u = me, t = Fe;
				function e(n, r) {
					var i = this, o = !u.global && (u !== me || t !== Fe), a = o && !Ue(), e = new _e(function(e, t) {
						Ke(i, new ke(Qe(n, u, o, a), Qe(r, u, o, a), e, t, u));
					});
					return this._consoleTask && (e._consoleTask = this._consoleTask), e;
				}
				return e.prototype = ae, e;
			},
			set: function(e) {
				l(this, "then", e && e.prototype === ae ? xe : {
					get: function() {
						return e;
					},
					set: xe.set
				});
			}
		};
		function ke(e, t, n, r, i) {
			this.onFulfilled = "function" == typeof e ? e : null, this.onRejected = "function" == typeof t ? t : null, this.resolve = n, this.reject = r, this.psd = i;
		}
		function Oe(e, t) {
			var n, r;
			pe.push(t), null === e._state && (n = e._lib && je(), t = ye(t), e._state = !1, e._value = t, r = e, de.some(function(e) {
				return e._value === r._value;
			}) || de.push(r), Pe(e), n && Ae());
		}
		function Pe(e) {
			var t = e._listeners;
			e._listeners = [];
			for (var n = 0, r = t.length; n < r; ++n) Ke(e, t[n]);
			var i = e._PSD;
			--i.ref || i.finalize(), 0 === ge && (++ge, le(function() {
				0 == --ge && Ce();
			}, []));
		}
		function Ke(e, t) {
			if (null !== e._state) {
				var n = e._state ? t.onFulfilled : t.onRejected;
				if (null === n) return (e._state ? t.resolve : t.reject)(e._value);
				++t.psd.ref, ++ge, le(Ee, [
					n,
					e,
					t
				]);
			} else e._listeners.push(t);
		}
		function Ee(e, t, n) {
			try {
				var r, i = t._value;
				!t._state && pe.length && (pe = []), r = ie && t._consoleTask ? t._consoleTask.run(function() {
					return e(i);
				}) : e(i), t._state || -1 !== pe.indexOf(i) || function(e) {
					var t = de.length;
					for (; t;) if (de[--t]._value === e._value) return de.splice(t, 1);
				}(t), n.resolve(r);
			} catch (e) {
				n.reject(e);
			} finally {
				0 == --ge && Ce(), --n.psd.ref || n.psd.finalize();
			}
		}
		function Se() {
			$e(ve, function() {
				je() && Ae();
			});
		}
		function je() {
			var e = fe;
			return he = fe = !1, e;
		}
		function Ae() {
			var e, t, n;
			do
				for (; 0 < be.length;) for (e = be, be = [], n = e.length, t = 0; t < n; ++t) {
					var r = e[t];
					r[0].apply(null, r[1]);
				}
			while (0 < be.length);
			he = fe = !0;
		}
		function Ce() {
			var e = de;
			de = [], e.forEach(function(e) {
				e._PSD.onunhandled.call(null, e._value, e);
			});
			for (var t = we.slice(0), n = t.length; n;) t[--n]();
		}
		function Te(e) {
			return new _e(ae, !1, e);
		}
		function Ie(n, r) {
			var i = me;
			return function() {
				var e = je(), t = me;
				try {
					return We(i, !0), n.apply(this, arguments);
				} catch (e) {
					r && r(e);
				} finally {
					We(t, !1), e && Ae();
				}
			};
		}
		r(_e.prototype, {
			then: xe,
			_then: function(e, t) {
				Ke(this, new ke(null, null, e, t, me));
			},
			catch: function(e) {
				if (1 === arguments.length) return this.then(null, e);
				var t = e, n = arguments[1];
				return "function" == typeof t ? this.then(null, function(e) {
					return (e instanceof t ? n : Te)(e);
				}) : this.then(null, function(e) {
					return (e && e.name === t ? n : Te)(e);
				});
			},
			finally: function(t) {
				return this.then(function(e) {
					return _e.resolve(t()).then(function() {
						return e;
					});
				}, function(e) {
					return _e.resolve(t()).then(function() {
						return Te(e);
					});
				});
			},
			timeout: function(r, i) {
				var o = this;
				return r < Infinity ? new _e(function(e, t) {
					var n = setTimeout(function() {
						return t(new Y.Timeout(i));
					}, r);
					o.then(e, t).finally(clearTimeout.bind(null, n));
				}) : this;
			}
		}), "undefined" != typeof Symbol && Symbol.toStringTag && l(_e.prototype, Symbol.toStringTag, "Dexie.Promise"), ve.env = Ye(), r(_e, {
			all: function() {
				var o = D.apply(null, arguments).map(Ve);
				return new _e(function(n, r) {
					0 === o.length && n([]);
					var i = o.length;
					o.forEach(function(e, t) {
						return _e.resolve(e).then(function(e) {
							o[t] = e, --i || n(o);
						}, r);
					});
				});
			},
			resolve: function(n) {
				return n instanceof _e ? n : n && "function" == typeof n.then ? new _e(function(e, t) {
					n.then(e, t);
				}) : new _e(ae, !0, n);
			},
			reject: Te,
			race: function() {
				var e = D.apply(null, arguments).map(Ve);
				return new _e(function(t, n) {
					e.map(function(e) {
						return _e.resolve(e).then(t, n);
					});
				});
			},
			PSD: {
				get: function() {
					return me;
				},
				set: function(e) {
					return me = e;
				}
			},
			totalEchoes: { get: function() {
				return Fe;
			} },
			newPSD: Ne,
			usePSD: $e,
			scheduler: {
				get: function() {
					return le;
				},
				set: function(e) {
					le = e;
				}
			},
			rejectionMapper: {
				get: function() {
					return ye;
				},
				set: function(e) {
					ye = e;
				}
			},
			follow: function(i, n) {
				return new _e(function(e, t) {
					return Ne(function(n, r) {
						var e = me;
						e.unhandleds = [], e.onunhandled = r, e.finalize = J(function() {
							var t, e = this;
							t = function() {
								0 === e.unhandleds.length ? n() : r(e.unhandleds[0]);
							}, we.push(function e() {
								t(), we.splice(we.indexOf(e), 1);
							}), ++ge, le(function() {
								0 == --ge && Ce();
							}, []);
						}, e.finalize), i();
					}, n, e, t);
				});
			}
		}), se && (se.allSettled && l(_e, "allSettled", function() {
			var e = D.apply(null, arguments).map(Ve);
			return new _e(function(n) {
				0 === e.length && n([]);
				var r = e.length, i = new Array(r);
				e.forEach(function(e, t) {
					return _e.resolve(e).then(function(e) {
						return i[t] = {
							status: "fulfilled",
							value: e
						};
					}, function(e) {
						return i[t] = {
							status: "rejected",
							reason: e
						};
					}).then(function() {
						return --r || n(i);
					});
				});
			});
		}), se.any && "undefined" != typeof AggregateError && l(_e, "any", function() {
			var e = D.apply(null, arguments).map(Ve);
			return new _e(function(n, r) {
				0 === e.length && r(/* @__PURE__ */ new AggregateError([]));
				var i = e.length, o = new Array(i);
				e.forEach(function(e, t) {
					return _e.resolve(e).then(function(e) {
						return n(e);
					}, function(e) {
						o[t] = e, --i || r(new AggregateError(o));
					});
				});
			});
		}), se.withResolvers && (_e.withResolvers = se.withResolvers));
		var qe = {
			awaits: 0,
			echoes: 0,
			id: 0
		}, De = 0, Be = [], Re = 0, Fe = 0, Me = 0;
		function Ne(e, t, n, r) {
			var i = me, o = Object.create(i);
			o.parent = i, o.ref = 0, o.global = !1, o.id = ++Me, ve.env, o.env = ce ? {
				Promise: _e,
				PromiseProp: {
					value: _e,
					configurable: !0,
					writable: !0
				},
				all: _e.all,
				race: _e.race,
				allSettled: _e.allSettled,
				any: _e.any,
				resolve: _e.resolve,
				reject: _e.reject
			} : {}, t && a(o, t), ++i.ref, o.finalize = function() {
				--this.parent.ref || this.parent.finalize();
			};
			r = $e(o, e, n, r);
			return 0 === o.ref && o.finalize(), r;
		}
		function Le() {
			return qe.id || (qe.id = ++De), ++qe.awaits, qe.echoes += ue, qe.id;
		}
		function Ue() {
			return !!qe.awaits && (0 == --qe.awaits && (qe.id = 0), qe.echoes = qe.awaits * ue, !0);
		}
		function Ve(e) {
			return qe.echoes && e && e.constructor === se ? (Le(), e.then(function(e) {
				return Ue(), e;
			}, function(e) {
				return Ue(), Xe(e);
			})) : e;
		}
		function ze() {
			var e = Be[Be.length - 1];
			Be.pop(), We(e, !1);
		}
		function We(e, t) {
			var n, r = me;
			(t ? !qe.echoes || Re++ && e === me : !Re || --Re && e === me) || queueMicrotask(t ? function(e) {
				++Fe, qe.echoes && 0 != --qe.echoes || (qe.echoes = qe.awaits = qe.id = 0), Be.push(me), We(e, !0);
			}.bind(null, e) : ze), e !== me && (me = e, r === ve && (ve.env = Ye()), ce && (n = ve.env.Promise, t = e.env, (r.global || e.global) && (Object.defineProperty(f, "Promise", t.PromiseProp), n.all = t.all, n.race = t.race, n.resolve = t.resolve, n.reject = t.reject, t.allSettled && (n.allSettled = t.allSettled), t.any && (n.any = t.any))));
		}
		function Ye() {
			var e = f.Promise;
			return ce ? {
				Promise: e,
				PromiseProp: Object.getOwnPropertyDescriptor(f, "Promise"),
				all: e.all,
				race: e.race,
				allSettled: e.allSettled,
				any: e.any,
				resolve: e.resolve,
				reject: e.reject
			} : {};
		}
		function $e(e, t, n, r, i) {
			var o = me;
			try {
				return We(e, !0), t(n, r, i);
			} finally {
				We(o, !1);
			}
		}
		function Qe(t, n, r, i) {
			return "function" != typeof t ? t : function() {
				var e = me;
				r && Le(), We(n, !0);
				try {
					return t.apply(this, arguments);
				} finally {
					We(e, !1), i && queueMicrotask(Ue);
				}
			};
		}
		function Ge(e) {
			Promise === se && 0 === qe.echoes ? 0 === Re ? e() : enqueueNativeMicroTask(e) : setTimeout(e, 0);
		}
		-1 === ("" + F).indexOf("[native code]") && (Le = Ue = G);
		var Xe = _e.reject;
		var He = String.fromCharCode(65535), Je = "Invalid key provided. Keys must be of type string, number, Date or Array<string | number | Date>.", Ze = "String expected.", et = [], tt = "__dbnames", nt = "readonly", rt = "readwrite";
		function it(e, t) {
			return e ? t ? function() {
				return e.apply(this, arguments) && t.apply(this, arguments);
			} : e : t;
		}
		var ot = {
			type: 3,
			lower: -Infinity,
			lowerOpen: !1,
			upper: [[]],
			upperOpen: !1
		};
		function at(t) {
			return "string" != typeof t || /\./.test(t) ? function(e) {
				return e;
			} : function(e) {
				return void 0 === e[t] && t in e && delete (e = S(e))[t], e;
			};
		}
		function ut() {
			throw Y.Type("Entity instances must never be new:ed. Instances are generated by the framework bypassing the constructor.");
		}
		function st(e, t) {
			try {
				var n = ct(e), r = ct(t);
				if (n !== r) return "Array" === n ? 1 : "Array" === r ? -1 : "binary" === n ? 1 : "binary" === r ? -1 : "string" === n ? 1 : "string" === r ? -1 : "Date" === n ? 1 : "Date" !== r ? NaN : -1;
				switch (n) {
					case "number":
					case "Date":
					case "string": return t < e ? 1 : e < t ? -1 : 0;
					case "binary": return function(e, t) {
						for (var n = e.length, r = t.length, i = n < r ? n : r, o = 0; o < i; ++o) if (e[o] !== t[o]) return e[o] < t[o] ? -1 : 1;
						return n === r ? 0 : n < r ? -1 : 1;
					}(lt(e), lt(t));
					case "Array": return function(e, t) {
						for (var n = e.length, r = t.length, i = n < r ? n : r, o = 0; o < i; ++o) {
							var a = st(e[o], t[o]);
							if (0 !== a) return a;
						}
						return n === r ? 0 : n < r ? -1 : 1;
					}(e, t);
				}
			} catch (e) {}
			return NaN;
		}
		function ct(e) {
			var t = typeof e;
			if ("object" != t) return t;
			if (ArrayBuffer.isView(e)) return "binary";
			e = A(e);
			return "ArrayBuffer" === e ? "binary" : e;
		}
		function lt(e) {
			return e instanceof Uint8Array ? e : ArrayBuffer.isView(e) ? new Uint8Array(e.buffer, e.byteOffset, e.byteLength) : new Uint8Array(e);
		}
		function ft(t, n, r) {
			var e = t.schema.yProps;
			return e ? (n && 0 < r.numFailures && (n = n.filter(function(e, t) {
				return !r.failures[t];
			})), Promise.all(e.map(function(e) {
				e = e.updatesTable;
				return n ? t.db.table(e).where("k").anyOf(n).delete() : t.db.table(e).clear();
			})).then(function() {
				return r;
			})) : r;
		}
		var ht = (dt.prototype.execute = function(e) {
			var t = this["@@propmod"];
			if (void 0 !== t.add) {
				var n = t.add;
				if (x(n)) return i(i([], x(e) ? e : [], !0), n, !0).sort();
				if ("number" == typeof n) return (Number(e) || 0) + n;
				if ("bigint" == typeof n) try {
					return BigInt(e) + n;
				} catch (e) {
					return BigInt(0) + n;
				}
				throw new TypeError("Invalid term ".concat(n));
			}
			if (void 0 !== t.remove) {
				var r = t.remove;
				if (x(r)) return x(e) ? e.filter(function(e) {
					return !r.includes(e);
				}).sort() : [];
				if ("number" == typeof r) return Number(e) - r;
				if ("bigint" == typeof r) try {
					return BigInt(e) - r;
				} catch (e) {
					return BigInt(0) - r;
				}
				throw new TypeError("Invalid subtrahend ".concat(r));
			}
			n = null === (n = t.replacePrefix) || void 0 === n ? void 0 : n[0];
			return n && "string" == typeof e && e.startsWith(n) ? t.replacePrefix[1] + e.substring(n.length) : e;
		}, dt);
		function dt(e) {
			this["@@propmod"] = e;
		}
		function pt(e, t) {
			for (var n = O(t), r = n.length, i = !1, o = 0; o < r; ++o) {
				var a = n[o], u = t[a], s = g(e, a);
				u instanceof ht ? (w(e, a, u.execute(s)), i = !0) : s !== u && (w(e, a, u), i = !0);
			}
			return i;
		}
		var yt = (vt.prototype._trans = function(e, r, t) {
			var n = this._tx || me.trans, i = this.name, o = ie && "undefined" != typeof console && console.createTask && console.createTask("Dexie: ".concat("readonly" === e ? "read" : "write", " ").concat(this.name));
			function a(e, t, n) {
				if (!n.schema[i]) throw new Y.NotFound("Table " + i + " not part of transaction");
				return r(n.idbtrans, n);
			}
			var u = je();
			try {
				var s = n && n.db._novip === this.db._novip ? n === me.trans ? n._promise(e, a, t) : Ne(function() {
					return n._promise(e, a, t);
				}, {
					trans: n,
					transless: me.transless || me
				}) : function t(n, r, i, o) {
					if (n.idbdb && (n._state.openComplete || me.letThrough || n._vip)) {
						var a = n._createTransaction(r, i, n._dbSchema);
						try {
							a.create(), n._state.PR1398_maxLoop = 3;
						} catch (e) {
							return e.name === z.InvalidState && n.isOpen() && 0 < --n._state.PR1398_maxLoop ? (console.warn("Dexie: Need to reopen db"), n.close({ disableAutoOpen: !1 }), n.open().then(function() {
								return t(n, r, i, o);
							})) : Xe(e);
						}
						return a._promise(r, function(e, t) {
							return Ne(function() {
								return me.trans = a, o(e, t, a);
							});
						}).then(function(e) {
							if ("readwrite" === r) try {
								a.idbtrans.commit();
							} catch (e) {}
							return "readonly" === r ? e : a._completion.then(function() {
								return e;
							});
						});
					}
					if (n._state.openComplete) return Xe(new Y.DatabaseClosed(n._state.dbOpenError));
					if (!n._state.isBeingOpened) {
						if (!n._state.autoOpen) return Xe(new Y.DatabaseClosed());
						n.open().catch(G);
					}
					return n._state.dbReadyPromise.then(function() {
						return t(n, r, i, o);
					});
				}(this.db, e, [this.name], a);
				return o && (s._consoleTask = o, s = s.catch(function(e) {
					return console.trace(e), Xe(e);
				})), s;
			} finally {
				u && Ae();
			}
		}, vt.prototype.get = function(t, e) {
			var n = this;
			return t && t.constructor === Object ? this.where(t).first(e) : null == t ? Xe(new Y.Type("Invalid argument to Table.get()")) : this._trans("readonly", function(e) {
				return n.core.get({
					trans: e,
					key: t
				}).then(function(e) {
					return n.hook.reading.fire(e);
				});
			}).then(e);
		}, vt.prototype.where = function(o) {
			if ("string" == typeof o) return new this.db.WhereClause(this, o);
			if (x(o)) return new this.db.WhereClause(this, "[".concat(o.join("+"), "]"));
			var n = O(o);
			if (1 === n.length) return this.where(n[0]).equals(o[n[0]]);
			var e = this.schema.indexes.concat(this.schema.primKey).filter(function(t) {
				if (t.compound && n.every(function(e) {
					return 0 <= t.keyPath.indexOf(e);
				})) {
					for (var e = 0; e < n.length; ++e) if (-1 === n.indexOf(t.keyPath[e])) return !1;
					return !0;
				}
				return !1;
			}).sort(function(e, t) {
				return e.keyPath.length - t.keyPath.length;
			})[0];
			if (e && this.db._maxKey !== He) {
				var t = e.keyPath.slice(0, n.length);
				return this.where(t).equals(t.map(function(e) {
					return o[e];
				}));
			}
			!e && ie && console.warn("The query ".concat(JSON.stringify(o), " on ").concat(this.name, " would benefit from a ") + "compound index [".concat(n.join("+"), "]"));
			var a = this.schema.idxByName;
			function u(e, t) {
				return 0 === st(e, t);
			}
			var r = n.reduce(function(e, t) {
				var n = e[0], r = e[1], e = a[t], i = o[t];
				return [n || e, n || !e ? it(r, e && e.multi ? function(e) {
					e = g(e, t);
					return x(e) && e.some(function(e) {
						return u(i, e);
					});
				} : function(e) {
					return u(i, g(e, t));
				}) : r];
			}, [null, null]), t = r[0], r = r[1];
			return t ? this.where(t.name).equals(o[t.keyPath]).filter(r) : e ? this.filter(r) : this.where(n).equals("");
		}, vt.prototype.filter = function(e) {
			return this.toCollection().and(e);
		}, vt.prototype.count = function(e) {
			return this.toCollection().count(e);
		}, vt.prototype.offset = function(e) {
			return this.toCollection().offset(e);
		}, vt.prototype.limit = function(e) {
			return this.toCollection().limit(e);
		}, vt.prototype.each = function(e) {
			return this.toCollection().each(e);
		}, vt.prototype.toArray = function(e) {
			return this.toCollection().toArray(e);
		}, vt.prototype.toCollection = function() {
			return new this.db.Collection(new this.db.WhereClause(this));
		}, vt.prototype.orderBy = function(e) {
			return new this.db.Collection(new this.db.WhereClause(this, x(e) ? "[".concat(e.join("+"), "]") : e));
		}, vt.prototype.reverse = function() {
			return this.toCollection().reverse();
		}, vt.prototype.mapToClass = function(r) {
			var e, t = this.db, n = this.name;
			function i() {
				return null !== e && e.apply(this, arguments) || this;
			}
			(this.schema.mappedClass = r).prototype instanceof ut && (function(e, t) {
				if ("function" != typeof t && null !== t) throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
				function n() {
					this.constructor = e;
				}
				s(e, t), e.prototype = null === t ? Object.create(t) : (n.prototype = t.prototype, new n());
			}(i, e = r), Object.defineProperty(i.prototype, "db", {
				get: function() {
					return t;
				},
				enumerable: !1,
				configurable: !0
			}), i.prototype.table = function() {
				return n;
			}, r = i);
			for (var o = /* @__PURE__ */ new Set(), a = r.prototype; a; a = c(a)) Object.getOwnPropertyNames(a).forEach(function(e) {
				return o.add(e);
			});
			function u(e) {
				if (!e) return e;
				var t, n = Object.create(r.prototype);
				for (t in e) if (!o.has(t)) try {
					n[t] = e[t];
				} catch (e) {}
				return n;
			}
			return this.schema.readHook && this.hook.reading.unsubscribe(this.schema.readHook), this.schema.readHook = u, this.hook("reading", u), r;
		}, vt.prototype.defineClass = function() {
			return this.mapToClass(function(e) {
				a(this, e);
			});
		}, vt.prototype.add = function(t, n) {
			var r = this, e = this.schema.primKey, i = e.auto, o = e.keyPath, a = t;
			return o && i && (a = at(o)(t)), this._trans("readwrite", function(e) {
				return r.core.mutate({
					trans: e,
					type: "add",
					keys: null != n ? [n] : null,
					values: [a]
				});
			}).then(function(e) {
				return e.numFailures ? _e.reject(e.failures[0]) : e.lastResult;
			}).then(function(e) {
				if (o) try {
					w(t, o, e);
				} catch (e) {}
				return e;
			});
		}, vt.prototype.upsert = function(r, i) {
			var o = this, a = this.schema.primKey.keyPath;
			return this._trans("readwrite", function(n) {
				return o.core.get({
					trans: n,
					key: r
				}).then(function(t) {
					var e = null != t ? t : {};
					return pt(e, i), a && w(e, a, r), o.core.mutate({
						trans: n,
						type: "put",
						values: [e],
						keys: [r],
						upsert: !0,
						updates: {
							keys: [r],
							changeSpecs: [i]
						}
					}).then(function(e) {
						return e.numFailures ? _e.reject(e.failures[0]) : !!t;
					});
				});
			});
		}, vt.prototype.update = function(e, t) {
			if ("object" != typeof e || x(e)) return this.where(":id").equals(e).modify(t);
			e = g(e, this.schema.primKey.keyPath);
			return void 0 === e ? Xe(new Y.InvalidArgument("Given object does not contain its primary key")) : this.where(":id").equals(e).modify(t);
		}, vt.prototype.put = function(t, n) {
			var r = this, e = this.schema.primKey, i = e.auto, o = e.keyPath, a = t;
			return o && i && (a = at(o)(t)), this._trans("readwrite", function(e) {
				return r.core.mutate({
					trans: e,
					type: "put",
					values: [a],
					keys: null != n ? [n] : null
				});
			}).then(function(e) {
				return e.numFailures ? _e.reject(e.failures[0]) : e.lastResult;
			}).then(function(e) {
				if (o) try {
					w(t, o, e);
				} catch (e) {}
				return e;
			});
		}, vt.prototype.delete = function(t) {
			var n = this;
			return this._trans("readwrite", function(e) {
				return n.core.mutate({
					trans: e,
					type: "delete",
					keys: [t]
				}).then(function(e) {
					return ft(n, [t], e);
				}).then(function(e) {
					return e.numFailures ? _e.reject(e.failures[0]) : void 0;
				});
			});
		}, vt.prototype.clear = function() {
			var t = this;
			return this._trans("readwrite", function(e) {
				return t.core.mutate({
					trans: e,
					type: "deleteRange",
					range: ot
				}).then(function(e) {
					return ft(t, null, e);
				});
			}).then(function(e) {
				return e.numFailures ? _e.reject(e.failures[0]) : void 0;
			});
		}, vt.prototype.bulkGet = function(t) {
			var n = this;
			return this._trans("readonly", function(e) {
				return n.core.getMany({
					keys: t,
					trans: e
				}).then(function(e) {
					return e.map(function(e) {
						return n.hook.reading.fire(e);
					});
				});
			});
		}, vt.prototype.bulkAdd = function(r, e, t) {
			var o = this, a = Array.isArray(e) ? e : void 0, u = (t = t || (a ? void 0 : e)) ? t.allKeys : void 0;
			return this._trans("readwrite", function(e) {
				var t = o.schema.primKey, n = t.auto, t = t.keyPath;
				if (t && a) throw new Y.InvalidArgument("bulkAdd(): keys argument invalid on tables with inbound keys");
				if (a && a.length !== r.length) throw new Y.InvalidArgument("Arguments objects and keys must have the same length");
				var i = r.length, t = t && n ? r.map(at(t)) : r;
				return o.core.mutate({
					trans: e,
					type: "add",
					keys: a,
					values: t,
					wantResults: u
				}).then(function(e) {
					var t = e.numFailures, n = e.results, r = e.lastResult, e = e.failures;
					if (0 === t) return u ? n : r;
					throw new V("".concat(o.name, ".bulkAdd(): ").concat(t, " of ").concat(i, " operations failed"), e);
				});
			});
		}, vt.prototype.bulkPut = function(r, e, t) {
			var o = this, a = Array.isArray(e) ? e : void 0, u = (t = t || (a ? void 0 : e)) ? t.allKeys : void 0;
			return this._trans("readwrite", function(e) {
				var t = o.schema.primKey, n = t.auto, t = t.keyPath;
				if (t && a) throw new Y.InvalidArgument("bulkPut(): keys argument invalid on tables with inbound keys");
				if (a && a.length !== r.length) throw new Y.InvalidArgument("Arguments objects and keys must have the same length");
				var i = r.length, t = t && n ? r.map(at(t)) : r;
				return o.core.mutate({
					trans: e,
					type: "put",
					keys: a,
					values: t,
					wantResults: u
				}).then(function(e) {
					var t = e.numFailures, n = e.results, r = e.lastResult, e = e.failures;
					if (0 === t) return u ? n : r;
					throw new V("".concat(o.name, ".bulkPut(): ").concat(t, " of ").concat(i, " operations failed"), e);
				});
			});
		}, vt.prototype.bulkUpdate = function(t) {
			var h = this, n = this.core, r = t.map(function(e) {
				return e.key;
			}), i = t.map(function(e) {
				return e.changes;
			}), d = [];
			return this._trans("readwrite", function(e) {
				return n.getMany({
					trans: e,
					keys: r,
					cache: "clone"
				}).then(function(c) {
					var l = [], f = [];
					t.forEach(function(e, t) {
						var n = e.key, r = e.changes, i = c[t];
						if (i) {
							for (var o = 0, a = Object.keys(r); o < a.length; o++) {
								var u = a[o], s = r[u];
								if (u === h.schema.primKey.keyPath) {
									if (0 !== st(s, n)) throw new Y.Constraint("Cannot update primary key in bulkUpdate()");
								} else w(i, u, s);
							}
							d.push(t), l.push(n), f.push(i);
						}
					});
					var s = l.length;
					return n.mutate({
						trans: e,
						type: "put",
						keys: l,
						values: f,
						updates: {
							keys: r,
							changeSpecs: i
						}
					}).then(function(e) {
						var t = e.numFailures, n = e.failures;
						if (0 === t) return s;
						for (var r = 0, i = Object.keys(n); r < i.length; r++) {
							var o, a = i[r], u = d[Number(a)];
							null != u && (o = n[a], delete n[a], n[u] = o);
						}
						throw new V("".concat(h.name, ".bulkUpdate(): ").concat(t, " of ").concat(s, " operations failed"), n);
					});
				});
			});
		}, vt.prototype.bulkDelete = function(t) {
			var r = this, i = t.length;
			return this._trans("readwrite", function(e) {
				return r.core.mutate({
					trans: e,
					type: "delete",
					keys: t
				}).then(function(e) {
					return ft(r, t, e);
				});
			}).then(function(e) {
				var t = e.numFailures, n = e.lastResult, e = e.failures;
				if (0 === t) return n;
				throw new V("".concat(r.name, ".bulkDelete(): ").concat(t, " of ").concat(i, " operations failed"), e);
			});
		}, vt);
		function vt() {}
		function mt(i) {
			function t(e, t) {
				if (t) {
					for (var n = arguments.length, r = new Array(n - 1); --n;) r[n - 1] = arguments[n];
					return a[e].subscribe.apply(null, r), i;
				}
				if ("string" == typeof e) return a[e];
			}
			var a = {};
			t.addEventType = u;
			for (var e = 1, n = arguments.length; e < n; ++e) u(arguments[e]);
			return t;
			function u(e, n, r) {
				if ("object" != typeof e) {
					var i;
					n = n || ne;
					var o = {
						subscribers: [],
						fire: r = r || G,
						subscribe: function(e) {
							-1 === o.subscribers.indexOf(e) && (o.subscribers.push(e), o.fire = n(o.fire, e));
						},
						unsubscribe: function(t) {
							o.subscribers = o.subscribers.filter(function(e) {
								return e !== t;
							}), o.fire = o.subscribers.reduce(n, r);
						}
					};
					return a[e] = t[e] = o;
				}
				O(i = e).forEach(function(e) {
					var t = i[e];
					if (x(t)) u(e, i[e][0], i[e][1]);
					else {
						if ("asap" !== t) throw new Y.InvalidArgument("Invalid event config");
						var n = u(e, X, function() {
							for (var e = arguments.length, t = new Array(e); e--;) t[e] = arguments[e];
							n.subscribers.forEach(function(e) {
								v(function() {
									e.apply(null, t);
								});
							});
						});
					}
				});
			}
		}
		function bt(e, t) {
			return o(t).from({ prototype: e }), t;
		}
		function gt(e, t) {
			return !(e.filter || e.algorithm || e.or) && (t ? e.justLimit : !e.replayFilter);
		}
		function wt(e, t) {
			e.filter = it(e.filter, t);
		}
		function _t(e, t, n) {
			var r = e.replayFilter;
			e.replayFilter = r ? function() {
				return it(r(), t());
			} : t, e.justLimit = n && !r;
		}
		function xt(e, t) {
			if (e.isPrimKey) return t.primaryKey;
			var n = t.getIndexByKeyPath(e.index);
			if (!n) throw new Y.Schema("KeyPath " + e.index + " on object store " + t.name + " is not indexed");
			return n;
		}
		function kt(e, t, n) {
			var r = xt(e, t.schema);
			return t.openCursor({
				trans: n,
				values: !e.keysOnly,
				reverse: "prev" === e.dir,
				unique: !!e.unique,
				query: {
					index: r,
					range: e.range
				}
			});
		}
		function Ot(e, o, t, n) {
			var a = e.replayFilter ? it(e.filter, e.replayFilter()) : e.filter;
			if (e.or) {
				var u = {}, r = function(e, t, n) {
					var r, i;
					a && !a(t, n, function(e) {
						return t.stop(e);
					}, function(e) {
						return t.fail(e);
					}) || ("[object ArrayBuffer]" === (i = "" + (r = t.primaryKey)) && (i = "" + new Uint8Array(r)), m(u, i) || (u[i] = !0, o(e, t, n)));
				};
				return Promise.all([e.or._iterate(r, t), Pt(kt(e, n, t), e.algorithm, r, !e.keysOnly && e.valueMapper)]);
			}
			return Pt(kt(e, n, t), it(e.algorithm, a), o, !e.keysOnly && e.valueMapper);
		}
		function Pt(e, r, i, o) {
			var a = Ie(o ? function(e, t, n) {
				return i(o(e), t, n);
			} : i);
			return e.then(function(n) {
				if (n) return n.start(function() {
					var t = function() {
						return n.continue();
					};
					r && !r(n, function(e) {
						return t = e;
					}, function(e) {
						n.stop(e), t = G;
					}, function(e) {
						n.fail(e), t = G;
					}) || a(n.value, n, function(e) {
						return t = e;
					}), t();
				});
			});
		}
		var Kt = (Et.prototype._read = function(e, t) {
			var n = this._ctx;
			return n.error ? n.table._trans(null, Xe.bind(null, n.error)) : n.table._trans("readonly", e).then(t);
		}, Et.prototype._write = function(e) {
			var t = this._ctx;
			return t.error ? t.table._trans(null, Xe.bind(null, t.error)) : t.table._trans("readwrite", e, "locked");
		}, Et.prototype._addAlgorithm = function(e) {
			var t = this._ctx;
			t.algorithm = it(t.algorithm, e);
		}, Et.prototype._iterate = function(e, t) {
			return Ot(this._ctx, e, t, this._ctx.table.core);
		}, Et.prototype.clone = function(e) {
			var t = Object.create(this.constructor.prototype), n = Object.create(this._ctx);
			return e && a(n, e), t._ctx = n, t;
		}, Et.prototype.raw = function() {
			return this._ctx.valueMapper = null, this;
		}, Et.prototype.each = function(t) {
			var n = this._ctx;
			return this._read(function(e) {
				return Ot(n, t, e, n.table.core);
			});
		}, Et.prototype.count = function(e) {
			var i = this;
			return this._read(function(e) {
				var t = i._ctx, n = t.table.core;
				if (gt(t, !0)) return n.count({
					trans: e,
					query: {
						index: xt(t, n.schema),
						range: t.range
					}
				}).then(function(e) {
					return Math.min(e, t.limit);
				});
				var r = 0;
				return Ot(t, function() {
					return ++r, !1;
				}, e, n).then(function() {
					return r;
				});
			}).then(e);
		}, Et.prototype.sortBy = function(e, t) {
			var n = e.split(".").reverse(), r = n[0], i = n.length - 1;
			function o(e, t) {
				return t ? o(e[n[t]], t - 1) : e[r];
			}
			var a = "next" === this._ctx.dir ? 1 : -1;
			function u(e, t) {
				return st(o(e, i), o(t, i)) * a;
			}
			return this.toArray(function(e) {
				return e.sort(u);
			}).then(t);
		}, Et.prototype.toArray = function(e) {
			var o = this;
			return this._read(function(e) {
				var t = o._ctx;
				if ("next" === t.dir && gt(t, !0) && 0 < t.limit) {
					var n = t.valueMapper, r = xt(t, t.table.core.schema);
					return t.table.core.query({
						trans: e,
						limit: t.limit,
						values: !0,
						query: {
							index: r,
							range: t.range
						}
					}).then(function(e) {
						e = e.result;
						return n ? e.map(n) : e;
					});
				}
				var i = [];
				return Ot(t, function(e) {
					return i.push(e);
				}, e, t.table.core).then(function() {
					return i;
				});
			}, e);
		}, Et.prototype.offset = function(t) {
			var e = this._ctx;
			return t <= 0 || (e.offset += t, gt(e) ? _t(e, function() {
				var n = t;
				return function(e, t) {
					return 0 === n || (1 === n ? --n : t(function() {
						e.advance(n), n = 0;
					}), !1);
				};
			}) : _t(e, function() {
				var e = t;
				return function() {
					return --e < 0;
				};
			})), this;
		}, Et.prototype.limit = function(e) {
			return this._ctx.limit = Math.min(this._ctx.limit, e), _t(this._ctx, function() {
				var r = e;
				return function(e, t, n) {
					return --r <= 0 && t(n), 0 <= r;
				};
			}, !0), this;
		}, Et.prototype.until = function(r, i) {
			return wt(this._ctx, function(e, t, n) {
				return !r(e.value) || (t(n), i);
			}), this;
		}, Et.prototype.first = function(e) {
			return this.limit(1).toArray(function(e) {
				return e[0];
			}).then(e);
		}, Et.prototype.last = function(e) {
			return this.reverse().first(e);
		}, Et.prototype.filter = function(t) {
			var e;
			return wt(this._ctx, function(e) {
				return t(e.value);
			}), (e = this._ctx).isMatch = it(e.isMatch, t), this;
		}, Et.prototype.and = function(e) {
			return this.filter(e);
		}, Et.prototype.or = function(e) {
			return new this.db.WhereClause(this._ctx.table, e, this);
		}, Et.prototype.reverse = function() {
			return this._ctx.dir = "prev" === this._ctx.dir ? "next" : "prev", this._ondirectionchange && this._ondirectionchange(this._ctx.dir), this;
		}, Et.prototype.desc = function() {
			return this.reverse();
		}, Et.prototype.eachKey = function(n) {
			var e = this._ctx;
			return e.keysOnly = !e.isMatch, this.each(function(e, t) {
				n(t.key, t);
			});
		}, Et.prototype.eachUniqueKey = function(e) {
			return this._ctx.unique = "unique", this.eachKey(e);
		}, Et.prototype.eachPrimaryKey = function(n) {
			var e = this._ctx;
			return e.keysOnly = !e.isMatch, this.each(function(e, t) {
				n(t.primaryKey, t);
			});
		}, Et.prototype.keys = function(e) {
			var t = this._ctx;
			t.keysOnly = !t.isMatch;
			var n = [];
			return this.each(function(e, t) {
				n.push(t.key);
			}).then(function() {
				return n;
			}).then(e);
		}, Et.prototype.primaryKeys = function(e) {
			var n = this._ctx;
			if ("next" === n.dir && gt(n, !0) && 0 < n.limit) return this._read(function(e) {
				var t = xt(n, n.table.core.schema);
				return n.table.core.query({
					trans: e,
					values: !1,
					limit: n.limit,
					query: {
						index: t,
						range: n.range
					}
				});
			}).then(function(e) {
				return e.result;
			}).then(e);
			n.keysOnly = !n.isMatch;
			var r = [];
			return this.each(function(e, t) {
				r.push(t.primaryKey);
			}).then(function() {
				return r;
			}).then(e);
		}, Et.prototype.uniqueKeys = function(e) {
			return this._ctx.unique = "unique", this.keys(e);
		}, Et.prototype.firstKey = function(e) {
			return this.limit(1).keys(function(e) {
				return e[0];
			}).then(e);
		}, Et.prototype.lastKey = function(e) {
			return this.reverse().firstKey(e);
		}, Et.prototype.distinct = function() {
			var e = this._ctx, e = e.index && e.table.schema.idxByName[e.index];
			if (!e || !e.multi) return this;
			var n = {};
			return wt(this._ctx, function(e) {
				var t = e.primaryKey.toString(), e = m(n, t);
				return n[t] = !0, !e;
			}), this;
		}, Et.prototype.modify = function(x) {
			var n = this, k = this._ctx;
			return this._write(function(p) {
				var y = "function" == typeof x ? x : function(e) {
					return pt(e, x);
				}, v = k.table.core, e = v.schema.primaryKey, m = e.outbound, b = e.extractKey, g = 200, e = n.db._options.modifyChunkSize;
				e && (g = "object" == typeof e ? e[v.name] || e["*"] || 200 : e);
				function w(e, t) {
					var n = t.failures, t = t.numFailures;
					u += e - t;
					for (var r = 0, i = O(n); r < i.length; r++) {
						var o = i[r];
						a.push(n[o]);
					}
				}
				var a = [], u = 0, t = [], _ = x === St;
				return n.clone().primaryKeys().then(function(f) {
					function h(s) {
						var c = Math.min(g, f.length - s), l = f.slice(s, s + c);
						return (_ ? Promise.resolve([]) : v.getMany({
							trans: p,
							keys: l,
							cache: "immutable"
						})).then(function(e) {
							var n = [], t = [], r = m ? [] : null, i = _ ? l : [];
							if (!_) for (var o = 0; o < c; ++o) {
								var a = e[o], u = {
									value: S(a),
									primKey: f[s + o]
								};
								!1 !== y.call(u, u.value, u) && (null == u.value ? i.push(f[s + o]) : m || 0 === st(b(a), b(u.value)) ? (t.push(u.value), m && r.push(f[s + o])) : (i.push(f[s + o]), n.push(u.value)));
							}
							return Promise.resolve(0 < n.length && v.mutate({
								trans: p,
								type: "add",
								values: n
							}).then(function(e) {
								for (var t in e.failures) i.splice(parseInt(t), 1);
								w(n.length, e);
							})).then(function() {
								return (0 < t.length || d && "object" == typeof x) && v.mutate({
									trans: p,
									type: "put",
									keys: r,
									values: t,
									criteria: d,
									changeSpec: "function" != typeof x && x,
									isAdditionalChunk: 0 < s
								}).then(function(e) {
									return w(t.length, e);
								});
							}).then(function() {
								return (0 < i.length || d && _) && v.mutate({
									trans: p,
									type: "delete",
									keys: i,
									criteria: d,
									isAdditionalChunk: 0 < s
								}).then(function(e) {
									return ft(k.table, i, e);
								}).then(function(e) {
									return w(i.length, e);
								});
							}).then(function() {
								return f.length > s + c && h(s + g);
							});
						});
					}
					var d = gt(k) && k.limit === Infinity && ("function" != typeof x || _) && {
						index: k.index,
						range: k.range
					};
					return h(0).then(function() {
						if (0 < a.length) throw new U("Error modifying one or more objects", a, u, t);
						return f.length;
					});
				});
			});
		}, Et.prototype.delete = function() {
			var i = this._ctx, n = i.range;
			return !gt(i) || i.table.schema.yProps || !i.isPrimKey && 3 !== n.type ? this.modify(St) : this._write(function(e) {
				var t = i.table.core.schema.primaryKey, r = n;
				return i.table.core.count({
					trans: e,
					query: {
						index: t,
						range: r
					}
				}).then(function(n) {
					return i.table.core.mutate({
						trans: e,
						type: "deleteRange",
						range: r
					}).then(function(e) {
						var t = e.failures, e = e.numFailures;
						if (e) throw new U("Could not delete some values", Object.keys(t).map(function(e) {
							return t[e];
						}), n - e);
						return n - e;
					});
				});
			});
		}, Et);
		function Et() {}
		var St = function(e, t) {
			return t.value = null;
		};
		function jt(e, t) {
			return e < t ? -1 : e === t ? 0 : 1;
		}
		function At(e, t) {
			return t < e ? -1 : e === t ? 0 : 1;
		}
		function Ct(e, t, n) {
			e = e instanceof Bt ? new e.Collection(e) : e;
			return e._ctx.error = new (n || TypeError)(t), e;
		}
		function Tt(e) {
			return new e.Collection(e, function() {
				return Dt("");
			}).limit(0);
		}
		function It(e, s, n, r) {
			var i, c, l, f, h, d, p, y = n.length;
			if (!n.every(function(e) {
				return "string" == typeof e;
			})) return Ct(e, Ze);
			function t(e) {
				i = "next" === e ? function(e) {
					return e.toUpperCase();
				} : function(e) {
					return e.toLowerCase();
				}, c = "next" === e ? function(e) {
					return e.toLowerCase();
				} : function(e) {
					return e.toUpperCase();
				}, l = "next" === e ? jt : At;
				var t = n.map(function(e) {
					return {
						lower: c(e),
						upper: i(e)
					};
				}).sort(function(e, t) {
					return l(e.lower, t.lower);
				});
				f = t.map(function(e) {
					return e.upper;
				}), h = t.map(function(e) {
					return e.lower;
				}), p = "next" === (d = e) ? "" : r;
			}
			t("next");
			e = new e.Collection(e, function() {
				return qt(f[0], h[y - 1] + r);
			});
			e._ondirectionchange = function(e) {
				t(e);
			};
			var v = 0;
			return e._addAlgorithm(function(e, t, n) {
				var r = e.key;
				if ("string" != typeof r) return !1;
				var i = c(r);
				if (s(i, h, v)) return !0;
				for (var o = null, a = v; a < y; ++a) {
					var u = function(e, t, n, r, i, o) {
						for (var a = Math.min(e.length, r.length), u = -1, s = 0; s < a; ++s) {
							var c = t[s];
							if (c !== r[s]) return i(e[s], n[s]) < 0 ? e.substr(0, s) + n[s] + n.substr(s + 1) : i(e[s], r[s]) < 0 ? e.substr(0, s) + r[s] + n.substr(s + 1) : 0 <= u ? e.substr(0, u) + t[u] + n.substr(u + 1) : null;
							i(e[s], c) < 0 && (u = s);
						}
						return a < r.length && "next" === o ? e + n.substr(e.length) : a < e.length && "prev" === o ? e.substr(0, n.length) : u < 0 ? null : e.substr(0, u) + r[u] + n.substr(u + 1);
					}(r, i, f[a], h[a], l, d);
					null === u && null === o ? v = a + 1 : (null === o || 0 < l(o, u)) && (o = u);
				}
				return t(null !== o ? function() {
					e.continue(o + p);
				} : n), !1;
			}), e;
		}
		function qt(e, t, n, r) {
			return {
				type: 2,
				lower: e,
				upper: t,
				lowerOpen: n,
				upperOpen: r
			};
		}
		function Dt(e) {
			return {
				type: 1,
				lower: e,
				upper: e
			};
		}
		var Bt = (Object.defineProperty(Rt.prototype, "Collection", {
			get: function() {
				return this._ctx.table.db.Collection;
			},
			enumerable: !1,
			configurable: !0
		}), Rt.prototype.between = function(e, t, n, r) {
			n = !1 !== n, r = !0 === r;
			try {
				return 0 < this._cmp(e, t) || 0 === this._cmp(e, t) && (n || r) && (!n || !r) ? Tt(this) : new this.Collection(this, function() {
					return qt(e, t, !n, !r);
				});
			} catch (e) {
				return Ct(this, Je);
			}
		}, Rt.prototype.equals = function(e) {
			return null == e ? Ct(this, Je) : new this.Collection(this, function() {
				return Dt(e);
			});
		}, Rt.prototype.above = function(e) {
			return null == e ? Ct(this, Je) : new this.Collection(this, function() {
				return qt(e, void 0, !0);
			});
		}, Rt.prototype.aboveOrEqual = function(e) {
			return null == e ? Ct(this, Je) : new this.Collection(this, function() {
				return qt(e, void 0, !1);
			});
		}, Rt.prototype.below = function(e) {
			return null == e ? Ct(this, Je) : new this.Collection(this, function() {
				return qt(void 0, e, !1, !0);
			});
		}, Rt.prototype.belowOrEqual = function(e) {
			return null == e ? Ct(this, Je) : new this.Collection(this, function() {
				return qt(void 0, e);
			});
		}, Rt.prototype.startsWith = function(e) {
			return "string" != typeof e ? Ct(this, Ze) : this.between(e, e + He, !0, !0);
		}, Rt.prototype.startsWithIgnoreCase = function(e) {
			return "" === e ? this.startsWith(e) : It(this, function(e, t) {
				return 0 === e.indexOf(t[0]);
			}, [e], He);
		}, Rt.prototype.equalsIgnoreCase = function(e) {
			return It(this, function(e, t) {
				return e === t[0];
			}, [e], "");
		}, Rt.prototype.anyOfIgnoreCase = function() {
			var e = D.apply(q, arguments);
			return 0 === e.length ? Tt(this) : It(this, function(e, t) {
				return -1 !== t.indexOf(e);
			}, e, "");
		}, Rt.prototype.startsWithAnyOfIgnoreCase = function() {
			var e = D.apply(q, arguments);
			return 0 === e.length ? Tt(this) : It(this, function(t, e) {
				return e.some(function(e) {
					return 0 === t.indexOf(e);
				});
			}, e, He);
		}, Rt.prototype.anyOf = function() {
			var t = this, i = D.apply(q, arguments), o = this._cmp;
			try {
				i.sort(o);
			} catch (e) {
				return Ct(this, Je);
			}
			if (0 === i.length) return Tt(this);
			var e = new this.Collection(this, function() {
				return qt(i[0], i[i.length - 1]);
			});
			e._ondirectionchange = function(e) {
				o = "next" === e ? t._ascending : t._descending, i.sort(o);
			};
			var a = 0;
			return e._addAlgorithm(function(e, t, n) {
				for (var r = e.key; 0 < o(r, i[a]);) if (++a === i.length) return t(n), !1;
				return 0 === o(r, i[a]) || (t(function() {
					e.continue(i[a]);
				}), !1);
			}), e;
		}, Rt.prototype.notEqual = function(e) {
			return this.inAnyRange([[-Infinity, e], [e, this.db._maxKey]], {
				includeLowers: !1,
				includeUppers: !1
			});
		}, Rt.prototype.noneOf = function() {
			var e = D.apply(q, arguments);
			if (0 === e.length) return new this.Collection(this);
			try {
				e.sort(this._ascending);
			} catch (e) {
				return Ct(this, Je);
			}
			var t = e.reduce(function(e, t) {
				return e ? e.concat([[e[e.length - 1][1], t]]) : [[-Infinity, t]];
			}, null);
			return t.push([e[e.length - 1], this.db._maxKey]), this.inAnyRange(t, {
				includeLowers: !1,
				includeUppers: !1
			});
		}, Rt.prototype.inAnyRange = function(e, t) {
			var o = this, a = this._cmp, u = this._ascending, n = this._descending, s = this._min, c = this._max;
			if (0 === e.length) return Tt(this);
			if (!e.every(function(e) {
				return void 0 !== e[0] && void 0 !== e[1] && u(e[0], e[1]) <= 0;
			})) return Ct(this, "First argument to inAnyRange() must be an Array of two-value Arrays [lower,upper] where upper must not be lower than lower", Y.InvalidArgument);
			var r = !t || !1 !== t.includeLowers, i = t && !0 === t.includeUppers;
			var l, f = u;
			function h(e, t) {
				return f(e[0], t[0]);
			}
			try {
				(l = e.reduce(function(e, t) {
					for (var n = 0, r = e.length; n < r; ++n) {
						var i = e[n];
						if (a(t[0], i[1]) < 0 && 0 < a(t[1], i[0])) {
							i[0] = s(i[0], t[0]), i[1] = c(i[1], t[1]);
							break;
						}
					}
					return n === r && e.push(t), e;
				}, [])).sort(h);
			} catch (e) {
				return Ct(this, Je);
			}
			var d = 0, p = i ? function(e) {
				return 0 < u(e, l[d][1]);
			} : function(e) {
				return 0 <= u(e, l[d][1]);
			}, y = r ? function(e) {
				return 0 < n(e, l[d][0]);
			} : function(e) {
				return 0 <= n(e, l[d][0]);
			};
			var v = p, e = new this.Collection(this, function() {
				return qt(l[0][0], l[l.length - 1][1], !r, !i);
			});
			return e._ondirectionchange = function(e) {
				f = "next" === e ? (v = p, u) : (v = y, n), l.sort(h);
			}, e._addAlgorithm(function(e, t, n) {
				for (var r, i = e.key; v(i);) if (++d === l.length) return t(n), !1;
				return !p(r = i) && !y(r) || (0 === o._cmp(i, l[d][1]) || 0 === o._cmp(i, l[d][0]) || t(function() {
					f === u ? e.continue(l[d][0]) : e.continue(l[d][1]);
				}), !1);
			}), e;
		}, Rt.prototype.startsWithAnyOf = function() {
			var e = D.apply(q, arguments);
			return e.every(function(e) {
				return "string" == typeof e;
			}) ? 0 === e.length ? Tt(this) : this.inAnyRange(e.map(function(e) {
				return [e, e + He];
			})) : Ct(this, "startsWithAnyOf() only works with strings");
		}, Rt);
		function Rt() {}
		function Ft(t) {
			return Ie(function(e) {
				return Mt(e), t(e.target.error), !1;
			});
		}
		function Mt(e) {
			e.stopPropagation && e.stopPropagation(), e.preventDefault && e.preventDefault();
		}
		var Nt = "storagemutated", Lt = "x-storagemutated-1", Ut = mt(null, Nt), Vt = (zt.prototype._lock = function() {
			return y(!me.global), ++this._reculock, 1 !== this._reculock || me.global || (me.lockOwnerFor = this), this;
		}, zt.prototype._unlock = function() {
			if (y(!me.global), 0 == --this._reculock) for (me.global || (me.lockOwnerFor = null); 0 < this._blockedFuncs.length && !this._locked();) {
				var e = this._blockedFuncs.shift();
				try {
					$e(e[1], e[0]);
				} catch (e) {}
			}
			return this;
		}, zt.prototype._locked = function() {
			return this._reculock && me.lockOwnerFor !== this;
		}, zt.prototype.create = function(t) {
			var n = this;
			if (!this.mode) return this;
			var e = this.db.idbdb, r = this.db._state.dbOpenError;
			if (y(!this.idbtrans), !t && !e) switch (r && r.name) {
				case "DatabaseClosedError": throw new Y.DatabaseClosed(r);
				case "MissingAPIError": throw new Y.MissingAPI(r.message, r);
				default: throw new Y.OpenFailed(r);
			}
			if (!this.active) throw new Y.TransactionInactive();
			return y(null === this._completion._state), (t = this.idbtrans = t || (this.db.core || e).transaction(this.storeNames, this.mode, { durability: this.chromeTransactionDurability })).onerror = Ie(function(e) {
				Mt(e), n._reject(t.error);
			}), t.onabort = Ie(function(e) {
				Mt(e), n.active && n._reject(new Y.Abort(t.error)), n.active = !1, n.on("abort").fire(e);
			}), t.oncomplete = Ie(function() {
				n.active = !1, n._resolve(), "mutatedParts" in t && Ut.storagemutated.fire(t.mutatedParts);
			}), this;
		}, zt.prototype._promise = function(n, r, i) {
			var o = this;
			if ("readwrite" === n && "readwrite" !== this.mode) return Xe(new Y.ReadOnly("Transaction is readonly"));
			if (!this.active) return Xe(new Y.TransactionInactive());
			if (this._locked()) return new _e(function(e, t) {
				o._blockedFuncs.push([function() {
					o._promise(n, r, i).then(e, t);
				}, me]);
			});
			if (i) return Ne(function() {
				var e = new _e(function(e, t) {
					o._lock();
					var n = r(e, t, o);
					n && n.then && n.then(e, t);
				});
				return e.finally(function() {
					return o._unlock();
				}), e._lib = !0, e;
			});
			var e = new _e(function(e, t) {
				var n = r(e, t, o);
				n && n.then && n.then(e, t);
			});
			return e._lib = !0, e;
		}, zt.prototype._root = function() {
			return this.parent ? this.parent._root() : this;
		}, zt.prototype.waitFor = function(e) {
			var t, r = this._root(), i = _e.resolve(e);
			r._waitingFor ? r._waitingFor = r._waitingFor.then(function() {
				return i;
			}) : (r._waitingFor = i, r._waitingQueue = [], t = r.idbtrans.objectStore(r.storeNames[0]), function e() {
				for (++r._spinCount; r._waitingQueue.length;) r._waitingQueue.shift()();
				r._waitingFor && (t.get(-Infinity).onsuccess = e);
			}());
			var o = r._waitingFor;
			return new _e(function(t, n) {
				i.then(function(e) {
					return r._waitingQueue.push(Ie(t.bind(null, e)));
				}, function(e) {
					return r._waitingQueue.push(Ie(n.bind(null, e)));
				}).finally(function() {
					r._waitingFor === o && (r._waitingFor = null);
				});
			});
		}, zt.prototype.abort = function() {
			this.active && (this.active = !1, this.idbtrans && this.idbtrans.abort(), this._reject(new Y.Abort()));
		}, zt.prototype.table = function(e) {
			var t = this._memoizedTables || (this._memoizedTables = {});
			if (m(t, e)) return t[e];
			var n = this.schema[e];
			if (!n) throw new Y.NotFound("Table " + e + " not part of transaction");
			n = new this.db.Table(e, n, this);
			return n.core = this.db.core.table(e), t[e] = n;
		}, zt);
		function zt() {}
		function Wt(e, t, n, r, i, o, a, u) {
			return {
				name: e,
				keyPath: t,
				unique: n,
				multi: r,
				auto: i,
				compound: o,
				src: (n && !a ? "&" : "") + (r ? "*" : "") + (i ? "++" : "") + Yt(t),
				type: u
			};
		}
		function Yt(e) {
			return "string" == typeof e ? e : e ? "[" + [].join.call(e, "+") + "]" : "";
		}
		function $t(e, t, n) {
			return {
				name: e,
				primKey: t,
				indexes: n,
				mappedClass: null,
				idxByName: (r = function(e) {
					return [e.name, e];
				}, n.reduce(function(e, t, n) {
					n = r(t, n);
					return n && (e[n[0]] = n[1]), e;
				}, {}))
			};
			var r;
		}
		var Qt = function(e) {
			try {
				return e.only([[]]), Qt = function() {
					return [[]];
				}, [[]];
			} catch (e) {
				return Qt = function() {
					return He;
				}, He;
			}
		};
		function Gt(t) {
			return null == t ? function() {} : "string" == typeof t ? 1 === (n = t).split(".").length ? function(e) {
				return e[n];
			} : function(e) {
				return g(e, n);
			} : function(e) {
				return g(e, t);
			};
			var n;
		}
		function Xt(e) {
			return [].slice.call(e);
		}
		var Ht = 0;
		function Jt(e) {
			return null == e ? ":id" : "string" == typeof e ? e : "[".concat(e.join("+"), "]");
		}
		function Zt(e, i, t) {
			function _(e) {
				if (3 === e.type) return null;
				if (4 === e.type) throw new Error("Cannot convert never type to IDBKeyRange");
				var t = e.lower, n = e.upper, r = e.lowerOpen, e = e.upperOpen;
				return void 0 === t ? void 0 === n ? null : i.upperBound(n, !!e) : void 0 === n ? i.lowerBound(t, !!r) : i.bound(t, n, !!r, !!e);
			}
			function n(e) {
				var h, w = e.name;
				return {
					name: w,
					schema: e,
					mutate: function(e) {
						var y = e.trans, v = e.type, m = e.keys, b = e.values, g = e.range;
						return new Promise(function(t, e) {
							t = Ie(t);
							var n = y.objectStore(w), r = null == n.keyPath, i = "put" === v || "add" === v;
							if (!i && "delete" !== v && "deleteRange" !== v) throw new Error("Invalid operation type: " + v);
							var o, a = (m || b || { length: 1 }).length;
							if (m && b && m.length !== b.length) throw new Error("Given keys array must have same length as given values array.");
							if (0 === a) return t({
								numFailures: 0,
								failures: {},
								results: [],
								lastResult: void 0
							});
							function u(e) {
								++l, Mt(e);
							}
							var s = [], c = [], l = 0;
							if ("deleteRange" === v) {
								if (4 === g.type) return t({
									numFailures: l,
									failures: c,
									results: [],
									lastResult: void 0
								});
								3 === g.type ? s.push(o = n.clear()) : s.push(o = n.delete(_(g)));
							} else {
								var r = i ? r ? [b, m] : [b, null] : [m, null], f = r[0], h = r[1];
								if (i) for (var d = 0; d < a; ++d) s.push(o = h && void 0 !== h[d] ? n[v](f[d], h[d]) : n[v](f[d])), o.onerror = u;
								else for (d = 0; d < a; ++d) s.push(o = n[v](f[d])), o.onerror = u;
							}
							function p(e) {
								e = e.target.result, s.forEach(function(e, t) {
									return null != e.error && (c[t] = e.error);
								}), t({
									numFailures: l,
									failures: c,
									results: "delete" === v ? m : s.map(function(e) {
										return e.result;
									}),
									lastResult: e
								});
							}
							o.onerror = function(e) {
								u(e), p(e);
							}, o.onsuccess = p;
						});
					},
					getMany: function(e) {
						var f = e.trans, h = e.keys;
						return new Promise(function(t, e) {
							t = Ie(t);
							for (var n, r = f.objectStore(w), i = h.length, o = new Array(i), a = 0, u = 0, s = function(e) {
								e = e.target;
								o[e._pos] = e.result, ++u === a && t(o);
							}, c = Ft(e), l = 0; l < i; ++l) null != h[l] && ((n = r.get(h[l]))._pos = l, n.onsuccess = s, n.onerror = c, ++a);
							0 === a && t(o);
						});
					},
					get: function(e) {
						var r = e.trans, i = e.key;
						return new Promise(function(t, e) {
							t = Ie(t);
							var n = r.objectStore(w).get(i);
							n.onsuccess = function(e) {
								return t(e.target.result);
							}, n.onerror = Ft(e);
						});
					},
					query: (h = s, function(f) {
						return new Promise(function(n, e) {
							n = Ie(n);
							var r, i, o, t = f.trans, a = f.values, u = f.limit, s = f.query, c = u === Infinity ? void 0 : u, l = s.index, s = s.range, t = t.objectStore(w), l = l.isPrimaryKey ? t : t.index(l.name), s = _(s);
							if (0 === u) return n({ result: [] });
							h ? ((c = a ? l.getAll(s, c) : l.getAllKeys(s, c)).onsuccess = function(e) {
								return n({ result: e.target.result });
							}, c.onerror = Ft(e)) : (r = 0, i = !a && "openKeyCursor" in l ? l.openKeyCursor(s) : l.openCursor(s), o = [], i.onsuccess = function(e) {
								var t = i.result;
								return t ? (o.push(a ? t.value : t.primaryKey), ++r === u ? n({ result: o }) : void t.continue()) : n({ result: o });
							}, i.onerror = Ft(e));
						});
					}),
					openCursor: function(e) {
						var c = e.trans, o = e.values, a = e.query, u = e.reverse, l = e.unique;
						return new Promise(function(t, n) {
							t = Ie(t);
							var e = a.index, r = a.range, i = c.objectStore(w), i = e.isPrimaryKey ? i : i.index(e.name), e = u ? l ? "prevunique" : "prev" : l ? "nextunique" : "next", s = !o && "openKeyCursor" in i ? i.openKeyCursor(_(r), e) : i.openCursor(_(r), e);
							s.onerror = Ft(n), s.onsuccess = Ie(function(e) {
								var r, i, o, a, u = s.result;
								u ? (u.___id = ++Ht, u.done = !1, r = u.continue.bind(u), i = (i = u.continuePrimaryKey) && i.bind(u), o = u.advance.bind(u), a = function() {
									throw new Error("Cursor not stopped");
								}, u.trans = c, u.stop = u.continue = u.continuePrimaryKey = u.advance = function() {
									throw new Error("Cursor not started");
								}, u.fail = Ie(n), u.next = function() {
									var e = this, t = 1;
									return this.start(function() {
										return t-- ? e.continue() : e.stop();
									}).then(function() {
										return e;
									});
								}, u.start = function(e) {
									function t() {
										if (s.result) try {
											e();
										} catch (e) {
											u.fail(e);
										}
										else u.done = !0, u.start = function() {
											throw new Error("Cursor behind last entry");
										}, u.stop();
									}
									var n = new Promise(function(t, e) {
										t = Ie(t), s.onerror = Ft(e), u.fail = e, u.stop = function(e) {
											u.stop = u.continue = u.continuePrimaryKey = u.advance = a, t(e);
										};
									});
									return s.onsuccess = Ie(function(e) {
										s.onsuccess = t, t();
									}), u.continue = r, u.continuePrimaryKey = i, u.advance = o, t(), n;
								}, t(u)) : t(null);
							}, n);
						});
					},
					count: function(e) {
						var t = e.query, i = e.trans, o = t.index, a = t.range;
						return new Promise(function(t, e) {
							var n = i.objectStore(w), r = o.isPrimaryKey ? n : n.index(o.name), n = _(a), r = n ? r.count(n) : r.count();
							r.onsuccess = Ie(function(e) {
								return t(e.target.result);
							}), r.onerror = Ft(e);
						});
					}
				};
			}
			var r, o, a, u = (o = t, a = Xt((r = e).objectStoreNames), {
				schema: {
					name: r.name,
					tables: a.map(function(e) {
						return o.objectStore(e);
					}).map(function(t) {
						var e = t.keyPath, n = t.autoIncrement, r = x(e), i = {}, n = {
							name: t.name,
							primaryKey: {
								name: null,
								isPrimaryKey: !0,
								outbound: null == e,
								compound: r,
								keyPath: e,
								autoIncrement: n,
								unique: !0,
								extractKey: Gt(e)
							},
							indexes: Xt(t.indexNames).map(function(e) {
								return t.index(e);
							}).map(function(e) {
								var t = e.name, n = e.unique, r = e.multiEntry, e = e.keyPath, r = {
									name: t,
									compound: x(e),
									keyPath: e,
									unique: n,
									multiEntry: r,
									extractKey: Gt(e)
								};
								return i[Jt(e)] = r;
							}),
							getIndexByKeyPath: function(e) {
								return i[Jt(e)];
							}
						};
						return i[":id"] = n.primaryKey, null != e && (i[Jt(e)] = n.primaryKey), n;
					})
				},
				hasGetAll: 0 < a.length && "getAll" in o.objectStore(a[0]) && !("undefined" != typeof navigator && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604)
			}), t = u.schema, s = u.hasGetAll, u = t.tables.map(n), c = {};
			return u.forEach(function(e) {
				return c[e.name] = e;
			}), {
				stack: "dbcore",
				transaction: e.transaction.bind(e),
				table: function(e) {
					if (!c[e]) throw new Error("Table '".concat(e, "' not found"));
					return c[e];
				},
				MIN_KEY: -Infinity,
				MAX_KEY: Qt(i),
				schema: t
			};
		}
		function en(e, t, n, r) {
			var i = n.IDBKeyRange;
			return n.indexedDB, { dbcore: (r = Zt(t, i, r), e.dbcore.reduce(function(e, t) {
				t = t.create;
				return _(_({}, e), t(e));
			}, r)) };
		}
		function tn(n, e) {
			var t = e.db, e = en(n._middlewares, t, n._deps, e);
			n.core = e.dbcore, n.tables.forEach(function(e) {
				var t = e.name;
				n.core.schema.tables.some(function(e) {
					return e.name === t;
				}) && (e.core = n.core.table(t), n[t] instanceof n.Table && (n[t].core = e.core));
			});
		}
		function nn(i, e, t, o) {
			t.forEach(function(n) {
				var r = o[n];
				e.forEach(function(e) {
					var t = function e(t, n) {
						return h(t, n) || (t = c(t)) && e(t, n);
					}(e, n);
					(!t || "value" in t && void 0 === t.value) && (e === i.Transaction.prototype || e instanceof i.Transaction ? l(e, n, {
						get: function() {
							return this.table(n);
						},
						set: function(e) {
							u(this, n, {
								value: e,
								writable: !0,
								configurable: !0,
								enumerable: !0
							});
						}
					}) : e[n] = new i.Table(n, r));
				});
			});
		}
		function rn(n, e) {
			e.forEach(function(e) {
				for (var t in e) e[t] instanceof n.Table && delete e[t];
			});
		}
		function on(e, t) {
			return e._cfg.version - t._cfg.version;
		}
		function an(n, r, i, e) {
			var o = n._dbSchema;
			i.objectStoreNames.contains("$meta") && !o.$meta && (o.$meta = $t("$meta", pn("")[0], []), n._storeNames.push("$meta"));
			var a = n._createTransaction("readwrite", n._storeNames, o);
			a.create(i), a._completion.catch(e);
			var u = a._reject.bind(a), s = me.transless || me;
			Ne(function() {
				return me.trans = a, me.transless = s, 0 !== r ? (tn(n, i), t = r, ((e = a).storeNames.includes("$meta") ? e.table("$meta").get("version").then(function(e) {
					return null != e ? e : t;
				}) : _e.resolve(t)).then(function(e) {
					return c = e, l = a, f = i, t = [], e = (s = n)._versions, h = s._dbSchema = hn(0, s.idbdb, f), 0 !== (e = e.filter(function(e) {
						return e._cfg.version >= c;
					})).length ? (e.forEach(function(u) {
						t.push(function() {
							var t = h, e = u._cfg.dbschema;
							dn(s, t, f), dn(s, e, f), h = s._dbSchema = e;
							var n = sn(t, e);
							n.add.forEach(function(e) {
								cn(f, e[0], e[1].primKey, e[1].indexes);
							}), n.change.forEach(function(e) {
								if (e.recreate) throw new Y.Upgrade("Not yet support for changing primary key");
								var t = f.objectStore(e.name);
								e.add.forEach(function(e) {
									return fn(t, e);
								}), e.change.forEach(function(e) {
									t.deleteIndex(e.name), fn(t, e);
								}), e.del.forEach(function(e) {
									return t.deleteIndex(e);
								});
							});
							var r = u._cfg.contentUpgrade;
							if (r && u._cfg.version > c) {
								tn(s, f), l._memoizedTables = {};
								var i = k(e);
								n.del.forEach(function(e) {
									i[e] = t[e];
								}), rn(s, [s.Transaction.prototype]), nn(s, [s.Transaction.prototype], O(i), i), l.schema = i;
								var o, a = B(r);
								a && Le();
								n = _e.follow(function() {
									var e;
									(o = r(l)) && a && (e = Ue.bind(null, null), o.then(e, e));
								});
								return o && "function" == typeof o.then ? _e.resolve(o) : n.then(function() {
									return o;
								});
							}
						}), t.push(function(e) {
							var t = u._cfg.dbschema, n = e;
							[].slice.call(n.db.objectStoreNames).forEach(function(e) {
								return null == t[e] && n.db.deleteObjectStore(e);
							}), rn(s, [s.Transaction.prototype]), nn(s, [s.Transaction.prototype], s._storeNames, s._dbSchema), l.schema = s._dbSchema;
						}), t.push(function(e) {
							s.idbdb.objectStoreNames.contains("$meta") && (Math.ceil(s.idbdb.version / 10) === u._cfg.version ? (s.idbdb.deleteObjectStore("$meta"), delete s._dbSchema.$meta, s._storeNames = s._storeNames.filter(function(e) {
								return "$meta" !== e;
							})) : e.objectStore("$meta").put(u._cfg.version, "version"));
						});
					}), function e() {
						return t.length ? _e.resolve(t.shift()(l.idbtrans)).then(e) : _e.resolve();
					}().then(function() {
						ln(h, f);
					})) : _e.resolve();
					var s, c, l, f, t, h;
				}).catch(u)) : (O(o).forEach(function(e) {
					cn(i, e, o[e].primKey, o[e].indexes);
				}), tn(n, i), void _e.follow(function() {
					return n.on.populate.fire(a);
				}).catch(u));
				var e, t;
			});
		}
		function un(e, r) {
			ln(e._dbSchema, r), r.db.version % 10 != 0 || r.objectStoreNames.contains("$meta") || r.db.createObjectStore("$meta").add(Math.ceil(r.db.version / 10 - 1), "version");
			var t = hn(0, e.idbdb, r);
			dn(e, e._dbSchema, r);
			for (var n = 0, i = sn(t, e._dbSchema).change; n < i.length; n++) {
				var o = function(t) {
					if (t.change.length || t.recreate) return console.warn("Unable to patch indexes of table ".concat(t.name, " because it has changes on the type of index or primary key.")), { value: void 0 };
					var n = r.objectStore(t.name);
					t.add.forEach(function(e) {
						ie && console.debug("Dexie upgrade patch: Creating missing index ".concat(t.name, ".").concat(e.src)), fn(n, e);
					});
				}(i[n]);
				if ("object" == typeof o) return o.value;
			}
		}
		function sn(e, t) {
			var n, r = {
				del: [],
				add: [],
				change: []
			};
			for (n in e) t[n] || r.del.push(n);
			for (n in t) {
				var i = e[n], o = t[n];
				if (i) {
					var a = {
						name: n,
						def: o,
						recreate: !1,
						del: [],
						add: [],
						change: []
					};
					if ("" + (i.primKey.keyPath || "") != "" + (o.primKey.keyPath || "") || i.primKey.auto !== o.primKey.auto) a.recreate = !0, r.change.push(a);
					else {
						var u = i.idxByName, s = o.idxByName, c = void 0;
						for (c in u) s[c] || a.del.push(c);
						for (c in s) {
							var l = u[c], f = s[c];
							l ? l.src !== f.src && a.change.push(f) : a.add.push(f);
						}
						(0 < a.del.length || 0 < a.add.length || 0 < a.change.length) && r.change.push(a);
					}
				} else r.add.push([n, o]);
			}
			return r;
		}
		function cn(e, t, n, r) {
			var i = e.db.createObjectStore(t, n.keyPath ? {
				keyPath: n.keyPath,
				autoIncrement: n.auto
			} : { autoIncrement: n.auto });
			return r.forEach(function(e) {
				return fn(i, e);
			}), i;
		}
		function ln(t, n) {
			O(t).forEach(function(e) {
				n.db.objectStoreNames.contains(e) || (ie && console.debug("Dexie: Creating missing table", e), cn(n, e, t[e].primKey, t[e].indexes));
			});
		}
		function fn(e, t) {
			e.createIndex(t.name, t.keyPath, {
				unique: t.unique,
				multiEntry: t.multi
			});
		}
		function hn(e, t, u) {
			var s = {};
			return b(t.objectStoreNames, 0).forEach(function(e) {
				for (var t = u.objectStore(e), n = Wt(Yt(a = t.keyPath), a || "", !0, !1, !!t.autoIncrement, a && "string" != typeof a, !0), r = [], i = 0; i < t.indexNames.length; ++i) {
					var o = t.index(t.indexNames[i]), a = o.keyPath, o = Wt(o.name, a, !!o.unique, !!o.multiEntry, !1, a && "string" != typeof a, !1);
					r.push(o);
				}
				s[e] = $t(e, n, r);
			}), s;
		}
		function dn(e, t, n) {
			for (var r = n.db.objectStoreNames, i = 0; i < r.length; ++i) {
				var o = r[i], a = n.objectStore(o);
				e._hasGetAll = "getAll" in a;
				for (var u = 0; u < a.indexNames.length; ++u) {
					var s = a.indexNames[u], c = a.index(s).keyPath, l = "string" == typeof c ? c : "[" + b(c).join("+") + "]";
					!t[o] || (c = t[o].idxByName[l]) && (c.name = s, delete t[o].idxByName[l], t[o].idxByName[s] = c);
				}
			}
			"undefined" != typeof navigator && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && f.WorkerGlobalScope && f instanceof f.WorkerGlobalScope && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604 && (e._hasGetAll = !1);
		}
		function pn(e) {
			return e.split(",").map(function(e, t) {
				var n = e.split(":"), r = null === (i = n[1]) || void 0 === i ? void 0 : i.trim(), i = (e = n[0].trim()).replace(/([&*]|\+\+)/g, ""), n = /^\[/.test(i) ? i.match(/^\[(.*)\]$/)[1].split("+") : i;
				return Wt(i, n || null, /\&/.test(e), /\*/.test(e), /\+\+/.test(e), x(n), 0 === t, r);
			});
		}
		var yn = (vn.prototype._createTableSchema = $t, vn.prototype._parseIndexSyntax = pn, vn.prototype._parseStoresSpec = function(r, i) {
			var o = this;
			O(r).forEach(function(e) {
				if (null !== r[e]) {
					var t = o._parseIndexSyntax(r[e]), n = t.shift();
					if (!n) throw new Y.Schema("Invalid schema for table " + e + ": " + r[e]);
					if (n.unique = !0, n.multi) throw new Y.Schema("Primary key cannot be multiEntry*");
					t.forEach(function(e) {
						if (e.auto) throw new Y.Schema("Only primary key can be marked as autoIncrement (++)");
						if (!e.keyPath) throw new Y.Schema("Index must have a name and cannot be an empty string");
					});
					t = o._createTableSchema(e, n, t);
					i[e] = t;
				}
			});
		}, vn.prototype.stores = function(e) {
			var t = this.db;
			this._cfg.storesSource = this._cfg.storesSource ? a(this._cfg.storesSource, e) : e;
			var e = t._versions, n = {}, r = {};
			return e.forEach(function(e) {
				a(n, e._cfg.storesSource), r = e._cfg.dbschema = {}, e._parseStoresSpec(n, r);
			}), t._dbSchema = r, rn(t, [
				t._allTables,
				t,
				t.Transaction.prototype
			]), nn(t, [
				t._allTables,
				t,
				t.Transaction.prototype,
				this._cfg.tables
			], O(r), r), t._storeNames = O(r), this;
		}, vn.prototype.upgrade = function(e) {
			return this._cfg.contentUpgrade = re(this._cfg.contentUpgrade || G, e), this;
		}, vn);
		function vn() {}
		function mn(e, t) {
			var n = e._dbNamesDB;
			return n || (n = e._dbNamesDB = new nr(tt, {
				addons: [],
				indexedDB: e,
				IDBKeyRange: t
			})).version(1).stores({ dbnames: "name" }), n.table("dbnames");
		}
		function bn(e) {
			return e && "function" == typeof e.databases;
		}
		function gn(e) {
			return Ne(function() {
				return me.letThrough = !0, e();
			});
		}
		function wn(e) {
			return !("from" in e);
		}
		var _n = function(e, t) {
			if (!this) {
				var n = new _n();
				return e && "d" in e && a(n, e), n;
			}
			a(this, arguments.length ? {
				d: 1,
				from: e,
				to: 1 < arguments.length ? t : e
			} : { d: 0 });
		};
		function xn(e, t, n) {
			var r = st(t, n);
			if (!isNaN(r)) {
				if (0 < r) throw RangeError();
				if (wn(e)) return a(e, {
					from: t,
					to: n,
					d: 1
				});
				var i = e.l, r = e.r;
				if (st(n, e.from) < 0) return i ? xn(i, t, n) : e.l = {
					from: t,
					to: n,
					d: 1,
					l: null,
					r: null
				}, Kn(e);
				if (0 < st(t, e.to)) return r ? xn(r, t, n) : e.r = {
					from: t,
					to: n,
					d: 1,
					l: null,
					r: null
				}, Kn(e);
				st(t, e.from) < 0 && (e.from = t, e.l = null, e.d = r ? r.d + 1 : 1), 0 < st(n, e.to) && (e.to = n, e.r = null, e.d = e.l ? e.l.d + 1 : 1);
				n = !e.r;
				i && !e.l && kn(e, i), r && n && kn(e, r);
			}
		}
		function kn(e, t) {
			wn(t) || function e(t, n) {
				var r = n.from, i = n.to, o = n.l, n = n.r;
				xn(t, r, i), o && e(t, o), n && e(t, n);
			}(e, t);
		}
		function On(e, t) {
			var n = Pn(t), r = n.next();
			if (r.done) return !1;
			for (var i = r.value, o = Pn(e), a = o.next(i.from), u = a.value; !r.done && !a.done;) {
				if (st(u.from, i.to) <= 0 && 0 <= st(u.to, i.from)) return !0;
				st(i.from, u.from) < 0 ? i = (r = n.next(u.from)).value : u = (a = o.next(i.from)).value;
			}
			return !1;
		}
		function Pn(e) {
			var n = wn(e) ? null : {
				s: 0,
				n: e
			};
			return { next: function(e) {
				for (var t = 0 < arguments.length; n;) switch (n.s) {
					case 0: if (n.s = 1, t) for (; n.n.l && st(e, n.n.from) < 0;) n = {
						up: n,
						n: n.n.l,
						s: 1
					};
					else for (; n.n.l;) n = {
						up: n,
						n: n.n.l,
						s: 1
					};
					case 1: if (n.s = 2, !t || st(e, n.n.to) <= 0) return {
						value: n.n,
						done: !1
					};
					case 2: if (n.n.r) {
						n.s = 3, n = {
							up: n,
							n: n.n.r,
							s: 0
						};
						continue;
					}
					case 3: n = n.up;
				}
				return { done: !0 };
			} };
		}
		function Kn(e) {
			var t, n, r = ((null === (t = e.r) || void 0 === t ? void 0 : t.d) || 0) - ((null === (n = e.l) || void 0 === n ? void 0 : n.d) || 0), i = 1 < r ? "r" : r < -1 ? "l" : "";
			i && (t = "r" == i ? "l" : "r", n = _({}, e), r = e[i], e.from = r.from, e.to = r.to, e[i] = r[i], n[i] = r[t], (e[t] = n).d = En(n)), e.d = En(e);
		}
		function En(e) {
			var t = e.r, e = e.l;
			return (t ? e ? Math.max(t.d, e.d) : t.d : e ? e.d : 0) + 1;
		}
		function Sn(t, n) {
			return O(n).forEach(function(e) {
				t[e] ? kn(t[e], n[e]) : t[e] = function e(t) {
					var n, r, i = {};
					for (n in t) m(t, n) && (r = t[n], i[n] = !r || "object" != typeof r || K.has(r.constructor) ? r : e(r));
					return i;
				}(n[e]);
			}), t;
		}
		function jn(t, n) {
			return t.all || n.all || Object.keys(t).some(function(e) {
				return n[e] && On(n[e], t[e]);
			});
		}
		r(_n.prototype, ((F = {
			add: function(e) {
				return kn(this, e), this;
			},
			addKey: function(e) {
				return xn(this, e, e), this;
			},
			addKeys: function(e) {
				var t = this;
				return e.forEach(function(e) {
					return xn(t, e, e);
				}), this;
			},
			hasKey: function(e) {
				var t = Pn(this).next(e).value;
				return t && st(t.from, e) <= 0 && 0 <= st(t.to, e);
			}
		})[C] = function() {
			return Pn(this);
		}, F));
		var An = {}, Cn = {}, Tn = !1;
		function In(e) {
			Sn(Cn, e), Tn || (Tn = !0, setTimeout(function() {
				Tn = !1, qn(Cn, !(Cn = {}));
			}, 0));
		}
		function qn(e, t) {
			void 0 === t && (t = !1);
			var n = /* @__PURE__ */ new Set();
			if (e.all) for (var r = 0, i = Object.values(An); r < i.length; r++) Dn(a = i[r], e, n, t);
			else for (var o in e) {
				var a, u = /^idb\:\/\/(.*)\/(.*)\//.exec(o);
				u && (o = u[1], u = u[2], (a = An["idb://".concat(o, "/").concat(u)]) && Dn(a, e, n, t));
			}
			n.forEach(function(e) {
				return e();
			});
		}
		function Dn(e, t, n, r) {
			for (var i = [], o = 0, a = Object.entries(e.queries.query); o < a.length; o++) {
				for (var u = a[o], s = u[0], c = [], l = 0, f = u[1]; l < f.length; l++) {
					var h = f[l];
					jn(t, h.obsSet) ? h.subscribers.forEach(function(e) {
						return n.add(e);
					}) : r && c.push(h);
				}
				r && i.push([s, c]);
			}
			if (r) for (var d = 0, p = i; d < p.length; d++) {
				var y = p[d], s = y[0], c = y[1];
				e.queries.query[s] = c;
			}
		}
		function Bn(f) {
			var h = f._state, r = f._deps.indexedDB;
			if (h.isBeingOpened || f.idbdb) return h.dbReadyPromise.then(function() {
				return h.dbOpenError ? Xe(h.dbOpenError) : f;
			});
			h.isBeingOpened = !0, h.dbOpenError = null, h.openComplete = !1;
			var t = h.openCanceller, d = Math.round(10 * f.verno), p = !1;
			function e() {
				if (h.openCanceller !== t) throw new Y.DatabaseClosed("db.open() was cancelled");
			}
			function y() {
				return new _e(function(s, n) {
					if (e(), !r) throw new Y.MissingAPI();
					var c = f.name, l = h.autoSchema || !d ? r.open(c) : r.open(c, d);
					if (!l) throw new Y.MissingAPI();
					l.onerror = Ft(n), l.onblocked = Ie(f._fireOnBlocked), l.onupgradeneeded = Ie(function(e) {
						var t;
						v = l.transaction, h.autoSchema && !f._options.allowEmptyDB ? (l.onerror = Mt, v.abort(), l.result.close(), (t = r.deleteDatabase(c)).onsuccess = t.onerror = Ie(function() {
							n(new Y.NoSuchDatabase("Database ".concat(c, " doesnt exist")));
						})) : (v.onerror = Ft(n), e = e.oldVersion > Math.pow(2, 62) ? 0 : e.oldVersion, m = e < 1, f.idbdb = l.result, p && un(f, v), an(f, e / 10, v, n));
					}, n), l.onsuccess = Ie(function() {
						v = null;
						var e, t, n, r, i, o = f.idbdb = l.result, a = b(o.objectStoreNames);
						if (0 < a.length) try {
							var u = o.transaction(1 === (r = a).length ? r[0] : r, "readonly");
							if (h.autoSchema) t = o, n = u, (e = f).verno = t.version / 10, n = e._dbSchema = hn(0, t, n), e._storeNames = b(t.objectStoreNames, 0), nn(e, [e._allTables], O(n), n);
							else if (dn(f, f._dbSchema, u), ((i = sn(hn(0, (i = f).idbdb, u), i._dbSchema)).add.length || i.change.some(function(e) {
								return e.add.length || e.change.length;
							})) && !p) return console.warn("Dexie SchemaDiff: Schema was extended without increasing the number passed to db.version(). Dexie will add missing parts and increment native version number to workaround this."), o.close(), d = o.version + 1, p = !0, s(y());
							tn(f, u);
						} catch (e) {}
						et.push(f), o.onversionchange = Ie(function(e) {
							h.vcFired = !0, f.on("versionchange").fire(e);
						}), o.onclose = Ie(function() {
							f.close({ disableAutoOpen: !1 });
						}), m && (i = f._deps, u = c, o = i.indexedDB, i = i.IDBKeyRange, bn(o) || u === tt || mn(o, i).put({ name: u }).catch(G)), s();
					}, n);
				}).catch(function(e) {
					switch (null == e ? void 0 : e.name) {
						case "UnknownError":
							if (0 < h.PR1398_maxLoop) return h.PR1398_maxLoop--, console.warn("Dexie: Workaround for Chrome UnknownError on open()"), y();
							break;
						case "VersionError": if (0 < d) return d = 0, y();
					}
					return _e.reject(e);
				});
			}
			var n, i = h.dbReadyResolve, v = null, m = !1;
			return _e.race([t, ("undefined" == typeof navigator ? _e.resolve() : !navigator.userAgentData && /Safari\//.test(navigator.userAgent) && !/Chrom(e|ium)\//.test(navigator.userAgent) && indexedDB.databases ? new Promise(function(e) {
				function t() {
					return indexedDB.databases().finally(e);
				}
				n = setInterval(t, 100), t();
			}).finally(function() {
				return clearInterval(n);
			}) : Promise.resolve()).then(y)]).then(function() {
				return e(), h.onReadyBeingFired = [], _e.resolve(gn(function() {
					return f.on.ready.fire(f.vip);
				})).then(function e() {
					if (0 < h.onReadyBeingFired.length) {
						var t = h.onReadyBeingFired.reduce(re, G);
						return h.onReadyBeingFired = [], _e.resolve(gn(function() {
							return t(f.vip);
						})).then(e);
					}
				});
			}).finally(function() {
				h.openCanceller === t && (h.onReadyBeingFired = null, h.isBeingOpened = !1);
			}).catch(function(e) {
				h.dbOpenError = e;
				try {
					v && v.abort();
				} catch (e) {}
				return t === h.openCanceller && f._close(), Xe(e);
			}).finally(function() {
				h.openComplete = !0, i();
			}).then(function() {
				var n;
				return m && (n = {}, f.tables.forEach(function(t) {
					t.schema.indexes.forEach(function(e) {
						e.name && (n["idb://".concat(f.name, "/").concat(t.name, "/").concat(e.name)] = new _n(-Infinity, [[[]]]));
					}), n["idb://".concat(f.name, "/").concat(t.name, "/")] = n["idb://".concat(f.name, "/").concat(t.name, "/:dels")] = new _n(-Infinity, [[[]]]);
				}), Ut(Nt).fire(n), qn(n, !0)), f;
			});
		}
		function Rn(t) {
			function e(e) {
				return t.next(e);
			}
			var r = n(e), i = n(function(e) {
				return t.throw(e);
			});
			function n(n) {
				return function(e) {
					var t = n(e), e = t.value;
					return t.done ? e : e && "function" == typeof e.then ? e.then(r, i) : x(e) ? Promise.all(e).then(r, i) : r(e);
				};
			}
			return n(e)();
		}
		function Fn(e, t, n) {
			for (var r = x(e) ? e.slice() : [e], i = 0; i < n; ++i) r.push(t);
			return r;
		}
		var Mn = {
			stack: "dbcore",
			name: "VirtualIndexMiddleware",
			level: 1,
			create: function(f) {
				return _(_({}, f), { table: function(e) {
					var a = f.table(e), t = a.schema, u = {}, s = [];
					function c(e, t, n) {
						var r = Jt(e), i = u[r] = u[r] || [], o = null == e ? 0 : "string" == typeof e ? 1 : e.length, a = 0 < t, a = _(_({}, n), {
							name: a ? "".concat(r, "(virtual-from:").concat(n.name, ")") : n.name,
							lowLevelIndex: n,
							isVirtual: a,
							keyTail: t,
							keyLength: o,
							extractKey: Gt(e),
							unique: !a && n.unique
						});
						return i.push(a), a.isPrimaryKey || s.push(a), 1 < o && c(2 === o ? e[0] : e.slice(0, o - 1), t + 1, n), i.sort(function(e, t) {
							return e.keyTail - t.keyTail;
						}), a;
					}
					e = c(t.primaryKey.keyPath, 0, t.primaryKey);
					u[":id"] = [e];
					for (var n = 0, r = t.indexes; n < r.length; n++) {
						var i = r[n];
						c(i.keyPath, 0, i);
					}
					function l(e) {
						var t, n = e.query.index;
						return n.isVirtual ? _(_({}, e), { query: {
							index: n.lowLevelIndex,
							range: (t = e.query.range, n = n.keyTail, {
								type: 1 === t.type ? 2 : t.type,
								lower: Fn(t.lower, t.lowerOpen ? f.MAX_KEY : f.MIN_KEY, n),
								lowerOpen: !0,
								upper: Fn(t.upper, t.upperOpen ? f.MIN_KEY : f.MAX_KEY, n),
								upperOpen: !0
							})
						} }) : e;
					}
					return _(_({}, a), {
						schema: _(_({}, t), {
							primaryKey: e,
							indexes: s,
							getIndexByKeyPath: function(e) {
								return (e = u[Jt(e)]) && e[0];
							}
						}),
						count: function(e) {
							return a.count(l(e));
						},
						query: function(e) {
							return a.query(l(e));
						},
						openCursor: function(t) {
							var e = t.query.index, r = e.keyTail, n = e.isVirtual, i = e.keyLength;
							return n ? a.openCursor(l(t)).then(function(e) {
								return e && o(e);
							}) : a.openCursor(t);
							function o(n) {
								return Object.create(n, {
									continue: { value: function(e) {
										null != e ? n.continue(Fn(e, t.reverse ? f.MAX_KEY : f.MIN_KEY, r)) : t.unique ? n.continue(n.key.slice(0, i).concat(t.reverse ? f.MIN_KEY : f.MAX_KEY, r)) : n.continue();
									} },
									continuePrimaryKey: { value: function(e, t) {
										n.continuePrimaryKey(Fn(e, f.MAX_KEY, r), t);
									} },
									primaryKey: { get: function() {
										return n.primaryKey;
									} },
									key: { get: function() {
										var e = n.key;
										return 1 === i ? e[0] : e.slice(0, i);
									} },
									value: { get: function() {
										return n.value;
									} }
								});
							}
						}
					});
				} });
			}
		};
		function Nn(i, o, a, u) {
			return a = a || {}, u = u || "", O(i).forEach(function(e) {
				var t, n, r;
				m(o, e) ? (t = i[e], n = o[e], "object" == typeof t && "object" == typeof n && t && n ? (r = A(t)) !== A(n) ? a[u + e] = o[e] : "Object" === r ? Nn(t, n, a, u + e + ".") : t !== n && (a[u + e] = o[e]) : t !== n && (a[u + e] = o[e])) : a[u + e] = void 0;
			}), O(o).forEach(function(e) {
				m(i, e) || (a[u + e] = o[e]);
			}), a;
		}
		function Ln(e, t) {
			return "delete" === t.type ? t.keys : t.keys || t.values.map(e.extractKey);
		}
		var Un = {
			stack: "dbcore",
			name: "HooksMiddleware",
			level: 2,
			create: function(e) {
				return _(_({}, e), { table: function(r) {
					var y = e.table(r), v = y.schema.primaryKey;
					return _(_({}, y), { mutate: function(e) {
						var t = me.trans, n = t.table(r).hook, h = n.deleting, d = n.creating, p = n.updating;
						switch (e.type) {
							case "add":
								if (d.fire === G) break;
								return t._promise("readwrite", function() {
									return a(e);
								}, !0);
							case "put":
								if (d.fire === G && p.fire === G) break;
								return t._promise("readwrite", function() {
									return a(e);
								}, !0);
							case "delete":
								if (h.fire === G) break;
								return t._promise("readwrite", function() {
									return a(e);
								}, !0);
							case "deleteRange":
								if (h.fire === G) break;
								return t._promise("readwrite", function() {
									return function n(r, i, o) {
										return y.query({
											trans: r,
											values: !1,
											query: {
												index: v,
												range: i
											},
											limit: o
										}).then(function(e) {
											var t = e.result;
											return a({
												type: "delete",
												keys: t,
												trans: r
											}).then(function(e) {
												return 0 < e.numFailures ? Promise.reject(e.failures[0]) : t.length < o ? {
													failures: [],
													numFailures: 0,
													lastResult: void 0
												} : n(r, _(_({}, i), {
													lower: t[t.length - 1],
													lowerOpen: !0
												}), o);
											});
										});
									}(e.trans, e.range, 1e4);
								}, !0);
						}
						return y.mutate(e);
						function a(c) {
							var e, t, n, l = me.trans, f = c.keys || Ln(v, c);
							if (!f) throw new Error("Keys missing");
							return "delete" !== (c = "add" === c.type || "put" === c.type ? _(_({}, c), { keys: f }) : _({}, c)).type && (c.values = i([], c.values, !0)), c.keys && (c.keys = i([], c.keys, !0)), e = y, n = f, ("add" === (t = c).type ? Promise.resolve([]) : e.getMany({
								trans: t.trans,
								keys: n,
								cache: "immutable"
							})).then(function(u) {
								var s = f.map(function(e, t) {
									var n, r, i, o = u[t], a = {
										onerror: null,
										onsuccess: null
									};
									return "delete" === c.type ? h.fire.call(a, e, o, l) : "add" === c.type || void 0 === o ? (n = d.fire.call(a, e, c.values[t], l), null == e && null != n && (c.keys[t] = e = n, v.outbound || w(c.values[t], v.keyPath, e))) : (n = Nn(o, c.values[t]), (r = p.fire.call(a, n, e, o, l)) && (i = c.values[t], Object.keys(r).forEach(function(e) {
										m(i, e) ? i[e] = r[e] : w(i, e, r[e]);
									}))), a;
								});
								return y.mutate(c).then(function(e) {
									for (var t = e.failures, n = e.results, r = e.numFailures, e = e.lastResult, i = 0; i < f.length; ++i) {
										var o = (n || f)[i], a = s[i];
										null == o ? a.onerror && a.onerror(t[i]) : a.onsuccess && a.onsuccess("put" === c.type && u[i] ? c.values[i] : o);
									}
									return {
										failures: t,
										results: n,
										numFailures: r,
										lastResult: e
									};
								}).catch(function(t) {
									return s.forEach(function(e) {
										return e.onerror && e.onerror(t);
									}), Promise.reject(t);
								});
							});
						}
					} });
				} });
			}
		};
		function Vn(e, t, n) {
			try {
				if (!t) return null;
				if (t.keys.length < e.length) return null;
				for (var r = [], i = 0, o = 0; i < t.keys.length && o < e.length; ++i) 0 === st(t.keys[i], e[o]) && (r.push(n ? S(t.values[i]) : t.values[i]), ++o);
				return r.length === e.length ? r : null;
			} catch (e) {
				return null;
			}
		}
		var zn = {
			stack: "dbcore",
			level: -1,
			create: function(t) {
				return { table: function(e) {
					var n = t.table(e);
					return _(_({}, n), {
						getMany: function(t) {
							if (!t.cache) return n.getMany(t);
							var e = Vn(t.keys, t.trans._cache, "clone" === t.cache);
							return e ? _e.resolve(e) : n.getMany(t).then(function(e) {
								return t.trans._cache = {
									keys: t.keys,
									values: "clone" === t.cache ? S(e) : e
								}, e;
							});
						},
						mutate: function(e) {
							return "add" !== e.type && (e.trans._cache = null), n.mutate(e);
						}
					});
				} };
			}
		};
		function Wn(e, t) {
			return "readonly" === e.trans.mode && !!e.subscr && !e.trans.explicit && "disabled" !== e.trans.db._options.cache && !t.schema.primaryKey.outbound;
		}
		function Yn(e, t) {
			switch (e) {
				case "query": return t.values && !t.unique;
				case "get":
				case "getMany":
				case "count":
				case "openCursor": return !1;
			}
		}
		var $n = {
			stack: "dbcore",
			level: 0,
			name: "Observability",
			create: function(b) {
				var g = b.schema.name, w = new _n(b.MIN_KEY, b.MAX_KEY);
				return _(_({}, b), {
					transaction: function(e, t, n) {
						if (me.subscr && "readonly" !== t) throw new Y.ReadOnly("Readwrite transaction in liveQuery context. Querier source: ".concat(me.querier));
						return b.transaction(e, t, n);
					},
					table: function(d) {
						var p = b.table(d), y = p.schema, v = y.primaryKey, e = y.indexes, c = v.extractKey, l = v.outbound, m = v.autoIncrement && e.filter(function(e) {
							return e.compound && e.keyPath.includes(v.keyPath);
						}), t = _(_({}, p), { mutate: function(a) {
							function u(e) {
								return e = "idb://".concat(g, "/").concat(d, "/").concat(e), n[e] || (n[e] = new _n());
							}
							var e, o, s, t = a.trans, n = a.mutatedParts || (a.mutatedParts = {}), r = u(""), i = u(":dels"), c = a.type, l = "deleteRange" === a.type ? [a.range] : "delete" === a.type ? [a.keys] : a.values.length < 50 ? [Ln(v, a).filter(function(e) {
								return e;
							}), a.values] : [], f = l[0], h = l[1], l = a.trans._cache;
							return x(f) ? (r.addKeys(f), (l = "delete" === c || f.length === h.length ? Vn(f, l) : null) || i.addKeys(f), (l || h) && (e = u, o = l, s = h, y.indexes.forEach(function(t) {
								var n = e(t.name || "");
								function r(e) {
									return null != e ? t.extractKey(e) : null;
								}
								function i(e) {
									return t.multiEntry && x(e) ? e.forEach(function(e) {
										return n.addKey(e);
									}) : n.addKey(e);
								}
								(o || s).forEach(function(e, t) {
									var n = o && r(o[t]), t = s && r(s[t]);
									0 !== st(n, t) && (null != n && i(n), null != t && i(t));
								});
							}))) : f ? (h = {
								from: null !== (h = f.lower) && void 0 !== h ? h : b.MIN_KEY,
								to: null !== (h = f.upper) && void 0 !== h ? h : b.MAX_KEY
							}, i.add(h), r.add(h)) : (r.add(w), i.add(w), y.indexes.forEach(function(e) {
								return u(e.name).add(w);
							})), p.mutate(a).then(function(o) {
								return !f || "add" !== a.type && "put" !== a.type || (r.addKeys(o.results), m && m.forEach(function(t) {
									for (var e = a.values.map(function(e) {
										return t.extractKey(e);
									}), n = t.keyPath.findIndex(function(e) {
										return e === v.keyPath;
									}), r = 0, i = o.results.length; r < i; ++r) e[r][n] = o.results[r];
									u(t.name).addKeys(e);
								})), t.mutatedParts = Sn(t.mutatedParts || {}, n), o;
							});
						} }), e = function(e) {
							var t = e.query, e = t.index, t = t.range;
							return [e, new _n(null !== (e = t.lower) && void 0 !== e ? e : b.MIN_KEY, null !== (t = t.upper) && void 0 !== t ? t : b.MAX_KEY)];
						}, f = {
							get: function(e) {
								return [v, new _n(e.key)];
							},
							getMany: function(e) {
								return [v, new _n().addKeys(e.keys)];
							},
							count: e,
							query: e,
							openCursor: e
						};
						return O(f).forEach(function(s) {
							t[s] = function(i) {
								var e = me.subscr, t = !!e, n = Wn(me, p) && Yn(s, i) ? i.obsSet = {} : e;
								if (t) {
									var r = function(e) {
										e = "idb://".concat(g, "/").concat(d, "/").concat(e);
										return n[e] || (n[e] = new _n());
									}, o = r(""), a = r(":dels"), e = f[s](i), t = e[0], e = e[1];
									if (("query" === s && t.isPrimaryKey && !i.values ? a : r(t.name || "")).add(e), !t.isPrimaryKey) {
										if ("count" !== s) {
											var u = "query" === s && l && i.values && p.query(_(_({}, i), { values: !1 }));
											return p[s].apply(this, arguments).then(function(t) {
												if ("query" === s) {
													if (l && i.values) return u.then(function(e) {
														e = e.result;
														return o.addKeys(e), t;
													});
													var e = i.values ? t.result.map(c) : t.result;
													(i.values ? o : a).addKeys(e);
												} else if ("openCursor" === s) {
													var n = t, r = i.values;
													return n && Object.create(n, {
														key: { get: function() {
															return a.addKey(n.primaryKey), n.key;
														} },
														primaryKey: { get: function() {
															var e = n.primaryKey;
															return a.addKey(e), e;
														} },
														value: { get: function() {
															return r && o.addKey(n.primaryKey), n.value;
														} }
													});
												}
												return t;
											});
										}
										a.add(w);
									}
								}
								return p[s].apply(this, arguments);
							};
						}), t;
					}
				});
			}
		};
		function Qn(e, t, n) {
			if (0 === n.numFailures) return t;
			if ("deleteRange" === t.type) return null;
			var r = t.keys ? t.keys.length : "values" in t && t.values ? t.values.length : 1;
			if (n.numFailures === r) return null;
			t = _({}, t);
			return x(t.keys) && (t.keys = t.keys.filter(function(e, t) {
				return !(t in n.failures);
			})), "values" in t && x(t.values) && (t.values = t.values.filter(function(e, t) {
				return !(t in n.failures);
			})), t;
		}
		function Gn(e, t) {
			return n = e, (void 0 === (r = t).lower || (r.lowerOpen ? 0 < st(n, r.lower) : 0 <= st(n, r.lower))) && (e = e, void 0 === (t = t).upper || (t.upperOpen ? st(e, t.upper) < 0 : st(e, t.upper) <= 0));
			var n, r;
		}
		function Xn(e, d, t, n, r, i) {
			if (!t || 0 === t.length) return e;
			var o = d.query.index, p = o.multiEntry, y = d.query.range, v = n.schema.primaryKey.extractKey, m = o.extractKey, a = (o.lowLevelIndex || o).extractKey, t = t.reduce(function(e, t) {
				var n = e, r = [];
				if ("add" === t.type || "put" === t.type) for (var i = new _n(), o = t.values.length - 1; 0 <= o; --o) {
					var a, u = t.values[o], s = v(u);
					i.hasKey(s) || (a = m(u), (p && x(a) ? a.some(function(e) {
						return Gn(e, y);
					}) : Gn(a, y)) && (i.addKey(s), r.push(u)));
				}
				switch (t.type) {
					case "add":
						var c = new _n().addKeys(d.values ? e.map(function(e) {
							return v(e);
						}) : e), n = e.concat(d.values ? r.filter(function(e) {
							e = v(e);
							return !c.hasKey(e) && (c.addKey(e), !0);
						}) : r.map(function(e) {
							return v(e);
						}).filter(function(e) {
							return !c.hasKey(e) && (c.addKey(e), !0);
						}));
						break;
					case "put":
						var l = new _n().addKeys(t.values.map(function(e) {
							return v(e);
						}));
						n = e.filter(function(e) {
							return !l.hasKey(d.values ? v(e) : e);
						}).concat(d.values ? r : r.map(function(e) {
							return v(e);
						}));
						break;
					case "delete":
						var f = new _n().addKeys(t.keys);
						n = e.filter(function(e) {
							return !f.hasKey(d.values ? v(e) : e);
						});
						break;
					case "deleteRange":
						var h = t.range;
						n = e.filter(function(e) {
							return !Gn(v(e), h);
						});
				}
				return n;
			}, e);
			return t === e ? e : (t.sort(function(e, t) {
				return st(a(e), a(t)) || st(v(e), v(t));
			}), d.limit && d.limit < Infinity && (t.length > d.limit ? t.length = d.limit : e.length === d.limit && t.length < d.limit && (r.dirty = !0)), i ? Object.freeze(t) : t);
		}
		function Hn(e, t) {
			return 0 === st(e.lower, t.lower) && 0 === st(e.upper, t.upper) && !!e.lowerOpen == !!t.lowerOpen && !!e.upperOpen == !!t.upperOpen;
		}
		function Jn(e, t) {
			return function(e, t, n, r) {
				if (void 0 === e) return void 0 !== t ? -1 : 0;
				if (void 0 === t) return 1;
				if (0 === (t = st(e, t))) {
					if (n && r) return 0;
					if (n) return 1;
					if (r) return -1;
				}
				return t;
			}(e.lower, t.lower, e.lowerOpen, t.lowerOpen) <= 0 && 0 <= function(e, t, n, r) {
				if (void 0 === e) return void 0 !== t ? 1 : 0;
				if (void 0 === t) return -1;
				if (0 === (t = st(e, t))) {
					if (n && r) return 0;
					if (n) return -1;
					if (r) return 1;
				}
				return t;
			}(e.upper, t.upper, e.upperOpen, t.upperOpen);
		}
		function Zn(n, r, i, e) {
			n.subscribers.add(i), e.addEventListener("abort", function() {
				var e, t;
				n.subscribers.delete(i), 0 === n.subscribers.size && (e = n, t = r, setTimeout(function() {
					0 === e.subscribers.size && I(t, e);
				}, 3e3));
			});
		}
		var er = {
			stack: "dbcore",
			level: 0,
			name: "Cache",
			create: function(k) {
				var O = k.schema.name;
				return _(_({}, k), {
					transaction: function(g, w, e) {
						var _, t, x = k.transaction(g, w, e);
						return "readwrite" === w && (t = (_ = new AbortController()).signal, e = function(b) {
							return function() {
								if (_.abort(), "readwrite" === w) {
									for (var t = /* @__PURE__ */ new Set(), e = 0, n = g; e < n.length; e++) {
										var r = n[e], i = An["idb://".concat(O, "/").concat(r)];
										if (i) {
											var o = k.table(r), a = i.optimisticOps.filter(function(e) {
												return e.trans === x;
											});
											if (x._explicit && b && x.mutatedParts) for (var u = 0, s = Object.values(i.queries.query); u < s.length; u++) for (var c = 0, l = (d = s[u]).slice(); c < l.length; c++) jn((p = l[c]).obsSet, x.mutatedParts) && (I(d, p), p.subscribers.forEach(function(e) {
												return t.add(e);
											}));
											else if (0 < a.length) {
												i.optimisticOps = i.optimisticOps.filter(function(e) {
													return e.trans !== x;
												});
												for (var f = 0, h = Object.values(i.queries.query); f < h.length; f++) for (var d, p, y, v = 0, m = (d = h[f]).slice(); v < m.length; v++) null != (p = m[v]).res && x.mutatedParts && (b && !p.dirty ? (y = Object.isFrozen(p.res), y = Xn(p.res, p.req, a, o, p, y), p.dirty ? (I(d, p), p.subscribers.forEach(function(e) {
													return t.add(e);
												})) : y !== p.res && (p.res = y, p.promise = _e.resolve({ result: y }))) : (p.dirty && I(d, p), p.subscribers.forEach(function(e) {
													return t.add(e);
												})));
											}
										}
									}
									t.forEach(function(e) {
										return e();
									});
								}
							};
						}, x.addEventListener("abort", e(!1), { signal: t }), x.addEventListener("error", e(!1), { signal: t }), x.addEventListener("complete", e(!0), { signal: t })), x;
					},
					table: function(c) {
						var l = k.table(c), i = l.schema.primaryKey;
						return _(_({}, l), {
							mutate: function(t) {
								var e = me.trans;
								if (i.outbound || "disabled" === e.db._options.cache || e.explicit || "readwrite" !== e.idbtrans.mode) return l.mutate(t);
								var n = An["idb://".concat(O, "/").concat(c)];
								if (!n) return l.mutate(t);
								e = l.mutate(t);
								return "add" !== t.type && "put" !== t.type || !(50 <= t.values.length || Ln(i, t).some(function(e) {
									return null == e;
								})) ? (n.optimisticOps.push(t), t.mutatedParts && In(t.mutatedParts), e.then(function(e) {
									0 < e.numFailures && (I(n.optimisticOps, t), (e = Qn(0, t, e)) && n.optimisticOps.push(e), t.mutatedParts && In(t.mutatedParts));
								}), e.catch(function() {
									I(n.optimisticOps, t), t.mutatedParts && In(t.mutatedParts);
								})) : e.then(function(r) {
									var e = Qn(0, _(_({}, t), { values: t.values.map(function(e, t) {
										var n;
										if (r.failures[t]) return e;
										e = null !== (n = i.keyPath) && void 0 !== n && n.includes(".") ? S(e) : _({}, e);
										return w(e, i.keyPath, r.results[t]), e;
									}) }), r);
									n.optimisticOps.push(e), queueMicrotask(function() {
										return t.mutatedParts && In(t.mutatedParts);
									});
								}), e;
							},
							query: function(t) {
								if (!Wn(me, l) || !Yn("query", t)) return l.query(t);
								var i = "immutable" === (null === (o = me.trans) || void 0 === o ? void 0 : o.db._options.cache), e = me, n = e.requery, r = e.signal, o = function(e, t, n, r) {
									var i = An["idb://".concat(e, "/").concat(t)];
									if (!i) return [];
									if (!(t = i.queries[n])) return [
										null,
										!1,
										i,
										null
									];
									var o = t[(r.query ? r.query.index.name : null) || ""];
									if (!o) return [
										null,
										!1,
										i,
										null
									];
									switch (n) {
										case "query":
											var a = o.find(function(e) {
												return e.req.limit === r.limit && e.req.values === r.values && Hn(e.req.query.range, r.query.range);
											});
											return a ? [
												a,
												!0,
												i,
												o
											] : [
												o.find(function(e) {
													return ("limit" in e.req ? e.req.limit : Infinity) >= r.limit && (!r.values || e.req.values) && Jn(e.req.query.range, r.query.range);
												}),
												!1,
												i,
												o
											];
										case "count":
											a = o.find(function(e) {
												return Hn(e.req.query.range, r.query.range);
											});
											return [
												a,
												!!a,
												i,
												o
											];
									}
								}(O, c, "query", t), a = o[0], e = o[1], u = o[2], s = o[3];
								return a && e ? a.obsSet = t.obsSet : (e = l.query(t).then(function(e) {
									var t = e.result;
									if (a && (a.res = t), i) {
										for (var n = 0, r = t.length; n < r; ++n) Object.freeze(t[n]);
										Object.freeze(t);
									} else e.result = S(t);
									return e;
								}).catch(function(e) {
									return s && a && I(s, a), Promise.reject(e);
								}), a = {
									obsSet: t.obsSet,
									promise: e,
									subscribers: /* @__PURE__ */ new Set(),
									type: "query",
									req: t,
									dirty: !1
								}, s ? s.push(a) : (s = [a], (u = u || (An["idb://".concat(O, "/").concat(c)] = {
									queries: {
										query: {},
										count: {}
									},
									objs: /* @__PURE__ */ new Map(),
									optimisticOps: [],
									unsignaledParts: {}
								})).queries.query[t.query.index.name || ""] = s)), Zn(a, s, n, r), a.promise.then(function(e) {
									return { result: Xn(e.result, t, null == u ? void 0 : u.optimisticOps, l, a, i) };
								});
							}
						});
					}
				});
			}
		};
		function tr(e, r) {
			return new Proxy(e, { get: function(e, t, n) {
				return "db" === t ? r : Reflect.get(e, t, n);
			} });
		}
		var nr = (rr.prototype.version = function(t) {
			if (isNaN(t) || t < .1) throw new Y.Type("Given version is not a positive number");
			if (t = Math.round(10 * t) / 10, this.idbdb || this._state.isBeingOpened) throw new Y.Schema("Cannot add version when database is open");
			this.verno = Math.max(this.verno, t);
			var e = this._versions, n = e.filter(function(e) {
				return e._cfg.version === t;
			})[0];
			return n || (n = new this.Version(t), e.push(n), e.sort(on), n.stores({}), this._state.autoSchema = !1, n);
		}, rr.prototype._whenReady = function(e) {
			var n = this;
			return this.idbdb && (this._state.openComplete || me.letThrough || this._vip) ? e() : new _e(function(e, t) {
				if (n._state.openComplete) return t(new Y.DatabaseClosed(n._state.dbOpenError));
				if (!n._state.isBeingOpened) {
					if (!n._state.autoOpen) return void t(new Y.DatabaseClosed());
					n.open().catch(G);
				}
				n._state.dbReadyPromise.then(e, t);
			}).then(e);
		}, rr.prototype.use = function(e) {
			var t = e.stack, n = e.create, r = e.level, i = e.name;
			i && this.unuse({
				stack: t,
				name: i
			});
			e = this._middlewares[t] || (this._middlewares[t] = []);
			return e.push({
				stack: t,
				create: n,
				level: null == r ? 10 : r,
				name: i
			}), e.sort(function(e, t) {
				return e.level - t.level;
			}), this;
		}, rr.prototype.unuse = function(e) {
			var t = e.stack, n = e.name, r = e.create;
			return t && this._middlewares[t] && (this._middlewares[t] = this._middlewares[t].filter(function(e) {
				return r ? e.create !== r : !!n && e.name !== n;
			})), this;
		}, rr.prototype.open = function() {
			var e = this;
			return $e(ve, function() {
				return Bn(e);
			});
		}, rr.prototype._close = function() {
			this.on.close.fire(new CustomEvent("close"));
			var n = this._state, e = et.indexOf(this);
			if (0 <= e && et.splice(e, 1), this.idbdb) {
				try {
					this.idbdb.close();
				} catch (e) {}
				this.idbdb = null;
			}
			n.isBeingOpened || (n.dbReadyPromise = new _e(function(e) {
				n.dbReadyResolve = e;
			}), n.openCanceller = new _e(function(e, t) {
				n.cancelOpen = t;
			}));
		}, rr.prototype.close = function(e) {
			var t = (void 0 === e ? { disableAutoOpen: !0 } : e).disableAutoOpen, e = this._state;
			t ? (e.isBeingOpened && e.cancelOpen(new Y.DatabaseClosed()), this._close(), e.autoOpen = !1, e.dbOpenError = new Y.DatabaseClosed()) : (this._close(), e.autoOpen = this._options.autoOpen || e.isBeingOpened, e.openComplete = !1, e.dbOpenError = null);
		}, rr.prototype.delete = function(n) {
			var i = this;
			void 0 === n && (n = { disableAutoOpen: !0 });
			var o = 0 < arguments.length && "object" != typeof arguments[0], a = this._state;
			return new _e(function(r, t) {
				function e() {
					i.close(n);
					var e = i._deps.indexedDB.deleteDatabase(i.name);
					e.onsuccess = Ie(function() {
						var e = i._deps, t = i.name, n = e.indexedDB;
						e = e.IDBKeyRange, bn(n) || t === tt || mn(n, e).delete(t).catch(G), r();
					}), e.onerror = Ft(t), e.onblocked = i._fireOnBlocked;
				}
				if (o) throw new Y.InvalidArgument("Invalid closeOptions argument to db.delete()");
				a.isBeingOpened ? a.dbReadyPromise.then(e) : e();
			});
		}, rr.prototype.backendDB = function() {
			return this.idbdb;
		}, rr.prototype.isOpen = function() {
			return null !== this.idbdb;
		}, rr.prototype.hasBeenClosed = function() {
			var e = this._state.dbOpenError;
			return e && "DatabaseClosed" === e.name;
		}, rr.prototype.hasFailed = function() {
			return null !== this._state.dbOpenError;
		}, rr.prototype.dynamicallyOpened = function() {
			return this._state.autoSchema;
		}, Object.defineProperty(rr.prototype, "tables", {
			get: function() {
				var t = this;
				return O(this._allTables).map(function(e) {
					return t._allTables[e];
				});
			},
			enumerable: !1,
			configurable: !0
		}), rr.prototype.transaction = function() {
			var e = function(e, t, n) {
				var r = arguments.length;
				if (r < 2) throw new Y.InvalidArgument("Too few arguments");
				for (var i = new Array(r - 1); --r;) i[r - 1] = arguments[r];
				return n = i.pop(), [
					e,
					P(i),
					n
				];
			}.apply(this, arguments);
			return this._transaction.apply(this, e);
		}, rr.prototype._transaction = function(e, t, n) {
			var r = this, i = me.trans;
			i && i.db === this && -1 === e.indexOf("!") || (i = null);
			var o, a, u = -1 !== e.indexOf("?");
			e = e.replace("!", "").replace("?", "");
			try {
				if (a = t.map(function(e) {
					e = e instanceof r.Table ? e.name : e;
					if ("string" != typeof e) throw new TypeError("Invalid table argument to Dexie.transaction(). Only Table or String are allowed");
					return e;
				}), "r" == e || e === nt) o = nt;
				else {
					if ("rw" != e && e != rt) throw new Y.InvalidArgument("Invalid transaction mode: " + e);
					o = rt;
				}
				if (i) {
					if (i.mode === nt && o === rt) {
						if (!u) throw new Y.SubTransaction("Cannot enter a sub-transaction with READWRITE mode when parent transaction is READONLY");
						i = null;
					}
					i && a.forEach(function(e) {
						if (i && -1 === i.storeNames.indexOf(e)) {
							if (!u) throw new Y.SubTransaction("Table " + e + " not included in parent transaction.");
							i = null;
						}
					}), u && i && !i.active && (i = null);
				}
			} catch (n) {
				return i ? i._promise(null, function(e, t) {
					t(n);
				}) : Xe(n);
			}
			var s = function i(o, a, u, s, c) {
				return _e.resolve().then(function() {
					var e = me.transless || me, t = o._createTransaction(a, u, o._dbSchema, s);
					if (t.explicit = !0, e = {
						trans: t,
						transless: e
					}, s) t.idbtrans = s.idbtrans;
					else try {
						t.create(), t.idbtrans._explicit = !0, o._state.PR1398_maxLoop = 3;
					} catch (e) {
						return e.name === z.InvalidState && o.isOpen() && 0 < --o._state.PR1398_maxLoop ? (console.warn("Dexie: Need to reopen db"), o.close({ disableAutoOpen: !1 }), o.open().then(function() {
							return i(o, a, u, null, c);
						})) : Xe(e);
					}
					var n, r = B(c);
					return r && Le(), e = _e.follow(function() {
						var e;
						(n = c.call(t, t)) && (r ? (e = Ue.bind(null, null), n.then(e, e)) : "function" == typeof n.next && "function" == typeof n.throw && (n = Rn(n)));
					}, e), (n && "function" == typeof n.then ? _e.resolve(n).then(function(e) {
						return t.active ? e : Xe(new Y.PrematureCommit("Transaction committed too early. See http://bit.ly/2kdckMn"));
					}) : e.then(function() {
						return n;
					})).then(function(e) {
						return s && t._resolve(), t._completion.then(function() {
							return e;
						});
					}).catch(function(e) {
						return t._reject(e), Xe(e);
					});
				});
			}.bind(null, this, o, a, i, n);
			return i ? i._promise(o, s, "lock") : me.trans ? $e(me.transless, function() {
				return r._whenReady(s);
			}) : this._whenReady(s);
		}, rr.prototype.table = function(e) {
			if (!m(this._allTables, e)) throw new Y.InvalidTable("Table ".concat(e, " does not exist"));
			return this._allTables[e];
		}, rr);
		function rr(e, t) {
			var o = this;
			this._middlewares = {}, this.verno = 0;
			var n = rr.dependencies;
			this._options = t = _({
				addons: rr.addons,
				autoOpen: !0,
				indexedDB: n.indexedDB,
				IDBKeyRange: n.IDBKeyRange,
				cache: "cloned"
			}, t), this._deps = {
				indexedDB: t.indexedDB,
				IDBKeyRange: t.IDBKeyRange
			};
			n = t.addons;
			this._dbSchema = {}, this._versions = [], this._storeNames = [], this._allTables = {}, this.idbdb = null, this._novip = this;
			var a, r, u, i, s, c = {
				dbOpenError: null,
				isBeingOpened: !1,
				onReadyBeingFired: null,
				openComplete: !1,
				dbReadyResolve: G,
				dbReadyPromise: null,
				cancelOpen: G,
				openCanceller: null,
				autoSchema: !0,
				PR1398_maxLoop: 3,
				autoOpen: t.autoOpen
			};
			c.dbReadyPromise = new _e(function(e) {
				c.dbReadyResolve = e;
			}), c.openCanceller = new _e(function(e, t) {
				c.cancelOpen = t;
			}), this._state = c, this.name = e, this.on = mt(this, "populate", "blocked", "versionchange", "close", { ready: [re, G] }), this.once = function(n, r) {
				var i = function() {
					for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];
					o.on(n).unsubscribe(i), r.apply(o, e);
				};
				return o.on(n, i);
			}, this.on.ready.subscribe = p(this.on.ready.subscribe, function(i) {
				return function(n, r) {
					rr.vip(function() {
						var t, e = o._state;
						e.openComplete ? (e.dbOpenError || _e.resolve().then(n), r && i(n)) : e.onReadyBeingFired ? (e.onReadyBeingFired.push(n), r && i(n)) : (i(n), t = o, r || i(function e() {
							t.on.ready.unsubscribe(n), t.on.ready.unsubscribe(e);
						}));
					});
				};
			}), this.Collection = (a = this, bt(Kt.prototype, function(e, t) {
				this.db = a;
				var n = ot, r = null;
				if (t) try {
					n = t();
				} catch (e) {
					r = e;
				}
				var i = e._ctx, t = i.table, e = t.hook.reading.fire;
				this._ctx = {
					table: t,
					index: i.index,
					isPrimKey: !i.index || t.schema.primKey.keyPath && i.index === t.schema.primKey.name,
					range: n,
					keysOnly: !1,
					dir: "next",
					unique: "",
					algorithm: null,
					filter: null,
					replayFilter: null,
					justLimit: !0,
					isMatch: null,
					offset: 0,
					limit: Infinity,
					error: r,
					or: i.or,
					valueMapper: e !== X ? e : null
				};
			})), this.Table = (r = this, bt(yt.prototype, function(e, t, n) {
				this.db = r, this._tx = n, this.name = e, this.schema = t, this.hook = r._allTables[e] ? r._allTables[e].hook : mt(null, {
					creating: [Z, G],
					reading: [H, X],
					updating: [te, G],
					deleting: [ee, G]
				});
			})), this.Transaction = (u = this, bt(Vt.prototype, function(e, t, n, r, i) {
				var o = this;
				"readonly" !== e && t.forEach(function(e) {
					e = null === (e = n[e]) || void 0 === e ? void 0 : e.yProps;
					e && (t = t.concat(e.map(function(e) {
						return e.updatesTable;
					})));
				}), this.db = u, this.mode = e, this.storeNames = t, this.schema = n, this.chromeTransactionDurability = r, this.idbtrans = null, this.on = mt(this, "complete", "error", "abort"), this.parent = i || null, this.active = !0, this._reculock = 0, this._blockedFuncs = [], this._resolve = null, this._reject = null, this._waitingFor = null, this._waitingQueue = null, this._spinCount = 0, this._completion = new _e(function(e, t) {
					o._resolve = e, o._reject = t;
				}), this._completion.then(function() {
					o.active = !1, o.on.complete.fire();
				}, function(e) {
					var t = o.active;
					return o.active = !1, o.on.error.fire(e), o.parent ? o.parent._reject(e) : t && o.idbtrans && o.idbtrans.abort(), Xe(e);
				});
			})), this.Version = (i = this, bt(yn.prototype, function(e) {
				this.db = i, this._cfg = {
					version: e,
					storesSource: null,
					dbschema: {},
					tables: {},
					contentUpgrade: null
				};
			})), this.WhereClause = (s = this, bt(Bt.prototype, function(e, t, n) {
				if (this.db = s, this._ctx = {
					table: e,
					index: ":id" === t ? null : t,
					or: n
				}, this._cmp = this._ascending = st, this._descending = function(e, t) {
					return st(t, e);
				}, this._max = function(e, t) {
					return 0 < st(e, t) ? e : t;
				}, this._min = function(e, t) {
					return st(e, t) < 0 ? e : t;
				}, this._IDBKeyRange = s._deps.IDBKeyRange, !this._IDBKeyRange) throw new Y.MissingAPI();
			})), this.on("versionchange", function(e) {
				0 < e.newVersion ? console.warn("Another connection wants to upgrade database '".concat(o.name, "'. Closing db now to resume the upgrade.")) : console.warn("Another connection wants to delete database '".concat(o.name, "'. Closing db now to resume the delete request.")), o.close({ disableAutoOpen: !1 });
			}), this.on("blocked", function(e) {
				!e.newVersion || e.newVersion < e.oldVersion ? console.warn("Dexie.delete('".concat(o.name, "') was blocked")) : console.warn("Upgrade '".concat(o.name, "' blocked by other connection holding version ").concat(e.oldVersion / 10));
			}), this._maxKey = Qt(t.IDBKeyRange), this._createTransaction = function(e, t, n, r) {
				return new o.Transaction(e, t, n, o._options.chromeTransactionDurability, r);
			}, this._fireOnBlocked = function(t) {
				o.on("blocked").fire(t), et.filter(function(e) {
					return e.name === o.name && e !== o && !e._state.vcFired;
				}).map(function(e) {
					return e.on("versionchange").fire(t);
				});
			}, this.use(zn), this.use(er), this.use($n), this.use(Mn), this.use(Un);
			var l = new Proxy(this, { get: function(e, t, n) {
				if ("_vip" === t) return !0;
				if ("table" === t) return function(e) {
					return tr(o.table(e), l);
				};
				var r = Reflect.get(e, t, n);
				return r instanceof yt ? tr(r, l) : "tables" === t ? r.map(function(e) {
					return tr(e, l);
				}) : "_createTransaction" === t ? function() {
					return tr(r.apply(this, arguments), l);
				} : r;
			} });
			this.vip = l, n.forEach(function(e) {
				return e(o);
			});
		}
		var ir, F = "undefined" != typeof Symbol && "observable" in Symbol ? Symbol.observable : "@@observable", or = (ar.prototype.subscribe = function(e, t, n) {
			return this._subscribe(e && "function" != typeof e ? e : {
				next: e,
				error: t,
				complete: n
			});
		}, ar.prototype[F] = function() {
			return this;
		}, ar);
		function ar(e) {
			this._subscribe = e;
		}
		try {
			ir = {
				indexedDB: f.indexedDB || f.mozIndexedDB || f.webkitIndexedDB || f.msIndexedDB,
				IDBKeyRange: f.IDBKeyRange || f.webkitIDBKeyRange
			};
		} catch (e) {
			ir = {
				indexedDB: null,
				IDBKeyRange: null
			};
		}
		function ur(h) {
			var d, p = !1, e = new or(function(r) {
				var i = B(h);
				var o, a = !1, u = {}, s = {}, e = {
					get closed() {
						return a;
					},
					unsubscribe: function() {
						a || (a = !0, o && o.abort(), c && Ut.storagemutated.unsubscribe(f));
					}
				};
				r.start && r.start(e);
				var c = !1, l = function() {
					return Ge(t);
				};
				var f = function(e) {
					Sn(u, e), jn(s, u) && l();
				}, t = function() {
					var t, n, e;
					!a && ir.indexedDB && (u = {}, t = {}, o && o.abort(), o = new AbortController(), e = function(e) {
						var t = je();
						try {
							i && Le();
							var n = Ne(h, e);
							return n = i ? n.finally(Ue) : n;
						} finally {
							t && Ae();
						}
					}(n = {
						subscr: t,
						signal: o.signal,
						requery: l,
						querier: h,
						trans: null
					}), Promise.resolve(e).then(function(e) {
						p = !0, d = e, a || n.signal.aborted || (u = {}, function(e) {
							for (var t in e) if (m(e, t)) return;
							return 1;
						}(s = t) || c || (Ut(Nt, f), c = !0), Ge(function() {
							return !a && r.next && r.next(e);
						}));
					}, function(e) {
						p = !1, ["DatabaseClosedError", "AbortError"].includes(null == e ? void 0 : e.name) || a || Ge(function() {
							a || r.error && r.error(e);
						});
					}));
				};
				return setTimeout(l, 0), e;
			});
			return e.hasValue = function() {
				return p;
			}, e.getValue = function() {
				return d;
			}, e;
		}
		var sr = nr;
		function cr(e) {
			var t = fr;
			try {
				fr = !0, Ut.storagemutated.fire(e), qn(e, !0);
			} finally {
				fr = t;
			}
		}
		r(sr, _(_({}, Q), {
			delete: function(e) {
				return new sr(e, { addons: [] }).delete();
			},
			exists: function(e) {
				return new sr(e, { addons: [] }).open().then(function(e) {
					return e.close(), !0;
				}).catch("NoSuchDatabaseError", function() {
					return !1;
				});
			},
			getDatabaseNames: function(e) {
				try {
					return t = sr.dependencies, n = t.indexedDB, t = t.IDBKeyRange, (bn(n) ? Promise.resolve(n.databases()).then(function(e) {
						return e.map(function(e) {
							return e.name;
						}).filter(function(e) {
							return e !== tt;
						});
					}) : mn(n, t).toCollection().primaryKeys()).then(e);
				} catch (e) {
					return Xe(new Y.MissingAPI());
				}
				var t, n;
			},
			defineClass: function() {
				return function(e) {
					a(this, e);
				};
			},
			ignoreTransaction: function(e) {
				return me.trans ? $e(me.transless, e) : e();
			},
			vip: gn,
			async: function(t) {
				return function() {
					try {
						var e = Rn(t.apply(this, arguments));
						return e && "function" == typeof e.then ? e : _e.resolve(e);
					} catch (e) {
						return Xe(e);
					}
				};
			},
			spawn: function(e, t, n) {
				try {
					var r = Rn(e.apply(n, t || []));
					return r && "function" == typeof r.then ? r : _e.resolve(r);
				} catch (e) {
					return Xe(e);
				}
			},
			currentTransaction: { get: function() {
				return me.trans || null;
			} },
			waitFor: function(e, t) {
				t = _e.resolve("function" == typeof e ? sr.ignoreTransaction(e) : e).timeout(t || 6e4);
				return me.trans ? me.trans.waitFor(t) : t;
			},
			Promise: _e,
			debug: {
				get: function() {
					return ie;
				},
				set: function(e) {
					oe(e);
				}
			},
			derive: o,
			extend: a,
			props: r,
			override: p,
			Events: mt,
			on: Ut,
			liveQuery: ur,
			extendObservabilitySet: Sn,
			getByKeyPath: g,
			setByKeyPath: w,
			delByKeyPath: function(t, e) {
				"string" == typeof e ? w(t, e, void 0) : "length" in e && [].map.call(e, function(e) {
					w(t, e, void 0);
				});
			},
			shallowClone: k,
			deepClone: S,
			getObjectDiff: Nn,
			cmp: st,
			asap: v,
			minKey: -Infinity,
			addons: [],
			connections: et,
			errnames: z,
			dependencies: ir,
			cache: An,
			semVer: "4.2.1",
			version: "4.2.1".split(".").map(function(e) {
				return parseInt(e);
			}).reduce(function(e, t, n) {
				return e + t / Math.pow(10, 2 * n);
			})
		})), sr.maxKey = Qt(sr.dependencies.IDBKeyRange), "undefined" != typeof dispatchEvent && "undefined" != typeof addEventListener && (Ut(Nt, function(e) {
			fr || (e = new CustomEvent(Lt, { detail: e }), fr = !0, dispatchEvent(e), fr = !1);
		}), addEventListener(Lt, function(e) {
			e = e.detail;
			fr || cr(e);
		}));
		var lr, fr = !1, hr = function() {};
		return "undefined" != typeof BroadcastChannel && ((hr = function() {
			(lr = new BroadcastChannel(Lt)).onmessage = function(e) {
				return e.data && cr(e.data);
			};
		})(), "function" == typeof lr.unref && lr.unref(), Ut(Nt, function(e) {
			fr || lr.postMessage(e);
		})), "undefined" != typeof addEventListener && (addEventListener("pagehide", function(e) {
			if (!nr.disableBfCache && e.persisted) {
				ie && console.debug("Dexie: handling persisted pagehide"), lr?.close();
				for (var t = 0, n = et; t < n.length; t++) n[t].close({ disableAutoOpen: !1 });
			}
		}), addEventListener("pageshow", function(e) {
			!nr.disableBfCache && e.persisted && (ie && console.debug("Dexie: handling persisted pageshow"), hr(), cr({ all: new _n(-Infinity, [[]]) }));
		})), _e.rejectionMapper = function(e, t) {
			return !e || e instanceof N || e instanceof TypeError || e instanceof SyntaxError || !e.name || !$[e.name] ? e : (t = new $[e.name](t || e.message, e), "stack" in e && l(t, "stack", { get: function() {
				return this.inner.stack;
			} }), t);
		}, oe(ie), _(nr, Object.freeze({
			__proto__: null,
			Dexie: nr,
			liveQuery: ur,
			Entity: ut,
			cmp: st,
			PropModification: ht,
			replacePrefix: function(e, t) {
				return new ht({ replacePrefix: [e, t] });
			},
			add: function(e) {
				return new ht({ add: e });
			},
			remove: function(e) {
				return new ht({ remove: e });
			},
			default: nr,
			RangeSet: _n,
			mergeRanges: kn,
			rangesOverlap: On
		}), { default: nr }), nr;
	});
})))(), 1);
var DexieSymbol = Symbol.for("Dexie");
var Dexie = globalThis[DexieSymbol] || (globalThis[DexieSymbol] = import_dexie_min.default);
if (import_dexie_min.default.semVer !== Dexie.semVer) throw new Error(`Two different versions of Dexie loaded in the same app: ${import_dexie_min.default.semVer} and ${Dexie.semVer}`);
var { liveQuery, mergeRanges, rangesOverlap, RangeSet, cmp, Entity, PropModification, replacePrefix, add, remove, DexieYProvider } = Dexie;
//#endregion
//#region lib/local-db.ts
var PlannerDatabase = class extends Dexie {
	constructor() {
		super("planner-v1");
		this.version(1).stores({
			thoughts: "id, status, createdAt, updatedAt, version",
			tasks: "id, status, dueAt, scheduledStartAt, updatedAt, version",
			events: "id, startAt, endAt, updatedAt, version",
			aiRuns: "id, status, createdAt",
			settings: "id",
			operations: "id, status, createdAt, entityType, entityId",
			conflicts: "id, operationId, entityType, entityId, createdAt"
		});
		this.version(2).stores({
			thoughts: "id, status, createdAt, updatedAt, version",
			tasks: "id, status, taskKind, dueAt, desiredCompletionAt, actualDeadlineAt, updatedAt, version",
			events: "id, eventKind, startAt, endAt, updatedAt, version",
			aiRuns: "id, status, createdAt",
			settings: "id",
			operations: "id, status, createdAt, entityType, entityId",
			conflicts: "id, operationId, entityType, entityId, createdAt",
			goals: "id, order, archived, updatedAt, version",
			projects: "id, goalId, status, order, updatedAt, version",
			projectNodes: "id, projectId, parentId, order, status, isFocused, updatedAt, version",
			scheduleBlocks: "id, sourceType, sourceId, date, startAt, status, updatedAt, version",
			phases: "id, startDate, endDate, updatedAt, version",
			reviews: "id, kind, periodKey, completedAt, updatedAt, version",
			fragmentActivities: "id, durationBucket, enabled, updatedAt, version",
			notifications: "id, readAt, createdAt",
			originLinks: "id, sourceEntityType, sourceEntityId, targetEntityType, targetEntityId, updatedAt, version"
		}).upgrade(async (transaction) => {
			await Promise.all([
				transaction.table("thoughts").clear(),
				transaction.table("tasks").clear(),
				transaction.table("events").clear(),
				transaction.table("aiRuns").clear(),
				transaction.table("settings").clear(),
				transaction.table("operations").clear(),
				transaction.table("conflicts").clear()
			]);
		});
		this.version(3).stores({
			thoughts: "id, status, createdAt, updatedAt, version",
			tasks: "id, planningState, status, taskKind, dueAt, desiredCompletionAt, actualDeadlineAt, updatedAt, version",
			events: "id, eventKind, startAt, endAt, updatedAt, version",
			aiRuns: "id, status, createdAt",
			settings: "id",
			operations: "id, status, createdAt, entityType, entityId",
			conflicts: "id, operationId, entityType, entityId, createdAt",
			goals: "id, order, archived, updatedAt, version",
			projects: "id, goalId, status, initializationState, order, updatedAt, version",
			projectNodes: "id, projectId, parentId, order, status, isFocused, updatedAt, version",
			scheduleBlocks: "id, sourceType, sourceId, date, startAt, status, updatedAt, version",
			phases: "id, startDate, endDate, updatedAt, version",
			reviews: "id, kind, periodKey, completedAt, updatedAt, version",
			fragmentActivities: "id, durationBucket, enabled, updatedAt, version",
			notifications: "id, readAt, createdAt",
			originLinks: "id, sourceEntityType, sourceEntityId, targetEntityType, targetEntityId, updatedAt, version"
		}).upgrade(async (transaction) => {
			const nodes = await transaction.table("projectNodes").toArray();
			const projectIdsWithNodes = new Set(nodes.map((node) => String(node.projectId)));
			await transaction.table("tasks").toCollection().modify((task) => {
				task.planningState = task.planningState ?? "planned";
			});
			await transaction.table("projects").toCollection().modify((project) => {
				project.initializationState = project.initializationState ?? (projectIdsWithNodes.has(String(project.id)) ? "ready" : "draft");
				project.importCheckpoint = null;
			});
			await transaction.table("thoughts").toCollection().modify((thought) => {
				if (thought.status === "someday") {
					thought.status = "inbox";
					thought.processedAt = null;
					thought.resultLabel = null;
				}
			});
		});
		this.version(4).stores({
			thoughts: "id, status, createdAt, updatedAt, version",
			tasks: "id, planningState, status, taskKind, dueAt, desiredCompletionAt, actualDeadlineAt, updatedAt, version",
			events: "id, eventKind, startAt, endAt, updatedAt, version",
			aiRuns: "id, status, createdAt",
			settings: "id",
			operations: "id, status, createdAt, entityType, entityId",
			conflicts: "id, operationId, entityType, entityId, createdAt",
			goals: "id, order, archived, updatedAt, version",
			projects: "id, goalId, status, initializationState, plannedStartDate, plannedEndDate, order, updatedAt, version",
			projectNodes: "id, projectId, parentId, order, status, isFocused, needsContinuousTime, updatedAt, version",
			scheduleBlocks: "id, sourceType, sourceId, date, startAt, status, updatedAt, version",
			phases: null,
			reviews: "id, kind, periodKey, completedAt, updatedAt, version",
			fragmentActivities: "id, durationBucket, enabled, updatedAt, version",
			notifications: "id, readAt, createdAt",
			originLinks: "id, sourceEntityType, sourceEntityId, targetEntityType, targetEntityId, updatedAt, version"
		}).upgrade(async (transaction) => {
			await transaction.table("tasks").toCollection().modify((task) => {
				task.needsContinuousTime = Boolean(task.needsContinuousTime);
				delete task.durationBucket;
			});
			await transaction.table("projectNodes").toCollection().modify((node) => {
				node.needsContinuousTime = Boolean(node.needsContinuousTime);
				delete node.durationBucket;
			});
			await transaction.table("projects").toCollection().modify((project) => {
				project.plannedStartDate ??= null;
				project.plannedEndDate ??= null;
			});
			await transaction.table("settings").toCollection().modify((settings) => {
				settings.defaultWakeTime ??= settings.availableDayStart ?? "08:00";
				settings.defaultSleepTime ??= settings.availableDayEnd ?? "00:30";
				settings.sleepOverrides ??= {};
				delete settings.availableDayStart;
				delete settings.availableDayEnd;
			});
		});
		this.version(5).stores({
			thoughts: "id, status, createdAt, updatedAt, version",
			tasks: "id, planningState, status, taskKind, dueAt, desiredCompletionAt, actualDeadlineAt, updatedAt, version",
			events: "id, eventKind, startAt, endAt, updatedAt, version",
			aiRuns: "id, status, createdAt",
			settings: "id",
			operations: "id, status, createdAt, entityType, entityId",
			conflicts: "id, operationId, entityType, entityId, createdAt",
			goals: "id, order, archived, updatedAt, version",
			projects: "id, goalId, status, initializationState, plannedStartDate, plannedEndDate, order, updatedAt, version",
			projectNodes: "id, projectId, parentId, order, status, isFocused, needsContinuousTime, updatedAt, version",
			scheduleBlocks: "id, sourceType, sourceId, date, startAt, status, updatedAt, version",
			reviews: "id, kind, periodKey, completedAt, updatedAt, version",
			fragmentActivities: "id, durationBucket, enabled, updatedAt, version",
			notifications: "id, readAt, createdAt",
			originLinks: "id, sourceEntityType, sourceEntityId, targetEntityType, targetEntityId, updatedAt, version"
		}).upgrade(async (transaction) => {
			await transaction.table("events").toCollection().modify((event) => {
				event.location ??= null;
			});
			await transaction.table("settings").toCollection().modify((settings) => {
				settings.calendarDisplayStart ??= "08:00";
				settings.calendarDisplayEnd ??= "02:00";
				if (!settings.itemTypes?.some((type) => type.id === "course")) {
					const courseType = DEFAULT_ITEM_TYPES.find((type) => type.id === "course");
					if (courseType) settings.itemTypes = [...settings.itemTypes ?? [], { ...courseType }];
				}
			});
		});
		this.version(6).stores({
			thoughts: "id, status, createdAt, updatedAt, version",
			tasks: "id, planningState, status, taskKind, dueAt, desiredCompletionAt, actualDeadlineAt, isFragmentFriendly, updatedAt, version",
			events: "id, eventKind, startAt, endAt, updatedAt, version",
			aiRuns: "id, status, createdAt",
			settings: "id",
			operations: "id, status, createdAt, entityType, entityId",
			conflicts: "id, operationId, entityType, entityId, createdAt",
			goals: "id, order, archived, updatedAt, version",
			projects: "id, goalId, status, initializationState, plannedStartDate, plannedEndDate, order, updatedAt, version",
			projectNodes: "id, projectId, parentId, order, status, isFocused, needsContinuousTime, isFragmentFriendly, updatedAt, version",
			scheduleBlocks: "id, sourceType, sourceId, date, startAt, status, updatedAt, version",
			reviews: "id, kind, periodKey, completedAt, updatedAt, version",
			fragmentActivities: "id, enabled, updatedAt, version",
			notifications: "id, readAt, createdAt",
			originLinks: "id, sourceEntityType, sourceEntityId, targetEntityType, targetEntityId, updatedAt, version"
		}).upgrade(async (transaction) => {
			await transaction.table("tasks").toCollection().modify((task) => {
				task.isFragmentFriendly = Boolean(task.isFragmentFriendly);
				if (task.needsContinuousTime) task.isFragmentFriendly = false;
			});
			await transaction.table("projectNodes").toCollection().modify((node) => {
				node.isFragmentFriendly = Boolean(node.isFragmentFriendly);
				if (node.needsContinuousTime) node.isFragmentFriendly = false;
			});
			await transaction.table("fragmentActivities").toCollection().modify((activity) => {
				activity.eligibleMinutes = normalizeFragmentMinutes(activity.eligibleMinutes, activity.durationBucket);
				delete activity.durationBucket;
			});
		});
		this.version(7).stores({ reviews: null }).upgrade(async (transaction) => {
			await Promise.all([transaction.table("operations").where("entityType").equals("review").delete(), transaction.table("conflicts").where("entityType").equals("review").delete()]);
			await transaction.table("settings").toCollection().modify((settings) => {
				delete settings.reviewTime;
				delete settings.weeklyReviewTime;
				delete settings.monthlyReviewTime;
				delete settings.dailyReviewEnabled;
				delete settings.weeklyReviewEnabled;
				delete settings.monthlyReviewEnabled;
			});
		});
	}
};
var database = null;
function getPlannerDb() {
	if (typeof window === "undefined") throw new Error("Planner database is only available in the browser.");
	database ??= new PlannerDatabase();
	return database;
}
//#endregion
//#region components/planner-provider/internals.ts
function normalizeTasks(records) {
	return records.filter(active).map((task) => ({
		...task,
		planningState: task.planningState ?? "planned",
		isAllDay: Boolean(task.isAllDay),
		courseEventId: task.courseEventId ?? null,
		courseOccurrenceDate: task.courseOccurrenceDate ?? null,
		needsContinuousTime: Boolean(task.needsContinuousTime),
		isFragmentFriendly: !task.needsContinuousTime && Boolean(task.isFragmentFriendly)
	})).sort(sortUpdated);
}
function normalizeEvents(records) {
	return records.filter(active).map((event) => ({
		...event,
		location: event.location ?? null
	})).sort((a, b) => a.startAt.localeCompare(b.startAt));
}
function normalizeProjects(records, nodes) {
	const projectIdsWithNodes = new Set(nodes.filter(active).map((node) => node.projectId));
	return records.filter(active).map((project) => ({
		...project,
		initializationState: project.initializationState ?? (projectIdsWithNodes.has(project.id) ? "ready" : "draft"),
		plannedStartDate: project.plannedStartDate ?? null,
		plannedEndDate: project.plannedEndDate ?? null
	})).sort((a, b) => a.order - b.order);
}
function normalizeProjectNodes(records) {
	return records.filter(active).map((node) => ({
		...node,
		needsContinuousTime: Boolean(node.needsContinuousTime),
		isFragmentFriendly: !node.needsContinuousTime && Boolean(node.isFragmentFriendly)
	})).sort((a, b) => a.order - b.order);
}
function normalizeSettings(record) {
	return {
		...DEFAULT_SETTINGS,
		...record ?? {},
		itemTypes: normalizeItemTypes(record?.itemTypes),
		lastProjectByGoal: record?.lastProjectByGoal ?? {},
		sleepOverrides: record?.sleepOverrides ?? {}
	};
}
function operationFor(entity, baseVersion, action = "upsert", patch) {
	return {
		id: newId("op"),
		entityType: entity.entityType,
		entityId: entity.id,
		action,
		baseVersion,
		patch: patch ?? entity,
		createdAt: nowIso(),
		status: "pending"
	};
}
async function putConflictRecordInDatabase(db, entityType, record) {
	if (entityType === "thought") await db.thoughts.put(record);
	if (entityType === "task") await db.tasks.put(record);
	if (entityType === "event") await db.events.put(record);
	if (entityType === "goal") await db.goals.put(record);
	if (entityType === "project") await db.projects.put(record);
	if (entityType === "projectNode") await db.projectNodes.put(record);
	if (entityType === "scheduleBlock") await db.scheduleBlocks.put(record);
	if (entityType === "fragmentActivity") await db.fragmentActivities.put(record);
	if (entityType === "notification") await db.notifications.put(record);
	if (entityType === "originLink") await db.originLinks.put(record);
	if (entityType === "aiRun") await db.aiRuns.put(record);
	if (entityType === "settings") await db.settings.put(record);
}
async function putConflictRecord(entityType, record) {
	await putConflictRecordInDatabase(getPlannerDb(), entityType, record);
}
function makeActivity(id, title, eligibleMinutes, time) {
	return {
		id,
		entityType: "fragmentActivity",
		title,
		eligibleMinutes,
		enabled: true,
		createdAt: time,
		updatedAt: time,
		version: 1
	};
}
function legacyReminder(offsetMinutes) {
	return offsetMinutes == null ? [] : [{
		id: newId("reminder"),
		offsetMinutes,
		anchor: "start"
	}];
}
function active(entity) {
	return !entity.deletedAt;
}
function sortUpdated(a, b) {
	return b.updatedAt.localeCompare(a.updatedAt);
}
function sortBlocks(a, b) {
	return `${a.date}${a.startAt ?? ""}`.localeCompare(`${b.date}${b.startAt ?? ""}`);
}
//#endregion
//#region components/planner-provider/schedule-mutations.ts
function useScheduleBlockMutations({ scheduleBlocks, setScheduleBlocks, kickSync }) {
	return {
		addScheduleBlock: (0, import_react.useCallback)(async (input) => {
			const db = getPlannerDb();
			if (input.sourceType === "projectNode") {
				const node = await db.projectNodes.get(input.sourceId);
				if (!node) throw new Error("找不到项目节点");
				const nodes = (await db.projectNodes.where("projectId").equals(node.projectId).toArray()).filter(active);
				if (!isLeafNode(node.id, nodes)) throw new Error("只有叶子节点可以安排进 Calendar");
			}
			const time = nowIso();
			const block = {
				id: newId("block"),
				entityType: "scheduleBlock",
				sourceType: input.sourceType,
				sourceId: input.sourceId,
				date: input.date,
				startAt: input.startAt ?? null,
				endAt: input.endAt ?? null,
				status: "planned",
				reminderRules: input.reminderRules ?? [],
				createdAt: time,
				updatedAt: time,
				version: 1
			};
			setScheduleBlocks((items) => [...items, block].sort(sortBlocks));
			try {
				await db.transaction("rw", [db.scheduleBlocks, db.operations], async () => {
					await db.scheduleBlocks.put(block);
					await db.operations.put(operationFor(block, 0));
				});
				kickSync();
				return block;
			} catch (error) {
				setScheduleBlocks((items) => items.filter((item) => item.id !== block.id));
				throw error;
			}
		}, [kickSync, setScheduleBlocks]),
		updateScheduleBlock: (0, import_react.useCallback)(async (id, patch) => {
			const db = getPlannerDb();
			const current = scheduleBlocks.find((block) => block.id === id) ?? await db.scheduleBlocks.get(id);
			if (!current) return;
			const nextPatch = {
				...patch,
				updatedAt: nowIso(),
				version: current.version + 1
			};
			setScheduleBlocks((items) => items.map((block) => block.id === id ? {
				...block,
				...nextPatch
			} : block).sort(sortBlocks));
			try {
				await db.transaction("rw", [db.scheduleBlocks, db.operations], async () => {
					await db.scheduleBlocks.update(id, nextPatch);
					await db.operations.put(operationFor({
						...current,
						...nextPatch
					}, current.version, "upsert", nextPatch));
				});
				kickSync();
			} catch (error) {
				setScheduleBlocks((items) => items.map((block) => block.id === id ? current : block).sort(sortBlocks));
				throw error;
			}
		}, [
			kickSync,
			scheduleBlocks,
			setScheduleBlocks
		]),
		updateScheduleBlocks: (0, import_react.useCallback)(async (patches) => {
			if (!patches.length) return;
			const db = getPlannerDb();
			const time = nowIso();
			const currentById = new Map(scheduleBlocks.map((block) => [block.id, block]));
			const updates = patches.flatMap(({ id, patch }) => {
				const current = currentById.get(id);
				if (!current) return [];
				const nextPatch = {
					...patch,
					updatedAt: time,
					version: current.version + 1
				};
				return [{
					current,
					nextPatch,
					next: {
						...current,
						...nextPatch
					}
				}];
			});
			if (!updates.length) return;
			const nextById = new Map(updates.map(({ next }) => [next.id, next]));
			setScheduleBlocks((items) => items.map((block) => nextById.get(block.id) ?? block).sort(sortBlocks));
			try {
				await db.transaction("rw", [db.scheduleBlocks, db.operations], async () => {
					await db.scheduleBlocks.bulkUpdate(updates.map(({ current, nextPatch }) => ({
						key: current.id,
						changes: nextPatch
					})));
					await db.operations.bulkPut(updates.map(({ current, nextPatch, next }) => operationFor(next, current.version, "upsert", nextPatch)));
				});
				kickSync();
			} catch (error) {
				const previousById = new Map(updates.map(({ current }) => [current.id, current]));
				setScheduleBlocks((items) => items.map((block) => previousById.get(block.id) ?? block).sort(sortBlocks));
				throw error;
			}
		}, [
			kickSync,
			scheduleBlocks,
			setScheduleBlocks
		]),
		deleteScheduleBlock: (0, import_react.useCallback)(async (id) => {
			const db = getPlannerDb();
			const current = scheduleBlocks.find((block) => block.id === id) ?? await db.scheduleBlocks.get(id);
			if (!current) return;
			const time = nowIso();
			const patch = {
				reminderRules: [],
				deletedAt: time,
				updatedAt: time,
				version: current.version + 1
			};
			setScheduleBlocks((items) => items.filter((item) => item.id !== id));
			try {
				await db.transaction("rw", [db.scheduleBlocks, db.operations], async () => {
					await db.scheduleBlocks.update(id, patch);
					await db.operations.put(operationFor({
						...current,
						...patch
					}, current.version, "delete", patch));
				});
			} catch (error) {
				setScheduleBlocks((items) => [...items.filter((item) => item.id !== id), current].sort(sortBlocks));
				throw error;
			}
			kickSync();
		}, [
			kickSync,
			scheduleBlocks,
			setScheduleBlocks
		])
	};
}
//#endregion
//#region components/planner-provider/initialization.ts
async function readPlannerSnapshot() {
	const db = getPlannerDb();
	const [thoughts, tasks, events, goals, projects, projectNodes, scheduleBlocks, settings] = await Promise.all([
		db.thoughts.toArray(),
		db.tasks.toArray(),
		db.events.toArray(),
		db.goals.toArray(),
		db.projects.toArray(),
		db.projectNodes.toArray(),
		db.scheduleBlocks.toArray(),
		db.settings.get("main")
	]);
	return {
		thoughts: thoughts.filter(active).sort(sortUpdated),
		tasks: normalizeTasks(tasks),
		events: normalizeEvents(events),
		goals: goals.filter(active).sort((a, b) => a.order - b.order),
		projects: normalizeProjects(projects, projectNodes),
		projectNodes: normalizeProjectNodes(projectNodes),
		scheduleBlocks: scheduleBlocks.filter(active).sort(sortBlocks),
		settings: normalizeSettings(settings)
	};
}
async function preparePlannerStorage() {
	const db = getPlannerDb();
	await db.operations.where("status").equals("syncing").modify({ status: "pending" }).catch(() => void 0);
	if (!await db.settings.get("main")) await db.settings.put(DEFAULT_SETTINGS);
	if (await db.fragmentActivities.count()) return;
	const time = nowIso();
	await db.fragmentActivities.bulkPut([
		makeActivity("activity_default_inbox", "整理 Inbox", [15, 30], time),
		makeActivity("activity_default_read", "阅读", [
			15,
			30,
			60
		], time),
		makeActivity("activity_default_rest", "休息片刻", [
			15,
			30,
			60,
			90
		], time)
	]);
}
function subscribeToPlannerStorage(listeners) {
	const db = getPlannerDb();
	const subscriptions = [
		liveQuery(() => db.thoughts.toArray()).subscribe((records) => listeners.onThoughts(records.filter(active).sort(sortUpdated))),
		liveQuery(() => db.tasks.toArray()).subscribe((records) => listeners.onTasks(normalizeTasks(records))),
		liveQuery(() => db.events.toArray()).subscribe((records) => listeners.onEvents(normalizeEvents(records))),
		liveQuery(() => db.goals.toArray()).subscribe((records) => listeners.onGoals(records.filter(active).sort((a, b) => a.order - b.order))),
		liveQuery(() => Promise.all([db.projects.toArray(), db.projectNodes.toArray()])).subscribe(([projects, nodes]) => {
			listeners.onProjects(normalizeProjects(projects, nodes));
			listeners.onProjectNodes(normalizeProjectNodes(nodes));
		}),
		liveQuery(() => db.scheduleBlocks.toArray()).subscribe((records) => listeners.onScheduleBlocks(records.filter(active).sort(sortBlocks))),
		liveQuery(() => db.fragmentActivities.toArray()).subscribe((records) => listeners.onFragmentActivities(records.filter(active).sort(sortUpdated))),
		liveQuery(() => db.notifications.toArray()).subscribe((records) => listeners.onNotifications(records.filter(active).sort(sortUpdated))),
		liveQuery(() => db.originLinks.toArray()).subscribe((records) => listeners.onOriginLinks(records.filter(active).sort(sortUpdated))),
		liveQuery(() => db.aiRuns.toArray()).subscribe((records) => listeners.onAiRuns(records.filter(active).sort(sortUpdated))),
		liveQuery(() => db.settings.get("main")).subscribe((record) => listeners.onSettings(normalizeSettings(record))),
		liveQuery(() => db.conflicts.toArray()).subscribe((records) => listeners.onConflicts(records.sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
	];
	return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
}
//#endregion
//#region components/planner-provider/support-mutations.ts
function useSupportMutations({ tasks, setTasks, settingsRef, setSettings, enqueue, kickSync }) {
	return {
		addFragmentActivity: (0, import_react.useCallback)(async (title, eligibleMinutes) => {
			const time = nowIso();
			const activity = {
				id: newId("activity"),
				entityType: "fragmentActivity",
				title: title.trim(),
				eligibleMinutes,
				enabled: true,
				createdAt: time,
				updatedAt: time,
				version: 1
			};
			await getPlannerDb().fragmentActivities.put(activity);
			await enqueue(operationFor(activity, 0));
			kickSync();
			return activity;
		}, [enqueue, kickSync]),
		updateFragmentActivity: (0, import_react.useCallback)(async (id, patch) => {
			const db = getPlannerDb();
			const current = await db.fragmentActivities.get(id);
			if (!current) return;
			const nextPatch = {
				...patch,
				updatedAt: nowIso(),
				version: current.version + 1
			};
			await db.fragmentActivities.update(id, nextPatch);
			await enqueue(operationFor({
				...current,
				...nextPatch
			}, current.version, "upsert", nextPatch));
			kickSync();
		}, [enqueue, kickSync]),
		deleteFragmentActivity: (0, import_react.useCallback)(async (id) => {
			const db = getPlannerDb();
			const current = await db.fragmentActivities.get(id);
			if (!current) return;
			const time = nowIso();
			const patch = {
				title: "",
				enabled: false,
				deletedAt: time,
				updatedAt: time,
				version: current.version + 1
			};
			await db.fragmentActivities.update(id, patch);
			await enqueue(operationFor({
				...current,
				...patch
			}, current.version, "delete", patch));
			kickSync();
		}, [enqueue, kickSync]),
		markNotificationRead: (0, import_react.useCallback)(async (id) => {
			const db = getPlannerDb();
			const current = await db.notifications.get(id);
			if (!current) return;
			const patch = {
				readAt: nowIso(),
				updatedAt: nowIso(),
				version: current.version + 1
			};
			await db.notifications.update(id, patch);
			await enqueue(operationFor({
				...current,
				...patch
			}, current.version, "upsert", patch));
			kickSync();
		}, [enqueue, kickSync]),
		saveSettings: (0, import_react.useCallback)(async (patch) => {
			const current = settingsRef.current;
			const next = {
				...current,
				...patch,
				id: "main",
				version: current.version + 1
			};
			settingsRef.current = next;
			setSettings(next);
			const operation = {
				id: newId("op"),
				entityType: "settings",
				entityId: "main",
				action: "upsert",
				baseVersion: current.version,
				patch: next,
				createdAt: nowIso(),
				status: "pending"
			};
			const db = getPlannerDb();
			try {
				await db.transaction("rw", [db.settings, db.operations], async () => {
					await db.settings.put(next);
					await db.operations.put(operation);
				});
				kickSync();
			} catch (error) {
				settingsRef.current = current;
				setSettings(current);
				throw error;
			}
		}, [
			kickSync,
			setSettings,
			settingsRef
		]),
		removeItemType: (0, import_react.useCallback)(async (typeId) => {
			if (DEFAULT_ITEM_TYPES.some((item) => item.id === typeId)) return;
			const currentSettings = settingsRef.current;
			if (!currentSettings.itemTypes.some((item) => item.id === typeId)) return;
			const fallbackTypeId = currentSettings.itemTypes.some((item) => item.id === "research") ? "research" : DEFAULT_ITEM_TYPES[0].id;
			const affectedTasks = tasks.filter((task) => task.itemTypeId === typeId);
			const nextSettings = {
				...currentSettings,
				itemTypes: currentSettings.itemTypes.filter((item) => item.id !== typeId),
				id: "main",
				version: currentSettings.version + 1
			};
			const time = nowIso();
			const nextTasks = affectedTasks.map((task) => ({
				...task,
				itemTypeId: fallbackTypeId,
				updatedAt: time,
				version: task.version + 1
			}));
			const operations = [{
				id: newId("op"),
				entityType: "settings",
				entityId: "main",
				action: "upsert",
				baseVersion: currentSettings.version,
				patch: nextSettings,
				createdAt: time,
				status: "pending"
			}, ...nextTasks.map((task, index) => operationFor(task, affectedTasks[index].version, "upsert", {
				itemTypeId: fallbackTypeId,
				updatedAt: task.updatedAt,
				version: task.version
			}))];
			const db = getPlannerDb();
			settingsRef.current = nextSettings;
			setSettings(nextSettings);
			setTasks((items) => items.map((item) => nextTasks.find((next) => next.id === item.id) ?? item));
			try {
				await db.transaction("rw", [
					db.settings,
					db.tasks,
					db.operations
				], async () => {
					await db.settings.put(nextSettings);
					await db.tasks.bulkPut(nextTasks);
					await db.operations.bulkPut(operations);
				});
				kickSync();
			} catch (error) {
				settingsRef.current = currentSettings;
				setSettings(currentSettings);
				setTasks((items) => items.map((item) => affectedTasks.find((current) => current.id === item.id) ?? item));
				throw error;
			}
		}, [
			kickSync,
			setSettings,
			setTasks,
			settingsRef,
			tasks
		]),
		saveAiRun: (0, import_react.useCallback)(async (run) => {
			await getPlannerDb().aiRuns.put(run);
		}, []),
		resolveConflict: (0, import_react.useCallback)(async (id, resolution) => {
			const db = getPlannerDb();
			const conflict = await db.conflicts.get(id);
			if (!conflict) return;
			const serverVersion = Number(conflict.serverRecord.version ?? 0);
			const resolvedRecord = resolution === "local" ? {
				...conflict.serverRecord,
				...conflict.localPatch,
				version: serverVersion
			} : conflict.serverRecord;
			await putConflictRecord(conflict.entityType, resolvedRecord);
			await db.operations.delete(conflict.operationId);
			await db.conflicts.delete(id);
			if (resolution === "local") await enqueue({
				id: newId("op"),
				entityType: conflict.entityType,
				entityId: conflict.entityId,
				action: "upsert",
				baseVersion: serverVersion,
				patch: conflict.localPatch,
				createdAt: nowIso(),
				status: "pending"
			});
			kickSync();
		}, [enqueue, kickSync]),
		resolveAllConflicts: (0, import_react.useCallback)(async (resolution) => {
			const db = getPlannerDb();
			const conflicts = await db.conflicts.toArray();
			if (!conflicts.length) return 0;
			const groups = /* @__PURE__ */ new Map();
			for (const conflict of conflicts) {
				const key = `${conflict.entityType}:${conflict.entityId}`;
				const group = groups.get(key) ?? [];
				group.push(conflict);
				groups.set(key, group);
			}
			const tables = [
				db.thoughts,
				db.tasks,
				db.events,
				db.goals,
				db.projects,
				db.projectNodes,
				db.scheduleBlocks,
				db.fragmentActivities,
				db.notifications,
				db.originLinks,
				db.aiRuns,
				db.settings,
				db.operations,
				db.conflicts
			];
			await db.transaction("rw", tables, async () => {
				for (const group of groups.values()) {
					const ordered = [...group].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
					const conflict = ordered[ordered.length - 1];
					const serverVersion = Math.max(...ordered.map((item) => Number(item.serverRecord.version ?? 0)));
					const mergedPatch = Object.assign({}, ...ordered.map((item) => item.localPatch));
					const resolvedRecord = resolution === "local" ? {
						...conflict.serverRecord,
						...mergedPatch,
						version: serverVersion
					} : conflict.serverRecord;
					await putConflictRecordInDatabase(db, conflict.entityType, resolvedRecord);
					await db.operations.bulkDelete(ordered.map((item) => item.operationId));
					if (resolution === "local") await db.operations.put({
						id: newId("op"),
						entityType: conflict.entityType,
						entityId: conflict.entityId,
						action: "upsert",
						baseVersion: serverVersion,
						patch: mergedPatch,
						createdAt: nowIso(),
						status: "pending"
					});
					await db.conflicts.bulkDelete(ordered.map((item) => item.id));
				}
			});
			kickSync();
			return conflicts.length;
		}, [kickSync])
	};
}
//#endregion
//#region components/planner-provider/item/origin-link-mutations.ts
function originLinksFor(sourceThoughtIds, target, time = nowIso()) {
	return [...new Set(sourceThoughtIds)].map((sourceEntityId) => ({
		id: newId("origin"),
		entityType: "originLink",
		sourceEntityType: "thought",
		sourceEntityId,
		targetEntityType: target.entityType,
		targetEntityId: target.id,
		relationship: "created_from",
		createdAt: time,
		updatedAt: time,
		version: 1
	}));
}
function useOriginLinkMutations({ setOriginLinks }) {
	return { addOriginLinks: (0, import_react.useCallback)(async (sourceThoughtIds, target) => {
		if (!sourceThoughtIds.length) return;
		const db = getPlannerDb();
		const links = originLinksFor(sourceThoughtIds, target);
		setOriginLinks((current) => [...links, ...current].sort(sortUpdated));
		try {
			await db.transaction("rw", [db.originLinks, db.operations], async () => {
				await db.originLinks.bulkPut(links);
				await db.operations.bulkPut(links.map((link) => operationFor(link, 0)));
			});
		} catch (error) {
			setOriginLinks((current) => current.filter((link) => !links.some((item) => item.id === link.id)));
			throw error;
		}
	}, [setOriginLinks]) };
}
//#endregion
//#region components/planner-provider/item/thought-mutations.ts
function useThoughtMutations({ thoughts, settings, setThoughts, kickSync }) {
	return {
		addThought: (0, import_react.useCallback)(async (content) => {
			const time = nowIso();
			const thought = {
				id: newId("thought"),
				entityType: "thought",
				content: content.trim(),
				status: "inbox",
				capturedTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || settings.timezone,
				createdAt: time,
				updatedAt: time,
				version: 1
			};
			const db = getPlannerDb();
			setThoughts((current) => [thought, ...current]);
			try {
				await db.transaction("rw", [db.thoughts, db.operations], async () => {
					await db.thoughts.put(thought);
					await db.operations.put(operationFor(thought, 0));
				});
				kickSync();
				return thought;
			} catch (error) {
				setThoughts((current) => current.filter((item) => item.id !== thought.id));
				throw error;
			}
		}, [
			kickSync,
			setThoughts,
			settings.timezone
		]),
		updateThoughtStatus: (0, import_react.useCallback)(async (ids, status, resultLabel) => {
			const db = getPlannerDb();
			const time = nowIso();
			const idSet = new Set(ids);
			const currentItems = thoughts.filter((thought) => idSet.has(thought.id));
			if (!currentItems.length) return;
			const updates = currentItems.map((current) => {
				const patch = {
					status,
					updatedAt: time,
					processedAt: status === "inbox" ? null : time,
					resultLabel: resultLabel ?? current.resultLabel,
					deletedAt: status === "deleted" ? time : null,
					version: current.version + 1
				};
				return {
					current,
					patch,
					next: {
						...current,
						...patch
					}
				};
			});
			setThoughts((current) => current.map((thought) => updates.find((item) => item.current.id === thought.id)?.next ?? thought).filter(active).sort(sortUpdated));
			try {
				await db.transaction("rw", [db.thoughts, db.operations], async () => {
					await db.thoughts.bulkPut(updates.map((item) => item.next));
					await db.operations.bulkPut(updates.map(({ current, next, patch }) => operationFor(next, current.version, status === "deleted" ? "delete" : "upsert", patch)));
				});
			} catch (error) {
				setThoughts((current) => {
					const previous = new Map(currentItems.map((item) => [item.id, item]));
					return current.filter((item) => !previous.has(item.id)).concat(currentItems).filter(active).sort(sortUpdated);
				});
				throw error;
			}
			kickSync();
		}, [
			kickSync,
			setThoughts,
			thoughts
		]),
		restoreThought: (0, import_react.useCallback)(async (id) => {
			const db = getPlannerDb();
			const current = await db.thoughts.get(id);
			if (!current || current.status !== "deleted") return;
			const patch = {
				status: "inbox",
				processedAt: null,
				deletedAt: null,
				updatedAt: nowIso(),
				version: current.version + 1
			};
			const next = {
				...current,
				...patch
			};
			setThoughts((items) => [...items, next].filter(active).sort(sortUpdated));
			try {
				await db.transaction("rw", [db.thoughts, db.operations], async () => {
					await db.thoughts.update(id, patch);
					await db.operations.put(operationFor(next, current.version, "upsert", patch));
				});
			} catch (error) {
				setThoughts((items) => items.filter((item) => item.id !== id));
				throw error;
			}
			kickSync();
		}, [kickSync, setThoughts])
	};
}
//#endregion
//#region components/planner-provider/item/task-mutations.ts
function taskFromInput(input, time) {
	const defaultDate = /* @__PURE__ */ new Date();
	defaultDate.setHours(23, 59, 0, 0);
	const planningState = input.planningState ?? "planned";
	return {
		id: newId("task"),
		entityType: "task",
		planningState,
		taskKind: input.taskKind ?? "ordinary",
		title: input.title.trim(),
		notes: input.notes?.trim() ?? "",
		itemTypeId: input.itemTypeId ?? "research",
		colorOverride: input.colorOverride ?? null,
		status: input.status ?? (input.taskKind === "assignment" && input.assignmentStatus === "submitted" ? "completed" : "open"),
		dueAt: planningState === "draft" ? input.dueAt ?? null : input.dueAt ?? input.desiredCompletionAt ?? defaultDate.toISOString(),
		scheduledStartAt: input.scheduledStartAt ?? null,
		durationMinutes: input.durationMinutes ?? null,
		isAllDay: Boolean(input.isAllDay),
		needsContinuousTime: Boolean(input.needsContinuousTime),
		isFragmentFriendly: !input.needsContinuousTime && Boolean(input.isFragmentFriendly),
		recurrenceRule: input.recurrenceRule ?? null,
		reminderOffsetMinutes: input.reminderOffsetMinutes ?? null,
		reminderRules: input.reminderRules ?? legacyReminder(input.reminderOffsetMinutes),
		assignmentStatus: input.taskKind === "assignment" ? input.assignmentStatus ?? "todo" : null,
		desiredCompletionAt: input.desiredCompletionAt ?? null,
		actualDeadlineAt: input.actualDeadlineAt ?? null,
		courseEventId: input.courseEventId ?? null,
		courseOccurrenceDate: input.courseOccurrenceDate ?? null,
		completedAt: input.status === "completed" || input.taskKind === "assignment" && input.assignmentStatus === "submitted" ? time : null,
		completedOccurrenceKeys: [],
		originThoughtIds: input.originThoughtIds ?? [],
		createdAt: time,
		updatedAt: time,
		version: 1
	};
}
function useTaskMutations({ tasks, setTasks, setScheduleBlocks, setOriginLinks, kickSync }) {
	const addTasks = (0, import_react.useCallback)(async (inputs) => {
		if (!inputs.length) return [];
		if (inputs.some((input) => !input.title.trim())) throw new Error("事项内容不能为空");
		const time = nowIso();
		const created = inputs.map((input) => taskFromInput(input, time));
		const links = created.flatMap((task) => originLinksFor(task.originThoughtIds, task, time));
		const createdIds = new Set(created.map((task) => task.id));
		const db = getPlannerDb();
		setTasks((current) => [...created, ...current].sort(sortUpdated));
		try {
			await db.transaction("rw", [
				db.tasks,
				db.originLinks,
				db.operations
			], async () => {
				await db.tasks.bulkPut(created);
				if (links.length) await db.originLinks.bulkPut(links);
				await db.operations.bulkPut([...created.map((task) => operationFor(task, 0)), ...links.map((link) => operationFor(link, 0))]);
			});
		} catch (error) {
			setTasks((current) => current.filter((item) => !createdIds.has(item.id)));
			throw error;
		}
		if (links.length) setOriginLinks((current) => [...links, ...current].sort(sortUpdated));
		kickSync();
		return created;
	}, [
		kickSync,
		setOriginLinks,
		setTasks
	]);
	const addTask = (0, import_react.useCallback)(async (input) => {
		const [task] = await addTasks([input]);
		return task;
	}, [addTasks]);
	const updateTask = (0, import_react.useCallback)(async (id, patch) => {
		const db = getPlannerDb();
		const current = tasks.find((task) => task.id === id) ?? await db.tasks.get(id);
		if (!current) return;
		const planningState = patch.planningState ?? (patch.dueAt !== void 0 ? patch.dueAt ? "planned" : "draft" : current.planningState ?? "planned");
		const continuous = patch.needsContinuousTime ?? current.needsContinuousTime;
		const fragmentFriendly = patch.isFragmentFriendly ?? current.isFragmentFriendly;
		const nextPatch = {
			...patch,
			planningState,
			needsContinuousTime: Boolean(continuous),
			isFragmentFriendly: Boolean(fragmentFriendly) && !continuous,
			updatedAt: nowIso(),
			version: current.version + 1
		};
		const next = {
			...current,
			...nextPatch
		};
		setTasks((items) => items.map((item) => item.id === id ? next : item).sort(sortUpdated));
		try {
			await db.transaction("rw", [db.tasks, db.operations], async () => {
				await db.tasks.update(id, nextPatch);
				await db.operations.put(operationFor(next, current.version, "upsert", nextPatch));
			});
		} catch (error) {
			setTasks((items) => items.map((item) => item.id === id ? current : item).sort(sortUpdated));
			throw error;
		}
		kickSync();
	}, [
		kickSync,
		setTasks,
		tasks
	]);
	return {
		addTask,
		addTasks,
		updateTask,
		toggleTask: (0, import_react.useCallback)(async (id, occurrenceAt) => {
			const current = await getPlannerDb().tasks.get(id);
			if (!current) return;
			if (current.recurrenceRule) {
				const occurrenceKey = localDateKey(new Date(occurrenceAt ?? nowIso()));
				const completedKeys = current.completedOccurrenceKeys ?? [];
				const alreadyCompleted = completedKeys.includes(occurrenceKey);
				await updateTask(id, {
					status: "open",
					completedAt: alreadyCompleted ? null : nowIso(),
					completedOccurrenceKeys: alreadyCompleted ? completedKeys.filter((key) => key !== occurrenceKey) : [...completedKeys, occurrenceKey]
				});
				return;
			}
			if (current.status === "failed") {
				await updateTask(id, {
					status: "open",
					completedAt: null
				});
				return;
			}
			const completed = current.status !== "completed";
			await updateTask(id, {
				status: completed ? "completed" : "open",
				completedAt: completed ? nowIso() : null,
				assignmentStatus: current.taskKind === "assignment" ? completed ? "submitted" : current.assignmentStatus === "submitted" ? "todo" : current.assignmentStatus : current.assignmentStatus
			});
		}, [updateTask]),
		deleteTask: (0, import_react.useCallback)(async (id) => {
			const db = getPlannerDb();
			const current = tasks.find((task) => task.id === id) ?? await db.tasks.get(id);
			if (!current) return;
			const time = nowIso();
			const patch = {
				title: "",
				notes: "",
				status: "deleted",
				deletedAt: time,
				reminderRules: [],
				updatedAt: time,
				version: current.version + 1
			};
			setTasks((items) => items.filter((item) => item.id !== id));
			const blockUpdates = (await db.scheduleBlocks.where("sourceId").equals(id).toArray()).filter((block) => block.status === "planned" && block.date >= localDateKey(/* @__PURE__ */ new Date())).map((block) => {
				const blockPatch = {
					status: "skipped",
					reminderRules: [],
					updatedAt: time,
					version: block.version + 1
				};
				return {
					current: block,
					patch: blockPatch,
					next: {
						...block,
						...blockPatch
					}
				};
			});
			setScheduleBlocks((items) => items.map((item) => blockUpdates.find((entry) => entry.current.id === item.id)?.next ?? item).sort(sortBlocks));
			try {
				await db.transaction("rw", [
					db.tasks,
					db.scheduleBlocks,
					db.operations
				], async () => {
					await db.tasks.update(id, patch);
					if (blockUpdates.length) await db.scheduleBlocks.bulkUpdate(blockUpdates.map(({ current: block, patch: blockPatch }) => ({
						key: block.id,
						changes: blockPatch
					})));
					await db.operations.bulkPut([operationFor({
						...current,
						...patch
					}, current.version, "delete", patch), ...blockUpdates.map(({ current: block, patch: blockPatch, next }) => operationFor(next, block.version, "upsert", blockPatch))]);
				});
			} catch (error) {
				setTasks((items) => [...items, current].sort(sortUpdated));
				setScheduleBlocks((items) => items.map((item) => blockUpdates.find((entry) => entry.current.id === item.id)?.current ?? item).sort(sortBlocks));
				throw error;
			}
			kickSync();
		}, [
			kickSync,
			setScheduleBlocks,
			setTasks,
			tasks
		])
	};
}
//#endregion
//#region components/planner-provider/item/event-mutations.ts
function useEventMutations({ events, settings, setEvents, addOriginLinks, kickSync }) {
	return {
		addEvent: (0, import_react.useCallback)(async (input) => {
			const time = nowIso();
			const event = {
				id: newId("event"),
				entityType: "event",
				eventKind: input.eventKind ?? "event",
				title: input.title.trim(),
				location: input.location?.trim() || null,
				notes: input.notes?.trim() ?? "",
				status: "open",
				completedAt: null,
				itemTypeId: input.itemTypeId ?? "temporary",
				colorOverride: input.colorOverride ?? null,
				startAt: input.startAt,
				endAt: input.endAt,
				recurrenceRule: input.recurrenceRule ?? null,
				excludedOccurrenceKeys: input.excludedOccurrenceKeys ?? [],
				recurrenceEndAt: input.recurrenceEndAt ?? null,
				reminderOffsetMinutes: input.reminderOffsetMinutes ?? null,
				reminderRules: input.reminderRules ?? legacyReminder(input.reminderOffsetMinutes),
				timezone: input.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? settings.timezone,
				originThoughtIds: input.originThoughtIds ?? [],
				createdAt: time,
				updatedAt: time,
				version: 1
			};
			const db = getPlannerDb();
			setEvents((current) => [event, ...current].sort((a, b) => a.startAt.localeCompare(b.startAt)));
			try {
				await db.transaction("rw", [db.events, db.operations], async () => {
					await db.events.put(event);
					await db.operations.put(operationFor(event, 0));
				});
				await addOriginLinks(event.originThoughtIds, event);
				kickSync();
				return event;
			} catch (error) {
				setEvents((current) => current.filter((item) => item.id !== event.id));
				throw error;
			}
		}, [
			addOriginLinks,
			kickSync,
			setEvents,
			settings.timezone
		]),
		updateEvent: (0, import_react.useCallback)(async (id, patch) => {
			const db = getPlannerDb();
			const current = events.find((event) => event.id === id) ?? await db.events.get(id);
			if (!current) return;
			const nextPatch = {
				...patch,
				updatedAt: nowIso(),
				version: current.version + 1
			};
			const next = {
				...current,
				...nextPatch
			};
			setEvents((items) => items.map((item) => item.id === id ? next : item).sort((a, b) => a.startAt.localeCompare(b.startAt)));
			try {
				await db.transaction("rw", [db.events, db.operations], async () => {
					await db.events.update(id, nextPatch);
					await db.operations.put(operationFor(next, current.version, "upsert", nextPatch));
				});
			} catch (error) {
				setEvents((items) => items.map((item) => item.id === id ? current : item).sort((a, b) => a.startAt.localeCompare(b.startAt)));
				throw error;
			}
			kickSync();
		}, [
			events,
			kickSync,
			setEvents
		]),
		deleteEvent: (0, import_react.useCallback)(async (id) => {
			const db = getPlannerDb();
			const current = events.find((event) => event.id === id) ?? await db.events.get(id);
			if (!current) return;
			const time = nowIso();
			const patch = {
				title: "",
				notes: "",
				deletedAt: time,
				reminderRules: [],
				updatedAt: time,
				version: current.version + 1
			};
			setEvents((items) => items.filter((item) => item.id !== id));
			try {
				await db.transaction("rw", [db.events, db.operations], async () => {
					await db.events.update(id, patch);
					await db.operations.put(operationFor({
						...current,
						...patch
					}, current.version, "delete", patch));
				});
			} catch (error) {
				setEvents((items) => [...items, current].sort((a, b) => a.startAt.localeCompare(b.startAt)));
				throw error;
			}
			kickSync();
		}, [
			events,
			kickSync,
			setEvents
		])
	};
}
//#endregion
//#region components/planner-provider/item/thought-conversions.ts
function useThoughtConversions({ thoughts, tasks, setThoughts, setTasks, setOriginLinks, addEvent, updateThoughtStatus, kickSync }) {
	const convertThoughtToDraft = (0, import_react.useCallback)(async (id) => {
		const db = getPlannerDb();
		const thought = thoughts.find((item) => item.id === id) ?? await db.thoughts.get(id);
		if (!thought || thought.status !== "inbox") return null;
		const existing = tasks.find((task) => (task.originThoughtIds ?? []).includes(id)) ?? await db.tasks.filter((task) => !task.deletedAt && (task.originThoughtIds ?? []).includes(id)).first();
		if (existing) return {
			...existing,
			planningState: existing.planningState ?? "draft"
		};
		const time = nowIso();
		const task = {
			id: newId("task"),
			entityType: "task",
			planningState: "draft",
			taskKind: "ordinary",
			title: thought.content.trim(),
			notes: "",
			itemTypeId: "temporary",
			colorOverride: null,
			status: "open",
			dueAt: null,
			scheduledStartAt: null,
			durationMinutes: null,
			isAllDay: false,
			needsContinuousTime: false,
			isFragmentFriendly: false,
			recurrenceRule: null,
			reminderOffsetMinutes: null,
			reminderRules: [],
			assignmentStatus: null,
			desiredCompletionAt: null,
			actualDeadlineAt: null,
			completedAt: null,
			completedOccurrenceKeys: [],
			originThoughtIds: [id],
			createdAt: time,
			updatedAt: time,
			version: 1
		};
		const link = {
			id: `origin_${id}_${task.id}`,
			entityType: "originLink",
			sourceEntityType: "thought",
			sourceEntityId: id,
			targetEntityType: "task",
			targetEntityId: task.id,
			relationship: "created_from",
			createdAt: time,
			updatedAt: time,
			version: 1
		};
		const thoughtPatch = {
			status: "archived",
			processedAt: time,
			resultLabel: "已转为待落实事项",
			updatedAt: time,
			version: thought.version + 1
		};
		const nextThought = {
			...thought,
			...thoughtPatch
		};
		setTasks((items) => [task, ...items].sort(sortUpdated));
		setThoughts((items) => items.filter((item) => item.id !== id));
		setOriginLinks((items) => [link, ...items].sort(sortUpdated));
		try {
			await db.transaction("rw", [
				db.tasks,
				db.thoughts,
				db.originLinks,
				db.operations
			], async () => {
				await db.tasks.put(task);
				await db.originLinks.put(link);
				await db.thoughts.update(id, thoughtPatch);
				await db.operations.bulkPut([
					operationFor(task, 0),
					operationFor(link, 0),
					operationFor(nextThought, thought.version, "upsert", thoughtPatch)
				]);
			});
		} catch (error) {
			setTasks((items) => items.filter((item) => item.id !== task.id));
			setThoughts((items) => [thought, ...items].sort(sortUpdated));
			setOriginLinks((items) => items.filter((item) => item.id !== link.id));
			throw error;
		}
		kickSync();
		return task;
	}, [
		kickSync,
		setOriginLinks,
		setTasks,
		setThoughts,
		tasks,
		thoughts
	]);
	return {
		convertThoughtToDraft,
		convertThoughtsToTasks: (0, import_react.useCallback)(async (ids) => {
			for (const id of ids) await convertThoughtToDraft(id);
		}, [convertThoughtToDraft]),
		convertThoughtsToEvents: (0, import_react.useCallback)(async (ids) => {
			const start = /* @__PURE__ */ new Date();
			start.setDate(start.getDate() + 1);
			start.setHours(9, 0, 0, 0);
			for (const id of ids) {
				const thought = thoughts.find((item) => item.id === id);
				if (!thought) continue;
				const end = new Date(start.getTime() + 30 * 6e4);
				await addEvent({
					title: thought.content,
					startAt: start.toISOString(),
					endAt: end.toISOString(),
					originThoughtIds: [id]
				});
			}
			await updateThoughtStatus(ids, "archived", `已加入 ${ids.length} 条日程`);
		}, [
			addEvent,
			thoughts,
			updateThoughtStatus
		])
	};
}
//#endregion
//#region components/planner-provider/item-mutations.ts
function useItemMutations({ thoughts, tasks, events, settings, setThoughts, setTasks, setEvents, setScheduleBlocks, setOriginLinks, kickSync }) {
	const { addOriginLinks } = useOriginLinkMutations({ setOriginLinks });
	const thoughtMutations = useThoughtMutations({
		thoughts,
		settings,
		setThoughts,
		kickSync
	});
	const taskMutations = useTaskMutations({
		tasks,
		setTasks,
		setScheduleBlocks,
		setOriginLinks,
		kickSync
	});
	const eventMutations = useEventMutations({
		events,
		settings,
		setEvents,
		addOriginLinks,
		kickSync
	});
	const conversions = useThoughtConversions({
		thoughts,
		tasks,
		setThoughts,
		setTasks,
		setOriginLinks,
		addEvent: eventMutations.addEvent,
		updateThoughtStatus: thoughtMutations.updateThoughtStatus,
		kickSync
	});
	return {
		addOriginLinks,
		...thoughtMutations,
		...taskMutations,
		...eventMutations,
		...conversions
	};
}
//#endregion
//#region components/planner-provider/project/goal-mutations.ts
function useGoalMutations({ goals, projects, projectNodes, scheduleBlocks, originLinks, setGoals, setProjects, setProjectNodes, setScheduleBlocks, setOriginLinks, kickSync }) {
	return {
		addGoal: (0, import_react.useCallback)(async (name, color) => {
			const time = nowIso();
			const db = getPlannerDb();
			const goal = {
				id: newId("goal"),
				entityType: "goal",
				name: name.trim(),
				color: color ?? MORANDI_COLORS[goals.length % MORANDI_COLORS.length],
				order: goals.length,
				archived: false,
				createdAt: time,
				updatedAt: time,
				version: 1
			};
			setGoals((current) => [...current, goal].sort((a, b) => a.order - b.order));
			try {
				await db.transaction("rw", [db.goals, db.operations], async () => {
					await db.goals.put(goal);
					await db.operations.put(operationFor(goal, 0));
				});
				kickSync();
				return goal;
			} catch (error) {
				setGoals((current) => current.filter((item) => item.id !== goal.id));
				throw error;
			}
		}, [
			goals.length,
			kickSync,
			setGoals
		]),
		updateGoal: (0, import_react.useCallback)(async (id, patch) => {
			const db = getPlannerDb();
			const current = goals.find((goal) => goal.id === id) ?? await db.goals.get(id);
			if (!current) return;
			const nextPatch = {
				...patch,
				updatedAt: nowIso(),
				version: current.version + 1
			};
			setGoals((items) => items.map((goal) => goal.id === id ? {
				...goal,
				...nextPatch
			} : goal).sort((a, b) => a.order - b.order));
			try {
				await db.transaction("rw", [db.goals, db.operations], async () => {
					await db.goals.update(id, nextPatch);
					await db.operations.put(operationFor({
						...current,
						...nextPatch
					}, current.version, "upsert", nextPatch));
				});
				kickSync();
			} catch (error) {
				setGoals((items) => items.map((goal) => goal.id === id ? current : goal).sort((a, b) => a.order - b.order));
				throw error;
			}
		}, [
			goals,
			kickSync,
			setGoals
		]),
		deleteGoal: (0, import_react.useCallback)(async (id) => {
			const db = getPlannerDb();
			const goal = goals.find((item) => item.id === id);
			if (!goal) return;
			const relatedProjects = projects.filter((project) => project.goalId === id);
			const projectIds = new Set(relatedProjects.map((project) => project.id));
			const relatedNodes = projectNodes.filter((node) => projectIds.has(node.projectId));
			const nodeIds = new Set(relatedNodes.map((node) => node.id));
			const relatedBlocks = scheduleBlocks.filter((block) => block.sourceType === "projectNode" && nodeIds.has(block.sourceId));
			const relatedLinks = originLinks.filter((link) => link.targetEntityType === "goal" && link.targetEntityId === id || link.targetEntityType === "project" && projectIds.has(link.targetEntityId) || link.targetEntityType === "projectNode" && nodeIds.has(link.targetEntityId));
			const linkIds = new Set(relatedLinks.map((link) => link.id));
			const time = nowIso();
			const goalPatch = {
				name: "",
				deletedAt: time,
				updatedAt: time,
				version: goal.version + 1
			};
			const projectUpdates = relatedProjects.map((project) => ({
				current: project,
				patch: {
					title: "",
					deletedAt: time,
					updatedAt: time,
					version: project.version + 1
				}
			}));
			const nodeUpdates = relatedNodes.map((node) => ({
				current: node,
				patch: {
					title: "",
					deletedAt: time,
					updatedAt: time,
					version: node.version + 1
				}
			}));
			const blockUpdates = relatedBlocks.map((block) => ({
				current: block,
				patch: {
					reminderRules: [],
					deletedAt: time,
					updatedAt: time,
					version: block.version + 1
				}
			}));
			const linkUpdates = relatedLinks.map((link) => ({
				current: link,
				patch: {
					deletedAt: time,
					updatedAt: time,
					version: link.version + 1
				}
			}));
			const operations = [
				operationFor({
					...goal,
					...goalPatch
				}, goal.version, "delete", goalPatch),
				...projectUpdates.map(({ current, patch }) => operationFor({
					...current,
					...patch
				}, current.version, "delete", patch)),
				...nodeUpdates.map(({ current, patch }) => operationFor({
					...current,
					...patch
				}, current.version, "delete", patch)),
				...blockUpdates.map(({ current, patch }) => operationFor({
					...current,
					...patch
				}, current.version, "delete", patch)),
				...linkUpdates.map(({ current, patch }) => operationFor({
					...current,
					...patch
				}, current.version, "delete", patch))
			];
			setGoals((current) => current.filter((item) => item.id !== id));
			setProjects((current) => current.filter((project) => !projectIds.has(project.id)));
			setProjectNodes((current) => current.filter((node) => !nodeIds.has(node.id)));
			setScheduleBlocks((current) => current.filter((block) => block.sourceType !== "projectNode" || !nodeIds.has(block.sourceId)));
			setOriginLinks((current) => current.filter((link) => !linkIds.has(link.id)));
			try {
				await db.transaction("rw", [
					db.goals,
					db.projects,
					db.projectNodes,
					db.scheduleBlocks,
					db.originLinks,
					db.operations
				], async () => {
					await db.goals.update(goal.id, goalPatch);
					if (projectUpdates.length) await db.projects.bulkUpdate(projectUpdates.map(({ current, patch }) => ({
						key: current.id,
						changes: patch
					})));
					if (nodeUpdates.length) await db.projectNodes.bulkUpdate(nodeUpdates.map(({ current, patch }) => ({
						key: current.id,
						changes: patch
					})));
					if (blockUpdates.length) await db.scheduleBlocks.bulkUpdate(blockUpdates.map(({ current, patch }) => ({
						key: current.id,
						changes: patch
					})));
					if (linkUpdates.length) await db.originLinks.bulkUpdate(linkUpdates.map(({ current, patch }) => ({
						key: current.id,
						changes: patch
					})));
					await db.operations.bulkPut(operations);
				});
			} catch (error) {
				setGoals((current) => [...current.filter((item) => item.id !== goal.id), goal].sort((a, b) => a.order - b.order));
				setProjects((current) => [...current.filter((project) => !projectIds.has(project.id)), ...relatedProjects].sort((a, b) => a.order - b.order));
				setProjectNodes((current) => [...current.filter((node) => !nodeIds.has(node.id)), ...relatedNodes].sort((a, b) => a.order - b.order));
				setScheduleBlocks((current) => [...current.filter((block) => !relatedBlocks.some((item) => item.id === block.id)), ...relatedBlocks].sort(sortBlocks));
				setOriginLinks((current) => [...current.filter((link) => !relatedLinks.some((item) => item.id === link.id)), ...relatedLinks].sort(sortUpdated));
				throw error;
			}
			kickSync();
		}, [
			goals,
			kickSync,
			originLinks,
			projectNodes,
			projects,
			scheduleBlocks,
			setGoals,
			setOriginLinks,
			setProjectNodes,
			setProjects,
			setScheduleBlocks
		])
	};
}
//#endregion
//#region components/planner-provider/project/project-entity-mutations.ts
function useProjectEntityMutations({ projects, projectNodes, scheduleBlocks, originLinks, setProjects, setProjectNodes, setScheduleBlocks, setOriginLinks, addOriginLinks, kickSync }) {
	return {
		addProject: (0, import_react.useCallback)(async (goalId, title, sourceThoughtIds = []) => {
			const time = nowIso();
			const db = getPlannerDb();
			const project = {
				id: newId("project"),
				entityType: "project",
				goalId,
				title: title.trim(),
				status: "active",
				initializationState: "draft",
				order: projects.filter((item) => item.goalId === goalId).length,
				sourceThoughtIds,
				plannedStartDate: null,
				plannedEndDate: null,
				createdAt: time,
				updatedAt: time,
				version: 1
			};
			setProjects((current) => [...current, project].sort((a, b) => a.order - b.order));
			try {
				await db.transaction("rw", [db.projects, db.operations], async () => {
					await db.projects.put(project);
					await db.operations.put(operationFor(project, 0));
				});
				await addOriginLinks(sourceThoughtIds, project);
				kickSync();
				return project;
			} catch (error) {
				setProjects((current) => current.filter((item) => item.id !== project.id));
				throw error;
			}
		}, [
			addOriginLinks,
			kickSync,
			projects,
			setProjects
		]),
		updateProject: (0, import_react.useCallback)(async (id, patch) => {
			const db = getPlannerDb();
			const current = projects.find((project) => project.id === id) ?? await db.projects.get(id);
			if (!current) return;
			const nextPatch = {
				...patch,
				updatedAt: nowIso(),
				version: current.version + 1
			};
			setProjects((items) => items.map((project) => project.id === id ? {
				...project,
				...nextPatch
			} : project).sort((a, b) => a.order - b.order));
			try {
				await db.transaction("rw", [db.projects, db.operations], async () => {
					await db.projects.update(id, nextPatch);
					await db.operations.put(operationFor({
						...current,
						...nextPatch
					}, current.version, "upsert", nextPatch));
				});
				kickSync();
			} catch (error) {
				setProjects((items) => items.map((project) => project.id === id ? current : project).sort((a, b) => a.order - b.order));
				throw error;
			}
		}, [
			kickSync,
			projects,
			setProjects
		]),
		deleteProject: (0, import_react.useCallback)(async (id) => {
			const db = getPlannerDb();
			const project = projects.find((item) => item.id === id);
			if (!project) return;
			const relatedNodes = projectNodes.filter((node) => node.projectId === id);
			const nodeIds = new Set(relatedNodes.map((node) => node.id));
			const relatedBlocks = scheduleBlocks.filter((block) => active(block) && block.sourceType === "projectNode" && nodeIds.has(block.sourceId));
			const relatedLinks = originLinks.filter((link) => active(link) && (link.targetEntityType === "project" && link.targetEntityId === id || link.targetEntityType === "projectNode" && nodeIds.has(link.targetEntityId)));
			const time = nowIso();
			const projectPatch = {
				title: "",
				deletedAt: time,
				updatedAt: time,
				version: project.version + 1
			};
			const nodeUpdates = relatedNodes.map((node) => ({
				current: node,
				patch: {
					title: "",
					deletedAt: time,
					updatedAt: time,
					version: node.version + 1
				}
			}));
			const blockUpdates = relatedBlocks.map((block) => ({
				current: block,
				patch: {
					reminderRules: [],
					deletedAt: time,
					updatedAt: time,
					version: block.version + 1
				}
			}));
			const linkUpdates = relatedLinks.map((link) => ({
				current: link,
				patch: {
					deletedAt: time,
					updatedAt: time,
					version: link.version + 1
				}
			}));
			setProjects((current) => current.filter((item) => item.id !== id));
			setProjectNodes((current) => current.filter((node) => node.projectId !== id));
			setScheduleBlocks((current) => current.filter((block) => block.sourceType !== "projectNode" || !nodeIds.has(block.sourceId)));
			setOriginLinks((current) => current.filter((link) => !(link.targetEntityType === "project" && link.targetEntityId === id || link.targetEntityType === "projectNode" && nodeIds.has(link.targetEntityId))));
			try {
				await db.transaction("rw", [
					db.projects,
					db.projectNodes,
					db.scheduleBlocks,
					db.originLinks,
					db.operations
				], async () => {
					await db.projects.update(id, projectPatch);
					if (nodeUpdates.length) await db.projectNodes.bulkUpdate(nodeUpdates.map(({ current, patch }) => ({
						key: current.id,
						changes: patch
					})));
					if (blockUpdates.length) await db.scheduleBlocks.bulkUpdate(blockUpdates.map(({ current, patch }) => ({
						key: current.id,
						changes: patch
					})));
					if (linkUpdates.length) await db.originLinks.bulkUpdate(linkUpdates.map(({ current, patch }) => ({
						key: current.id,
						changes: patch
					})));
					await db.operations.bulkPut([
						operationFor({
							...project,
							...projectPatch
						}, project.version, "delete", projectPatch),
						...nodeUpdates.map(({ current, patch }) => operationFor({
							...current,
							...patch
						}, current.version, "delete", patch)),
						...blockUpdates.map(({ current, patch }) => operationFor({
							...current,
							...patch
						}, current.version, "delete", patch)),
						...linkUpdates.map(({ current, patch }) => operationFor({
							...current,
							...patch
						}, current.version, "delete", patch))
					]);
				});
			} catch (error) {
				setProjects((current) => [...current.filter((item) => item.id !== project.id), project].sort((a, b) => a.order - b.order));
				setProjectNodes((current) => [...current.filter((node) => !nodeIds.has(node.id)), ...relatedNodes].sort((a, b) => a.order - b.order));
				setScheduleBlocks((current) => [...current.filter((block) => !blockUpdates.some((item) => item.current.id === block.id)), ...relatedBlocks].sort(sortBlocks));
				setOriginLinks((current) => [...current.filter((link) => !linkUpdates.some((item) => item.current.id === link.id)), ...relatedLinks].sort(sortUpdated));
				throw error;
			}
			kickSync();
		}, [
			kickSync,
			originLinks,
			projectNodes,
			projects,
			scheduleBlocks,
			setOriginLinks,
			setProjectNodes,
			setProjects,
			setScheduleBlocks
		])
	};
}
//#endregion
//#region components/planner-provider/project/project-node-mutations.ts
function useProjectNodeMutations({ projects, projectNodes, scheduleBlocks, originLinks, setProjects, setProjectNodes, setScheduleBlocks, setOriginLinks, kickSync }) {
	const addProjectNode = (0, import_react.useCallback)(async (projectId, parentId, title, options = {}) => {
		const db = getPlannerDb();
		const time = nowIso();
		const nodes = projectNodes.filter((node) => node.projectId === projectId);
		const project = projects.find((item) => item.id === projectId);
		if (!project) throw new Error("找不到 Project");
		let futureBlocks = [];
		if (parentId) {
			const parent = nodes.find((node) => node.id === parentId);
			if (!parent) throw new Error("找不到父节点");
			if (parent.status === "completed") throw new Error("已完成叶子不能再增加子节点");
			futureBlocks = scheduleBlocks.filter((block) => block.sourceId === parentId && block.status === "planned" && block.date >= localDateKey(/* @__PURE__ */ new Date()));
			if (futureBlocks.length && !options.confirmDecompose) throw new Error("LEAF_HAS_SCHEDULES");
		}
		const siblings = nodes.filter((node) => node.parentId === parentId);
		const node = {
			id: newId("node"),
			entityType: "projectNode",
			projectId,
			parentId,
			title: title.trim(),
			order: siblings.length,
			status: "open",
			isFocused: false,
			needsContinuousTime: Boolean(options.needsContinuousTime),
			isFragmentFriendly: !options.needsContinuousTime && Boolean(options.isFragmentFriendly),
			sourceThoughtIds: options.sourceThoughtIds ?? [],
			importIndex: options.importIndex ?? null,
			completedAt: null,
			createdAt: time,
			updatedAt: time,
			version: 1
		};
		const projectPatch = project.initializationState !== "ready" ? {
			initializationState: "ready",
			updatedAt: time,
			version: project.version + 1
		} : null;
		const blockUpdates = futureBlocks.map((block) => ({
			current: block,
			patch: {
				status: "skipped",
				reminderRules: [],
				updatedAt: time,
				version: block.version + 1
			}
		}));
		const links = node.sourceThoughtIds.map((sourceEntityId) => ({
			id: newId("origin"),
			entityType: "originLink",
			sourceEntityType: "thought",
			sourceEntityId,
			targetEntityType: "projectNode",
			targetEntityId: node.id,
			relationship: "created_from",
			createdAt: time,
			updatedAt: time,
			version: 1
		}));
		setProjectNodes((current) => [...current, node].sort((a, b) => a.order - b.order));
		if (projectPatch) setProjects((current) => current.map((item) => item.id === projectId ? {
			...item,
			...projectPatch
		} : item));
		if (blockUpdates.length) setScheduleBlocks((current) => current.map((block) => {
			const update = blockUpdates.find((item) => item.current.id === block.id);
			return update ? {
				...block,
				...update.patch
			} : block;
		}).sort(sortBlocks));
		if (links.length) setOriginLinks((current) => [...links, ...current].sort(sortUpdated));
		try {
			await db.transaction("rw", [
				db.projects,
				db.projectNodes,
				db.scheduleBlocks,
				db.originLinks,
				db.operations
			], async () => {
				await db.projectNodes.put(node);
				if (blockUpdates.length) await db.scheduleBlocks.bulkUpdate(blockUpdates.map(({ current, patch }) => ({
					key: current.id,
					changes: patch
				})));
				if (projectPatch) await db.projects.update(projectId, projectPatch);
				if (links.length) await db.originLinks.bulkPut(links);
				await db.operations.bulkPut([
					operationFor(node, 0),
					...blockUpdates.map(({ current, patch }) => operationFor({
						...current,
						...patch
					}, current.version, "upsert", patch)),
					...projectPatch ? [operationFor({
						...project,
						...projectPatch
					}, project.version, "upsert", projectPatch)] : [],
					...links.map((link) => operationFor(link, 0))
				]);
			});
		} catch (error) {
			setProjectNodes((current) => current.filter((item) => item.id !== node.id));
			if (projectPatch) setProjects((current) => current.map((item) => item.id === projectId ? project : item));
			if (blockUpdates.length) setScheduleBlocks((current) => current.map((block) => {
				return blockUpdates.find((item) => item.current.id === block.id)?.current ?? block;
			}).sort(sortBlocks));
			if (links.length) setOriginLinks((current) => current.filter((link) => !links.some((item) => item.id === link.id)));
			throw error;
		}
		kickSync();
		return node;
	}, [
		kickSync,
		projectNodes,
		projects,
		scheduleBlocks,
		setOriginLinks,
		setProjectNodes,
		setProjects,
		setScheduleBlocks
	]);
	const updateProjectNode = (0, import_react.useCallback)(async (id, patch) => {
		const db = getPlannerDb();
		const current = projectNodes.find((node) => node.id === id) ?? await db.projectNodes.get(id);
		if (!current) return;
		const continuous = patch.needsContinuousTime ?? current.needsContinuousTime;
		const fragmentFriendly = patch.isFragmentFriendly ?? current.isFragmentFriendly;
		const nextPatch = {
			...patch,
			needsContinuousTime: Boolean(continuous),
			isFragmentFriendly: Boolean(fragmentFriendly) && !continuous,
			updatedAt: nowIso(),
			version: current.version + 1
		};
		setProjectNodes((items) => items.map((node) => node.id === id ? {
			...node,
			...nextPatch
		} : node).sort((a, b) => a.order - b.order));
		try {
			await db.transaction("rw", [db.projectNodes, db.operations], async () => {
				await db.projectNodes.update(id, nextPatch);
				await db.operations.put(operationFor({
					...current,
					...nextPatch
				}, current.version, "upsert", nextPatch));
			});
			kickSync();
		} catch (error) {
			setProjectNodes((items) => items.map((node) => node.id === id ? current : node).sort((a, b) => a.order - b.order));
			throw error;
		}
	}, [
		kickSync,
		projectNodes,
		setProjectNodes
	]);
	return {
		addProjectNode,
		updateProjectNode,
		moveProjectNode: (0, import_react.useCallback)(async (id, parentId, requestedOrder = Number.MAX_SAFE_INTEGER, confirmDecompose = false) => {
			const db = getPlannerDb();
			const current = projectNodes.find((node) => node.id === id);
			if (!current) return;
			const nodes = projectNodes.filter((node) => node.projectId === current.projectId);
			if (wouldCreateCycle(id, parentId, nodes)) throw new Error("不能把节点移动到自身后代中");
			let future = [];
			if (parentId) {
				const parent = nodes.find((node) => node.id === parentId);
				if (!parent || parent.projectId !== current.projectId) throw new Error("节点只能在同一个 Project 内移动");
				if (parent.status === "completed" && isLeafNode(parent.id, nodes)) throw new Error("已完成叶子不能再增加子节点");
				future = scheduleBlocks.filter((block) => !block.deletedAt && block.sourceId === parentId && block.status === "planned" && block.date >= localDateKey(/* @__PURE__ */ new Date()));
				if (future.length && !confirmDecompose) throw new Error("LEAF_HAS_SCHEDULES");
			}
			const time = nowIso();
			const blockUpdates = future.map((block) => ({
				current: block,
				patch: {
					status: "skipped",
					reminderRules: [],
					updatedAt: time,
					version: block.version + 1
				}
			}));
			const siblings = nodes.filter((node) => node.parentId === parentId && node.id !== id).sort((a, b) => a.order - b.order);
			const order = Math.max(0, Math.min(requestedOrder, siblings.length));
			siblings.splice(order, 0, current);
			const nodeUpdates = siblings.map((node, index) => ({
				current: node,
				patch: {
					parentId,
					order: index,
					updatedAt: time,
					version: node.version + 1
				}
			}));
			const nodePatchById = new Map(nodeUpdates.map(({ current: node, patch }) => [node.id, patch]));
			const blockPatchById = new Map(blockUpdates.map(({ current: block, patch }) => [block.id, patch]));
			setProjectNodes((items) => items.map((node) => ({
				...node,
				...nodePatchById.get(node.id)
			})).sort((a, b) => a.order - b.order));
			if (blockUpdates.length) setScheduleBlocks((items) => items.map((block) => ({
				...block,
				...blockPatchById.get(block.id)
			})).sort(sortBlocks));
			try {
				await db.transaction("rw", [
					db.projectNodes,
					db.scheduleBlocks,
					db.operations
				], async () => {
					await db.projectNodes.bulkUpdate(nodeUpdates.map(({ current: node, patch }) => ({
						key: node.id,
						changes: patch
					})));
					if (blockUpdates.length) await db.scheduleBlocks.bulkUpdate(blockUpdates.map(({ current: block, patch }) => ({
						key: block.id,
						changes: patch
					})));
					await db.operations.bulkPut([...nodeUpdates.map(({ current: node, patch }) => operationFor({
						...node,
						...patch
					}, node.version, "upsert", patch)), ...blockUpdates.map(({ current: block, patch }) => operationFor({
						...block,
						...patch
					}, block.version, "upsert", patch))]);
				});
			} catch (error) {
				const previousNodes = new Map(nodeUpdates.map(({ current: node }) => [node.id, node]));
				const previousBlocks = new Map(blockUpdates.map(({ current: block }) => [block.id, block]));
				setProjectNodes((items) => items.map((node) => previousNodes.get(node.id) ?? node).sort((a, b) => a.order - b.order));
				if (blockUpdates.length) setScheduleBlocks((items) => items.map((block) => previousBlocks.get(block.id) ?? block).sort(sortBlocks));
				throw error;
			}
			kickSync();
		}, [
			kickSync,
			projectNodes,
			scheduleBlocks,
			setProjectNodes,
			setScheduleBlocks
		]),
		deleteProjectNode: (0, import_react.useCallback)(async (id) => {
			const db = getPlannerDb();
			const root = projectNodes.find((node) => node.id === id) ?? await db.projectNodes.get(id);
			if (!root) return;
			const targets = [root, ...collectDescendants(id, projectNodes.filter((node) => node.projectId === root.projectId))];
			const time = nowIso();
			const targetIds = new Set(targets.map((node) => node.id));
			const blocks = scheduleBlocks.filter((block) => block.sourceType === "projectNode" && targetIds.has(block.sourceId));
			const links = originLinks.filter((link) => link.targetEntityType === "projectNode" && targetIds.has(link.targetEntityId));
			const nodeUpdates = targets.map((node) => ({
				current: node,
				patch: {
					title: "",
					deletedAt: time,
					updatedAt: time,
					version: node.version + 1
				}
			}));
			const blockUpdates = blocks.map((block) => ({
				current: block,
				patch: {
					deletedAt: time,
					reminderRules: [],
					updatedAt: time,
					version: block.version + 1
				}
			}));
			const linkUpdates = links.map((link) => ({
				current: link,
				patch: {
					deletedAt: time,
					updatedAt: time,
					version: link.version + 1
				}
			}));
			setProjectNodes((items) => items.filter((node) => !targetIds.has(node.id)));
			setScheduleBlocks((items) => items.filter((block) => block.sourceType !== "projectNode" || !targetIds.has(block.sourceId)));
			setOriginLinks((items) => items.filter((link) => link.targetEntityType !== "projectNode" || !targetIds.has(link.targetEntityId)));
			try {
				await db.transaction("rw", [
					db.projectNodes,
					db.scheduleBlocks,
					db.originLinks,
					db.operations
				], async () => {
					await db.projectNodes.bulkUpdate(nodeUpdates.map(({ current, patch }) => ({
						key: current.id,
						changes: patch
					})));
					if (blockUpdates.length) await db.scheduleBlocks.bulkUpdate(blockUpdates.map(({ current, patch }) => ({
						key: current.id,
						changes: patch
					})));
					if (linkUpdates.length) await db.originLinks.bulkUpdate(linkUpdates.map(({ current, patch }) => ({
						key: current.id,
						changes: patch
					})));
					await db.operations.bulkPut([
						...nodeUpdates.map(({ current, patch }) => operationFor({
							...current,
							...patch
						}, current.version, "delete", patch)),
						...blockUpdates.map(({ current, patch }) => operationFor({
							...current,
							...patch
						}, current.version, "delete", patch)),
						...linkUpdates.map(({ current, patch }) => operationFor({
							...current,
							...patch
						}, current.version, "delete", patch))
					]);
				});
				kickSync();
			} catch (error) {
				setProjectNodes((items) => [...items.filter((node) => !targetIds.has(node.id)), ...targets].sort((a, b) => a.order - b.order));
				setScheduleBlocks((items) => [...items.filter((block) => !blocks.some((item) => item.id === block.id)), ...blocks].sort(sortBlocks));
				setOriginLinks((items) => [...items.filter((link) => !links.some((item) => item.id === link.id)), ...links].sort(sortUpdated));
				throw error;
			}
		}, [
			kickSync,
			originLinks,
			projectNodes,
			scheduleBlocks,
			setOriginLinks,
			setProjectNodes,
			setScheduleBlocks
		]),
		toggleProjectNode: (0, import_react.useCallback)(async (id) => {
			const db = getPlannerDb();
			const node = await db.projectNodes.get(id);
			if (!node) return;
			if (!isLeafNode(id, (await db.projectNodes.where("projectId").equals(node.projectId).toArray()).filter(active))) throw new Error("父节点进度由叶子节点自动计算");
			const completed = node.status !== "completed";
			await updateProjectNode(id, {
				status: completed ? "completed" : "open",
				completedAt: completed ? nowIso() : null
			});
		}, [updateProjectNode]),
		setProjectNodeFocus: (0, import_react.useCallback)(async (id) => {
			const db = getPlannerDb();
			const target = projectNodes.find((node) => node.id === id);
			if (!target || target.status === "completed") return;
			const nodes = projectNodes.filter((node) => node.projectId === target.projectId);
			if (!isLeafNode(id, nodes)) throw new Error("只有可执行叶子可以设为当前推进");
			const time = nowIso();
			const nextFocused = !target.isFocused;
			const updates = nodes.filter((node) => node.isFocused || node.id === id && node.isFocused !== nextFocused).flatMap((node) => {
				const isFocused = node.id === id ? nextFocused : false;
				if (node.isFocused === isFocused) return [];
				return [{
					current: node,
					patch: {
						isFocused,
						updatedAt: time,
						version: node.version + 1
					}
				}];
			});
			const patchById = new Map(updates.map(({ current: node, patch }) => [node.id, patch]));
			setProjectNodes((items) => items.map((node) => ({
				...node,
				...patchById.get(node.id)
			})));
			try {
				await db.transaction("rw", [db.projectNodes, db.operations], async () => {
					await db.projectNodes.bulkUpdate(updates.map(({ current: node, patch }) => ({
						key: node.id,
						changes: patch
					})));
					await db.operations.bulkPut(updates.map(({ current: node, patch }) => operationFor({
						...node,
						...patch
					}, node.version, "upsert", patch)));
				});
			} catch (error) {
				const previousById = new Map(updates.map(({ current: node }) => [node.id, node]));
				setProjectNodes((items) => items.map((node) => previousById.get(node.id) ?? node));
				throw error;
			}
			kickSync();
		}, [
			kickSync,
			projectNodes,
			setProjectNodes
		])
	};
}
//#endregion
//#region components/planner-provider/project/project-import-mutations.ts
function useProjectImportMutations({ projects, projectNodes, scheduleBlocks, originLinks, setProjects, setProjectNodes, setScheduleBlocks, setOriginLinks, kickSync }) {
	return {
		duplicateProject: (0, import_react.useCallback)(async (id) => {
			const db = getPlannerDb();
			const source = projects.find((project) => project.id === id) ?? await db.projects.get(id);
			if (!source) return null;
			const sourceNodes = projectNodes.filter((node) => node.projectId === id);
			const time = nowIso();
			const copy = {
				id: newId("project"),
				entityType: "project",
				goalId: source.goalId,
				title: `${source.title}（副本）`,
				status: "active",
				initializationState: source.initializationState,
				order: projects.filter((project) => project.goalId === source.goalId).length,
				sourceThoughtIds: [],
				plannedStartDate: null,
				plannedEndDate: null,
				importCheckpoint: null,
				createdAt: time,
				updatedAt: time,
				version: 1
			};
			const idMap = new Map(sourceNodes.map((node) => [node.id, newId("node")]));
			const copies = sourceNodes.map((node) => ({
				id: idMap.get(node.id),
				entityType: "projectNode",
				projectId: copy.id,
				parentId: node.parentId ? idMap.get(node.parentId) ?? null : null,
				title: node.title,
				order: node.order,
				status: "open",
				isFocused: false,
				needsContinuousTime: Boolean(node.needsContinuousTime),
				isFragmentFriendly: Boolean(node.isFragmentFriendly),
				sourceThoughtIds: [],
				importIndex: null,
				completedAt: null,
				createdAt: time,
				updatedAt: time,
				version: 1
			}));
			setProjects((current) => [...current, copy].sort((a, b) => a.order - b.order));
			setProjectNodes((current) => [...current, ...copies].sort((a, b) => a.order - b.order));
			try {
				await db.transaction("rw", [
					db.projects,
					db.projectNodes,
					db.operations
				], async () => {
					await db.projects.put(copy);
					if (copies.length) await db.projectNodes.bulkPut(copies);
					await db.operations.bulkPut([operationFor(copy, 0), ...copies.map((node) => operationFor(node, 0))]);
				});
			} catch (error) {
				setProjects((current) => current.filter((project) => project.id !== copy.id));
				setProjectNodes((current) => current.filter((node) => node.projectId !== copy.id));
				throw error;
			}
			kickSync();
			return copy;
		}, [
			kickSync,
			projectNodes,
			projects,
			setProjectNodes,
			setProjects
		]),
		resumeProjectImport: (0, import_react.useCallback)(async (projectId) => {
			const db = getPlannerDb();
			const project = await db.projects.get(projectId);
			if (!project?.importCheckpoint) return;
			await db.projects.update(projectId, {
				importCheckpoint: null,
				updatedAt: nowIso(),
				version: project.version + 1
			});
		}, []),
		importProjectOutline: (0, import_react.useCallback)(async (goalId, title, candidates, sourceThoughtIds = [], targetProjectId) => {
			const db = getPlannerDb();
			const time = nowIso();
			let project;
			let baseVersion = 0;
			let previousProject = null;
			let previousNodes = [];
			let previousBlocks = [];
			let previousProjectLinks = [];
			let previousNodeLinks = [];
			if (targetProjectId) {
				const existing = projects.find((item) => item.id === targetProjectId);
				if (!existing || existing.goalId !== goalId) throw new Error("只能把 Markdown 导入当前 Goal 下的 Project");
				previousProject = existing;
				baseVersion = existing.version;
				previousNodes = projectNodes.filter((node) => node.projectId === targetProjectId);
				previousProjectLinks = originLinks.filter((link) => link.targetEntityType === "project" && link.targetEntityId === targetProjectId);
				const previousNodeIds = new Set(previousNodes.map((node) => node.id));
				previousBlocks = scheduleBlocks.filter((block) => block.sourceType === "projectNode" && previousNodeIds.has(block.sourceId));
				previousNodeLinks = originLinks.filter((link) => link.targetEntityType === "projectNode" && previousNodeIds.has(link.targetEntityId));
				project = {
					...existing,
					title: title.trim(),
					initializationState: "ready",
					sourceThoughtIds: Array.from(new Set([...existing.sourceThoughtIds ?? [], ...sourceThoughtIds])),
					importCheckpoint: null,
					updatedAt: time,
					version: existing.version + 1
				};
			} else project = {
				id: newId("project"),
				entityType: "project",
				goalId,
				title: title.trim(),
				status: "active",
				initializationState: "ready",
				order: projects.filter((item) => item.goalId === goalId).length,
				sourceThoughtIds,
				importCheckpoint: null,
				createdAt: time,
				updatedAt: time,
				version: 1
			};
			const ids = candidates.map(() => newId("node"));
			const siblingOrders = /* @__PURE__ */ new Map();
			const nodes = candidates.map((candidate, index) => {
				const parentId = candidate.parentIndex == null ? null : ids[candidate.parentIndex] ?? null;
				const orderKey = parentId ?? "root";
				const order = siblingOrders.get(orderKey) ?? 0;
				siblingOrders.set(orderKey, order + 1);
				return {
					id: ids[index],
					entityType: "projectNode",
					projectId: project.id,
					parentId,
					title: candidate.title.trim(),
					order,
					status: "open",
					isFocused: false,
					needsContinuousTime: false,
					isFragmentFriendly: false,
					sourceThoughtIds,
					importIndex: index,
					completedAt: null,
					createdAt: time,
					updatedAt: time,
					version: 1
				};
			});
			const linkedThoughtIds = new Set(previousProjectLinks.filter((link) => link.sourceEntityType === "thought").map((link) => link.sourceEntityId));
			const links = [...new Set(project.sourceThoughtIds)].filter((sourceEntityId) => !linkedThoughtIds.has(sourceEntityId)).map((sourceEntityId) => ({
				id: `origin_${sourceEntityId}_${project.id}`,
				entityType: "originLink",
				sourceEntityType: "thought",
				sourceEntityId,
				targetEntityType: "project",
				targetEntityId: project.id,
				relationship: "created_from",
				createdAt: time,
				updatedAt: time,
				version: 1
			}));
			const previousLinks = originLinks.filter((link) => links.some((item) => item.id === link.id));
			const previousLinksToReplace = previousNodeLinks;
			const previousLinkIds = new Set(previousLinksToReplace.map((link) => link.id));
			const nodeIdsToReplace = new Set(previousNodes.map((node) => node.id));
			const nodeDeleteUpdates = previousNodes.map((node) => ({
				current: node,
				patch: {
					title: "",
					deletedAt: time,
					updatedAt: time,
					version: node.version + 1
				}
			}));
			const blockDeleteUpdates = previousBlocks.map((block) => ({
				current: block,
				patch: {
					reminderRules: [],
					deletedAt: time,
					updatedAt: time,
					version: block.version + 1
				}
			}));
			const linkDeleteUpdates = previousNodeLinks.map((link) => ({
				current: link,
				patch: {
					deletedAt: time,
					updatedAt: time,
					version: link.version + 1
				}
			}));
			setProjects((current) => [...current.filter((item) => item.id !== project.id), project].sort((a, b) => a.order - b.order));
			setProjectNodes((current) => [...current.filter((node) => !nodeIdsToReplace.has(node.id)), ...nodes].sort((a, b) => a.order - b.order));
			if (previousBlocks.length) setScheduleBlocks((current) => current.filter((block) => !previousBlocks.some((item) => item.id === block.id)));
			if (links.length) setOriginLinks((current) => [...current.filter((link) => !links.some((item) => item.id === link.id) && !previousLinkIds.has(link.id)), ...links].sort(sortUpdated));
			else if (previousLinksToReplace.length) setOriginLinks((current) => current.filter((link) => !previousLinkIds.has(link.id)));
			try {
				await db.transaction("rw", [
					db.projects,
					db.projectNodes,
					db.scheduleBlocks,
					db.originLinks,
					db.operations
				], async () => {
					await db.projects.put(project);
					if (nodeDeleteUpdates.length) await db.projectNodes.bulkUpdate(nodeDeleteUpdates.map(({ current, patch }) => ({
						key: current.id,
						changes: patch
					})));
					await db.projectNodes.bulkPut(nodes);
					if (blockDeleteUpdates.length) await db.scheduleBlocks.bulkUpdate(blockDeleteUpdates.map(({ current, patch }) => ({
						key: current.id,
						changes: patch
					})));
					if (linkDeleteUpdates.length) await db.originLinks.bulkUpdate(linkDeleteUpdates.map(({ current, patch }) => ({
						key: current.id,
						changes: patch
					})));
					if (links.length) await db.originLinks.bulkPut(links);
					await db.operations.bulkPut([
						operationFor(project, baseVersion),
						...nodeDeleteUpdates.map(({ current, patch }) => operationFor({
							...current,
							...patch
						}, current.version, "delete", patch)),
						...blockDeleteUpdates.map(({ current, patch }) => operationFor({
							...current,
							...patch
						}, current.version, "delete", patch)),
						...linkDeleteUpdates.map(({ current, patch }) => operationFor({
							...current,
							...patch
						}, current.version, "delete", patch)),
						...nodes.map((node) => operationFor(node, 0)),
						...links.map((link) => operationFor(link, 0))
					]);
				});
			} catch (error) {
				setProjects((current) => {
					const withoutNext = current.filter((item) => item.id !== project.id);
					return previousProject ? [...withoutNext, previousProject].sort((a, b) => a.order - b.order) : withoutNext;
				});
				setProjectNodes((current) => [...current.filter((node) => !nodes.some((item) => item.id === node.id)), ...previousNodes].sort((a, b) => a.order - b.order));
				if (previousBlocks.length) setScheduleBlocks((current) => [...current.filter((block) => !previousBlocks.some((item) => item.id === block.id)), ...previousBlocks].sort(sortBlocks));
				if (links.length) setOriginLinks((current) => [
					...current.filter((link) => !links.some((item) => item.id === link.id) && !previousLinkIds.has(link.id)),
					...previousLinks,
					...previousNodeLinks
				].sort(sortUpdated));
				else if (previousLinksToReplace.length) setOriginLinks((current) => [...current.filter((link) => !previousLinkIds.has(link.id)), ...previousNodeLinks].sort(sortUpdated));
				throw error;
			}
			kickSync();
			return project;
		}, [
			kickSync,
			originLinks,
			projectNodes,
			projects,
			scheduleBlocks,
			setOriginLinks,
			setProjectNodes,
			setScheduleBlocks,
			setProjects
		])
	};
}
//#endregion
//#region components/planner-provider/project-mutations.ts
function useProjectMutations({ goals, projects, projectNodes, scheduleBlocks, originLinks, setGoals, setProjects, setProjectNodes, setScheduleBlocks, setOriginLinks, addOriginLinks, kickSync }) {
	const goalMutations = useGoalMutations({
		goals,
		projects,
		projectNodes,
		scheduleBlocks,
		originLinks,
		setGoals,
		setProjects,
		setProjectNodes,
		setScheduleBlocks,
		setOriginLinks,
		kickSync
	});
	const projectMutations = useProjectEntityMutations({
		projects,
		projectNodes,
		scheduleBlocks,
		originLinks,
		setProjects,
		setProjectNodes,
		setScheduleBlocks,
		setOriginLinks,
		addOriginLinks,
		kickSync
	});
	const nodeMutations = useProjectNodeMutations({
		projects,
		projectNodes,
		scheduleBlocks,
		originLinks,
		setProjects,
		setProjectNodes,
		setScheduleBlocks,
		setOriginLinks,
		kickSync
	});
	const importMutations = useProjectImportMutations({
		projects,
		projectNodes,
		scheduleBlocks,
		originLinks,
		setProjects,
		setProjectNodes,
		setScheduleBlocks,
		setOriginLinks,
		kickSync
	});
	return {
		...goalMutations,
		...projectMutations,
		...nodeMutations,
		...importMutations
	};
}
//#endregion
//#region lib/sync-version.ts
function shouldApplyCloudRecord(current, incoming) {
	const currentVersion = current?.version;
	const incomingVersion = incoming?.version;
	return typeof currentVersion !== "number" || typeof incomingVersion !== "number" || incomingVersion >= currentVersion;
}
//#endregion
//#region lib/sync-client.ts
var CLOUD_SYNC_LOCK = "quiet-plan-cloud-sync";
async function fetchWithTimeout(input, init, timeoutMs = 15e3) {
	const controller = new AbortController();
	const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(input, {
			...init,
			cache: "no-store",
			signal: controller.signal
		});
	} finally {
		window.clearTimeout(timeout);
	}
}
async function applyCloudChanges(changes) {
	if (!changes.length) return;
	const db = getPlannerDb();
	const recordsByStore = /* @__PURE__ */ new Map();
	const entityTypes = /* @__PURE__ */ new Map();
	for (const change of changes) {
		const normalized = normalizeCloudChange(change);
		if (!normalized) continue;
		const records = recordsByStore.get(normalized.storeName) ?? [];
		records.push(normalized.record);
		recordsByStore.set(normalized.storeName, records);
		entityTypes.set(normalized.storeName, change.entityType);
	}
	if (!recordsByStore.size) return;
	const tables = [...[...recordsByStore.keys()].map((storeName) => db.table(storeName)), db.operations];
	await db.transaction("rw", tables, async () => {
		const queued = await db.operations.toArray();
		const protectedIds = new Set(queued.map((operation) => `${operation.entityType}:${operation.entityId}`));
		for (const [storeName, records] of recordsByStore) {
			const table = db.table(storeName);
			const incoming = records;
			const current = await table.bulkGet(incoming.map((record) => record.id));
			const applicable = incoming.filter((record, index) => !protectedIds.has(`${entityTypes.get(storeName)}:${record.id}`) && shouldApplyCloudRecord(current[index], record)).map((record) => storeName === "settings" ? {
				...record,
				cloudCursor: current.find((item) => item?.id === record.id)?.cloudCursor ?? 0
			} : record);
			if (applicable.length) await table.bulkPut(applicable);
		}
	});
}
async function synchronize(settings) {
	if (typeof navigator !== "undefined" && !navigator.onLine) return {
		state: "offline",
		cursor: settings.cloudCursor
	};
	if (navigator.locks) return navigator.locks.request(CLOUD_SYNC_LOCK, () => synchronizeUnlocked(settings));
	return synchronizeUnlocked(settings);
}
async function synchronizeUnlocked(settings) {
	const db = getPlannerDb();
	const operations = await db.operations.where("status").equals("pending").sortBy("createdAt");
	let cursor = (await db.settings.get("main"))?.cloudCursor ?? settings.cloudCursor;
	let uploadError;
	try {
		if (operations.length) {
			await db.operations.bulkUpdate(operations.map((operation) => ({
				key: operation.id,
				changes: { status: "syncing" }
			})));
			const response = await fetchWithTimeout("/api/sync/push", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					operations,
					cursor
				})
			});
			if (response.status === 503) {
				await resetOperations(operations);
				return {
					state: "unconfigured",
					cursor
				};
			}
			if (!response.ok) throw new Error(`同步写入失败（${response.status}）`);
			const result = await response.json();
			await db.transaction("rw", db.operations, db.conflicts, async () => {
				await db.operations.bulkDelete(result.acknowledged ?? []);
				if (result.conflicts?.length) {
					await db.conflicts.bulkPut(result.conflicts);
					await db.operations.bulkUpdate(result.conflicts.map((conflict) => ({
						key: conflict.operationId,
						changes: { status: "conflict" }
					})));
				}
			});
			await applyCloudChanges(result.changes ?? []);
			if (typeof result.cursor === "number") cursor = result.cursor;
		}
	} catch (error) {
		if (operations.length) await resetOperations(operations);
		uploadError = error instanceof Error ? error.message : "同步上传暂时不可用";
	}
	try {
		let hasMore = true;
		while (hasMore) {
			const previousCursor = cursor;
			const pull = await fetchWithTimeout(`/api/sync/pull?cursor=${cursor}`, { headers: { accept: "application/json" } });
			if (pull.status === 503) return {
				state: "unconfigured",
				cursor
			};
			if (!pull.ok) throw new Error(`同步读取失败（${pull.status}）`);
			const pulled = await pull.json();
			await applyCloudChanges(pulled.changes ?? []);
			cursor = pulled.cursor ?? cursor;
			await db.settings.update("main", { cloudCursor: cursor });
			hasMore = Boolean(pulled.changes?.length) && cursor > previousCursor;
			if (pulled.changes?.length) console.info(`[sync] Applied ${pulled.changes.length} changes; cursor ${cursor}`);
		}
		return uploadError ? {
			state: "error",
			cursor,
			message: `${uploadError}；已下载云端更新，本机改动保留待重试`
		} : {
			state: "synced",
			cursor
		};
	} catch (error) {
		return {
			state: "error",
			cursor,
			message: [uploadError, error instanceof Error ? error.message : "同步暂时不可用"].filter(Boolean).join("；")
		};
	}
}
async function resetOperations(operations) {
	const db = getPlannerDb();
	const current = await db.operations.bulkGet(operations.map((operation) => operation.id));
	await db.operations.bulkUpdate(current.filter((operation) => operation?.status === "syncing").map((operation) => ({
		key: operation.id,
		changes: { status: "pending" }
	})));
}
function normalizeCloudChange(change) {
	const record = change.record;
	if (change.entityType === "thought") {
		const thought = record;
		return {
			storeName: "thoughts",
			record: {
				...thought,
				status: thought.status === "someday" ? "inbox" : thought.status,
				processedAt: thought.status === "someday" ? null : thought.processedAt
			}
		};
	}
	if (change.entityType === "task") {
		const task = record;
		return {
			storeName: "tasks",
			record: {
				...task,
				planningState: task.planningState ?? "planned",
				needsContinuousTime: Boolean(task.needsContinuousTime),
				isFragmentFriendly: Boolean(task.isFragmentFriendly)
			}
		};
	}
	if (change.entityType === "event") {
		const event = record;
		return {
			storeName: "events",
			record: {
				...event,
				location: event.location ?? null,
				excludedOccurrenceKeys: event.excludedOccurrenceKeys ?? []
			}
		};
	}
	if (change.entityType === "goal") return {
		storeName: "goals",
		record
	};
	if (change.entityType === "project") {
		const project = record;
		return {
			storeName: "projects",
			record: {
				...project,
				initializationState: project.initializationState ?? "ready",
				plannedStartDate: project.plannedStartDate ?? null,
				plannedEndDate: project.plannedEndDate ?? null,
				importCheckpoint: null
			}
		};
	}
	if (change.entityType === "projectNode") {
		const node = record;
		return {
			storeName: "projectNodes",
			record: {
				...node,
				needsContinuousTime: Boolean(node.needsContinuousTime),
				isFragmentFriendly: Boolean(node.isFragmentFriendly)
			}
		};
	}
	if (change.entityType === "scheduleBlock") return {
		storeName: "scheduleBlocks",
		record
	};
	if (change.entityType === "fragmentActivity") {
		const activity = record;
		return {
			storeName: "fragmentActivities",
			record: {
				...activity,
				eligibleMinutes: normalizeFragmentMinutes(activity.eligibleMinutes, activity.durationBucket)
			}
		};
	}
	if (change.entityType === "notification") return {
		storeName: "notifications",
		record
	};
	if (change.entityType === "originLink") return {
		storeName: "originLinks",
		record
	};
	if (change.entityType === "aiRun") return {
		storeName: "aiRuns",
		record
	};
	if (change.entityType === "settings") {
		const nextSettings = record;
		return {
			storeName: "settings",
			record: {
				...nextSettings,
				defaultWakeTime: nextSettings.defaultWakeTime ?? "08:00",
				defaultSleepTime: nextSettings.defaultSleepTime ?? "00:30",
				calendarDisplayStart: nextSettings.calendarDisplayStart ?? "08:00",
				calendarDisplayEnd: nextSettings.calendarDisplayEnd ?? "02:00",
				sleepOverrides: nextSettings.sleepOverrides ?? {}
			}
		};
	}
	return null;
}
//#endregion
//#region components/planner-provider/sync-controller.ts
function useSyncController({ ready, cloudEnabled, settingsRef }) {
	const [syncState, setSyncState] = (0, import_react.useState)("starting");
	const [syncMessage, setSyncMessage] = (0, import_react.useState)("");
	const syncStateRef = (0, import_react.useRef)("starting");
	const syncing = (0, import_react.useRef)(false);
	const kickTimer = (0, import_react.useRef)(null);
	const updateSyncStatus = (0, import_react.useCallback)((state, message = "") => {
		syncStateRef.current = state;
		setSyncState((current) => current === state ? current : state);
		setSyncMessage((current) => current === message ? current : message);
	}, []);
	const runSync = (0, import_react.useCallback)(async (showProgress, reportSuccess) => {
		if (syncing.current || !ready) return;
		syncing.current = true;
		if (showProgress) updateSyncStatus(navigator.onLine ? "syncing" : "offline");
		try {
			const result = await synchronize(settingsRef.current);
			if (reportSuccess || result.state !== "synced" || syncStateRef.current !== "synced") updateSyncStatus(result.state, result.state === "unconfigured" ? "云同步尚未连接，内容已安全保存在此设备" : result.message ?? "");
		} catch (error) {
			updateSyncStatus("error", error instanceof Error ? error.message : "同步暂时不可用");
		} finally {
			syncing.current = false;
		}
	}, [
		ready,
		settingsRef,
		updateSyncStatus
	]);
	const syncNow = (0, import_react.useCallback)(() => runSync(true, true), [runSync]);
	(0, import_react.useEffect)(() => {
		if (!ready) return;
		const initialSync = window.setTimeout(() => void runSync(false, true), 0);
		const onOnline = () => void runSync(false, false);
		const onOffline = () => updateSyncStatus("offline");
		const onVisibility = () => {
			if (document.visibilityState === "visible") runSync(false, false);
		};
		window.addEventListener("online", onOnline);
		window.addEventListener("offline", onOffline);
		document.addEventListener("visibilitychange", onVisibility);
		const interval = window.setInterval(() => {
			if (document.visibilityState === "visible") runSync(false, false);
		}, 6e4);
		return () => {
			window.removeEventListener("online", onOnline);
			window.removeEventListener("offline", onOffline);
			document.removeEventListener("visibilitychange", onVisibility);
			window.clearTimeout(initialSync);
			window.clearInterval(interval);
		};
	}, [
		ready,
		runSync,
		updateSyncStatus
	]);
	(0, import_react.useEffect)(() => {
		if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");
	}, []);
	(0, import_react.useEffect)(() => {
		if (!("serviceWorker" in navigator)) return;
		const onWorkerMessage = (event) => {
			if (event.data?.type === "PLANNER_SYNC_REQUESTED") runSync(false, false);
		};
		navigator.serviceWorker.addEventListener("message", onWorkerMessage);
		return () => navigator.serviceWorker.removeEventListener("message", onWorkerMessage);
	}, [runSync]);
	const enqueue = (0, import_react.useCallback)(async (operation) => {
		await getPlannerDb().operations.put(operation);
		if (cloudEnabled && document.visibilityState !== "visible" && "serviceWorker" in navigator && "SyncManager" in window) navigator.serviceWorker.ready.then((registration) => registration.sync.register("planner-sync")).catch(() => {});
	}, [cloudEnabled]);
	const kickSync = (0, import_react.useCallback)(() => {
		if (kickTimer.current != null) window.clearTimeout(kickTimer.current);
		const runWhenIdle = () => {
			if (syncing.current) {
				kickTimer.current = window.setTimeout(runWhenIdle, 250);
				return;
			}
			kickTimer.current = null;
			runSync(false, false);
		};
		kickTimer.current = window.setTimeout(runWhenIdle, 450);
	}, [runSync]);
	(0, import_react.useEffect)(() => () => {
		if (kickTimer.current != null) window.clearTimeout(kickTimer.current);
	}, []);
	return {
		syncState,
		syncMessage,
		syncNow,
		enqueue,
		kickSync
	};
}
//#endregion
//#region components/planner-provider/widget-bridge.ts
var BRIDGE_ENDPOINT = "http://127.0.0.1:23579/api/widget-sync";
function useWidgetBridge({ ready, tasks, events, scheduleBlocks, projectNodes, settings }) {
	const timerRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!ready || typeof window === "undefined") return;
		if (timerRef.current != null) window.clearTimeout(timerRef.current);
		timerRef.current = window.setTimeout(() => {
			timerRef.current = null;
			try {
				const colorMap = new Map(settings.itemTypes.map((type) => [type.id, type.color]));
				const items = [];
				for (const task of tasks) {
					if (task.status === "deleted") continue;
					const start = task.scheduledStartAt ?? null;
					const due = task.dueAt ?? null;
					if (!start && !due) continue;
					items.push({
						id: task.id,
						title: task.title,
						startTime: start,
						dueTime: due,
						status: task.status,
						color: task.colorOverride || colorMap.get(task.itemTypeId) || "#AFC3D4"
					});
				}
				const now = /* @__PURE__ */ new Date();
				const startDay = new Date(now);
				startDay.setDate(startDay.getDate() - 15);
				startDay.setHours(0, 0, 0, 0);
				const endDay = new Date(now);
				endDay.setDate(endDay.getDate() + 45);
				endDay.setHours(23, 59, 59, 999);
				for (const event of events) {
					if (event.status === "completed") {
						const eventStart = new Date(event.startAt);
						if (eventStart >= startDay && eventStart <= endDay) items.push({
							id: event.id,
							title: event.title,
							startTime: event.startAt,
							dueTime: event.endAt,
							status: "completed",
							color: event.colorOverride || colorMap.get(event.itemTypeId) || "#B9B2CC"
						});
						continue;
					}
					const durationMs = new Date(event.endAt).getTime() - new Date(event.startAt).getTime();
					if (event.recurrenceRule) {
						const cursor = new Date(startDay);
						while (cursor <= endDay) {
							const occ = eventOccurrenceOnDay(event, cursor);
							if (occ) {
								const occEnd = new Date(new Date(occ).getTime() + durationMs).toISOString();
								items.push({
									id: `${event.id}_${localDateKey(cursor)}`,
									title: event.title,
									startTime: occ,
									dueTime: occEnd,
									status: "open",
									color: event.colorOverride || colorMap.get(event.itemTypeId) || "#B9B2CC"
								});
							}
							cursor.setDate(cursor.getDate() + 1);
						}
					} else items.push({
						id: event.id,
						title: event.title,
						startTime: event.startAt,
						dueTime: event.endAt,
						status: event.status,
						color: event.colorOverride || colorMap.get(event.itemTypeId) || "#B9B2CC"
					});
				}
				for (const block of scheduleBlocks) {
					if (block.status === "skipped") continue;
					const start = block.startAt ?? `${block.date}T00:00:00.000Z`;
					const end = block.endAt ?? `${block.date}T23:59:59.000Z`;
					items.push({
						id: block.id,
						title: taskTitleForBlock(block, tasks, projectNodes),
						startTime: start,
						dueTime: end,
						status: block.status === "performed" ? "completed" : "open",
						color: "#AFC3D4"
					});
				}
				fetch(BRIDGE_ENDPOINT, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(items)
				}).catch(() => {});
			} catch {}
		}, 400);
		return () => {
			if (timerRef.current != null) window.clearTimeout(timerRef.current);
		};
	}, [
		events,
		projectNodes,
		ready,
		scheduleBlocks,
		settings,
		tasks
	]);
}
//#endregion
//#region components/planner-provider.tsx
var PlannerContext = (0, import_react.createContext)(null);
function retainMatchingRecords(current, next) {
	if (current.length === next.length && current.every((item, index) => item.id === next[index]?.id && item.version === next[index]?.version && item.updatedAt === next[index]?.updatedAt)) return current;
	return next;
}
function PlannerProvider({ children }) {
	const [ready, setReady] = (0, import_react.useState)(false);
	const [thoughts, setThoughts] = (0, import_react.useState)([]);
	const [tasks, setTasks] = (0, import_react.useState)([]);
	const [events, setEvents] = (0, import_react.useState)([]);
	const [goals, setGoals] = (0, import_react.useState)([]);
	const [projects, setProjects] = (0, import_react.useState)([]);
	const [projectNodes, setProjectNodes] = (0, import_react.useState)([]);
	const [scheduleBlocks, setScheduleBlocks] = (0, import_react.useState)([]);
	const [fragmentActivities, setFragmentActivities] = (0, import_react.useState)([]);
	const [notifications, setNotifications] = (0, import_react.useState)([]);
	const [originLinks, setOriginLinks] = (0, import_react.useState)([]);
	const [aiRuns, setAiRuns] = (0, import_react.useState)([]);
	const [settings, setSettings] = (0, import_react.useState)(DEFAULT_SETTINGS);
	const settingsRef = (0, import_react.useRef)(DEFAULT_SETTINGS);
	const [conflicts, setConflicts] = (0, import_react.useState)([]);
	const [cloudEnabled, setCloudEnabled] = (0, import_react.useState)(false);
	const initialLoadComplete = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		settingsRef.current = settings;
	}, [settings]);
	const refresh = (0, import_react.useCallback)(async () => {
		if (initialLoadComplete.current) return;
		const snapshot = await readPlannerSnapshot();
		setThoughts(snapshot.thoughts);
		setTasks(snapshot.tasks);
		setEvents(snapshot.events);
		setGoals(snapshot.goals);
		setProjects(snapshot.projects);
		setProjectNodes(snapshot.projectNodes);
		setScheduleBlocks(snapshot.scheduleBlocks);
		setSettings(snapshot.settings);
		initialLoadComplete.current = true;
	}, []);
	const { syncState, syncMessage, syncNow, enqueue, kickSync } = useSyncController({
		ready,
		cloudEnabled,
		settingsRef
	});
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		async function start() {
			await refresh();
			if (cancelled) return;
			setReady(true);
			preparePlannerStorage().catch(() => void 0);
			fetch("/api/status", { headers: { accept: "application/json" } }).then((response) => response.json()).then((status) => {
				if (!cancelled) setCloudEnabled(status.cloud === "connected");
			}).catch(() => {
				if (!cancelled) setCloudEnabled(false);
			});
		}
		start();
		return () => {
			cancelled = true;
		};
	}, [refresh]);
	(0, import_react.useEffect)(() => {
		if (!ready || !initialLoadComplete.current) return;
		return subscribeToPlannerStorage({
			onThoughts: (records) => setThoughts((current) => retainMatchingRecords(current, records)),
			onTasks: (records) => setTasks((current) => retainMatchingRecords(current, records)),
			onEvents: (records) => setEvents((current) => retainMatchingRecords(current, records)),
			onGoals: (records) => setGoals((current) => retainMatchingRecords(current, records)),
			onProjects: (records) => setProjects((current) => retainMatchingRecords(current, records)),
			onProjectNodes: (records) => setProjectNodes((current) => retainMatchingRecords(current, records)),
			onScheduleBlocks: (records) => setScheduleBlocks((current) => retainMatchingRecords(current, records)),
			onFragmentActivities: (records) => setFragmentActivities((current) => retainMatchingRecords(current, records)),
			onNotifications: (records) => setNotifications((current) => retainMatchingRecords(current, records)),
			onOriginLinks: (records) => setOriginLinks((current) => retainMatchingRecords(current, records)),
			onAiRuns: (records) => setAiRuns((current) => retainMatchingRecords(current, records)),
			onSettings: (record) => setSettings((current) => current.version === record.version && current.cloudCursor === record.cloudCursor ? current : record),
			onConflicts: setConflicts
		});
	}, [ready]);
	useWidgetBridge({
		ready,
		tasks,
		events,
		scheduleBlocks,
		projectNodes,
		settings
	});
	const { addScheduleBlock, updateScheduleBlock, updateScheduleBlocks, deleteScheduleBlock } = useScheduleBlockMutations({
		scheduleBlocks,
		setScheduleBlocks,
		kickSync
	});
	const { addFragmentActivity, updateFragmentActivity, deleteFragmentActivity, markNotificationRead, saveSettings, removeItemType, saveAiRun, resolveConflict, resolveAllConflicts } = useSupportMutations({
		tasks,
		setTasks,
		settingsRef,
		setSettings,
		enqueue,
		kickSync
	});
	const { addOriginLinks, addThought, updateThoughtStatus, restoreThought, addTask, addTasks, updateTask, deleteTask, toggleTask, addEvent, updateEvent, deleteEvent, convertThoughtToDraft, convertThoughtsToTasks, convertThoughtsToEvents } = useItemMutations({
		thoughts,
		tasks,
		events,
		settings,
		setThoughts,
		setTasks,
		setEvents,
		setScheduleBlocks,
		setOriginLinks,
		kickSync
	});
	const { addGoal, updateGoal, deleteGoal, addProject, updateProject, deleteProject, addProjectNode, updateProjectNode, moveProjectNode, deleteProjectNode, toggleProjectNode, setProjectNodeFocus, duplicateProject, resumeProjectImport, importProjectOutline } = useProjectMutations({
		goals,
		projects,
		projectNodes,
		scheduleBlocks,
		originLinks,
		setGoals,
		setProjects,
		setProjectNodes,
		setScheduleBlocks,
		setOriginLinks,
		addOriginLinks,
		kickSync
	});
	const completeScheduleBlock = (0, import_react.useCallback)(async (id, scope) => {
		const block = scheduleBlocks.find((item) => item.id === id);
		if (!block) return;
		const future = scope === "item" ? scheduleBlocks.filter((candidate) => candidate.sourceId === block.sourceId && candidate.id !== id && candidate.status === "planned") : [];
		await updateScheduleBlocks([{
			id,
			patch: { status: "performed" }
		}, ...future.map((candidate) => ({
			id: candidate.id,
			patch: {
				status: "skipped",
				reminderRules: []
			}
		}))]);
		if (scope === "block") return;
		if (block.sourceType === "task") {
			if (tasks.find((item) => item.id === block.sourceId)?.status !== "completed") await toggleTask(block.sourceId);
		} else if (projectNodes.find((item) => item.id === block.sourceId)?.status !== "completed") await toggleProjectNode(block.sourceId);
	}, [
		projectNodes,
		scheduleBlocks,
		tasks,
		toggleProjectNode,
		toggleTask,
		updateScheduleBlocks
	]);
	const value = (0, import_react.useMemo)(() => ({
		ready,
		thoughts,
		tasks,
		events,
		goals,
		projects,
		projectNodes,
		scheduleBlocks,
		fragmentActivities,
		notifications,
		originLinks,
		aiRuns,
		settings,
		conflicts,
		syncState,
		syncMessage,
		refresh,
		syncNow,
		addThought,
		updateThoughtStatus,
		restoreThought,
		addTask,
		addTasks,
		updateTask,
		deleteTask,
		toggleTask,
		addEvent,
		updateEvent,
		deleteEvent,
		convertThoughtToDraft,
		convertThoughtsToTasks,
		convertThoughtsToEvents,
		addGoal,
		updateGoal,
		deleteGoal,
		addProject,
		updateProject,
		deleteProject,
		duplicateProject,
		importProjectOutline,
		resumeProjectImport,
		addProjectNode,
		updateProjectNode,
		moveProjectNode,
		deleteProjectNode,
		toggleProjectNode,
		setProjectNodeFocus,
		addScheduleBlock,
		updateScheduleBlock,
		deleteScheduleBlock,
		completeScheduleBlock,
		addFragmentActivity,
		updateFragmentActivity,
		deleteFragmentActivity,
		markNotificationRead,
		saveSettings,
		removeItemType,
		saveAiRun,
		resolveConflict,
		resolveAllConflicts
	}), [
		ready,
		thoughts,
		tasks,
		events,
		goals,
		projects,
		projectNodes,
		scheduleBlocks,
		fragmentActivities,
		notifications,
		originLinks,
		aiRuns,
		settings,
		conflicts,
		syncState,
		syncMessage,
		refresh,
		syncNow,
		addThought,
		updateThoughtStatus,
		restoreThought,
		addTask,
		addTasks,
		updateTask,
		deleteTask,
		toggleTask,
		addEvent,
		updateEvent,
		deleteEvent,
		convertThoughtToDraft,
		convertThoughtsToTasks,
		convertThoughtsToEvents,
		addGoal,
		updateGoal,
		deleteGoal,
		addProject,
		updateProject,
		deleteProject,
		duplicateProject,
		importProjectOutline,
		resumeProjectImport,
		addProjectNode,
		updateProjectNode,
		moveProjectNode,
		deleteProjectNode,
		toggleProjectNode,
		setProjectNodeFocus,
		addScheduleBlock,
		updateScheduleBlock,
		deleteScheduleBlock,
		completeScheduleBlock,
		addFragmentActivity,
		updateFragmentActivity,
		deleteFragmentActivity,
		markNotificationRead,
		saveSettings,
		removeItemType,
		saveAiRun,
		resolveConflict,
		resolveAllConflicts
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlannerContext.Provider, {
		value,
		children
	});
}
function usePlanner() {
	const value = (0, import_react.useContext)(PlannerContext);
	if (!value) throw new Error("usePlanner must be used inside PlannerProvider");
	return value;
}
//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/utils.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
var mergeClasses = (...classes) => classes.filter((className, index, array) => {
	return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();
//#endregion
//#region node_modules/lucide-react/dist/esm/defaultAttributes.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var defaultAttributes = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round",
	strokeLinejoin: "round"
};
//#endregion
//#region node_modules/lucide-react/dist/esm/Icon.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Icon = (0, import_react.forwardRef)(({ color = "currentColor", size = 24, strokeWidth = 2, absoluteStrokeWidth, className = "", children, iconNode, ...rest }, ref) => {
	return (0, import_react.createElement)("svg", {
		ref,
		...defaultAttributes,
		width: size,
		height: size,
		stroke: color,
		strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
		className: mergeClasses("lucide", className),
		...rest
	}, [...iconNode.map(([tag, attrs]) => (0, import_react.createElement)(tag, attrs)), ...Array.isArray(children) ? children : [children]]);
});
//#endregion
//#region node_modules/lucide-react/dist/esm/createLucideIcon.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var createLucideIcon = (iconName, iconNode) => {
	const Component = (0, import_react.forwardRef)(({ className, ...props }, ref) => (0, import_react.createElement)(Icon, {
		ref,
		iconNode,
		className: mergeClasses(`lucide-${toKebabCase(iconName)}`, className),
		...props
	}));
	Component.displayName = `${iconName}`;
	return Component;
};
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/plus.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Plus = createLucideIcon("Plus", [["path", {
	d: "M5 12h14",
	key: "1ays0h"
}], ["path", {
	d: "M12 5v14",
	key: "s699le"
}]]);
//#endregion
//#region components/ui/empty-state.tsx
function EmptyState({ icon, title, description, action }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "empty-state",
		children: [
			icon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "empty-icon",
				children: icon
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: title }),
			description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: description }) : null,
			action
		]
	});
}
//#endregion
//#region components/ui/page-header.tsx
function PageHeader({ eyebrow, title, description, action }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "page-header",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			eyebrow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "eyebrow",
				children: eyebrow
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: title }),
			description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "page-description",
				children: description
			}) : null
		] }), action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "page-header-action",
			children: action
		}) : null]
	});
}
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/lightbulb.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Lightbulb = createLucideIcon("Lightbulb", [
	["path", {
		d: "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",
		key: "1gvzjb"
	}],
	["path", {
		d: "M9 18h6",
		key: "x1upvd"
	}],
	["path", {
		d: "M10 22h4",
		key: "ceow96"
	}]
]);
//#endregion
//#region components/ui/quick-capture.tsx
function QuickCapture({ compact = false, autoFocus = false, onSaved }) {
	const { addThought, syncState } = usePlanner();
	const [value, setValue] = (0, import_react.useState)("");
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [saved, setSaved] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	async function submit(event) {
		event.preventDefault();
		const content = value.trim();
		if (!content || saving) return;
		setSaving(true);
		setError("");
		try {
			await addThought(content);
			setValue("");
			setSaved(true);
			window.setTimeout(() => setSaved(false), 1600);
			onSaved?.();
		} catch {
			setError("没有保存成功，请再试一次。");
		} finally {
			setSaving(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: `quick-capture ${compact ? "is-compact" : ""}`,
		onSubmit: submit,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "quick-capture-icon",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, {
					size: 18,
					strokeWidth: 1.8
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "sr-only",
				htmlFor: compact ? "quick-thought-compact" : "quick-thought",
				children: "记录一个想法"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				id: compact ? "quick-thought-compact" : "quick-thought",
				autoFocus,
				value,
				onChange: (event) => setValue(event.target.value),
				placeholder: "刚刚想到什么？",
				autoComplete: "off"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "quiet-button primary-quiet",
				disabled: !value.trim() || saving,
				type: "submit",
				children: saving ? "保存中" : saved ? "已保存" : "保存"
			}),
			!compact && (syncState === "offline" || syncState === "unconfigured") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "capture-hint",
				children: "会先保存在此设备"
			}) : null,
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "capture-error",
				role: "alert",
				children: error
			}) : null
		]
	});
}
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/cloud.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Cloud = createLucideIcon("Cloud", [["path", {
	d: "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z",
	key: "p7xjir"
}]]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/cloud-off.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var CloudOff = createLucideIcon("CloudOff", [
	["path", {
		d: "m2 2 20 20",
		key: "1ooewy"
	}],
	["path", {
		d: "M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193",
		key: "yfwify"
	}],
	["path", {
		d: "M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07",
		key: "jlfiyv"
	}]
]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/loader-circle.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var LoaderCircle = createLucideIcon("LoaderCircle", [["path", {
	d: "M21 12a9 9 0 1 1-6.219-8.56",
	key: "13zald"
}]]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/refresh-cw.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var RefreshCw = createLucideIcon("RefreshCw", [
	["path", {
		d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",
		key: "v9h5vc"
	}],
	["path", {
		d: "M21 3v5h-5",
		key: "1q7to0"
	}],
	["path", {
		d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",
		key: "3uifl3"
	}],
	["path", {
		d: "M8 16H3v5",
		key: "1cv678"
	}]
]);
//#endregion
//#region components/ui/sync-pill.tsx
function SyncPill() {
	const { syncState, syncMessage, syncNow, conflicts } = usePlanner();
	const config = {
		starting: {
			icon: LoaderCircle,
			label: "正在准备",
			className: "is-working"
		},
		syncing: {
			icon: RefreshCw,
			label: "同步中",
			className: "is-working"
		},
		synced: {
			icon: Cloud,
			label: "已同步",
			className: "is-synced"
		},
		offline: {
			icon: CloudOff,
			label: "离线保存",
			className: "is-offline"
		},
		unconfigured: {
			icon: CloudOff,
			label: "仅此设备",
			className: "is-offline"
		},
		error: {
			icon: CloudOff,
			label: "同步受阻",
			className: "is-error"
		}
	}[syncState];
	const Icon = config.icon;
	const title = conflicts.length ? `${conflicts.length} 项修改需要处理` : syncMessage || config.label;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		className: `sync-pill ${config.className}`,
		onClick: () => void syncNow(),
		type: "button",
		title,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			size: 14,
			className: syncState === "syncing" ? "spin" : ""
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: conflicts.length ? `${conflicts.length} 个冲突` : config.label })]
	});
}
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/arrow-up-right.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ArrowUpRight = createLucideIcon("ArrowUpRight", [["path", {
	d: "M7 7h10v10",
	key: "1tivn9"
}], ["path", {
	d: "M7 17 17 7",
	key: "1vkiza"
}]]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/check.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Check = createLucideIcon("Check", [["path", {
	d: "M20 6 9 17l-5-5",
	key: "1gmf2c"
}]]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/circle.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Circle = createLucideIcon("Circle", [["circle", {
	cx: "12",
	cy: "12",
	r: "10",
	key: "1mglay"
}]]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/x.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var X = createLucideIcon("X", [["path", {
	d: "M18 6 6 18",
	key: "1bl5f8"
}], ["path", {
	d: "m6 6 12 12",
	key: "d8bk6v"
}]]);
//#endregion
//#region components/ui/task-row.tsx
function TaskRow({ task, onOpen, occurrenceAt }) {
	const { toggleTask } = usePlanner();
	const failed = task.status === "failed";
	const completed = task.status === "completed" || Boolean(task.recurrenceRule && occurrenceAt && isTaskOccurrenceCompleted(task, occurrenceAt));
	const assignmentLabel = task.taskKind === "assignment" ? {
		todo: "待完成",
		content_done: "待提交",
		submitted: "已提交"
	}[task.assignmentStatus ?? "todo"] : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `task-row ${completed ? "is-completed" : ""} ${failed ? "is-failed" : ""}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "task-check",
				type: "button",
				"aria-label": failed ? `恢复任务：${task.title}` : completed ? `恢复任务：${task.title}` : `完成任务：${task.title}`,
				onClick: () => void toggleTask(task.id, occurrenceAt),
				children: failed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 15 }) : completed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 14 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { size: 16 })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "task-main",
				type: "button",
				onClick: () => onOpen?.(task),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "task-title",
					children: task.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "task-meta",
					children: [
						failed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "task-failed-badge",
							children: "已失败"
						}) : null,
						task.scheduledStartAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatTime(task.scheduledStartAt) }) : task.actualDeadlineAt || task.dueAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatShortDate(task.actualDeadlineAt ?? task.dueAt) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "未安排" }),
						task.durationMinutes ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							" · ",
							task.durationMinutes,
							" 分钟"
						] }) : null,
						task.recurrenceRule ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: " · 重复" }) : null,
						assignmentLabel ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [" · ", assignmentLabel] }) : null
					]
				})]
			}),
			task.originThoughtIds.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "origin-chip",
				title: "由 Quick Thought 转化",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, { size: 12 }), "来源"]
			}) : null,
			onOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, {
				size: 14,
				className: "row-arrow"
			}) : null
		]
	});
}
//#endregion
export { taskDateAnchors as $, buildProjectTreeIndex as A, firstCourseDateOnOrAfter as B, buildCalendarTimelineScale as C, formatGapDuration as D, compactTimelineY as E, MORANDI_COLORS as F, localDateKey as G, formatTime as H, courseWeekdayForDate as I, parseRepeatPreset as J, makeCourseRecurrenceRule as K, daysFrom as L, taskTitleForBlock as M, parseProjectMarkdown as N, resolveTimelineWindow as O, DEFAULT_ITEM_TYPES as P, startOfWeek as Q, eventOccurrenceOnDay as R, recommendationTargetDate as S, compactTimelineMinuteAtY as T, fromDateTimeLocal as U, formatFullDate as V, isTaskOccurrenceCompleted as W, sameLocalDay as X, recurrenceWeekdays as Y, startOfLocalDay as Z, buildChatGptContext as _, SyncPill as a, freeTimeRanges as b, QuickCapture as c, EmptyState as d, taskOccurrencesOnDay as et, Plus as f, nextCourseTaskSlot as g, usePlanner as h, Check as i, projectPath as j, timelineOffsetMinutes as k, Lightbulb as l, PlannerProvider as m, X as n, rrulestr$1 as nt, LoaderCircle as o, createLucideIcon as p, newId as q, Circle as r, RRule$1 as rt, Cloud as s, TaskRow as t, toDateTimeLocal as tt, PageHeader as u, buildProjectMarkdown as v, buildCompactTimelineScale as w, recommendCandidatesForGaps as x, buildAdvanceCandidates as y, expandRecurrence as z };
