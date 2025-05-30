/* global QUnit */
sap.ui.define([
	"sap-ui-integration-editor",
	"sap/base/i18n/Localization",
	"sap/ui/integration/editor/Editor",
	"sap/ui/integration/Host",
	"sap/ui/thirdparty/sinon-4",
	"./../../../../ContextHost",
	"sap/base/util/deepEqual",
	"sap/base/util/deepClone",
	"sap/base/util/merge",
	"qunit/designtime/EditorQunitUtils"
], function (
	x,
	Localization,
	Editor,
	Host,
	sinon,
	ContextHost,
	deepEqual,
	deepClone,
	merge,
	EditorQunitUtils
) {
	"use strict";
	QUnit.config.reorder = false;

	var sBaseUrl = "test-resources/sap/ui/integration/qunit/editor/jsons/withDesigntime/sap.card/";
	var _aCheckedLanguages = [
		{
			"key": "fr-CA",
			"description": "Français (Canada)"
		},
		{
			"key": "zh-CN",
			"description": "简体中文"
		},
		{
			"key": "zh-TW",
			"description": "繁體中文"
		}
	];
	var oManifestForobjectFieldsWithTranslations = {
		"sap.app": {
			"id": "test.sample",
			"i18n": "../i18ntrans/i18n.properties"
		},
		"sap.card": {
			"designtime": "designtime/objectFieldsWithTranslations",
			"type": "List",
			"configuration": {
				"parameters": {
					"objectWithPropertiesDefined1": {},
					"objectWithPropertiesDefined2": {},
					"objectWithPropertiesDefined3": {}
				},
				"destinations": {
					"local": {
						"name": "local",
						"defaultUrl": "./"
					},
					"mock_request": {
						"name": "mock_request"
					}
				}
			}
		}
	};

	var oValueOfObject1InContentChange = {
		"_dt": {
			"_uuid": "111771a4-0d3f-4fec-af20-6f28f1b894cb"
		},
		"icon": "sap-icon://add",
		"text": "string2",
		"url": "http://",
		"number": 0.5
	};
	var oValueOfObject2InContentChange = {
		"_dt": {
			"_uuid": "222771a4-0d3f-4fec-af20-6f28f1b894cb"
		},
		"icon": "sap-icon://add",
		"text": "{i18n>string1}",
		"url": "http://",
		"number": 0.5
	};
	var oValueOfObject3InContentChange = {
		"_dt": {
			"_uuid": "333771a4-0d3f-4fec-af20-6f28f1b894cb"
		},
		"icon": "sap-icon://add",
		"text": "string4",
		"url": "http://",
		"number": 0.5
	};
	var _oContentChangesOfObjectsWithWithTranslations = {
		"/sap.card/configuration/parameters/objectWithPropertiesDefined1/value": oValueOfObject1InContentChange,
		"/sap.card/configuration/parameters/objectWithPropertiesDefined2/value": oValueOfObject2InContentChange,
		"/sap.card/configuration/parameters/objectWithPropertiesDefined3/value": oValueOfObject3InContentChange,
		":layer": 5,
		":errors": false,
		"texts": {
			"en": {
				"/sap.card/configuration/parameters/objectWithPropertiesDefined1/value": {
					"111771a4-0d3f-4fec-af20-6f28f1b894cb": {
						"text": "String2 EN Content"
					}
				},
				"/sap.card/configuration/parameters/objectWithPropertiesDefined2/value": {
					"222771a4-0d3f-4fec-af20-6f28f1b894cb": {
						"text": "String1 EN Content"
					}
				},
				"/sap.card/configuration/parameters/objectWithPropertiesDefined3/value": {
					"333771a4-0d3f-4fec-af20-6f28f1b894cb": {
						"text": "String4 EN Content"
					}
				}
			},
			"fr": {
				"/sap.card/configuration/parameters/objectWithPropertiesDefined2/value": {
					"222771a4-0d3f-4fec-af20-6f28f1b894cb": {
						"text": "String1 FR Content"
					}
				}
			},
			"ru": {
				"/sap.card/configuration/parameters/objectWithPropertiesDefined1/value": {
					"111771a4-0d3f-4fec-af20-6f28f1b894cb": {
						"text": "String2 RU Content"
					}
				},
				"/sap.card/configuration/parameters/objectWithPropertiesDefined3/value": {
					"333771a4-0d3f-4fec-af20-6f28f1b894cb": {
						"text": "String4 RU Content"
					}
				}
			},
			"zh-CN": {
				"/sap.card/configuration/parameters/objectWithPropertiesDefined2/value": {
					"222771a4-0d3f-4fec-af20-6f28f1b894cb": {
						"text": "String1 简体 Content"
					}
				}
			},
			"zh-TW": {
				"/sap.card/configuration/parameters/objectWithPropertiesDefined1/value": {
					"111771a4-0d3f-4fec-af20-6f28f1b894cb": {
						"text": "String2 繁體 Content"
					}
				},
				"/sap.card/configuration/parameters/objectWithPropertiesDefined3/value": {
					"333771a4-0d3f-4fec-af20-6f28f1b894cb": {
						"text": "String4 繁體 Content"
					}
				}
			}
		}
	};
	var _oExpectedValuesOfChangesFromContent = {
		"objectWithPropertiesDefined1": {
			"default": "string2",
			"en": "String2 EN Content",
			"ru": "String2 RU Content",
			"zh-TW": "String2 繁體 Content"
		},
		"objectWithPropertiesDefined2": {
			"default": "String 1 English",
			"en": "String1 EN Content",
			"en-US": "String 1 US English",
			"es-MX": "String 1 Spanish MX",
			"fr": "String1 FR Content",
			"fr-FR": "String 1 French",
			"fr-CA": "String 1 French CA",
			"zh-CN": "String1 简体 Content"
		},
		"objectWithPropertiesDefined3": {
			"default": "string4",
			"en": "String4 EN Content",
			"ru": "String4 RU Content",
			"zh-TW": "String4 繁體 Content"
		}
	};
	function destroyEditor(oEditor) {
		oEditor.destroy();
		var oContent = document.getElementById("content");
		if (oContent) {
			oContent.innerHTML = "";
			document.body.style.zIndex = "unset";
		}
	}

	Localization.setLanguage("en");
	document.body.className = document.body.className + " sapUiSizeCompact ";

	QUnit.module("content mode", {
		beforeEach: function () {
			this.oHost = new Host("host");
			this.oContextHost = new ContextHost("contexthost");
		},
		afterEach: function () {
			this.oHost.destroy();
			this.oContextHost.destroy();
		}
	}, function () {
		_aCheckedLanguages.forEach(function(sLanguage) {
			var sLanguageKey = sLanguage.key;
			var sCaseTitle = "in " + sLanguageKey + " (" + sLanguage.description + ")";
			QUnit.test(sCaseTitle, function (assert) {
				var that = this;
				return new Promise(function (resolve, reject) {
					that.oEditor = EditorQunitUtils.createEditor(sLanguageKey);
					that.oEditor.setMode("content");
					that.oEditor.setAllowSettings(true);
					that.oEditor.setAllowDynamicValues(true);
					that.oEditor.setJson({
						baseUrl: sBaseUrl,
						host: "contexthost",
						manifest: oManifestForobjectFieldsWithTranslations,
						manifestChanges: [_oContentChangesOfObjectsWithWithTranslations]
					});
					EditorQunitUtils.isFieldReady(that.oEditor).then(function () {
						assert.ok(that.oEditor.isFieldReady(), "Editor fields are ready");
						var oLabel1 = that.oEditor.getAggregation("_formContent")[1];
						var oField1 = that.oEditor.getAggregation("_formContent")[2];
						var oLabel2 = that.oEditor.getAggregation("_formContent")[3];
						var oField2 = that.oEditor.getAggregation("_formContent")[4];
						var oLabel3 = that.oEditor.getAggregation("_formContent")[5];
						var oField3 = that.oEditor.getAggregation("_formContent")[6];
						var oSelectedValueOfField1 = merge(deepClone(oValueOfObject1InContentChange, 500), {"_dt": {"_selected": true}});
						var oSelectedValueOfField2 = merge(deepClone(oValueOfObject2InContentChange, 500), {"_dt": {"_selected": true}});
						var oSelectedValueOfField3 = merge(deepClone(oValueOfObject3InContentChange, 500), {"_dt": {"_selected": true}});
						EditorQunitUtils.isReady(that.oEditor).then(function () {
							assert.ok(that.oEditor.isReady(), "Editor is ready");
							assert.ok(oLabel1.isA("sap.m.Label"), "Label 1: Form content contains a Label");
							assert.equal(oLabel1.getText(), "Object properties defined: value from Json list", "Label 1: Has label text");
							assert.ok(oField1.isA("sap.ui.integration.editor.fields.ObjectField"), "Field 1: Object Field");
							assert.ok(deepEqual(oField1._getCurrentProperty("value"), oValueOfObject1InContentChange), "Field 1: Value");
							var oTable1 = oField1.getAggregation("_field");
							var oToolbar1 = oTable1.getExtension()[0];
							assert.equal(oTable1.getBinding().getCount(), 9, "Table 1: value length is 9");
							assert.equal(oToolbar1.getContent().length, 7, "Table toolbar 1: content length");
							var oEditButton1 = oToolbar1.getContent()[2];
							assert.ok(oEditButton1.getVisible(), "Table toolbar 1: edit button visible");
							assert.ok(!oEditButton1.getEnabled(), "Table toolbar 1: edit button disabled");
							var oRow1 = oTable1.getRows()[0];
							assert.ok(deepEqual(oRow1.getBindingContext().getObject(), oSelectedValueOfField1), "Table 1: value object is the first row");
							var oTextCell1 = oRow1.getCells()[3];
							var sTextPropertyValue = _oExpectedValuesOfChangesFromContent["objectWithPropertiesDefined1"][sLanguageKey] || _oExpectedValuesOfChangesFromContent["objectWithPropertiesDefined1"]["default"];
							assert.equal(oTextCell1.getText(), sTextPropertyValue, "Row 1: text cell value");
							oTable1.setSelectedIndex(0);
							oTable1.fireRowSelectionChange({
								rowIndex: 0,
								userInteraction: true
							});
							assert.ok(oEditButton1.getEnabled(), "Table toolbar 1: edit button enabled");
							oEditButton1.onAfterRendering = function(oEvent) {
								oEditButton1.onAfterRendering = function () {};
								oEditButton1.firePress();
								EditorQunitUtils.wait().then(function () {
									var oAddButtonInPopover1 = oField1._oObjectDetailsPopover._oAddButton;
									assert.ok(!oAddButtonInPopover1.getVisible(), "Popover 1: add button not visible");
									var oUpdateButtonInPopover1 = oField1._oObjectDetailsPopover._oUpdateButton;
									assert.ok(oUpdateButtonInPopover1.getVisible(), "Popover 1: update button visible");
									var oCancelButtonInPopover1 = oField1._oObjectDetailsPopover._oCancelButton;
									assert.ok(oCancelButtonInPopover1.getVisible(), "Popover 1: cancel button visible");
									var oCloseButtonInPopover1 = oField1._oObjectDetailsPopover._oCloseButton;
									assert.ok(!oCloseButtonInPopover1.getVisible(), "Popover 1: close button not visible");
									var oSimpleForm1 = oField1._oObjectDetailsPopover.getContent()[0].getPages()[0].getContent()[0];
									assert.ok(oSimpleForm1.isA("sap.ui.layout.form.SimpleForm"), "Popover 1: content is SimpleForm");
									var oContents1 = oSimpleForm1.getContent();
									assert.equal(oContents1.length, 16, "SimpleForm 1: length");
									assert.ok(deepEqual(JSON.parse(oContents1[15].getValue()), oSelectedValueOfField1), "SimpleForm 1 field textArea: Has the value");
									var oFormLabel3 = oContents1[4];
									var oFormField3 = oContents1[5];
									assert.equal(oFormLabel3.getText(), "Text", "SimpleForm 1 label 3: Has label text");
									assert.ok(oFormLabel3.getVisible(), "SimpleForm 1 label 3: Visible");
									assert.ok(oFormField3.isA("sap.m.Input"), "SimpleForm 1 Field 3: Input Field");
									assert.ok(oFormField3.getVisible(), "SimpleForm 1 Field 3: Visible");
									assert.ok(oFormField3.getEditable(), "SimpleForm 1 Field 3: Editable");
									assert.equal(oFormField3.getValue(), oValueOfObject1InContentChange.text, "SimpleForm 1 field 3: Has value");
									assert.ok(oFormField3.getShowValueHelp(), "SimpleForm 1 field 3: ShowValueHelp true");
									var oValueHelpIcon1 = oFormField3._oValueHelpIcon;
									assert.ok(oValueHelpIcon1, "SimpleForm 1 field 3: Value help icon exist");
									assert.ok(oValueHelpIcon1.getVisible(), "SimpleForm 1 field 3: Value help icon visible");
									assert.ok(oValueHelpIcon1.isA("sap.ui.core.Icon"), "SimpleForm 1 field 3: Input value help icon");
									assert.equal(oValueHelpIcon1.getSrc(), "sap-icon://translate", "SimpleForm 1 field 3: Input value help icon src");
									oValueHelpIcon1.firePress();
									EditorQunitUtils.wait(1500).then(function () {
										var oTranslationListPage1 = oField1._oTranslationListPage;
										var oSaveButton1 = oTranslationListPage1.getFooter().getContent()[1];
										assert.ok(oSaveButton1.getVisible(), "oTranslationListPage 1 footer: save button visible");
										assert.ok(!oSaveButton1.getEnabled(), "oTranslationListPage 1 footer: save button disabled");
										var oResetButton1 = oTranslationListPage1.getFooter().getContent()[2];
										assert.ok(oResetButton1.getVisible(), "oTranslationListPage 1 footer: reset button visible");
										assert.ok(!oResetButton1.getEnabled(), "oTranslationListPage 1 footer: reset button disabled");
										var oCancelButton1 = oTranslationListPage1.getFooter().getContent()[3];
										assert.ok(!oCancelButton1.getVisible(), "oTranslationListPage 1 footer: cancel button not visible");
										var oLanguageItems1 = oTranslationListPage1.getContent()[0].getItems();
										assert.equal(oLanguageItems1.length, 49, "oTranslationPopover1 Content: length");
										for (var i = 0; i < oLanguageItems1.length; i++) {
											var oCustomData = oLanguageItems1[i].getCustomData();
											if (oCustomData && oCustomData.length > 0) {
												var sLanguage = oCustomData[0].getKey();
												var sExpectedValue = _oExpectedValuesOfChangesFromContent["objectWithPropertiesDefined1"][sLanguage] || _oExpectedValuesOfChangesFromContent["objectWithPropertiesDefined1"]["default"];
												var sCurrentValue = oLanguageItems1[i].getContent()[0].getItems()[1].getValue();
												assert.equal(sCurrentValue, sExpectedValue, "oTranslationPopover 1 Content: item " + i + " " + sLanguage + ", current: " + sCurrentValue + ", expected: " + sExpectedValue);
											}
										}
										oTranslationListPage1._navBtn.firePress();
										oCancelButtonInPopover1.firePress();
										EditorQunitUtils.wait().then(function () {
											assert.ok(oLabel2.isA("sap.m.Label"), "Label 2: Form content contains a Label");
											assert.equal(oLabel2.getText(), "Object properties defined: value from Json list", "Label 2: Has label text");
											assert.ok(oField2.isA("sap.ui.integration.editor.fields.ObjectField"), "Field 2: Object Field");
											assert.ok(deepEqual(oField2._getCurrentProperty("value"), oValueOfObject2InContentChange), "Field 2: Value");
											var oTable2 = oField2.getAggregation("_field");
											var oToolbar2 = oTable2.getExtension()[0];
											assert.equal(oTable2.getBinding().getCount(), 9, "Table 2: value length is 9");
											assert.equal(oToolbar2.getContent().length, 7, "Table toolbar 2: content length");
											var oEditButton2 = oToolbar2.getContent()[2];
											assert.ok(oEditButton2.getVisible(), "Table toolbar 2: edit button visible");
											assert.ok(!oEditButton2.getEnabled(), "Table toolbar 2: edit button disabled");
											oRow1 = oTable2.getRows()[0];
											assert.ok(deepEqual(oRow1.getBindingContext().getObject(), oSelectedValueOfField2), "Table 2: value object is the first row");
											oTextCell1 = oRow1.getCells()[3];
											sTextPropertyValue = _oExpectedValuesOfChangesFromContent["objectWithPropertiesDefined2"][sLanguageKey] || _oExpectedValuesOfChangesFromContent["objectWithPropertiesDefined2"]["default"];
											assert.equal(oTextCell1.getText(), sTextPropertyValue, "Row 1: text cell value");
											oTable2.setSelectedIndex(0);
											oTable2.fireRowSelectionChange({
												rowIndex: 0,
												userInteraction: true
											});
											assert.ok(oEditButton2.getEnabled(), "Table toolbar 1: edit button enabled");
											oEditButton2.firePress();
											EditorQunitUtils.wait().then(function () {
												var oAddButtonInPopover2 = oField2._oObjectDetailsPopover._oAddButton;
												assert.ok(!oAddButtonInPopover2.getVisible(), "Popover 2: add button not visible");
												var oUpdateButtonInPopover2 = oField2._oObjectDetailsPopover._oUpdateButton;
												assert.ok(oUpdateButtonInPopover2.getVisible(), "Popover 2: update button visible");
												var oCancelButtonInPopover2 = oField2._oObjectDetailsPopover._oCancelButton;
												assert.ok(oCancelButtonInPopover2.getVisible(), "Popover 2: cancel button visible");
												var oCloseButtonInPopover2 = oField2._oObjectDetailsPopover._oCloseButton;
												assert.ok(!oCloseButtonInPopover2.getVisible(), "Popover 2: close button not visible");
												var oSimpleForm2 = oField2._oObjectDetailsPopover.getContent()[0].getPages()[0].getContent()[0];
												assert.ok(oSimpleForm2.isA("sap.ui.layout.form.SimpleForm"), "Popover 1: content is SimpleForm");
												var oContents2 = oSimpleForm2.getContent();
												assert.equal(oContents2.length, 16, "SimpleForm 1: length");
												assert.ok(deepEqual(JSON.parse(oContents2[15].getValue()), oSelectedValueOfField2), "SimpleForm 2 field textArea: Has the value");
												oFormLabel3 = oContents2[4];
												oFormField3 = oContents2[5];
												assert.equal(oFormLabel3.getText(), "Text", "SimpleForm 2 label 3: Has label text");
												assert.ok(oFormLabel3.getVisible(), "SimpleForm 2 label 3: Visible");
												assert.ok(oFormField3.isA("sap.m.Input"), "SimpleForm 2 Field 3: Input Field");
												assert.ok(oFormField3.getVisible(), "SimpleForm 2 Field 3: Visible");
												assert.ok(oFormField3.getEditable(), "SimpleForm 2 Field 3: Editable");
												assert.equal(oFormField3.getValue(), oValueOfObject2InContentChange.text, "SimpleForm 2 field 3: Has value");
												assert.ok(oFormField3.getShowValueHelp(), "SimpleForm 2 field 3: ShowValueHelp true");
												var oValueHelpIcon2 = oFormField3._oValueHelpIcon;
												assert.ok(oValueHelpIcon2, "SimpleForm field 3: Value help icon exist");
												assert.ok(oValueHelpIcon2.getVisible(), "SimpleForm 2 field 3: Value help icon visible");
												assert.ok(oValueHelpIcon2.isA("sap.ui.core.Icon"), "SimpleForm 2 field 3: Input value help icon");
												assert.equal(oValueHelpIcon2.getSrc(), "sap-icon://translate", "SimpleForm 2 field 3: Input value help icon src");
												oValueHelpIcon2.firePress();
												EditorQunitUtils.wait().then(function () {
													var oTranslationListPage2 = oField2._oTranslationListPage;
													var oSaveButton2 = oTranslationListPage2.getFooter().getContent()[1];
													assert.ok(oSaveButton2.getVisible(), "oTranslationListPage 2 footer: save button visible");
													assert.ok(!oSaveButton2.getEnabled(), "oTranslationListPage 2 footer: save button disabled");
													var oResetButton2 = oTranslationListPage2.getFooter().getContent()[2];
													assert.ok(oResetButton2.getVisible(), "oTranslationListPage 2 footer: reset button visible");
													assert.ok(!oResetButton2.getEnabled(), "oTranslationListPage 2 footer: reset button disabled");
													var oCancelButton2 = oTranslationListPage2.getFooter().getContent()[3];
													assert.ok(!oCancelButton2.getVisible(), "oTranslationListPage 2 footer: cancel button not visible");
													var oLanguageItems2 = oTranslationListPage2.getContent()[0].getItems();
													assert.equal(oLanguageItems2.length, 49, "oTranslationPopover 2 Content: length");
													for (var i = 0; i < oLanguageItems2.length; i++) {
														var oCustomData = oLanguageItems2[i].getCustomData();
														if (oCustomData && oCustomData.length > 0) {
															var sLanguage = oCustomData[0].getKey();
															var sExpectedValue = _oExpectedValuesOfChangesFromContent["objectWithPropertiesDefined2"][sLanguage] || _oExpectedValuesOfChangesFromContent["objectWithPropertiesDefined2"]["default"];
															var sCurrentValue = oLanguageItems2[i].getContent()[0].getItems()[1].getValue();
															assert.equal(sCurrentValue, sExpectedValue, "oTranslationPopover2 Content: item " + i + " " + sLanguage + ", current: " + sCurrentValue + ", expected: " + sExpectedValue);
														}
													}
													oTranslationListPage2._navBtn.firePress();
													oCancelButtonInPopover2.firePress();
													EditorQunitUtils.wait().then(function () {
														assert.ok(oLabel3.isA("sap.m.Label"), "Label 3: Form content contains a Label");
														assert.equal(oLabel3.getText(), "Object properties defined: value from Json list", "Label 3: Has label text");
														assert.ok(oField3.isA("sap.ui.integration.editor.fields.ObjectField"), "Field 3: Object Field");
														assert.ok(deepEqual(oField3._getCurrentProperty("value"), oValueOfObject3InContentChange), "Field 3: Value");
														var oTable3 = oField3.getAggregation("_field");
														var oToolbar3 = oTable3.getExtension()[0];
														assert.equal(oTable3.getBinding().getCount(), 9, "Table 3: value length is 9");
														assert.equal(oToolbar3.getContent().length, 7, "Table toolbar 3: content length");
														var oEditButton3 = oToolbar3.getContent()[2];
														assert.ok(oEditButton3.getVisible(), "Table toolbar 3: edit button visible");
														assert.ok(!oEditButton3.getEnabled(), "Table toolbar 3: edit button disabled");
														oRow1 = oTable3.getRows()[0];
														assert.ok(deepEqual(oRow1.getBindingContext().getObject(), oSelectedValueOfField3), "Table 3: value object is the first row");
														oTextCell1 = oRow1.getCells()[3];
														sTextPropertyValue = _oExpectedValuesOfChangesFromContent["objectWithPropertiesDefined3"][sLanguageKey] || _oExpectedValuesOfChangesFromContent["objectWithPropertiesDefined3"]["default"];
														assert.equal(oTextCell1.getText(), sTextPropertyValue, "Row 1: text cell value");
														oTable3.setSelectedIndex(0);
														oTable3.fireRowSelectionChange({
															rowIndex: 0,
															userInteraction: true
														});
														assert.ok(oEditButton3.getEnabled(), "Table toolbar 3: edit button enabled");
														oEditButton3.firePress();
														EditorQunitUtils.wait().then(function () {
															var oAddButtonInPopover3 = oField3._oObjectDetailsPopover._oAddButton;
															assert.ok(!oAddButtonInPopover3.getVisible(), "Popover 3: add button not visible");
															var oUpdateButtonInPopover3 = oField3._oObjectDetailsPopover._oUpdateButton;
															assert.ok(oUpdateButtonInPopover3.getVisible(), "Popover 3: update button visible");
															var oCancelButtonInPopover3 = oField3._oObjectDetailsPopover._oCancelButton;
															assert.ok(oCancelButtonInPopover3.getVisible(), "Popover 3: cancel button visible");
															var oCloseButtonInPopover3 = oField3._oObjectDetailsPopover._oCloseButton;
															assert.ok(!oCloseButtonInPopover3.getVisible(), "Popover 3: close button not visible");
															var oSimpleForm3 = oField3._oObjectDetailsPopover.getContent()[0].getPages()[0].getContent()[0];
															assert.ok(oSimpleForm3.isA("sap.ui.layout.form.SimpleForm"), "Popover 3: content is SimpleForm");
															var oContents3 = oSimpleForm3.getContent();
															assert.equal(oContents3.length, 16, "SimpleForm 3: length");
															assert.ok(deepEqual(JSON.parse(oContents3[15].getValue()), oSelectedValueOfField3), "SimpleForm 3 field textArea: Has the value");
															oFormLabel3 = oContents3[4];
															oFormField3 = oContents3[5];
															assert.equal(oFormLabel3.getText(), "Text", "SimpleForm 3 label 3: Has label text");
															assert.ok(oFormLabel3.getVisible(), "SimpleForm 3 label 3: Visible");
															assert.ok(oFormField3.isA("sap.m.Input"), "SimpleForm 3 Field 3: Input Field");
															assert.ok(oFormField3.getVisible(), "SimpleForm 3 Field 3: Visible");
															assert.ok(oFormField3.getEditable(), "SimpleForm 3 Field 3: Editable");
															assert.equal(oFormField3.getValue(), oValueOfObject3InContentChange.text, "SimpleForm 3 field 3: Has value");
															assert.ok(oFormField3.getShowValueHelp(), "SimpleForm 3 field 3: ShowValueHelp true");
															var oValueHelpIcon3 = oFormField3._oValueHelpIcon;
															assert.ok(oValueHelpIcon3, "SimpleForm 3 field 3: Value help icon exist");
															assert.ok(oValueHelpIcon3.getVisible(), "SimpleForm 3 field 3: Value help icon visible");
															assert.ok(oValueHelpIcon3.isA("sap.ui.core.Icon"), "SimpleForm 3 field 3: Input value help icon");
															assert.equal(oValueHelpIcon3.getSrc(), "sap-icon://translate", "SimpleForm 3 field 3: Input value help icon src");
															oValueHelpIcon3.firePress();
															EditorQunitUtils.wait().then(function () {
																var oTranslationListPage3 = oField3._oTranslationListPage;
																var oSaveButton3 = oTranslationListPage3.getFooter().getContent()[1];
																assert.ok(oSaveButton3.getVisible(), "oTranslationListPage 3 footer: save button visible");
																assert.ok(!oSaveButton3.getEnabled(), "oTranslationListPage 3 footer: save button disabled");
																var oResetButton3 = oTranslationListPage3.getFooter().getContent()[2];
																assert.ok(oResetButton3.getVisible(), "oTranslationListPage 3 footer: reset button visible");
																assert.ok(!oResetButton3.getEnabled(), "oTranslationListPage 3 footer: reset button disabled");
																var oCancelButton3 = oTranslationListPage3.getFooter().getContent()[3];
																assert.ok(!oCancelButton3.getVisible(), "oTranslationListPage 3 footer: cancel button not visible");
																var oLanguageItems3 = oTranslationListPage3.getContent()[0].getItems();
																assert.equal(oLanguageItems3.length, 49, "oTranslationPopover 3 Content: length");
																for (var i = 0; i < oLanguageItems3.length; i++) {
																	var oCustomData = oLanguageItems3[i].getCustomData();
																	if (oCustomData && oCustomData.length > 0) {
																		var sLanguage = oCustomData[0].getKey();
																		var sExpectedValue = _oExpectedValuesOfChangesFromContent["objectWithPropertiesDefined3"][sLanguage] || _oExpectedValuesOfChangesFromContent["objectWithPropertiesDefined3"]["default"];
																		var sCurrentValue = oLanguageItems3[i].getContent()[0].getItems()[1].getValue();
																		assert.equal(sCurrentValue, sExpectedValue, "oTranslationPopover 3 Content: item " + i + " " + sLanguage + ", current: " + sCurrentValue + ", expected: " + sExpectedValue);
																	}
																}
																destroyEditor(that.oEditor);
																resolve();
															});
														});
													});
												});
											});
										});
									});
								});
							};
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
