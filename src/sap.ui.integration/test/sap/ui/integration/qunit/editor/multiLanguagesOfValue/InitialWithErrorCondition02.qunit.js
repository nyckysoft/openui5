/* eslint-disable no-loop-func */
/* global QUnit */
sap.ui.define([
	"sap/base/i18n/Localization",
	"sap/base/util/merge",
	"sap-ui-integration-editor",
	"sap/ui/integration/editor/Editor",
	"sap/ui/integration/Designtime",
	"sap/ui/integration/Host",
	"sap/ui/thirdparty/sinon-4",
	"./../ContextHost",
	"sap/ui/qunit/QUnitUtils",
	"sap/ui/events/KeyCodes",
	"qunit/designtime/EditorQunitUtils"
], function (
	Localization,
	merge,
	x,
	Editor,
	Designtime,
	Host,
	sinon,
	ContextHost,
	QUnitUtils,
	KeyCodes,
	EditorQunitUtils
) {
	"use strict";

	QUnit.config.reorder = false;

	var sBaseUrl = "test-resources/sap/ui/integration/qunit/editor/jsons/withDesigntime/sap.card/";
	Localization.setLanguage("en");
	document.body.className = document.body.className + " sapUiSizeCompact ";

	function destroyEditor(oEditor) {
		oEditor.destroy();
		var oContent = document.getElementById("content");
		if (oContent) {
			oContent.innerHTML = "";
			document.body.style.zIndex = "unset";
		}

	}
	var _oManifestWithi18nOriginFileOnly = {
		"sap.app": {
			"id": "test.sample",
			"i18n": "../i18nTransOriOnly/i18n.properties"
		},
		"sap.card": {
			"designtime": "designtime/multiLanguage",
			"type": "List",
			"configuration": {
				"parameters": {
					"string1": {
						"value": "{{string1}}"
					},
					"string2": {
						"value": "String 2"
					},
					"string3": {
						"value": "String 3"
					},
					"string4": {
						"value": "{i18n>string4}"
					},
					"integer": {
						"value": 1
					},
					"number": {
						"value": 3
					}
				}
			}
		}
	};
	var _aCheckedLanguages = [
		{
			"key": "en",
			"description": "English"
		},
		{
			"key": "en-GB",
			"description": "English UK"
		},
		{
			"key": "es-MX",
			"description": "Español de México"
		},
		{
			"key": "fr",
			"description": "Français"
		},
		{
			"key": "fr-CA",
			"description": "Français (Canada)"
		},
		{
			"key": "zh-CN",
			"description": "简体中文"
		}
	];

	QUnit.module("Check the i18n folder only have the original i18n.properties file", {
		beforeEach: function () {
			this.oHost = new Host("host");
			this.oContextHost = new ContextHost("contexthost");
		},
		afterEach: function () {
			this.oHost.destroy();
			this.oContextHost.destroy();
		}
	}, function () {
		QUnit.test("Admin mode", function (assert) {
			var that = this;
			//Fallback language
			return new Promise(function (resolve, reject) {
				that.oEditor = EditorQunitUtils.createEditor("en");
				that.oEditor.setMode("admin");
				that.oEditor.setAllowSettings(true);
				that.oEditor.setAllowDynamicValues(true);
				that.oEditor.setJson({
					baseUrl: sBaseUrl,
					host: "contexthost",
					manifest: _oManifestWithi18nOriginFileOnly
				});
				EditorQunitUtils.isFieldReady(that.oEditor).then(function () {
					assert.ok(that.oEditor.isFieldReady(), "Editor fields are ready");
					var oLabel1 = that.oEditor.getAggregation("_formContent")[1];
					var oField1 = that.oEditor.getAggregation("_formContent")[2];
					var oLabel2 = that.oEditor.getAggregation("_formContent")[3];
					var oField2 = that.oEditor.getAggregation("_formContent")[4];
					var oLabel3 = that.oEditor.getAggregation("_formContent")[5];
					var oField3 = that.oEditor.getAggregation("_formContent")[6];
					var oLabel4 = that.oEditor.getAggregation("_formContent")[7];
					var oField4 = that.oEditor.getAggregation("_formContent")[8];
					var oLabel5 = that.oEditor.getAggregation("_formContent")[9];
					var oField5 = that.oEditor.getAggregation("_formContent")[10];
					var oLabel6 = that.oEditor.getAggregation("_formContent")[11];
					var oField6 = that.oEditor.getAggregation("_formContent")[12];
					EditorQunitUtils.isReady(that.oEditor).then(function () {
						assert.ok(that.oEditor.isReady(), "Editor is ready");
						assert.equal(oLabel1.getText(), "Label 1 NOLANG", "Label1: Label 1 NOLANG");
						assert.equal(oField1.getAggregation("_field").getValue(), "String 1 NOLANG", "oField1: String 1 NOLANG");
						assert.ok(oField1.getAggregation("_field").isA("sap.m.Input"), "oField1: Input control");
						assert.equal(oLabel2.getText(), "Label 2 NOLANG", "Label2: Label 2 NOLANG");
						assert.equal(oField2.getAggregation("_field").getValue(), "String 2", "oField2: String 2");
						assert.ok(oField2.getAggregation("_field").isA("sap.m.Input"), "oField2: Input control");
						assert.equal(oLabel3.getText(), "Label 3 NOLANG", "Label3: Label 3 NOLANG");
						assert.equal(oField3.getAggregation("_field").getValue(), "String 3", "oField1: String 3");
						assert.ok(oField3.getAggregation("_field").isA("sap.m.Input"), "oField3: Input control");
						assert.equal(oLabel4.getText(), "Label 4 NOLANG", "Label4: Label 4 NOLANG");
						assert.equal(oField4.getAggregation("_field").getValue(), "String 4 NOLANG", "oField1: String 4 NOLANG");
						assert.ok(oField4.getAggregation("_field").isA("sap.m.Input"), "oField4: Input control");
						assert.equal(oLabel5.getText(), "integer", "Label5: integer");
						assert.ok(oField5.getAggregation("_field").isA("sap.m.Input"), "oField5: Input control");
						assert.equal(oField5.getAggregation("_field").getValue(), "1", "oField5: 1");
						assert.equal(oField5.getAggregation("_field").getAggregation("_endIcon"), null, "oField5: No Input value help icon");
						assert.equal(oLabel6.getText(), "number", "Label6: number");
						assert.ok(oField6.getAggregation("_field").isA("sap.m.Input"), "oField6: Input control");
						assert.equal(oField6.getAggregation("_field").getValue(), "3", "oField6: 3");
						assert.equal(oField6.getAggregation("_field").getAggregation("_endIcon"), null, "oField6: No Input value help icon");

						var oValueHelpIcon1 = oField1.getAggregation("_field")._oValueHelpIcon;
						assert.ok(oValueHelpIcon1.isA("sap.ui.core.Icon"), "oField1: Input value help icon");
						assert.equal(oValueHelpIcon1.getSrc(), "sap-icon://translate", "oField1: Input value help icon src");
						oField1.attachEventOnce("translationPopoverOpened", function () {
							var oTranslationPopover1 = oField1._oTranslationPopover;
							var aHeaderItems1 = oTranslationPopover1.getCustomHeader().getItems();
							assert.equal(aHeaderItems1[0].getText(), that.oEditor._oResourceBundle.getText("EDITOR_FIELD_TRANSLATION_LIST_POPOVER_TITLE"), "oTranslationPopover1 Header: Title");
							assert.equal(aHeaderItems1[1].getText(), that.oEditor._oResourceBundle.getText("EDITOR_FIELD_TRANSLATION_LIST_POPOVER_CURRENTLANGUAGE"), "oTranslationPopover1 Header: Current Language");
							assert.equal(aHeaderItems1[2].getItems()[0].getText(), "English", "oTranslationPopover1 Header: English");
							assert.equal(aHeaderItems1[2].getItems()[1].getValue(), "String 1 NOLANG", "oTranslationPopover1 Header: String 1 NOLANG");
							assert.equal(aHeaderItems1[2].getItems()[1].getEditable(), false, "oTranslationPopover1 Header: Editable false");
							assert.equal(aHeaderItems1[3].getText(), that.oEditor._oResourceBundle.getText("EDITOR_FIELD_TRANSLATION_LIST_POPOVER_OTHERLANGUAGES"), "oTranslationPopover1 Header: Other Languages");
							assert.ok(oTranslationPopover1.getContent()[0].isA("sap.m.List"), "oTranslationPopover1 Content: List");
							var oLanguageItems1 = oTranslationPopover1.getContent()[0].getItems();
							assert.equal(oLanguageItems1.length, 48, "oTranslationPopover1 Content: length");
							for (var i = 0; i < oLanguageItems1.length; i++) {
								var sLanguage = oLanguageItems1[i].getCustomData()[0].getKey();
								var sExpectedValue = "String 1 NOLANG";
								var sCurrentValue = oLanguageItems1[i].getContent()[0].getItems()[1].getValue();
								assert.equal(sCurrentValue, sExpectedValue, "oTranslationPopover1 Content: item " + i + " " + sLanguage + ", current: " + sCurrentValue + ", expected: " + sExpectedValue);
							}
							var oCancelButton1 = oTranslationPopover1.getFooter().getContent()[2];
							oCancelButton1.firePress();

							var oValueHelpIcon2 = oField2.getAggregation("_field").getAggregation("_endIcon");
							assert.equal(oValueHelpIcon2, null, "oField2: No Input value help icon");

							var oValueHelpIcon3 = oField3.getAggregation("_field")._oValueHelpIcon;
							assert.ok(oValueHelpIcon3.isA("sap.ui.core.Icon"), "oField3: Input value help icon");
							assert.equal(oValueHelpIcon3.getSrc(), "sap-icon://translate", "oField3: Input value help icon src");
							oField3.attachEventOnce("translationPopoverOpened", function () {
								var oTranslationPopover3 = oField3._oTranslationPopover;
								var aHeaderItems3 = oTranslationPopover3.getCustomHeader().getItems();
								assert.equal(aHeaderItems3[2].getItems()[1].getValue(), "String 3", "oTranslationPopover3 Header: String 3");
								assert.ok(aHeaderItems3[2].getItems()[1].getEditable() === false, "oTranslationPopover3 Header: Editable false");
								assert.ok(oTranslationPopover3.getContent()[0].isA("sap.m.List"), "oTranslationPopover3 Content: List");
								var oLanguageItems3 = oTranslationPopover3.getContent()[0].getItems();
								assert.equal(oLanguageItems3.length, 48, "oTranslationPopover3 Content: length");
								for (var i = 1; i < oLanguageItems3.length; i++) {
									var sLanguage = oLanguageItems3[i].getCustomData()[0].getKey();
									var sCurrentValue = oLanguageItems3[i].getContent()[0].getItems()[1].getValue();
									assert.equal(sCurrentValue, "String 3", "oTranslationPopover3 Content: item " + i + " " + sLanguage + ", current: " + sCurrentValue + ", expected: String 3");
								}
								var oCancelButton3 = oTranslationPopover3.getFooter().getContent()[2];
								oCancelButton3.firePress();

								var oValueHelpIcon4 = oField4.getAggregation("_field")._oValueHelpIcon;
								assert.ok(oValueHelpIcon4.isA("sap.ui.core.Icon"), "oField4: Input value help icon");
								assert.equal(oValueHelpIcon4.getSrc(), "sap-icon://translate", "oField4: Input value help icon src");
								oField4.attachEventOnce("translationPopoverOpened", function () {
									var oTranslationPopover4 = oField4._oTranslationPopover;
									var aHeaderItems4 = oTranslationPopover4.getCustomHeader().getItems();
									assert.equal(aHeaderItems4[2].getItems()[1].getValue(), "String 4 NOLANG", "oTranslationPopover4 Header: String 4 NOLANG");
									assert.ok(aHeaderItems4[2].getItems()[1].getEditable() === false, "oTranslationPopover4 Header: Editable false");
									assert.ok(oTranslationPopover4.getContent()[0].isA("sap.m.List"), "oTranslationPopover4 Content: List");
									var oLanguageItems4 = oTranslationPopover4.getContent()[0].getItems();
									assert.equal(oLanguageItems4.length, 48, "oTranslationPopover4 Content: length");
									for (var i = 1; i < oLanguageItems4.length; i++) {
										var sLanguage = oLanguageItems4[i].getCustomData()[0].getKey();
										var sExpectedValue = "String 4 NOLANG";
										var sCurrentValue = oLanguageItems4[i].getContent()[0].getItems()[1].getValue();
										assert.equal(sCurrentValue, sExpectedValue, "oTranslationPopover4 Content: item " + i + " " + sLanguage + ", current: " + sCurrentValue + ", expected: " + sExpectedValue);
									}
									var oCancelButton4 = oTranslationPopover4.getFooter().getContent()[2];
									oCancelButton4.firePress();
									destroyEditor(that.oEditor);
									resolve();
								});
								oValueHelpIcon4.firePress();
								oValueHelpIcon4.focus();
							});
							oValueHelpIcon3.firePress();
							oValueHelpIcon3.focus();
						});
						oValueHelpIcon1.firePress();
						oValueHelpIcon1.focus();
					});
				});
			});
		});

		QUnit.test("Content mode", function (assert) {
			var that = this;
			//Fallback language
			return new Promise(function (resolve, reject) {
				that.oEditor = EditorQunitUtils.createEditor("en");
				that.oEditor.setMode("content");
				that.oEditor.setAllowSettings(true);
				that.oEditor.setAllowDynamicValues(true);
				that.oEditor.setJson({
					baseUrl: sBaseUrl,
					host: "contexthost",
					manifest: _oManifestWithi18nOriginFileOnly
				});
				EditorQunitUtils.isFieldReady(that.oEditor).then(function () {
					assert.ok(that.oEditor.isFieldReady(), "Editor fields are ready");
					var oLabel1 = that.oEditor.getAggregation("_formContent")[1];
					var oField1 = that.oEditor.getAggregation("_formContent")[2];
					var oLabel2 = that.oEditor.getAggregation("_formContent")[3];
					var oField2 = that.oEditor.getAggregation("_formContent")[4];
					var oLabel3 = that.oEditor.getAggregation("_formContent")[5];
					var oField3 = that.oEditor.getAggregation("_formContent")[6];
					var oLabel4 = that.oEditor.getAggregation("_formContent")[7];
					var oField4 = that.oEditor.getAggregation("_formContent")[8];
					var oLabel5 = that.oEditor.getAggregation("_formContent")[9];
					var oField5 = that.oEditor.getAggregation("_formContent")[10];
					var oLabel6 = that.oEditor.getAggregation("_formContent")[11];
					var oField6 = that.oEditor.getAggregation("_formContent")[12];
					EditorQunitUtils.isReady(that.oEditor).then(function () {
						assert.ok(that.oEditor.isReady(), "Editor is ready");
						assert.equal(oLabel1.getText(), "Label 1 NOLANG", "Label1: Label 1 NOLANG");
						assert.equal(oField1.getAggregation("_field").getValue(), "String 1 NOLANG", "oField1: String 1 NOLANG");
						assert.ok(oField1.getAggregation("_field").isA("sap.m.Input"), "oField1: Input control");
						assert.equal(oLabel2.getText(), "Label 2 NOLANG", "Label2: Label 2 NOLANG");
						assert.equal(oField2.getAggregation("_field").getValue(), "String 2", "oField2: String 2");
						assert.ok(oField2.getAggregation("_field").isA("sap.m.Input"), "oField2: Input control");
						assert.equal(oLabel3.getText(), "Label 3 NOLANG", "Label3: Label 3 NOLANG");
						assert.equal(oField3.getAggregation("_field").getValue(), "String 3", "oField1: String 3");
						assert.ok(oField3.getAggregation("_field").isA("sap.m.Input"), "oField3: Input control");
						assert.equal(oLabel4.getText(), "Label 4 NOLANG", "Label4: Label 4 NOLANG");
						assert.equal(oField4.getAggregation("_field").getValue(), "String 4 NOLANG", "oField1: String 4 NOLANG");
						assert.ok(oField4.getAggregation("_field").isA("sap.m.Input"), "oField4: Input control");
						assert.equal(oLabel5.getText(), "integer", "Label5: integer");
						assert.ok(oField5.getAggregation("_field").isA("sap.m.Input"), "oField5: Input control");
						assert.equal(oField5.getAggregation("_field").getValue(), "1", "oField5: 1");
						assert.equal(oField5.getAggregation("_field").getAggregation("_endIcon"), null, "oField5: No Input value help icon");
						assert.equal(oLabel6.getText(), "number", "Label6: number");
						assert.ok(oField6.getAggregation("_field").isA("sap.m.Input"), "oField6: Input control");
						assert.equal(oField6.getAggregation("_field").getValue(), "3", "oField6: 3");
						assert.equal(oField6.getAggregation("_field").getAggregation("_endIcon"), null, "oField6: No Input value help icon");

						var oValueHelpIcon1 = oField1.getAggregation("_field")._oValueHelpIcon;
						assert.ok(oValueHelpIcon1.isA("sap.ui.core.Icon"), "oField1: Input value help icon");
						assert.equal(oValueHelpIcon1.getSrc(), "sap-icon://translate", "oField1: Input value help icon src");
						oField1.attachEventOnce("translationPopoverOpened", function () {
							var oTranslationPopover1 = oField1._oTranslationPopover;
							var aHeaderItems1 = oTranslationPopover1.getCustomHeader().getItems();
							assert.equal(aHeaderItems1[0].getText(), that.oEditor._oResourceBundle.getText("EDITOR_FIELD_TRANSLATION_LIST_POPOVER_TITLE"), "oTranslationPopover1 Header: Title");
							assert.equal(aHeaderItems1[1].getText(), that.oEditor._oResourceBundle.getText("EDITOR_FIELD_TRANSLATION_LIST_POPOVER_CURRENTLANGUAGE"), "oTranslationPopover1 Header: Current Language");
							assert.equal(aHeaderItems1[2].getItems()[0].getText(), "English", "oTranslationPopover1 Header: English");
							assert.equal(aHeaderItems1[2].getItems()[1].getValue(), "String 1 NOLANG", "oTranslationPopover1 Header: String 1 NOLANG");
							assert.equal(aHeaderItems1[2].getItems()[1].getEditable(), false, "oTranslationPopover1 Header: Editable false");
							assert.equal(aHeaderItems1[3].getText(), that.oEditor._oResourceBundle.getText("EDITOR_FIELD_TRANSLATION_LIST_POPOVER_OTHERLANGUAGES"), "oTranslationPopover1 Header: Other Languages");
							assert.ok(oTranslationPopover1.getContent()[0].isA("sap.m.List"), "oTranslationPopover1 Content: List");
							var oLanguageItems1 = oTranslationPopover1.getContent()[0].getItems();
							assert.equal(oLanguageItems1.length, 48, "oTranslationPopover1 Content: length");
							for (var i = 0; i < oLanguageItems1.length; i++) {
								var sLanguage = oLanguageItems1[i].getCustomData()[0].getKey();
								var sExpectedValue = "String 1 NOLANG";
								var sCurrentValue = oLanguageItems1[i].getContent()[0].getItems()[1].getValue();
								assert.equal(sCurrentValue, sExpectedValue, "oTranslationPopover1 Content: item " + i + " " + sLanguage + ", current: " + sCurrentValue + ", expected: " + sExpectedValue);
							}
							var oCancelButton1 = oTranslationPopover1.getFooter().getContent()[2];
							oCancelButton1.firePress();

							var oValueHelpIcon2 = oField2.getAggregation("_field").getAggregation("_endIcon");
							assert.equal(oValueHelpIcon2, null, "oField2: No Input value help icon");

							var oValueHelpIcon3 = oField3.getAggregation("_field")._oValueHelpIcon;
							assert.ok(oValueHelpIcon3.isA("sap.ui.core.Icon"), "oField3: Input value help icon");
							assert.equal(oValueHelpIcon3.getSrc(), "sap-icon://translate", "oField3: Input value help icon src");
							oField3.attachEventOnce("translationPopoverOpened", function () {
								var oTranslationPopover3 = oField3._oTranslationPopover;
								var aHeaderItems3 = oTranslationPopover3.getCustomHeader().getItems();
								assert.equal(aHeaderItems3[2].getItems()[1].getValue(), "String 3", "oTranslationPopover3 Header: String 3");
								assert.ok(aHeaderItems3[2].getItems()[1].getEditable() === false, "oTranslationPopover3 Header: Editable false");
								assert.ok(oTranslationPopover3.getContent()[0].isA("sap.m.List"), "oTranslationPopover3 Content: List");
								var oLanguageItems3 = oTranslationPopover3.getContent()[0].getItems();
								assert.equal(oLanguageItems3.length, 48, "oTranslationPopover3 Content: length");
								for (var i = 1; i < oLanguageItems3.length; i++) {
									var sLanguage = oLanguageItems3[i].getCustomData()[0].getKey();
									var sCurrentValue = oLanguageItems3[i].getContent()[0].getItems()[1].getValue();
									assert.equal(sCurrentValue, "String 3", "oTranslationPopover3 Content: item " + i + " " + sLanguage + ", current: " + sCurrentValue + ", expected: String 3");
								}
								var oCancelButton3 = oTranslationPopover3.getFooter().getContent()[2];
								oCancelButton3.firePress();

								var oValueHelpIcon4 = oField4.getAggregation("_field")._oValueHelpIcon;
								assert.ok(oValueHelpIcon4.isA("sap.ui.core.Icon"), "oField4: Input value help icon");
								assert.equal(oValueHelpIcon4.getSrc(), "sap-icon://translate", "oField4: Input value help icon src");
								oField4.attachEventOnce("translationPopoverOpened", function () {
									var oTranslationPopover4 = oField4._oTranslationPopover;
									var aHeaderItems4 = oTranslationPopover4.getCustomHeader().getItems();
									assert.equal(aHeaderItems4[2].getItems()[1].getValue(), "String 4 NOLANG", "oTranslationPopover4 Header: String 4 NOLANG");
									assert.ok(aHeaderItems4[2].getItems()[1].getEditable() === false, "oTranslationPopover4 Header: Editable false");
									assert.ok(oTranslationPopover4.getContent()[0].isA("sap.m.List"), "oTranslationPopover4 Content: List");
									var oLanguageItems4 = oTranslationPopover4.getContent()[0].getItems();
									assert.equal(oLanguageItems4.length, 48, "oTranslationPopover4 Content: length");
									for (var i = 1; i < oLanguageItems4.length; i++) {
										var sLanguage = oLanguageItems4[i].getCustomData()[0].getKey();
										var sExpectedValue = "String 4 NOLANG";
										var sCurrentValue = oLanguageItems4[i].getContent()[0].getItems()[1].getValue();
										assert.equal(sCurrentValue, sExpectedValue, "oTranslationPopover4 Content: item " + i + " " + sLanguage + ", current: " + sCurrentValue + ", expected: " + sExpectedValue);
									}
									var oCancelButton4 = oTranslationPopover4.getFooter().getContent()[2];
									oCancelButton4.firePress();
									destroyEditor(that.oEditor);
									resolve();
								});
								oValueHelpIcon4.firePress();
								oValueHelpIcon4.focus();
							});
							oValueHelpIcon3.firePress();
							oValueHelpIcon3.focus();
						});
						oValueHelpIcon1.firePress();
						oValueHelpIcon1.focus();
					});
				});
			});
		});

		QUnit.test("All mode", function (assert) {
			var that = this;
			//Fallback language
			return new Promise(function (resolve, reject) {
				that.oEditor = EditorQunitUtils.createEditor("en");
				that.oEditor.setMode("all");
				that.oEditor.setAllowSettings(true);
				that.oEditor.setAllowDynamicValues(true);
				that.oEditor.setJson({
					baseUrl: sBaseUrl,
					host: "contexthost",
					manifest: _oManifestWithi18nOriginFileOnly
				});
				EditorQunitUtils.isFieldReady(that.oEditor).then(function () {
					assert.ok(that.oEditor.isFieldReady(), "Editor fields are ready");
					var oLabel1 = that.oEditor.getAggregation("_formContent")[1];
					var oField1 = that.oEditor.getAggregation("_formContent")[2];
					var oLabel2 = that.oEditor.getAggregation("_formContent")[3];
					var oField2 = that.oEditor.getAggregation("_formContent")[4];
					var oLabel3 = that.oEditor.getAggregation("_formContent")[5];
					var oField3 = that.oEditor.getAggregation("_formContent")[6];
					var oLabel4 = that.oEditor.getAggregation("_formContent")[7];
					var oField4 = that.oEditor.getAggregation("_formContent")[8];
					var oLabel5 = that.oEditor.getAggregation("_formContent")[9];
					var oField5 = that.oEditor.getAggregation("_formContent")[10];
					var oLabel6 = that.oEditor.getAggregation("_formContent")[11];
					var oField6 = that.oEditor.getAggregation("_formContent")[12];
					EditorQunitUtils.isReady(that.oEditor).then(function () {
						assert.ok(that.oEditor.isReady(), "Editor is ready");
						assert.equal(oLabel1.getText(), "Label 1 NOLANG", "Label1: Label 1 NOLANG");
						assert.equal(oField1.getAggregation("_field").getValue(), "String 1 NOLANG", "oField1: String 1 NOLANG");
						assert.ok(oField1.getAggregation("_field").isA("sap.m.Input"), "oField1: Input control");
						assert.equal(oLabel2.getText(), "Label 2 NOLANG", "Label2: Label 2 NOLANG");
						assert.equal(oField2.getAggregation("_field").getValue(), "String 2", "oField2: String 2");
						assert.ok(oField2.getAggregation("_field").isA("sap.m.Input"), "oField2: Input control");
						assert.equal(oLabel3.getText(), "Label 3 NOLANG", "Label3: Label 3 NOLANG");
						assert.equal(oField3.getAggregation("_field").getValue(), "String 3", "oField1: String 3");
						assert.ok(oField3.getAggregation("_field").isA("sap.m.Input"), "oField3: Input control");
						assert.equal(oLabel4.getText(), "Label 4 NOLANG", "Label4: Label 4 NOLANG");
						assert.equal(oField4.getAggregation("_field").getValue(), "String 4 NOLANG", "oField1: String 4 NOLANG");
						assert.ok(oField4.getAggregation("_field").isA("sap.m.Input"), "oField4: Input control");
						assert.equal(oLabel5.getText(), "integer", "Label5: integer");
						assert.ok(oField5.getAggregation("_field").isA("sap.m.Input"), "oField5: Input control");
						assert.equal(oField5.getAggregation("_field").getValue(), "1", "oField5: 1");
						assert.equal(oField5.getAggregation("_field").getAggregation("_endIcon"), null, "oField5: No Input value help icon");
						assert.equal(oLabel6.getText(), "number", "Label6: number");
						assert.ok(oField6.getAggregation("_field").isA("sap.m.Input"), "oField6: Input control");
						assert.equal(oField6.getAggregation("_field").getValue(), "3", "oField6: 3");
						assert.equal(oField6.getAggregation("_field").getAggregation("_endIcon"), null, "oField6: No Input value help icon");

						var oValueHelpIcon1 = oField1.getAggregation("_field")._oValueHelpIcon;
						assert.ok(oValueHelpIcon1.isA("sap.ui.core.Icon"), "oField1: Input value help icon");
						assert.equal(oValueHelpIcon1.getSrc(), "sap-icon://translate", "oField1: Input value help icon src");
						oField1.attachEventOnce("translationPopoverOpened", function () {
							var oTranslationPopover1 = oField1._oTranslationPopover;
							var aHeaderItems1 = oTranslationPopover1.getCustomHeader().getItems();
							assert.equal(aHeaderItems1[0].getText(), that.oEditor._oResourceBundle.getText("EDITOR_FIELD_TRANSLATION_LIST_POPOVER_TITLE"), "oTranslationPopover1 Header: Title");
							assert.equal(aHeaderItems1[1].getText(), that.oEditor._oResourceBundle.getText("EDITOR_FIELD_TRANSLATION_LIST_POPOVER_CURRENTLANGUAGE"), "oTranslationPopover1 Header: Current Language");
							assert.equal(aHeaderItems1[2].getItems()[0].getText(), "English", "oTranslationPopover1 Header: English");
							assert.equal(aHeaderItems1[2].getItems()[1].getValue(), "String 1 NOLANG", "oTranslationPopover1 Header: String 1 NOLANG");
							assert.equal(aHeaderItems1[2].getItems()[1].getEditable(), false, "oTranslationPopover1 Header: Editable false");
							assert.equal(aHeaderItems1[3].getText(), that.oEditor._oResourceBundle.getText("EDITOR_FIELD_TRANSLATION_LIST_POPOVER_OTHERLANGUAGES"), "oTranslationPopover1 Header: Other Languages");
							assert.ok(oTranslationPopover1.getContent()[0].isA("sap.m.List"), "oTranslationPopover1 Content: List");
							var oLanguageItems1 = oTranslationPopover1.getContent()[0].getItems();
							assert.equal(oLanguageItems1.length, 48, "oTranslationPopover1 Content: length");
							for (var i = 0; i < oLanguageItems1.length; i++) {
								var sLanguage = oLanguageItems1[i].getCustomData()[0].getKey();
								var sExpectedValue = "String 1 NOLANG";
								var sCurrentValue = oLanguageItems1[i].getContent()[0].getItems()[1].getValue();
								assert.equal(sCurrentValue, sExpectedValue, "oTranslationPopover1 Content: item " + i + " " + sLanguage + ", current: " + sCurrentValue + ", expected: " + sExpectedValue);
							}
							var oCancelButton1 = oTranslationPopover1.getFooter().getContent()[2];
							oCancelButton1.firePress();

							var oValueHelpIcon2 = oField2.getAggregation("_field").getAggregation("_endIcon");
							assert.equal(oValueHelpIcon2, null, "oField2: No Input value help icon");

							var oValueHelpIcon3 = oField3.getAggregation("_field")._oValueHelpIcon;
							assert.ok(oValueHelpIcon3.isA("sap.ui.core.Icon"), "oField3: Input value help icon");
							assert.equal(oValueHelpIcon3.getSrc(), "sap-icon://translate", "oField3: Input value help icon src");
							oField3.attachEventOnce("translationPopoverOpened", function () {
								var oTranslationPopover3 = oField3._oTranslationPopover;
								var aHeaderItems3 = oTranslationPopover3.getCustomHeader().getItems();
								assert.equal(aHeaderItems3[2].getItems()[1].getValue(), "String 3", "oTranslationPopover3 Header: String 3");
								assert.ok(aHeaderItems3[2].getItems()[1].getEditable() === false, "oTranslationPopover3 Header: Editable false");
								assert.ok(oTranslationPopover3.getContent()[0].isA("sap.m.List"), "oTranslationPopover3 Content: List");
								var oLanguageItems3 = oTranslationPopover3.getContent()[0].getItems();
								assert.equal(oLanguageItems3.length, 48, "oTranslationPopover3 Content: length");
								for (var i = 1; i < oLanguageItems3.length; i++) {
									var sLanguage = oLanguageItems3[i].getCustomData()[0].getKey();
									var sCurrentValue = oLanguageItems3[i].getContent()[0].getItems()[1].getValue();
									assert.equal(sCurrentValue, "String 3", "oTranslationPopover3 Content: item " + i + " " + sLanguage + ", current: " + sCurrentValue + ", expected: String 3");
								}
								var oCancelButton3 = oTranslationPopover3.getFooter().getContent()[2];
								oCancelButton3.firePress();

								var oValueHelpIcon4 = oField4.getAggregation("_field")._oValueHelpIcon;
								assert.ok(oValueHelpIcon4.isA("sap.ui.core.Icon"), "oField4: Input value help icon");
								assert.equal(oValueHelpIcon4.getSrc(), "sap-icon://translate", "oField4: Input value help icon src");
								oField4.attachEventOnce("translationPopoverOpened", function () {
									var oTranslationPopover4 = oField4._oTranslationPopover;
									var aHeaderItems4 = oTranslationPopover4.getCustomHeader().getItems();
									assert.equal(aHeaderItems4[2].getItems()[1].getValue(), "String 4 NOLANG", "oTranslationPopover4 Header: String 4 NOLANG");
									assert.ok(aHeaderItems4[2].getItems()[1].getEditable() === false, "oTranslationPopover4 Header: Editable false");
									assert.ok(oTranslationPopover4.getContent()[0].isA("sap.m.List"), "oTranslationPopover4 Content: List");
									var oLanguageItems4 = oTranslationPopover4.getContent()[0].getItems();
									assert.equal(oLanguageItems4.length, 48, "oTranslationPopover4 Content: length");
									for (var i = 1; i < oLanguageItems4.length; i++) {
										var sLanguage = oLanguageItems4[i].getCustomData()[0].getKey();
										var sExpectedValue = "String 4 NOLANG";
										var sCurrentValue = oLanguageItems4[i].getContent()[0].getItems()[1].getValue();
										assert.equal(sCurrentValue, sExpectedValue, "oTranslationPopover4 Content: item " + i + " " + sLanguage + ", current: " + sCurrentValue + ", expected: " + sExpectedValue);
									}
									var oCancelButton4 = oTranslationPopover4.getFooter().getContent()[2];
									oCancelButton4.firePress();
									destroyEditor(that.oEditor);
									resolve();
								});
								oValueHelpIcon4.firePress();
								oValueHelpIcon4.focus();
							});
							oValueHelpIcon3.firePress();
							oValueHelpIcon3.focus();
						});
						oValueHelpIcon1.firePress();
						oValueHelpIcon1.focus();
					});
				});
			});
		});

		_aCheckedLanguages.forEach(function(oCoreLanguage) {
			var sCoreLanguageKey = oCoreLanguage.key;
			_aCheckedLanguages.forEach(function(oEditorLanguage) {
				var sEditorLanguageKey = oEditorLanguage.key;
				var sCaseTitle = "Core: " + sCoreLanguageKey + ", Editor: " + sEditorLanguageKey;
				QUnit.test(sCaseTitle, function (assert) {
					var that = this;
					//Fallback language
					return new Promise(function (resolve, reject) {
						that.oEditor = EditorQunitUtils.createEditor(sCoreLanguageKey);
						that.oEditor.setMode("translation");
						that.oEditor.setLanguage(sEditorLanguageKey);
						that.oEditor.setAllowSettings(true);
						that.oEditor.setAllowDynamicValues(true);
						that.oEditor.setJson({
							baseUrl: sBaseUrl,
							host: "contexthost",
							manifest: _oManifestWithi18nOriginFileOnly
						});
						EditorQunitUtils.isFieldReady(that.oEditor).then(function () {
							assert.ok(that.oEditor.isFieldReady(), "Editor fields are ready");
							var oField1Ori = that.oEditor.getAggregation("_formContent")[3];
							var oField1Trans = that.oEditor.getAggregation("_formContent")[4];
							var oField3Ori = that.oEditor.getAggregation("_formContent")[6];
							var oField3Trans = that.oEditor.getAggregation("_formContent")[7];
							var oField4Ori = that.oEditor.getAggregation("_formContent")[9];
							var oField4Trans = that.oEditor.getAggregation("_formContent")[10];
							EditorQunitUtils.wait().then(function () {
								assert.equal(oField1Ori.getAggregation("_field").getText(), "String 1 NOLANG", "Field1Ori: String 1 NOLANG");
								assert.ok(oField1Trans.getAggregation("_field").getEditable() === true, "Field1Trans: Editable");
								assert.equal(oField1Trans.getAggregation("_field").getValue(), "String 1 NOLANG", "Field1Trans: String 1 NOLANG");
								assert.ok(oField1Trans.getAggregation("_field").isA("sap.m.Input"), "Field1Trans: Input control");
								assert.equal(oField1Trans.getAggregation("_field").getAggregation("_endIcon"), null, "Field1Trans: No Input value help icon");
								assert.equal(oField3Ori.getAggregation("_field").getText(), "String 3", "Field3Ori: String 3");
								assert.ok(oField3Trans.getAggregation("_field").getEditable() === true, "Field3Trans: Editable");
								assert.equal(oField3Trans.getAggregation("_field").getValue(), "String 3", "Field3Trans: String 3");
								assert.ok(oField3Trans.getAggregation("_field").isA("sap.m.Input"), "Field3Trans: Input control");
								assert.equal(oField3Trans.getAggregation("_field").getAggregation("_endIcon"), null, "Field3Trans: No Input value help icon");
								assert.equal(oField4Ori.getAggregation("_field").getText(), "String 4 NOLANG", "Field4Ori: String 4 NOLANG");
								assert.ok(oField4Trans.getAggregation("_field").getEditable() === true, "Field4Trans: Editable");
								assert.equal(oField4Trans.getAggregation("_field").getValue(), "String 4 NOLANG", "Field4Trans: String 4 NOLANG");
								assert.ok(oField4Trans.getAggregation("_field").isA("sap.m.Input"), "Field4Trans: Input control");
								assert.equal(oField4Trans.getAggregation("_field").getAggregation("_endIcon"), null, "Field4Trans: No Input value help icon");
							}).then(function () {
								destroyEditor(that.oEditor);
								resolve();
							});
						});
					});
				});
			});
		});
	});

	QUnit.done(function () {
		document.getElementById("qunit-fixture").style.display = "none";
	});
});
