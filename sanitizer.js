/**
 * Copyright 2015 Nikhil Mahendra.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

/*** Code template referenced from Node-RED's default 'switch' module as mentioned in Sanitizer Node's Specifications. ***/

module.exports = function(RED) {
	"use strict";

	// Operator functions to check the payload data as per user-configuration
	var operators = {
		'eq': function(a, b) { return a == b; },
		'neq': function(a, b) { return a != b; },
		'lt': function(a, b) { return a < b; },
		'lte': function(a, b) { return a <= b; },
		'gt': function(a, b) { return a > b; },
		'gte': function(a, b) { return a >= b; },
		'btwn': function(a, b, c) { return a >= b && a <= c; },
		'cont': function(a, b) { return (a + "").indexOf(b) != -1; },
		'regex': function(a, b) { return (a + "").match(new RegExp(b)); },
		'true': function(a) { return a === true; },
		'false': function(a) { return a === false; },
		'null': function(a) { return (typeof a == "undefined" || a === null); },
		'nnull': function(a) { return (typeof a != "undefined" && a !== null); },
		'else': function(a) { return a === true; }
	};

	function SanitizerNode(n) {
		//Creating Sanitizer Node
		RED.nodes.createNode(this,n);

		// Obtain node's configuration values
		this.rules = n.rules || [];
		this.property = n.property;
		this.checkall = n.checkall || "true";
		var propertyParts = (n.property || "payload").split(".");
		var node = this;

		for (var i=0; i<this.rules.length; i+=1) {
			var rule = this.rules[i];
			if (!isNaN(Number(rule.v))) {
				rule.v = Number(rule.v);
				rule.v2 = Number(rule.v2);
			}
		}

			// Verify JSON input payload
			this.on('input', function (msg) {
			if (msg.hasOwnProperty("payload")) 
			{
				if(typeof msg.payload === "string") {
					var len = msg.payload.length;
					try {
						msg.payload = JSON.parse(msg.payload);
					} catch(e) {
						node.error("Payload JSON parse failed");
						msg.payload = JSON.stringify(msg.payload);
						msg.payload = JSON.parse(msg.payload);
					}
				}
			}

			var onward = [];
			try {
				var elseflag = true;
				for (var i=0; i<node.rules.length; i+=1) {
					var rule = node.rules[i];

					// If 'length' or 'key/value' of the object is to be checked
					if (propertyParts == "length") {
						var test = len;
					}
					else
						var test = msg.payload[propertyParts];

					if (rule.t == "else") { 
						test = elseflag; 
						elseflag = true; 
					}

					if (operators[rule.t](test, rule.v, rule.v2)) {
						node.warn("Success");
						onward.push(msg);
						elseflag = false;
						if (node.checkall == "false") { break; }
					} else {
						node.error("No match");
						onward.push(null);
					}
				}
				this.send(onward);
			} catch(err) {
				node.warn(err);
			}
		});
	}
	RED.nodes.registerType("sanitizer",SanitizerNode);
}

