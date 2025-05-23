/* global QUnit */
sap.ui.define([
	"sap/m/p13n/Popup",
	"sap/m/Button",
	"sap/ui/core/Element",
	"sap/ui/core/Control",
	"sap/ui/qunit/utils/nextUIUpdate",
	"sap/m/p13n/SelectionPanel",
	"sap/m/p13n/SortPanel",
	"sap/ui/model/json/JSONModel",
	"sap/base/i18n/Localization",
	"sap/ui/thirdparty/sinon"
], function(P13nPopup, Button, Element, Control, nextUIUpdate, SelectionPanel, SortPanel, JSONModel, Localization, sinon) {
	"use strict";

	QUnit.module("p13n.Popup API tests", {
		beforeEach: async function() {
			var oPopup = new P13nPopup();
			this.oPopup = oPopup;
			this.oPopup.placeAt("qunit-fixture");
			this.oSource = new Button();
			await nextUIUpdate();
		},
		afterEach: function() {
			this.oPopup.destroy();
		}
	});

	QUnit.test("Instantiate Popup", function(assert) {
		assert.ok(this.oPopup, "Popup could be instantiated");
	});

	QUnit.test("Error handling on 'open'", function(assert) {
		this.oPopup.setMode("ResponsivePopover");
		assert.throws(function(){
			this.oPopup.open();
		}, 'Error thrown in case no source control is provided');

	});

	QUnit.test("Check 'isOpen'", function(assert) {
		assert.equal(this.oPopup.isOpen(), false, "Popup is initially not open");

		//Check open
		this.oPopup.open(this.oSource);
		assert.equal(this.oPopup.isOpen(), true, "Popup is open");

		//Check OK
		this.oPopup._oPopup.getButtons()[0].firePress();
		assert.equal(this.oPopup.isOpen(), false, "Popup is closed");

		//Check Cancel
		this.oPopup.open(this.oSource);
		this.oPopup._oPopup.getButtons()[1].firePress();
		assert.equal(this.oPopup.isOpen(), false, "Popup is closed");
	});

	QUnit.test("Check 'open' depending on 'mode'", function(assert) {

		this.oPopup.open(this.oSource);

		assert.ok(this.oPopup._oPopup.isA("sap.m.Dialog"), "Popup is a Dialog");

		//Close Dialog
		this.oPopup._oPopup.getButtons()[0].firePress();

		//Switch to ResponsivePopover
		this.oPopup.setMode("ResponsivePopover");
		this.oPopup.open(this.oSource);
		assert.ok(this.oPopup._oPopup.isA("sap.m.ResponsivePopover"), "Popup is a ResponsivePopover");
	});

	QUnit.test("Check 'open' with custom width & height settings (Dialog mode)", function(assert) {

		var oOpenSettings = {
			contentWidth: "30rem",
			contentHeight:"10rem"
		};

		this.oPopup.open(this.oSource, oOpenSettings);

		assert.equal(this.oPopup._oPopup.getContentHeight(), oOpenSettings.contentHeight, "Content height propagated");
		assert.equal(this.oPopup._oPopup.getContentWidth(), oOpenSettings.contentWidth, "Content width propagated");
	});

	QUnit.test("Check 'open' without activePanel settings parameter opens first panel", function(assert) {
		// arrange
		const oCustomSelectionPanel = new SelectionPanel({
			title: "My SelectionPanel"
		});
		const oCustomSortPanel = new SortPanel({
			title: "My SortPanel"
		});

		const sSelectionPanelKey = "customSelection";
		const sSortPanelKey = "customSort";

		this.oPopup.addPanel(oCustomSelectionPanel, sSelectionPanelKey);
		this.oPopup.addPanel(oCustomSortPanel, sSortPanelKey);

		// act
		this.oPopup.open(this.oSource, {});

		// assert
		assert.equal(this.oPopup._oContainer.getCurrentViewKey(), sSelectionPanelKey, "SelectionPanel is initially shown");
	});

	QUnit.test("Check 'open' with activePanel settings parameter opens correct view", function(assert) {
		// arrange
		const oCustomSelectionPanel = new SelectionPanel({
			title: "My SelectionPanel"
		});
		const oCustomSortPanel = new SortPanel({
			title: "My SortPanel"
		});

		const sSelectionPanelKey = "customSelection";
		const sSortPanelKey = "customSort";

		this.oPopup.addPanel(oCustomSelectionPanel, sSelectionPanelKey);
		this.oPopup.addPanel(oCustomSortPanel, sSortPanelKey);

		// act
		this.oPopup.open(this.oSource, { activePanel: sSortPanelKey });

		// assert
		assert.equal(this.oPopup._oContainer.getCurrentViewKey(), sSortPanelKey, "SortPanel is currently shown");
	});

	QUnit.test("Check '_getContainer' with parameter does not call switchView", function(assert) {
		// arrange
		assert.equal(this.oPopup._oContainer, undefined, "Container does not exist");
		this.oPopup._getContainer();
		assert.ok(this.oPopup._oContainer, "Container exists");

		const oSwitchViewSpy = sinon.spy(this.oPopup._oContainer, "switchView");

		// act
		this.oPopup._getContainer(true);

		// assert
		assert.ok(oSwitchViewSpy.notCalled, "SortPanel is currently shown");
	});

	QUnit.test("Check 'open' width custom width & height settings (ResponsivePopover mode)", function(assert) {

		var oOpenSettings = {
			contentWidth: "30rem",
			contentHeight:"10rem"
		};

		this.oPopup.setMode("ResponsivePopover");

		this.oPopup.open(this.oSource, oOpenSettings);

		assert.equal(this.oPopup._oPopup.getContentHeight(), oOpenSettings.contentHeight, "Content height propagated");
		assert.equal(this.oPopup._oPopup.getContentWidth(), oOpenSettings.contentWidth, "Content width propagated");
	});

	QUnit.test("Check 'reset' callback NOT provided (button only visible if callback provided)", function(assert) {

		this.oPopup.open(this.oSource);

		//Trigger reset via 'Reset' button
		assert.notOk(this.oPopup._oPopup.getCustomHeader(), "Custom header is not provided");

	});

	QUnit.test("Check 'reset' callback IS provided (button only visible if callback provided)", function(assert) {

		this.oPopup.setReset(function(){});

		this.oPopup.open(this.oSource);

		//Trigger reset via 'Reset' button
		assert.ok(this.oPopup._oPopup.getCustomHeader(), "Custom header is provided");
		assert.ok(this.oPopup._oPopup.getCustomHeader().getContentRight()[0].getText(), "Reset", "The 'Reset' button has been created");

	});

	QUnit.test("Check 'additionalButtons' aggregation", function(assert) {

		this.oPopup.addAdditionalButton(new Button({
			text: "Custom 1"
		}));

		this.oPopup.addAdditionalButton(new Button({
			text: "Custom 2"
		}));

		this.oPopup.open(this.oSource);

		assert.equal(this.oPopup._oPopup.getButtons()[0].getText(), "OK");
		assert.equal(this.oPopup._oPopup.getButtons()[1].getText(), "Cancel");
		assert.equal(this.oPopup._oPopup.getButtons()[2].getText(), "Custom 1");
		assert.equal(this.oPopup._oPopup.getButtons()[3].getText(), "Custom 2");
	});

	QUnit.test("Check propagation of compact style class", function(assert) {


		const oControlWithCompactStyle = new Control();

		oControlWithCompactStyle.addStyleClass("sapUiSizeCompact");
		this.oPopup.setParent(oControlWithCompactStyle);

		this.oPopup.open(this.oSource);
		const bIsCompact = this.oPopup._oPopup.hasStyleClass("sapUiSizeCompact");

		assert.ok(bIsCompact, "The compact style class has been propagated to the Popup");
	});

	QUnit.module("p13n.Popup check events & parameters", {
		beforeEach: async function() {
			var oPopup = new P13nPopup();
			this.oPopup = oPopup;
			this.oPopup.placeAt("qunit-fixture");
			this.oSource = new Button();
			await nextUIUpdate();
		},
		afterEach: function() {
			this.oPopup.destroy();
		}
	});

	QUnit.test("Check close in 'Dialog' mode by clicking 'Ok'", function(assert){

		this.oPopup.attachClose(function(oEvt){
			assert.equal(oEvt.getParameter("reason"), "Ok");
		});

		this.oPopup.open(this.oSource);

		//Press 'OK'
		this.oPopup._oPopup.getButtons()[0].firePress();
	});

	QUnit.test("Check close in 'Dialog' mode by clicking 'Ok'", function(assert){

		this.oPopup.attachClose(function(oEvt){
			assert.equal(oEvt.getParameter("reason"), "Cancel");
		});

		this.oPopup.open(this.oSource);

		//Press 'Cancel'
		this.oPopup._oPopup.getButtons()[1].firePress();
	});

	QUnit.module("p13n.Popup Reset tests", {
		beforeEach: async function() {
			var oPopup = new P13nPopup({
				reset: function() {
					this.fnReset();
				}.bind(this)
			});
			this.oPopup = oPopup;
			this.oPopup.placeAt("qunit-fixture");
			this.oSource = new Button();
			await nextUIUpdate();
		},
		afterEach: function() {
			this.oPopup.destroy();
		}
	});

	QUnit.test("Check focus handling after reset", function(assert){

		this.oPopup.open(this.oSource);
		var oResetBtn = this.oPopup._oPopup.getCustomHeader().getContentRight()[0];
		assert.ok(oResetBtn, "Reset button has been created");

	});

	QUnit.test("Check the 'onReset' hook execution", async function(assert){

		var done = assert.async();

		this.fnReset = function() {};

		var oSelectionPanel = new SelectionPanel();

		oSelectionPanel.onReset = function() {
			assert.ok(true, "Reset hook as been executed");
			done();
		};

		this.oPopup.addPanel(oSelectionPanel);

		this.oPopup.open(this.oSource);
		var oResetBtn = this.oPopup._oPopup.getCustomHeader().getContentRight()[0];

		//1) Trigger reset on Dialog
		oResetBtn.firePress();

		//2) --> Find MessageBox opened by Dialog
		var oMessageBox = Element.registry.filter(function(oElement){return oElement.getMetadata().isA("sap.m.Dialog") && oElement.getTitle() === "Warning";})[0];

		//3) confirm warning
		oMessageBox.getButtons()[0].firePress();
		await nextUIUpdate();

	});

	QUnit.test("Check focus handling after reset", async function(assert){

		var done = assert.async();

		this.fnReset = function() {

			//4) check if the current focused control is the P13nDialogs reset btn
			var nActiveElement = document.activeElement;
			assert.ok(this.oPopup._oPopup.getButtons()[0].getFocusDomRef() === nActiveElement, "The OK button control of the p13n Dialog is focused");
			done();

		}.bind(this);

		this.oPopup.open(this.oSource);

		//1) Trigger reset on Dialog
		var oResetBtn = this.oPopup._oPopup.getCustomHeader().getContentRight()[0];
		oResetBtn.firePress();

		//2) --> Find MessageBox opened by Dialog
		var oMessageBox = Element.registry.filter(function(oElement){return oElement.getMetadata().isA("sap.m.Dialog") && oElement.getTitle() === "Warning";})[0];

		//3) confirm warning
		oMessageBox.getButtons()[0].firePress();
		await nextUIUpdate();

	});

	QUnit.test("Bind inner panel's title property", function(assert){

		var oTestModel = new JSONModel({
			myCustomTitle: "Bound Title"
		});

		var oSelectionPanel = new SelectionPanel({
			title: "{testModel>/myCustomTitle}"
		});

		this.oPopup.addPanel(oSelectionPanel);

		this.oPopup.setModel(oTestModel, "testModel");

		var oContainer = this.oPopup._getContainer();

		var oPopupContainerBindingInfo = oContainer._getTabBar().getItems()[0].getBindingInfo("text").parts;
		var oSelectionPanelBindingInfo = oSelectionPanel.getBindingInfo("title").parts;

		assert.deepEqual(oPopupContainerBindingInfo, oSelectionPanelBindingInfo, "The provided binding info has been propagated to the inner p13n.Container used in the Popup");

	});

	QUnit.module("p13n.Popup add panels dynamically", {
		getCustomPanelClass: function() {
			return Control.extend("temp", {
				metadata: {
					properties: {
						title: {
							type: "string"
						}
					}
				}
			});
		},
		beforeEach: async function() {
			var oPopup = new P13nPopup();
			this.oPopup = oPopup;
			this.oPopup.placeAt("qunit-fixture");
			this.oSource = new Button();
			await nextUIUpdate();
		},
		afterEach: function() {
			this.oPopup.destroy();
		}
	});

	QUnit.test("Check adding panels", function(assert){

		var Custom = this.getCustomPanelClass();
		var oMyPanel = new Custom({
			title: "My Custom Test 1"
		});

		this.oPopup.addPanel(oMyPanel);

		assert.equal(this.oPopup.getPanels().length, 1, "Panel added to the Popup");
		assert.equal(this.oPopup._getContainer().getViews().length, 2, "Panel added to the inner Container (+default view)");

	});


	QUnit.test("Check removing panels", function(assert){

		var Custom = this.getCustomPanelClass();
		var oMyPanel = new Custom({
			title: "My Custom Test 1"
		});

		this.oPopup.addPanel(oMyPanel);
		this.oPopup.removePanel(oMyPanel);

		assert.equal(this.oPopup.getPanels().length, 0, "Panel added and removed");
		assert.equal(this.oPopup._getContainer().getViews().length, 1, "Panel added and removed to the inner Container (+default view)");

	});

	[
		{ amountOfPanels: 0, verticalScrolling: true },
		{ amountOfPanels: 1, verticalScrolling: true },
		{ amountOfPanels: 2, verticalScrolling: false }
	].forEach(function(oConfig) {
		var iAmountOfPanels = oConfig.amountOfPanels;
		var bVerticalScrolling = oConfig.verticalScrolling;
		QUnit.test("_createResponsivePopover with " + iAmountOfPanels +  " panel" + (iAmountOfPanels != 1 ? "s" : ""), function(assert) {
			var Custom = this.getCustomPanelClass();

			for (var iCount = 0; iCount < iAmountOfPanels; iCount++) {
				this.oPopup.addPanel(new Custom({
					title: "My Custom Test"
				}));
			}
			var oResponsivePopover = this.oPopup._createResponsivePopover({});
			assert.equal(this.oPopup.getPanels().length, iAmountOfPanels, iAmountOfPanels + " panel" + (iAmountOfPanels != 1 ? "s" : "") + " on the popup");
			assert.equal(oResponsivePopover.getVerticalScrolling(), bVerticalScrolling, "verticalScrolling is " + (bVerticalScrolling ? "enabled" : "disabled"));
			oResponsivePopover.destroy();
		});

		QUnit.test("_createDialog with " + iAmountOfPanels +  " panel" + (iAmountOfPanels != 1 ? "s" : ""), function(assert) {
			var Custom = this.getCustomPanelClass();

			for (var iCount = 0; iCount < iAmountOfPanels; iCount++) {
				this.oPopup.addPanel(new Custom({
					title: "My Custom Test"
				}));
			}
			var oDialog = this.oPopup._createDialog({});
			assert.equal(this.oPopup.getPanels().length, iAmountOfPanels, iAmountOfPanels + " panel" + (iAmountOfPanels != 1 ? "s" : "") + " on the popup");
			assert.equal(oDialog.getVerticalScrolling(), bVerticalScrolling, "verticalScrolling is " + (bVerticalScrolling ? "enabled" : "disabled"));
			oDialog.destroy();
		});
	});

	QUnit.test("The Popup should only provide vertical scrolling for the content if the content does not provide it itself", function(assert) {

		//Create a popup with one panel
		var oPopup = new P13nPopup({
			panels: [
				new SelectionPanel()
			]
		});

		var oDialog = oPopup._createDialog({});
		assert.equal(oDialog.getVerticalScrolling(), true, "In case there is only one panel, the dialog provides the scrolling");

		//Create a popup with one panel (which can scroll by itself)
		var oScrollablePanel = new SelectionPanel();
		oScrollablePanel.getVerticalScrolling = function() {
			return true;
		};

		oPopup = new P13nPopup({
			panels: [
				oScrollablePanel
			]
		});

		var oDialog = oPopup._createDialog({});
		assert.equal(oDialog.getVerticalScrolling(), false, "In case there is only one panel which is scrollable, the panel provides the scrolling");

	});

	QUnit.test("#addStyleClass forwards to the inner container", function(assert) {
		var oPanel = new SelectionPanel();
		this.oPopup.addPanel(oPanel);
		this.oPopup.open(this.oSource);
		this.oPopup.addStyleClass("myClass");
		assert.ok(this.oPopup._oPopup.hasStyleClass("myClass"), "The style class has been forwarded to the inner container");
	});

	QUnit.test("#removeStyleClass forwards to the inner container", function(assert) {
		var oPanel = new SelectionPanel();
		this.oPopup.addPanel(oPanel);
		this.oPopup.open(this.oSource);
		this.oPopup.removeStyleClass("myClass");
		assert.ok(!this.oPopup._oPopup.hasStyleClass("myClass"), "The style class removal has been forwarded to the inner container");
	});

	QUnit.test("Check 'onlocalizationChanged'", function(assert) {
		var oPanel = new SelectionPanel();
		this.oPopup.addPanel(oPanel);
		this.oPopup.setReset(function(){});
		this.oPopup.open(this.oSource);

		// Arrange
		let oBundle;
		const sOriginalLanguage = "en_US";
		const sChangedLanguage = "de";

		const oSpy = sinon.spy(this.oPopup, "_onLocalizationChanged");

		oBundle = this.oPopup.oResourceBundle;

		// Assert
		let oModel = this.oPopup.getModel(this.oPopup.LOCALIZATION_MODEL);
		assert.strictEqual(oBundle.sLocale, sOriginalLanguage, "Returned the already loaded bundle");
		assert.strictEqual(this.oPopup.getResetButton().getText(), "Reset", "reset button text is correctly initialized");
		assert.strictEqual(oModel.getProperty("/resetText"), "Reset", "reset button model text is correctly initialized");
		assert.strictEqual(oModel.getProperty("/confirmText"), "OK", "confirm button model text is correctly initialized");
		assert.strictEqual(oModel.getProperty("/cancelText"), "Cancel", "cancel button model text is correctly initialized");

		// Act
		Localization.setLanguage(sChangedLanguage);
		oBundle = this.oPopup.oResourceBundle;

		// Assert
		oModel = this.oPopup.getModel(this.oPopup.LOCALIZATION_MODEL);
		assert.equal(oSpy.called, true, "_onLocalizationChanged called after Localization.setLanguage");
		assert.strictEqual(oBundle.sLocale, sChangedLanguage, "Returned the newly loaded bundle");
		assert.strictEqual(this.oPopup.getResetButton().getText(), "Zurücksetzen", "reset button text is correctly translated");
		assert.strictEqual(oModel.getProperty("/resetText"), "Zurücksetzen", "reset button model text is correctly translated");
		assert.strictEqual(oModel.getProperty("/confirmText"), "OK", "confirm button model text is correctly translated");
		assert.strictEqual(oModel.getProperty("/cancelText"), "Abbrechen", "cancel button model text is correctly translated");
	});

});