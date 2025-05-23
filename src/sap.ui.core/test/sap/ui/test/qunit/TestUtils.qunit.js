/*!
 * ${copyright}
 */
sap.ui.define([
	"sap/base/Log",
	"sap/ui/test/TestUtils",
	"sap/ui/thirdparty/jquery"
], function (Log, TestUtils, jQuery) {
	/*global QUnit, sinon */
	/*eslint max-nested-callbacks: 0, no-warning-comments: 0 */
	"use strict";

	var aRegExpFixture = [{
			regExp : /GET \/Foo\/regexp\/b[a]r/,
			response : {
				message : "RegExp1"
			}
		}, {
			regExp : /GET \/Foo\/regexp\/ba[z]/,
			response : [{
				ifMatch : function (_oRequest) {
					return true;
				},
				message : "RegExp2"
			}, {
				code : 404,
				message : "nope"
			}]
		}, {
			regExp : /GET \/Foo\/regexp\/(ba[s])/,
			response : {
				source : "bar.json",
				buildResponse : function (oMatch, oResponse) {
					var oMessage = JSON.parse(oResponse.message);

					oMessage.foo = oMatch[1];
					oResponse.message = JSON.stringify(oMessage);
				}
			}
		}, {
			regExp : /GET .*regexp\/bor/,
			response : {
				message : "RegExp4"
			}
		}, {
			regExp : /GET \/Foo\/fail/,
			response : {
				buildResponse : function () {
					throw new Error("failed intentionally");
				}
			}
		}, {
			regExp : /POST .*\$batch/,
			response : [{
				ifMatch : /DoNotMatch/
			}, {
				code : 503,
				headers : {"Retry-After" : 5},
				ifMatch : /RetryAfter/,
				message : {error : {code : "DB_MIGRATION", message : "Service Unavailable"}}
			}]
		}],
		mServerFixture = {
			"/Foo/bar" : {source : "bar.json"},
			"/Foo/bar?$filter=baz eq 42" : {source : "bar.json"},
			"GET /Foo/bar?$filter=baz eq 23" : {source : "bar.json"},
			'/Foo/bar?ExpandLevels=[{NodeId:"1",Level:0}]' : {source : "bar.json"},
			"/Foo/baz" : [{
				ifMatch : function (oRequest) {
					return oRequest.requestHeaders["SAP-ContextId"] === "session";
				},
				headers : {"Content-Type" : "application/json;charset=utf-8"},
				message : '{"@odata.etag":"abc123"}'
			}, {
				code : 404,
				headers : {"Content-Type" : "text/plain"},
				message : "Missing SAP-ContextId"
			}],
			"DELETE /Foo/bar" : {
				code : 500,
				message : "Guru meditation"
			},
			"MERGE /Foo/bar" : {
				code : 204
			},
			"PATCH /Foo/bar" : {
				code : 200,
				message : '{"@odata.etag":"abc123"}'
			},
			"POST /Foo/bar" : {code : 200, source : "bar.json"},
			"POST /Foo/baz" : [{
				code : 400,
				headers : {"Content-Type" : "application/json;charset=utf-8"},
				ifMatch : /{"foo":0}/,
				message : '{"message":"Failure"}'
			}, {
				code : 200,
				source : "bar.json"
			}],
			"POST /Foo/$batch" : [{
				ifMatch : /DoNotMatch/
			}, {
				code : 503,
				headers : {"Retry-After" : 5},
				ifMatch : /RetryAfter/,
				message : {error : {code : "DB_MIGRATION", message : "Service Unavailable"}}
			}]
		};

	/**
	 * Checks that the header is as expected.
	 *
	 * @param {object} assert The QUnit assert object
	 * @param {string} sHeaderString The headers as in XMLHttpRequest#getAllResponseHeaders
	 * @param {string} sName The header name
	 * @param {string} [sValue] The expected header value
	 */
	function checkHeader(assert, sHeaderString, sName, sValue) {
		sHeaderString += "\r\n";

		if (sValue) {
			assert.ok(sHeaderString.includes("\r\n" + sName + ": " + sValue + "\r\n"), sName);
		} else {
			assert.notOk(sHeaderString.includes("\r\n" + sName + ": ", sName));
		}
	}

	/**
	 * Formats the headers to a string similar to XMLHttpRequest#getAllResponseHeaders
	 *
	 * @param {map} mHeaders The headers
	 * @returns {string} The resulting string
	 */
	function headerString(mHeaders) {
		return Object.keys(mHeaders || {}).map(function (sKey) {
			return sKey + ": " + mHeaders[sKey];
		}).join("\r\n") + "\r\n";
	}

	/**
	 * Runs a request and returns a promise on the finished XMLHttpRequest object.
	 *
	 * @param {string} sMethod The request method
	 * @param {string} sUrl The request URL
	 * @param {map} [mRequestHeaders] The request headers
	 * @param {string} [sRequestBody=""] The request body
	 * @returns {Promise} A promise that is resolved with the XMLHttpRequest object when the
	 *   response has arrived
	 */
	function request(sMethod, sUrl, mRequestHeaders, sRequestBody) {
		return new Promise(function (resolve) {
			var oXHR = new XMLHttpRequest();

			oXHR.open(sMethod, sUrl);
			oXHR.setRequestHeader("Accept-Foo", "bar");
			oXHR.setRequestHeader("X-CSRF-Token", "Refresh");
			Object.keys(mRequestHeaders || {}).forEach(function (sHeader) {
				oXHR.setRequestHeader(sHeader, mRequestHeaders[sHeader]);
			});
			oXHR.addEventListener("load", function () {
				resolve(oXHR);
			});
			oXHR.send(sRequestBody);
		});
	}

	//*********************************************************************************************
	QUnit.module("sap.ui.test.TestUtils", {
		beforeEach : function () {
			this.oLogMock = this.mock(Log);
			this.oLogMock.expects("info").never();
			this.oLogMock.expects("warning").never();
			this.oLogMock.expects("error").never();

			/**
			 * workaround: Chrome extension "UI5 Inspector" calls this method which loads the
			 * resource "sap-ui-version.json" and thus interferes with mocks for jQuery.ajax
			 * @deprecated As of version 1.56
			 */
			this.mock(sap.ui).expects("getVersionInfo").atLeast(0);
		},
		afterEach : function () {
			TestUtils.onRequest(null);
		}
	});

	//*********************************************************************************************
	[{
		method : "GET",
		url : "/Foo/regexp/bor",
		status : 200,
		responseBody : "RegExp4",
		responseHeaders : {
			"OData-Version" : "4.0"
		}
	}, {
		method : "GET",
		url : "/Foo/regexp/bar",
		status : 200,
		responseBody : "RegExp1",
		responseHeaders : {
			"OData-Version" : "4.0"
		}
	}, {
		expectedLogMessage : "GET /Foo/regexp/baz, alternative (ifMatch) #0",
		method : "GET",
		url : "/Foo/regexp/baz",
		status : 200,
		responseBody : "RegExp2",
		responseHeaders : {
			"OData-Version" : "4.0"
		}
	}, {
		method : "GET",
		url : "/Foo/regexp/bas",
		status : 200,
		responseBody : "{\"foo\":\"bas\",\"@odata.etag\":\"abc123\"}",
		responseHeaders : {
			"OData-Version" : "4.0",
			"Content-Type" : "application/json;charset=UTF-8;IEEE754Compatible=true"
		}
	}, {
		method : "GET",
		url : "/Foo/bar",
		status : 200,
		responseBody : '{"foo":"bar","@odata.etag":"abc123"}',
		responseHeaders : {
			"OData-Version" : "4.0",
			"Content-Type" : "application/json;charset=UTF-8;IEEE754Compatible=true"
		}
	}, {
		expectedLogMessage : "GET /Foo/bar?$filter=baz eq 42",
		method : "GET",
		url : "/Foo/bar?$filter=baz%20eq%2042",
		status : 200,
		responseBody : '{"foo":"bar","@odata.etag":"abc123"}',
		responseHeaders : {
			"OData-Version" : "4.0",
			"Content-Type" : "application/json;charset=UTF-8;IEEE754Compatible=true"
		}
	}, {
		expectedLogMessage : "GET /Foo/bar?$filter=baz eq 23",
		method : "GET",
		url : "/Foo/bar?$filter=baz%20eq%2023",
		status : 200,
		responseBody : '{"foo":"bar","@odata.etag":"abc123"}',
		responseHeaders : {
			"OData-Version" : "4.0",
			"Content-Type" : "application/json;charset=UTF-8;IEEE754Compatible=true"
		}
	}, {
		expectedLogMessage : 'GET /Foo/bar?ExpandLevels=[{NodeId:"1",Level:0}]',
		method : "GET",
		url : "/Foo/bar?ExpandLevels=%5B%7BNodeId:%221%22,Level:0%7D%5D",
		status : 200,
		responseBody : '{"foo":"bar","@odata.etag":"abc123"}',
		responseHeaders : {
			"OData-Version" : "4.0",
			"Content-Type" : "application/json;charset=UTF-8;IEEE754Compatible=true"
		}
	}, {
		expectedLogMessage : "GET /Foo/baz, alternative (ifMatch) #1",
		method : "GET",
		url : "/Foo/baz",
		status : 404,
		responseHeaders : {
			"OData-Version" : "4.0",
			"Content-Type" : "text/plain"
		},
		responseBody : "Missing SAP-ContextId"
	}, {
		expectedLogMessage : "GET /Foo/baz, alternative (ifMatch) #0",
		method : "GET",
		url : "/Foo/baz",
		status : 200,
		requestHeaders : {
			"SAP-ContextId" : "session"
		},
		responseHeaders : {
			"OData-Version" : "4.0",
			"Content-Type" : "application/json;charset=utf-8"
		},
		responseBody : '{"@odata.etag":"abc123"}'
	}, {
		method : "DELETE",
		url : "/Foo/any",
		status : 204,
		responseHeaders : {
			"OData-Version" : "4.0"
		}
	}, {
		method : "DELETE",
		url : "/Foo/bar",
		status : 500,
		responseHeaders : {
			"OData-Version" : "4.0"
		},
		responseBody : "Guru meditation"
	}, {
		method : "MERGE",
		url : "/Foo/any",
		requestHeaders : {
			"Content-Type" : "application/json"
		},
		requestBody : '{"foo":"bar"}',
		status : 204,
		responseHeaders : {
			DataServiceVersion : "2.0"
		},
		responseBody : ""
	}, {
		method : "MERGE",
		url : "/Foo/bar",
		requestHeaders : {
			"Content-Type" : "application/json"
		},
		requestBody : '{"foo":"bar"}',
		status : 204,
		responseHeaders : {
			DataServiceVersion : "2.0"
		},
		responseBody : ""
	}, { // "auto responder"
		method : "PATCH",
		url : "/Foo/any",
		requestHeaders : {
			"Content-Type" : "application/json;charset=UTF-8;IEEE754Compatible=true"
		},
		requestBody : '{"foo":"bar"}',
		status : 204,
		responseHeaders : {
			"OData-Version" : "4.0"
		},
		responseBody : ""
	}, { // "server fixture"
		method : "PATCH",
		url : "/Foo/bar",
		requestHeaders : {
			"Content-Type" : "application/json;charset=utf-8"
		},
		requestBody : '{"@odata.etag":"abc123"}',
		status : 200,
		responseHeaders : {
			"OData-Version" : "4.0"
		},
		responseBody : '{"@odata.etag":"abc123"}'
	}, {
		method : "POST",
		url : "/Foo/any",
		requestHeaders : {
			"OData-Version" : "4.01",
			"Content-Type" : "application/json;charset=UTF-8;IEEE754Compatible=true"
		},
		requestBody : '{"foo":"bar"}',
		status : 200,
		responseHeaders : {
			"OData-Version" : "4.01",
			"Content-Type" : "application/json;charset=UTF-8;IEEE754Compatible=true"
		},
		responseBody : '{"foo":"bar"}'
	}, {
		method : "POST",
		url : "/Foo/bar",
		requestHeaders : {
			"OData-Version" : "4.01",
			"Content-Type" : "application/json;charset=utf-8"
		},
		requestBody : '{"foo":"bar"}',
		status : 200,
		responseHeaders : {
			"OData-Version" : "4.01",
			"Content-Type" : "application/json;charset=UTF-8;IEEE754Compatible=true"
		},
		responseBody : '{"foo":"bar","@odata.etag":"abc123"}'
	}, {
		expectedLogMessage : "POST /Foo/baz, alternative (ifMatch) #0",
		method : "POST",
		url : "/Foo/baz",
		requestHeaders : {
			"Content-Type" : "application/json;charset=utf-8"
		},
		requestBody : '{"foo":0}',
		status : 400,
		responseHeaders : {
			"OData-Version" : "4.0",
			"Content-Type" : "application/json;charset=utf-8"
		},
		responseBody : '{"message":"Failure"}'
	}, {
		expectedLogMessage : "POST /Foo/baz, alternative (ifMatch) #1",
		method : "POST",
		url : "/Foo/baz",
		requestHeaders : {
			"Content-Type" : "application/json;charset=utf-8"
		},
		requestBody : '{"foo":1}',
		status : 200,
		responseHeaders : {
			"OData-Version" : "4.0",
			"Content-Type" : "application/json;charset=UTF-8;IEEE754Compatible=true"
		},
		responseBody : '{"foo":"bar","@odata.etag":"abc123"}'
	}, {
		expectedError : ["GET /Foo/missing?$filter=a eq 1", "No mock data found",
			"sap.ui.test.TestUtils"],
		expectNoInfo : true,
		method : "GET",
		url : "/Foo/missing?$filter=a%20eq%201",
		status : 404,
		responseHeaders : {
			"OData-Version" : "4.0",
			"Content-Type" : "application/json;charset=UTF-8;IEEE754Compatible=true"
		},
		responseBody : '{"error":{"code":"TestUtils","message":"No mock data found"}}'
	}, {
		expectedError : [
			"GET /Foo/fail",
			sinon.match((p) => p instanceof Error && p.message === "failed intentionally"),
			"sap.ui.test.TestUtils"
		],
		method : "GET",
		url : "/Foo/fail",
		status : 500,
		responseHeaders : {
			"OData-Version" : "4.0",
			"Content-Type" : "application/json;charset=UTF-8;IEEE754Compatible=true"
		},
		responseBody : '{"error":{"code":"TestUtils","message":"failed intentionally"}}'
	}].forEach(function (oFixture) {
		var sTitle = oFixture.method + " " + oFixture.url + ", status : " + oFixture.status;

		QUnit.test("useFakeServer: " + sTitle + " (direct)", function (assert) {
			var mHeaders = oFixture.method === "MERGE" ? {DataServiceVersion : "2.0"}
				: {"OData-Version" : "4.0"};

			Object.keys(oFixture.requestHeaders || {}).forEach(function (sKey) {
				mHeaders[sKey] = oFixture.requestHeaders[sKey];
			});
			TestUtils.useFakeServer(this._oSandbox, "sap/ui/test/qunit/data", mServerFixture,
				aRegExpFixture, "/Foo");
			this.oLogMock.expects("info").exactly(oFixture.expectNoInfo ? 0 : 1)
				.withExactArgs(oFixture.expectedLogMessage || oFixture.method + " " + oFixture.url,
					'{"If-Match":undefined}', "sap.ui.test.TestUtils");
			if (oFixture.expectedError) {
				this.oLogMock.expects("error").withArgs(...oFixture.expectedError);
			}

			TestUtils.onRequest(function (sMessage, sRequestLine) {
				assert.strictEqual(sMessage, oFixture.requestBody);
				assert.strictEqual(sRequestLine, oFixture.method + " " + oFixture.url);
			});
			return request(oFixture.method, oFixture.url, mHeaders, oFixture.requestBody
			).then(function (oXHR) {
				assert.strictEqual(oXHR.status, oFixture.status, "status");
				assert.strictEqual(oXHR.responseText, oFixture.responseBody || "", "body");
				assert.strictEqual(oXHR.getAllResponseHeaders(),
					headerString(oFixture.responseHeaders), "headers");
			});
		});

		QUnit.test("useFakeServer: " + sTitle + " (batch)", function (assert) {
			var mBatchHeaders = {},
				mInitialHeaders = {},
				sUrl = oFixture.url.replace("/Foo/", "");

			if (oFixture.method === "MERGE") {
				mInitialHeaders["DataServiceVersion"] = "2.0";
				mBatchHeaders["DataServiceVersion"] = "2.0";
			} else {
				mInitialHeaders["OData-Version"] = "4.0";
				mBatchHeaders["OData-Version"] = "4.0";
			}

			mBatchHeaders["Content-Type"] = "multipart/mixed;boundary=batch_id-0123456789012-345";

			TestUtils.useFakeServer(this._oSandbox, "sap/ui/test/qunit/data", mServerFixture,
				aRegExpFixture);
			this.oLogMock.expects("info").exactly(oFixture.expectNoInfo ? 0 : 1)
				.withExactArgs(oFixture.expectedLogMessage || oFixture.method + " " + oFixture.url,
					'{"If-Match":undefined}', "sap.ui.test.TestUtils");
			if (oFixture.expectedError) {
				this.oLogMock.expects("error").withExactArgs(...oFixture.expectedError);
			}

			TestUtils.onRequest(function (sMessage, sRequestLine) {
				assert.ok(sMessage.includes(oFixture.method + " " + sUrl));
				if (oFixture.requestBody) {
					assert.ok(sMessage.includes(oFixture.requestBody));
				}
				assert.strictEqual(sRequestLine, "POST /Foo/$batch");
			});
			return request("POST", "/Foo/$batch", mInitialHeaders,
				"--batch_id-0123456789012-345\r\n"
				+ "Content-Type: application/http\r\n"
				+ "Content-Transfer-Encoding: binary\r\n"
				+ "\r\n"
				+ oFixture.method + " " + sUrl + " HTTP/1.1\r\n"
				+ headerString(oFixture.requestHeaders)
				+ "\r\n"
				+ (oFixture.requestBody || "")
				+ "\r\n"
				+ "--batch_id-0123456789012-345--\r\n"
				+ "epilogue"
			).then(function (oXHR) {
				assert.strictEqual(oXHR.status, 200, "status");
				assert.strictEqual(oXHR.responseText,
					"--batch_id-0123456789012-345\r\n"
					+ "Content-Type: application/http\r\n"
					+ "Content-Transfer-Encoding: binary\r\n"
					+ "\r\n"
					+ "HTTP/1.1 " + oFixture.status + " \r\n"
					+ headerString(oFixture.responseHeaders)
					+ "\r\n"
					+ (oFixture.responseBody || "")
					+ "\r\n"
					+ "--batch_id-0123456789012-345--\r\n",
					"body"
				);
				assert.strictEqual(oXHR.getAllResponseHeaders(), headerString(mBatchHeaders),
					"batch headers");
			});
		});
	});

	//*********************************************************************************************
[false, true].forEach(function (bRegExp) {
	QUnit.test(`useFakeServer: fixture for $batch, regExp=${bRegExp}`, function (assert) {
		TestUtils.useFakeServer(this._oSandbox, "sap/ui/test/qunit/data",
			bRegExp ? {} : mServerFixture, bRegExp ? aRegExpFixture : undefined);
		this.oLogMock.expects("info").withExactArgs("POST /Foo/$batch, alternative (ifMatch) #1",
			'{"If-Match":undefined}', "sap.ui.test.TestUtils");

		let bOnRequestCalled = false;
		TestUtils.onRequest(function (sRequestBody) {
			assert.ok(sRequestBody.includes("GET RetryAfter HTTP/1.1"));
			bOnRequestCalled = true;
		});
		return request("POST", "/Foo/$batch", {"OData-Version" : "4.0"},
			"GET RetryAfter HTTP/1.1"
		).then(function (oXHR) {
			assert.strictEqual(oXHR.status, 503, "status");
			assert.strictEqual(oXHR.responseText,
				'{"error":{"code":"DB_MIGRATION","message":"Service Unavailable"}}');
			assert.strictEqual(oXHR.getResponseHeader("Retry-After"), 5);
			assert.ok(bOnRequestCalled);
		});
	});
});

	//*********************************************************************************************
	QUnit.test("useFakeServer: multiple RegExp matches", function (assert) {
		TestUtils.useFakeServer(this._oSandbox, "sap/ui/test/qunit/data", [], [{
			regExp : /GET \/Foo\/regexp\/ba./,
			response : {
				message : "RegExp1"
			}
		}, {
			regExp : /GET \/Foo\/regexp\/b.r/,
			response : {
				message : "RegExp2"
			}
		}]);
		this.oLogMock.expects("warning")
			.withExactArgs("Multiple matches found for GET /Foo/regexp/bar", undefined,
				"sap.ui.test.TestUtils");

		return request("GET", "/Foo/regexp/bar", {"OData-Version" : "4.0"}).then(function (oXHR) {
			assert.strictEqual(oXHR.status, 404, "status");
		});
	});

	//*********************************************************************************************
	QUnit.test("useFakeServer: HEAD /Foo/any (direct)", function (assert) {
		TestUtils.useFakeServer(this._oSandbox, "sap/ui/test/qunit/data", mServerFixture);
		this.oLogMock.expects("info").withExactArgs("HEAD /Foo/any", '{"If-Match":undefined}',
			"sap.ui.test.TestUtils");

		return request("HEAD", "/Foo/any", {"OData-Version" : "4.0"}).then(function (oXHR) {
			assert.strictEqual(oXHR.status, 200, "status");
			assert.strictEqual(oXHR.responseText, "", "body");
			assert.strictEqual(
				oXHR.getAllResponseHeaders(), headerString({"OData-Version" : "4.0"}),
				"headers");
		});
	});

	//*********************************************************************************************
	QUnit.test("useFakeServer: change set - success", function (assert) {
		TestUtils.useFakeServer(this._oSandbox, "sap/ui/test/qunit/data", mServerFixture);
		this.oLogMock.expects("info").withExactArgs("PATCH /Foo/any", '{"If-Match":undefined}',
			"sap.ui.test.TestUtils");
		this.oLogMock.expects("info").withExactArgs("PATCH /Foo/bar", '{"If-Match":undefined}',
			"sap.ui.test.TestUtils");
		this.oLogMock.expects("info").withExactArgs("GET /Foo/bar", '{"If-Match":undefined}',
			"sap.ui.test.TestUtils");

		return request("POST", "/Foo/$batch", {"OData-Version" : "4.0"}, [
			"--batch_id-1538663822135-19",
			"Content-Type: multipart/mixed;boundary=changeset_id-1538663822135-20",
			"",
			"--changeset_id-1538663822135-20",
			"Content-Type:application/http",
			"Content-Transfer-Encoding:binary",
			"Content-ID:0.0",
			"",
			"PATCH any HTTP/1.1",
			"Accept:application/json;odata.metadata=minimal;IEEE754Compatible=true",
			"Accept-Language:en-US",
			"X-CSRF-Token:n0Uqj99BFa41yJb2QELx7g",
			"Content-Type:application/json;charset=UTF-8;IEEE754Compatible=true",
			"",
			'{"foo":"bar"}',
			"--changeset_id-1538663822135-20",
			"Content-Type:application/http",
			"Content-Transfer-Encoding:binary",
			"Content-ID:1.0",
			"",
			"PATCH bar HTTP/1.1",
			"Accept:application/json;odata.metadata=minimal;IEEE754Compatible=true",
			"Accept-Language:en-US",
			"X-CSRF-Token:",
			"Content-Type:application/json;charset=UTF-8;IEEE754Compatible=true",
			"",
			'{"foo":"bar"}',
			"--changeset_id-1538663822135-20--",
			"--batch_id-1538663822135-19--",
			"Content-Type:application/http",
			"Content-Transfer-Encoding:binary",
			"",
			"GET bar HTTP/1.1",
			"Accept:application/json;odata.metadata=minimal;IEEE754Compatible=true",
			"Accept-Language:en",
			"X-CSRF-Token:QzqAwcv5s1HQA7xOQgaNGQ==",
			"Content-Type:application/json;charset=UTF-8;IEEE754Compatible=true",
			"",
			"",
			"--batch_id-1538663822135-19--"
		].join("\r\n")).then(function (oXHR) {
			assert.strictEqual(oXHR.responseText, [
				"--batch_id-1538663822135-19",
				"Content-Type: multipart/mixed;boundary=changeset_id-1538663822135-20",
				"",
				"--changeset_id-1538663822135-20",
				"Content-Type: application/http",
				"Content-Transfer-Encoding: binary",
				"Content-ID: 0.0",
				"",
				"HTTP/1.1 204 ", // "auto responder"
				"OData-Version: 4.0",
				"",
				"", // <-- No Content
				"--changeset_id-1538663822135-20",
				"Content-Type: application/http",
				"Content-Transfer-Encoding: binary",
				"Content-ID: 1.0",
				"",
				"HTTP/1.1 200 ", // "server fixture"
				"OData-Version: 4.0",
				"",
				'{"@odata.etag":"abc123"}',
				"--changeset_id-1538663822135-20--",
				"--batch_id-1538663822135-19",
				"Content-Type: application/http",
				"Content-Transfer-Encoding: binary",
				"",
				"HTTP/1.1 200 ", // "server fixture"
				"OData-Version: 4.0",
				"Content-Type: application/json;charset=UTF-8;IEEE754Compatible=true",
				"",
				"{\"foo\":\"bar\",\"@odata.etag\":\"abc123\"}",
				"--batch_id-1538663822135-19--",
				""
			].join("\r\n"));
		});
	});

	//*********************************************************************************************
	QUnit.test("useFakeServer: change set - failure", function (assert) {
		TestUtils.useFakeServer(this._oSandbox, "sap/ui/test/qunit/data", mServerFixture);
		this.oLogMock.expects("info").withExactArgs("POST /Foo/any", '{"If-Match":undefined}',
			"sap.ui.test.TestUtils");
		this.oLogMock.expects("info").withExactArgs("POST /Foo/baz, alternative (ifMatch) #0",
			'{"If-Match":undefined}', "sap.ui.test.TestUtils");
		this.oLogMock.expects("info").withExactArgs("GET /Foo/bar", '{"If-Match":undefined}',
			"sap.ui.test.TestUtils");

		return request("POST", "/Foo/$batch", {"OData-Version" : "4.0"}, [
			"--batch_id-1538663822135-19",
			"Content-Type: multipart/mixed;boundary=changeset_id-1538663822135-20",
			"",
			"--changeset_id-1538663822135-20",
			"Content-Type:application/http",
			"Content-Transfer-Encoding:binary",
			"Content-ID:0.0",
			"",
			"POST any HTTP/1.1",
			"Accept:application/json;odata.metadata=minimal;IEEE754Compatible=true",
			"Accept-Language:en-US",
			"X-CSRF-Token:n0Uqj99BFa41yJb2QELx7g",
			"Content-Type:application/json;charset=UTF-8;IEEE754Compatible=true",
			"",
			'{"foo":"bar"}',
			"--changeset_id-1538663822135-20",
			"Content-Type:application/http",
			"Content-Transfer-Encoding:binary",
			"Content-ID:1.0",
			"",
			"POST baz HTTP/1.1",
			"Accept:application/json;odata.metadata=minimal;IEEE754Compatible=true",
			"Accept-Language:en-US",
			"X-CSRF-Token:n0Uqj99BFa41yJb2QELx7g",
			"Content-Type:application/json;charset=UTF-8;IEEE754Compatible=true",
			"",
			'{"foo":0}',
			"--changeset_id-1538663822135-20--",
			"--batch_id-1538663822135-19--",
			"Content-Type:application/http",
			"Content-Transfer-Encoding:binary",
			"",
			"GET bar HTTP/1.1",
			"Accept:application/json;odata.metadata=minimal;IEEE754Compatible=true",
			"Accept-Language:en",
			"X-CSRF-Token:QzqAwcv5s1HQA7xOQgaNGQ==",
			"Content-Type:application/json;charset=UTF-8;IEEE754Compatible=true",
			"",
			"",
			"--batch_id-1538663822135-19--"
		].join("\r\n")).then(function (oXHR) {
			assert.strictEqual(oXHR.responseText, [
				"--batch_id-1538663822135-19",
				"Content-Type: application/http",
				"Content-Transfer-Encoding: binary",
				"",
				"HTTP/1.1 400 ",
				"OData-Version: 4.0",
				"Content-Type: application/json;charset=utf-8",
				"",
				'{"message":"Failure"}',
				"--batch_id-1538663822135-19--",
				""
			].join("\r\n"));
		});
	});

	//*********************************************************************************************
	[{
		requestHeaders : {"OData-Version" : "Foo"},
		responseHeaders : {},
		expectedODataVersion : "Foo",
		expectedDataServiceVersion : null
	}, {
		requestHeaders : {"OData-Version" : "4.0"},
		responseHeaders : {"OData-Version" : "4.01"},
		expectedODataVersion : "4.01",
		expectedDataServiceVersion : null
	}, {
		requestHeaders : {DataServiceVersion : "Foo"},
		responseHeaders : {},
		expectedODataVersion : null,
		expectedDataServiceVersion : "Foo"
	}, {
		requestHeaders : {DataServiceVersion : "Foo"},
		responseHeaders : {DataServiceVersion : "Bar"},
		expectedODataVersion : null,
		expectedDataServiceVersion : "Bar"
	}, {
		requestHeaders : {},
		responseHeaders : {},
		expectedODataVersion : null,
		expectedDataServiceVersion : null
	}].forEach(function (oFixture, i) {
		var oOriginalResponseHeaders = jQuery.extend({}, oFixture.responseHeaders),
			mUrls = {
				"/Foo/bar" : {
					headers : oFixture.responseHeaders,
					message : "{\"foo\":\"bar\"}"
				}
			};

		QUnit.test("TestUtils: GET, " + i, function (assert) {
			TestUtils.useFakeServer(this._oSandbox, "sap/ui/core/qunit/odata/v4/data", mUrls);
			this.oLogMock.expects("info").withExactArgs("GET /Foo/bar", '{"If-Match":undefined}',
				"sap.ui.test.TestUtils");
			return jQuery.ajax("/Foo/bar", {
				method : "GET",
				headers : oFixture.requestHeaders
			}).then(function (_vData, _sTextStatus, jqXHR) {
				assert.strictEqual(jqXHR.getResponseHeader("OData-Version"),
					oFixture.expectedODataVersion);
				assert.strictEqual(jqXHR.getResponseHeader("DataServiceVersion"),
					oFixture.expectedDataServiceVersion);
				// fixture must not be modified
				assert.deepEqual(oFixture.responseHeaders, oOriginalResponseHeaders);
			});
		});

		QUnit.test("TestUtils: $batch with GET, " + i, function (assert) {
			TestUtils.useFakeServer(this._oSandbox, "sap/ui/core/qunit/odata/v4/data", mUrls);
			this.oLogMock.expects("info").withExactArgs("GET /Foo/bar", '{"If-Match":undefined}',
				"sap.ui.test.TestUtils");
			return jQuery.ajax("/$batch", {
				data : "--batch_id-0123456789012-345\r\n"
					+ "Content-Type:application/http\r\n"
					+ "Content-Transfer-Encoding:binary\r\n"
					+ "\r\n"
					+ "GET Foo/bar HTTP/1.1\r\n"
					+ "\r\n"
					+ "\r\n"
					+ "--batch_id-0123456789012-345\r\n",
				method : "POST",
				headers : oFixture.requestHeaders
			}).then(function (vData, _sTextStatus, jqXHR) {
				var sResponseHeaders;

				// check that $batch response header contains same OData version as in the request
				assert.strictEqual(jqXHR.getResponseHeader("OData-Version"),
					oFixture.requestHeaders["OData-Version"] || null);
				assert.strictEqual(jqXHR.getResponseHeader("DataServiceVersion"),
					oFixture.requestHeaders["DataServiceVersion"] || null);
				// fixture must not be modified
				assert.deepEqual(oFixture.responseHeaders, oOriginalResponseHeaders);

				// OData service version is same as in the header of each response within the batch
				sResponseHeaders = (vData.split("\r\n\r\n"))[1];
				checkHeader(assert, sResponseHeaders, "OData-Version",
					oFixture.expectedODataVersion);
				checkHeader(assert, sResponseHeaders, "DataServiceVersion",
					oFixture.expectedDataServiceVersion);
			});
		});
	});

	//*********************************************************************************************
	// DELETE, PATCH and POST requests cannot be configured in TestUtils.useFakeServer(), so OData
	// version headers are simply taken from the request
	["DELETE", "PATCH", "POST"].forEach(function (sMethod) {
		[{
			requestHeaders : {"OData-Version" : "Foo"},
			expectedODataVersion : "Foo",
			expectedDataServiceVersion : null
		}, {
			requestHeaders : {DataServiceVersion : "Foo"},
			expectedODataVersion : null,
			expectedDataServiceVersion : "Foo"
		}, {
			requestHeaders : {},
			expectedODataVersion : null,
			expectedDataServiceVersion : null
		}].forEach(function (oFixture, i) {
			var sTitle = sMethod + ", " + i;

			QUnit.test("TestUtils: " + sTitle, function (assert) {
				TestUtils.useFakeServer(this._oSandbox, "sap/ui/core/qunit/odata/v4/data", {});
				this.oLogMock.expects("info").withExactArgs(sMethod + " /Foo/bar",
					'{"If-Match":undefined}', "sap.ui.test.TestUtils");
				return jQuery.ajax("/Foo/bar", {
					data : sMethod === "DELETE" ? "" : "{\"foo\":\"bar\"}",
					method : sMethod,
					headers : oFixture.requestHeaders
				}).then(function (_vData, _sTextStatus, jqXHR) {
					assert.strictEqual(jqXHR.getResponseHeader("OData-Version"),
						oFixture.expectedODataVersion);
					assert.strictEqual(jqXHR.getResponseHeader("OData-MaxVersion"), null);
					assert.strictEqual(jqXHR.getResponseHeader("DataServiceVersion"),
						oFixture.expectedDataServiceVersion);
				});
			});

			QUnit.test("TestUtils: $batch with " + sTitle, function (assert) {
				TestUtils.useFakeServer(this._oSandbox, "sap/ui/core/qunit/odata/v4/data", {});
				this.oLogMock.expects("info").withExactArgs(sMethod + " /Foo/bar",
					'{"If-Match":undefined}', "sap.ui.test.TestUtils");
				return jQuery.ajax("/$batch", {
					data : "--batch_id-0123456789012-345\r\n"
						+ "Content-Type:application/http\r\n"
						+ "Content-Transfer-Encoding:binary\r\n"
						+ "\r\n"
						+ sMethod + " Foo/bar HTTP/1.1\r\n"
						+ "\r\n"
						+ "\r\n"
						+ "--batch_id-0123456789012-345\r\n",
					method : "POST",
					headers : oFixture.requestHeaders
				}).then(function (vData, _sTextStatus, jqXHR) {
					var sResponseHeaders;

					// check that $batch response header contains same OData version as the request
					assert.strictEqual(jqXHR.getResponseHeader("OData-Version"),
						oFixture.requestHeaders["OData-Version"] || null);
					assert.strictEqual(jqXHR.getResponseHeader("DataServiceVersion"),
						oFixture.requestHeaders["DataServiceVersion"] || null);

					// check OData service version in the headers of each response within the batch
					sResponseHeaders = (vData.split("\r\n\r\n"))[1];
					checkHeader(assert, sResponseHeaders, "OData-Version",
						oFixture.expectedODataVersion);
					checkHeader(assert, sResponseHeaders, "DataServiceVersion",
						oFixture.expectedDataServiceVersion);
				});
			});
		});
	});

	//*********************************************************************************************
	QUnit.test("useFakeServer: change set - failure - continue on error (V2)", function (assert) {
		var mFixture = {
				"POST /Foo/Any" : {
					code : 400,
					message : '{"error" : {"code" : "010","message" : {"value" : "Error 0"}}}'
				},
				"GET /Foo/Any?$skip=0&$top=4" : {
					code : 200,
					message : '{"d":{"results":[]}}'
				}
			};

		TestUtils.useFakeServer(this._oSandbox, "sap/ui/test/qunit/data", mFixture);
		this.oLogMock.expects("info")
			.withExactArgs("POST /Foo/Any", '{"If-Match":undefined}', "sap.ui.test.TestUtils");
		this.oLogMock.expects("info")
			.withExactArgs("GET /Foo/Any?$skip=0&$top=4", '{"If-Match":undefined}',
				"sap.ui.test.TestUtils");

		return request("POST", "/Foo/$batch", {DataServiceVersion : "2.0"}, [
			"--batch_c35a-0361-5112",
			"Content-Type: multipart/mixed; boundary=changeset_ab4e-9114-8adf",
			"",
			"--changeset_ab4e-9114-8adf",
			"Content-Type: application/http",
			"Content-Transfer-Encoding: binary",
			"",
			"POST Any HTTP/1.1",
			"Content-ID: id-1",
			"Content-Type: application/json",
			"Accept: application/json",
			"Accept-Language: en-US",
			"DataServiceVersion: 2.0",
			"MaxDataServiceVersion: 2.0",
			"Content-Length: 47",
			"",
			'{"Note":"Foo","__metadata":{"type":"Foo.Any"}}',
			"--changeset_ab4e-9114-8adf--",
			"",
			"--batch_c35a-0361-5112",
			"Content-Type: application/http",
			"Content-Transfer-Encoding: binary",
			"",
			"GET Any?$skip=0&$top=4 HTTP/1.1",
			"sap-contextid-accept: header",
			"Accept: application/json",
			"Accept-Language: en-US",
			"DataServiceVersion: 2.0",
			"MaxDataServiceVersion: 2.0",
			"",
			"",
			"--batch_c35a-0361-5112--"
	].join("\r\n")).then(function (oXHR) {
			assert.strictEqual(oXHR.responseText, [
				"--batch_c35a-0361-5112",
				"Content-Type: application/http",
				"Content-Transfer-Encoding: binary",
				"",
				"HTTP/1.1 400 ",
				"DataServiceVersion: 2.0",
				"",
				'{"error" : {"code" : "010","message" : {"value" : "Error 0"}}}',
				"--batch_c35a-0361-5112",
				"Content-Type: application/http",
				"Content-Transfer-Encoding: binary",
				"",
				"HTTP/1.1 200 ",
				"DataServiceVersion: 2.0",
				"",
				'{"d":{"results":[]}}',
				"--batch_c35a-0361-5112--",
				""
			].join("\r\n"));
		});
	});

	//*********************************************************************************************
	QUnit.test("makeUrlReadable/encodeReadableUrl", function (assert) {
		function test(sReadableUrl, sCorrectUrl) {
			assert.strictEqual(TestUtils.makeUrlReadable(sCorrectUrl), sReadableUrl);
			assert.strictEqual(TestUtils.encodeReadableUrl(sReadableUrl), sCorrectUrl);
			assert.strictEqual(encodeURI(sReadableUrl), sCorrectUrl);
		}

		test(
			"foo?$select=a,b&$expand=c($select=d;$expand=e)&$filter=bar eq 42",
			"foo?$select=a,b&$expand=c($select=d;$expand=e)&$filter=bar%20eq%2042"
		);
		test(
			'foo?ExpandLevels=[{NodeId:"1",Level:0}]',
			"foo?ExpandLevels=%5B%7BNodeId:%221%22,Level:0%7D%5D"
		);
	});

	//*********************************************************************************************
	QUnit.test("requestAllSources", async function (assert) {
		// code under test
		let oResult = TestUtils.requestAllSources({});

		assert.ok(oResult instanceof Promise);
		assert.strictEqual(await oResult, undefined);

		const oFixture = {
			url0 : {}, // no source
			url1 : {source : "path/a.json"},
			url2 : {
				source : "b.JsOn", // ignore case of file extension
				headers : {x : "y"}
			},
			url3 : [
				{},
				{source : "path/a.json"}, // not requested twice
				{source : "c.xml"}
			]
		};
		const aRegExp = [{
			regExp : /regexp0/,
			response : {} // no source
		}, {
			regExp : /regexp1/,
			response : {source : "d.xml"}
		}, {
			regExp : /regexp2/,
			response : [
				{},
				{source : "path/a.json"}, // not requested twice
				{source : "e.txt"} // unknown file extension
			]
		}];
		const oWindowMock = this.mock(window);
		oWindowMock.expects("fetch")
			.withExactArgs("test-resources/foo/bar/path/a.json")
			.resolves({text : () => "content of path/a.json"});
		oWindowMock.expects("fetch")
			.withExactArgs("test-resources/foo/bar/b.JsOn")
			.resolves({text : () => "content of b.JsOn"});
		oWindowMock.expects("fetch")
			.withExactArgs("test-resources/foo/bar/c.xml")
			.resolves({text : () => "content of c.xml"});
		oWindowMock.expects("fetch")
			.withExactArgs("test-resources/foo/bar/d.xml")
			.resolves({text : () => "content of d.xml"});
		oWindowMock.expects("fetch")
			.withExactArgs("test-resources/foo/bar/e.txt")
			.resolves({text : () => "content of e.txt"});

		// code under test
		oResult = TestUtils.requestAllSources(oFixture, aRegExp, "foo/bar");

		assert.ok(oResult instanceof Promise);
		assert.strictEqual(await oResult, undefined);
		assert.strictEqual(oFixture.url1.source, undefined);
		assert.strictEqual(oFixture.url1.message, "content of path/a.json");
		assert.deepEqual(oFixture.url1.headers, {
			"Content-Type" : "application/json;charset=UTF-8;IEEE754Compatible=true"
		});
		assert.strictEqual(oFixture.url2.source, undefined);
		assert.strictEqual(oFixture.url2.message, "content of b.JsOn");
		assert.deepEqual(oFixture.url2.headers, {
			"Content-Type" : "application/json;charset=UTF-8;IEEE754Compatible=true",
			x : "y"
		});
		assert.strictEqual(oFixture.url3[1].source, undefined);
		assert.strictEqual(oFixture.url3[1].message, "content of path/a.json");
		assert.deepEqual(oFixture.url3[1].headers, {
			"Content-Type" : "application/json;charset=UTF-8;IEEE754Compatible=true"
		});
		assert.strictEqual(oFixture.url3[2].source, undefined);
		assert.strictEqual(oFixture.url3[2].message, "content of c.xml");
		assert.deepEqual(oFixture.url3[2].headers, {"Content-Type" : "application/xml"});
		assert.strictEqual(aRegExp[1].response.source, undefined);
		assert.strictEqual(aRegExp[1].response.message, "content of d.xml");
		assert.deepEqual(aRegExp[1].response.headers, {"Content-Type" : "application/xml"});
		assert.strictEqual(aRegExp[2].response[1].source, undefined);
		assert.strictEqual(aRegExp[2].response[1].message, "content of path/a.json");
		assert.deepEqual(aRegExp[2].response[1].headers, {
			"Content-Type" : "application/json;charset=UTF-8;IEEE754Compatible=true"
		});
		assert.strictEqual(aRegExp[2].response[2].source, undefined);
		assert.strictEqual(aRegExp[2].response[2].message, "content of e.txt");
		assert.deepEqual(aRegExp[2].response[2].headers, {
			"Content-Type" : "application/x-octet-stream"
		});
	});

	//*********************************************************************************************
	QUnit.test("requestAllSources: default base, rejects", async function (assert) {
		const oFixture = {
			url1 : {source : "path/a.json"}
		};
		const oError = new Error("failed intentionally");
		this.mock(window).expects("fetch")
			.withExactArgs("test-resources/sap/ui/core/qunit/odata/v4/data/path/a.json")
			.rejects(oError);

		try {
			// code under test
			await TestUtils.requestAllSources(oFixture);
			assert.ok(false, "unexpected success");
		} catch (oError0) {
			assert.strictEqual(oError0, oError);
		}
	});
});
