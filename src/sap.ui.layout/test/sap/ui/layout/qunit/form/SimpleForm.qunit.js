/* global QUnit */

/*eslint max-nested-callbacks: [2, 5]*/

sap.ui.define([
	"sap/ui/core/Element",
	"sap/ui/layout/library",
	"sap/ui/layout/form/SimpleForm",
	"sap/ui/layout/GridData",
	"sap/ui/layout/ResponsiveFlowLayoutData",
	"sap/ui/core/VariantLayoutData",
	"sap/ui/core/Title",
	"sap/m/Toolbar",
	"sap/m/Label",
	"sap/m/Input",
	"sap/ui/thirdparty/jquery",
	"sap/ui/qunit/utils/nextUIUpdate"
],
	function(
		Element,
		library,
		SimpleForm,
		GridData,
		ResponsiveFlowLayoutData,
		VariantLayoutData,
		Title,
		Toolbar,
		Label,
		Input,
		jQuery,
		nextUIUpdate
	) {
	"use strict";

	// use no check with instanceof for layout or LayoutData to let the SimpleForm load the
	// files async

	var oSimpleForm;
	var oForm;
	var oFormLayout;

	// if some test breaks internal controls of test may not destroyed
	// what leads to duplicate ID errors in next test
	function cleanupControls(sId) {
		var oControl = Element.getElementById(sId);
		if (oControl) {
			oControl.destroy();
		}
	}

	function initTestWithoutContent() {
		oSimpleForm = new SimpleForm("SF1");
		oForm = oSimpleForm.getAggregation("form");
		oFormLayout = oForm.getLayout();
	}

	async function initTestWithContent(sLayout) {
		oSimpleForm = new SimpleForm("SF1", {
			layout: sLayout,
			editable: true,
			content: [
					  new Title("T1", {text: "Test"}),
					  new Label("L1", {text: "Test"}),
					  new Input("I1"),
					  new Input("I2"),
					  new Title("T2", {text: "Test"}),
					  new Label("L2", {text: "Test"}),
					  new Input("I3"),
					  new Label("L3", {text: "Test"}),
					  new Input("I4"),
					  new Input("I5"),
					  new Input("I6")
					  ]
		}).placeAt("qunit-fixture");
		await nextUIUpdate();
		oForm = oSimpleForm.getAggregation("form");
		oFormLayout = oForm.getLayout();
	}

	async function initTestWithContentRL() {
		await initTestWithContent("ResponsiveLayout");
	}

	async function initTestWithContentRGL() {
		await initTestWithContent("ResponsiveGridLayout");
	}

	async function initTestWithContentGL() {
		await initTestWithContent("GridLayout");
	}

	async function initTestWithContentCL() {
		await initTestWithContent("ColumnLayout");
	}

	function afterTest() {
		if (oSimpleForm) {
			oSimpleForm.destroy();
			oSimpleForm = undefined;
			oForm = undefined;
			oFormLayout = undefined;
		}
		cleanupControls("L1");
		cleanupControls("L2");
		cleanupControls("L3");
		cleanupControls("I1");
		cleanupControls("I2");
		cleanupControls("I3");
		cleanupControls("T1");
		cleanupControls("T2");
		cleanupControls("T3");
		cleanupControls("TB1");
		cleanupControls("TB2");
		cleanupControls("TB3");
	}

	async function asyncLayoutTest(assert, sLayout, fnTest) {
		oFormLayout = oForm.getLayout(); // as might loadud right now
		if (oFormLayout) {
			await nextUIUpdate();
			if (oSimpleForm.getDomRef()) { // only test if SimpleForm is rendered
				assert.ok(oForm.getDomRef(), "Form rendered");
			}

			return await fnTest(assert, sLayout);
		} else {
			await nextUIUpdate();
			if (oSimpleForm.getDomRef()) { // only test if SimpleForm is rendered
				assert.notOk(oForm.getDomRef(), "Form not rendered (as no Layout)");
			}

			// wait until Layout is loaded
			return new Promise((Resolve) => {
				sap.ui.require([sLayout], async (aModules) => {
					oFormLayout = oForm.getLayout();
					await nextUIUpdate();
					if (oSimpleForm.getDomRef()) { // only test if SimpleForm is rendered
						assert.ok(oForm.getDomRef(), "Form rendered");
					}

					await fnTest(assert, sLayout);
					Resolve();
				});
			});
		}
	}

	QUnit.module("Form", {
		beforeEach: initTestWithoutContent,
		afterEach: afterTest
	});

	function usedLayout(assert, sLayout) {
		assert.ok(oFormLayout, "FormLayout is created");
		var sName = sLayout.replace(/\//g, ".");
		assert.ok(oFormLayout && oFormLayout.isA(sName), "Right FormLayout used");
		assert.equal(oFormLayout.getId(), "SF1--Layout", "Stable ID of FormLayout");
	}

	QUnit.test("initial state", async function(assert) {
		assert.ok(oSimpleForm, "SimpleForm is created");
		assert.ok(oForm, "internal Form is created");
		assert.equal(oForm.getId(), "SF1--Form", "Stable ID of Form");
		assert.notOk(oFormLayout, "no FormLayout is created before rendering if no Layout is set");
		assert.equal(oSimpleForm.getLayout(), library.form.SimpleFormLayout.ResponsiveGridLayout, "ResponsiveGridLayout is default");
		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 0, "SimpleForm has no content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 0, "Form has no FormContainers");

		oSimpleForm.placeAt("qunit-fixture");
		await nextUIUpdate();
		// eslint-disable-next-line require-atomic-updates
		oFormLayout = oForm.getLayout();

		await asyncLayoutTest(assert, "sap/ui/layout/form/ResponsiveGridLayout", usedLayout);
	});

	QUnit.test("DefaultLayout explicit set", async function(assert) {
		oSimpleForm.setLayout(oSimpleForm.getLayout());
		await asyncLayoutTest(assert, "sap/ui/layout/form/ResponsiveGridLayout", usedLayout);
	});

	QUnit.test("width", async function(assert) {
		oSimpleForm.placeAt("qunit-fixture");
		await nextUIUpdate();
		assert.ok(!/width:/.test(oSimpleForm.$().attr("style")), "SimpleForm2: no width set");

		oSimpleForm.setWidth("100%");
		await nextUIUpdate();
		assert.ok(/width:/.test(oSimpleForm.$().attr("style")) && /100%/.test(oSimpleForm.$().attr("style")), "SimpleForm1: width set");
	});

	QUnit.test("Editabale", function(assert) {
		assert.notOk(oSimpleForm.getEditable(), "SimpleForm not ediatable per default");
		assert.notOk(oForm.getEditable(), "Form not ediatable");

		oSimpleForm.setEditable(true);
		assert.ok(oSimpleForm.getEditable(), "SimpleForm is ediatable");
		assert.ok(oForm.getEditable(), "Form is ediatable");
	});

	QUnit.test("Title", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		oSimpleForm.setTitle(oTitle);

		assert.equal(oSimpleForm.getTitle().getId(), "T1", "SimpleForm getTitle");
		assert.equal(oForm.getTitle().getId(), "T1", "Form getTitle");
		assert.equal(oTitle.getParent().getId(), "SF1", "SimpleForm still parent of Title");

		oSimpleForm.destroyTitle();
		assert.notOk(!!oSimpleForm.getTitle(), "SimpleForm getTitle");
		assert.notOk(!!oForm.getTitle(), "Form getTitle");
	});

	QUnit.test("Toolbar", function(assert) {
		var oToolbar = new Toolbar("TB1");
		oSimpleForm.setToolbar(oToolbar);

		assert.equal(oSimpleForm.getToolbar().getId(), "TB1", "SimpleForm getToolbar");
		assert.equal(oForm.getToolbar().getId(), "TB1", "Form getToolbar");

		oSimpleForm.destroyToolbar();
		assert.notOk(!!oSimpleForm.getToolbar(), "SimpleForm getToolbar");
		assert.notOk(!!oForm.getToolbar(), "Form getToolbar");
	});

	QUnit.test("AriaLabelledBy", async function(assert) {
		oSimpleForm.addAriaLabelledBy("XXX");
		oSimpleForm.placeAt("qunit-fixture");
		await nextUIUpdate();

		assert.equal(oForm.getAriaLabelledBy(), "XXX", "Form getAriaLabelledBy");
		assert.equal(jQuery("#SF1--Form").attr("aria-labelledby"), "XXX", "aria-labelledby");
	});

	QUnit.test("_suggestTitleId", async function(assert) {
		oSimpleForm._suggestTitleId("ID1");
		oSimpleForm.placeAt("qunit-fixture");
		await nextUIUpdate();
		assert.equal(jQuery("#SF1--Form").attr("aria-labelledby"), "ID1", "aria-labelledby points to TitleID");

		var oTitle = new Title("T1", {text: "Test"});
		oSimpleForm.setTitle(oTitle);
		await nextUIUpdate();
		assert.equal(jQuery("#SF1--Form").attr("aria-labelledby"), "T1", "aria-labelledby points to Title");

		oSimpleForm.addAriaLabelledBy("X");
		await nextUIUpdate();
		assert.equal(jQuery("#SF1--Form").attr("aria-labelledby"), "X T1", "aria-labelledby points to AriaLabel and Title");
	});

	QUnit.module("addContent", {
		beforeEach: initTestWithoutContent,
		afterEach: afterTest
	});

	QUnit.test("Title as first content", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		oSimpleForm.addContent(oTitle);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 1, "SimpleForm has 1 content element");
		assert.equal(aContent[0].getId(), "T1", "SimpleForm Title as content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		assert.equal(aFormContainers[0].getTitle().getId(), "T1", "FormContainer has Title set");
		assert.equal(aFormContainers[0].getId(), "SF1--T1--FC", "FormContainer has stable ID based on Title");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 0, "FormContainer has no FormElements");
	});

	QUnit.test("Toolbar as first content", function(assert) {
		var oToolbar = new Toolbar("TB1");
		oSimpleForm.addContent(oToolbar);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 1, "SimpleForm has 1 content element");
		assert.equal(aContent[0].getId(), "TB1", "SimpleForm Toolbar as content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		assert.equal(aFormContainers[0].getToolbar().getId(), "TB1", "FormContainer has Toolbar set");
		assert.equal(aFormContainers[0].getId(), "SF1--TB1--FC", "FormContainer has stable ID based on Toolbar");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 0, "FormContainer has no FormElements");
	});

	QUnit.test("Label as first content", function(assert) {
		var oLabel = new Label("L1", {text: "Test"});
		oSimpleForm.addContent(oLabel);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 1, "SimpleForm has 1 content element");
		assert.equal(aContent[0].getId(), "L1", "SimpleForm Label as content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		assert.notOk(aFormContainers[0].getTitle(), "FormContainer has no Title set");
		assert.notOk(aFormContainers[0].getToolbar(), "FormContainer has no Toolbar set");
		assert.equal(aFormContainers[0].getId(), "SF1--FC-NoHead", "FormContainer has stable ID for no Title");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 1, "FormContainer has 1 FormElement");
		assert.equal(aFormElements[0].getLabel().getId(), "L1", "FormElement has Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L1--FE", "FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 0, "FormElement has no Fields");
	});

	QUnit.test("Field as first content", function(assert) {
		var oField = new Input("I1");
		oSimpleForm.addContent(oField);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 1, "SimpleForm has 1 content element");
		assert.equal(aContent[0].getId(), "I1", "SimpleForm Field as content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		assert.notOk(aFormContainers[0].getTitle(), "FormContainer has no Title set");
		assert.notOk(aFormContainers[0].getToolbar(), "FormContainer has no Toolbar set");
		assert.equal(aFormContainers[0].getId(), "SF1--FC-NoHead", "FormContainer has stable ID for no Title");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 1, "FormContainer has 1 FormElement");
		assert.notOk(aFormElements[0].getLabel(), "FormElement has no Label set");
		assert.equal(aFormElements[0].getId(), "SF1--FC-NoHead--FE-NoLabel", "FormElement has stable ID for no Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 1, "FormElement has 1 Field");
		assert.equal(aFields[0].getId(), "I1", "FormElement has Field assigned");
	});

	function testAddTitleAfter(assert, oControl) {
		var oTitle = new Title("T2", {text: "Test"});
		oSimpleForm.addContent(oControl);
		oSimpleForm.addContent(oTitle);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 2, "SimpleForm has 2 content elements");
		assert.equal(aContent[1].getId(), "T2", "SimpleForm Title as second content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 2, "Form has 2 FormContainers");
		assert.equal(aFormContainers[1].getTitle().getId(), "T2", "2. FormContainer has Title set");
		assert.equal(aFormContainers[1].getId(), "SF1--T2--FC", "FormContainer has stable ID based on Title");
		var aFormElements = aFormContainers[1].getFormElements();
		assert.equal(aFormElements.length, 0, "2. FormContainer has no FormElements");
	}

	QUnit.test("Title after Title", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		testAddTitleAfter(assert, oTitle);
	});

	QUnit.test("Title after Toolbar", function(assert) {
		var oToolbar = new Toolbar("TB1");
		testAddTitleAfter(assert, oToolbar);
	});

	QUnit.test("Title after Label", function(assert) {
		var oLabel = new Label("L1", {text: "Test"});
		testAddTitleAfter(assert, oLabel);
	});

	QUnit.test("Title after Field", function(assert) {
		var oField = new Input("I1");
		testAddTitleAfter(assert, oField);
	});

	function testAddToolbarAfter(assert, oControl) {
		var oToolbar = new Toolbar("TB2");
		oSimpleForm.addContent(oControl);
		oSimpleForm.addContent(oToolbar);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 2, "SimpleForm has 2 content elements");
		assert.equal(aContent[1].getId(), "TB2", "SimpleForm Toolbar as second content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 2, "Form has 2 FormContainers");
		assert.equal(aFormContainers[1].getToolbar().getId(), "TB2", "2. FormContainer has Toolbar set");
		assert.equal(aFormContainers[1].getId(), "SF1--TB2--FC", "FormContainer has stable ID based on Toolbar");
		var aFormElements = aFormContainers[1].getFormElements();
		assert.equal(aFormElements.length, 0, "2. FormContainer has no FormElements");
	}

	QUnit.test("Toolbar after Title", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		testAddToolbarAfter(assert, oTitle);
	});

	QUnit.test("Toolbar after Toolbar", function(assert) {
		var oToolbar = new Toolbar("TB1");
		testAddToolbarAfter(assert, oToolbar);
	});

	QUnit.test("Toolbar after Title", function(assert) {
		var oLabel = new Label("L1", {text: "Test"});
		testAddToolbarAfter(assert, oLabel);
	});

	QUnit.test("Toolbar after Title", function(assert) {
		var oField = new Input("I1");
		testAddToolbarAfter(assert, oField);
	});

	function testAddLabelAfterHeader(assert, oControl) {
		var oLabel = new Label("L2", {text: "Test"});
		oSimpleForm.addContent(oControl);
		oSimpleForm.addContent(oLabel);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 2, "SimpleForm has 1 content elements");
		assert.equal(aContent[1].getId(), "L2", "SimpleForm Label as second content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 1, "FormContainer has 1 FormElement");
		assert.equal(aFormElements[0].getLabel().getId(), "L2", "FormElement has Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L2--FE", "FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 0, "FormElement has no Fields");
	}

	QUnit.test("Label after Title", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		testAddLabelAfterHeader(assert, oTitle);
	});

	QUnit.test("Label after Toolbar", function(assert) {
		var oToolbar = new Toolbar("TB1");
		testAddLabelAfterHeader(assert, oToolbar);
	});

	function testAddLabelAfterRow(assert, oControl) {
		var oLabel = new Label("L2", {text: "Test"});
		oSimpleForm.addContent(oControl);
		oSimpleForm.addContent(oLabel);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 2, "SimpleForm has 1 content elements");
		assert.equal(aContent[1].getId(), "L2", "SimpleForm Label as second content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 2, "FormContainer has 2 FormElements");
		assert.equal(aFormElements[1].getLabel().getId(), "L2", "2. FormElement has Label set");
		assert.equal(aFormElements[1].getId(), "SF1--L2--FE", "2. FormElement has stable ID based on Label");
		var aFields = aFormElements[1].getFields();
		assert.equal(aFields.length, 0, "2. FormElement has no Fields");
	}

	QUnit.test("Label after Label", function(assert) {
		var oLabel = new Label("L1", {text: "Test"});
		testAddLabelAfterRow(assert, oLabel);
	});

	QUnit.test("Label after Field", function(assert) {
		var oField = new Input("I1");
		testAddLabelAfterRow(assert, oField);
	});

	function testAddFieldAfterHeader(assert, oControl) {
		var oField = new Input("I2");
		oSimpleForm.addContent(oControl);
		oSimpleForm.addContent(oField);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 2, "SimpleForm has 2 content elements");
		assert.equal(aContent[1].getId(), "I2", "SimpleForm Field as second content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 1, "FormContainer has 1 FormElement");
		if (oControl.isA("sap.ui.core.Label")) {
			assert.equal(aFormElements[0].getId(), "SF1--" + oControl.getId() + "--FE", "FormElement has stable ID based on Label");
		} else {
			assert.equal(aFormElements[0].getId(), "SF1--" + oControl.getId() + "--FC--FE-NoLabel", "FormElement has stable ID for no Label");
		}
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 1, "FormElement has 1 Field");
		assert.equal(aFields[0].getId(), "I2", "FormElement has Field assigned");
	}

	QUnit.test("Field after Title", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		testAddFieldAfterHeader(assert, oTitle);
	});

	QUnit.test("Field after Toolbar", function(assert) {
		var oToolbar = new Toolbar("TB1");
		testAddFieldAfterHeader(assert, oToolbar);
	});

	QUnit.test("Field after Label", function(assert) {
		var oLabel = new Label("L1", {text: "Test"});
		testAddFieldAfterHeader(assert, oLabel);
	});

	QUnit.test("Field after Field", function(assert) {
		var oField1 = new Input("I1");
		var oField2 = new Input("I2");
		oSimpleForm.addContent(oField1);
		oSimpleForm.addContent(oField2);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 2, "SimpleForm has 2 content elements");
		assert.equal(aContent[1].getId(), "I2", "SimpleForm Field as second content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 1, "FormContainer has 1 FormElement");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 2, "FormElement has 2 Fields");
		assert.equal(aFields[1].getId(), "I2", "FormElement has second Field assigned");
	});

	QUnit.test("already added Field", function(assert) {
		var oField1 = new Input("I1");
		var oField2 = new Input("I2");
		oSimpleForm.addContent(oField1);
		oSimpleForm.addContent(oField2);
		oSimpleForm.addContent(oField1);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 2, "SimpleForm has 2 content elements");
		assert.equal(aContent[1].getId(), "I1", "Field1 is second content element");
	});

	QUnit.module("InsertContent", {
		beforeEach: initTestWithoutContent,
		afterEach: afterTest
	});

	function testInsertTitleBeforeHeader(assert, oControl) {
		var oTitle = new Title("T2", {text: "Test"});
		oSimpleForm.addContent(oControl);
		oSimpleForm.insertContent(oTitle, 0);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 2, "SimpleForm has 2 content elements");
		assert.equal(aContent[0].getId(), "T2", "SimpleForm Title as first content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 2, "Form has 2 FormContainers");
		assert.equal(aFormContainers[0].getTitle().getId(), "T2", "1. FormContainer has Title set");
		assert.equal(aFormContainers[0].getId(), "SF1--T2--FC", "FormContainer has stable ID based on Title");
		assert.equal(aFormContainers[1].getId(), "SF1--" + oControl.getId() + "--FC", "FormContainer has stable ID based on Header control");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 0, "1. FormContainer has no FormElements");
	}

	QUnit.test("Title before Title", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		testInsertTitleBeforeHeader(assert, oTitle);
	});

	QUnit.test("Title before Toolbar", function(assert) {
		var oToolbar = new Toolbar("TB1");
		testInsertTitleBeforeHeader(assert, oToolbar);
	});

	function testInsertTitleBeforeContent(assert, oControl) {
		var oTitle = new Title("T2", {text: "Test"});
		oSimpleForm.addContent(oControl);
		oSimpleForm.insertContent(oTitle, 0);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 2, "SimpleForm has 2 content elements");
		assert.equal(aContent[0].getId(), "T2", "SimpleForm Title as first content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		assert.equal(aFormContainers[0].getTitle().getId(), "T2", "FormContainer has Title set");
		assert.equal(aFormContainers[0].getId(), "SF1--T2--FC", "FormContainer has stable ID based on Title");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 1, "FormContainer has 1 FormElement");
	}

	QUnit.test("Title before Label", function(assert) {
		var oLabel = new Label("L1", {text: "Test"});
		testInsertTitleBeforeContent(assert, oLabel);
	});

	QUnit.test("Title before Field", function(assert) {
		var oField = new Input("I1");
		testInsertTitleBeforeContent(assert, oField);
	});

	function testInsertToolbarBeforeHeader(assert, oControl) {
		var oToolbar = new Toolbar("TB2");
		oSimpleForm.addContent(oControl);
		oSimpleForm.insertContent(oToolbar, 0);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 2, "SimpleForm has 2 content elements");
		assert.equal(aContent[0].getId(), "TB2", "SimpleForm Toolbar as first content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 2, "Form has 2 FormContainers");
		assert.equal(aFormContainers[0].getToolbar().getId(), "TB2", "1. FormContainer has Toolbar set");
		assert.equal(aFormContainers[0].getId(), "SF1--TB2--FC", "FormContainer has stable ID based on Toolbar");
		assert.equal(aFormContainers[1].getId(), "SF1--" + oControl.getId() + "--FC", "FormContainer has stable ID based on Header control");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 0, "1. FormContainer has no FormElements");
	}

	QUnit.test("Toolbar before Title", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		testInsertToolbarBeforeHeader(assert, oTitle);
	});

	QUnit.test("Toolbar before Toolbar", function(assert) {
		var oToolbar = new Toolbar("TB1");
		testInsertToolbarBeforeHeader(assert, oToolbar);
	});

	function testInsertToolbarBeforeContent(assert, oControl) {
		var oToolbar = new Toolbar("TB2");
		oSimpleForm.addContent(oControl);
		oSimpleForm.insertContent(oToolbar, 0);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 2, "SimpleForm has 2 content elements");
		assert.equal(aContent[0].getId(), "TB2", "SimpleForm Toolbar as first content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		assert.equal(aFormContainers[0].getToolbar().getId(), "TB2", "FormContainer has Toolbar set");
		assert.equal(aFormContainers[0].getId(), "SF1--TB2--FC", "FormContainer has stable ID based on Toolbar");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 1, "FormContainer has 1 FormElement");
	}

	QUnit.test("Toolbar before Label", function(assert) {
		var oLabel = new Label("L1", {text: "Test"});
		testInsertToolbarBeforeContent(assert, oLabel);
	});

	QUnit.test("Toolbar before Field", function(assert) {
		var oField = new Input("I1");
		testInsertToolbarBeforeContent(assert, oField);
	});

	function testInsertLabelBeforeHeader(assert, oControl) {
		var oLabel = new Label("L2", {text: "Test"});
		oSimpleForm.addContent(oControl);
		oSimpleForm.insertContent(oLabel, 0);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 2, "SimpleForm has 2 content elements");
		assert.equal(aContent[0].getId(), "L2", "SimpleForm Label as first content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 2, "Form has 2 FormContainers");
		assert.notOk(aFormContainers[0].getTitle(), "1. FormContainer has no Title set");
		assert.notOk(aFormContainers[0].getToolbar(), "1. FormContainer has no Toolbar set");
		assert.equal(aFormContainers[0].getId(), "SF1--FC-NoHead", "FormContainer has stable ID for no Title");
		assert.equal(aFormContainers[1].getId(), "SF1--" + oControl.getId() + "--FC", "FormContainer has stable ID based on Header control");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 1, "FormContainer has 1 FormElement");
		assert.equal(aFormElements[0].getLabel().getId(), "L2", "FormElement has Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L2--FE", "FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 0, "FormElement has no Fields");
	}

	QUnit.test("Label before Title", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		testInsertLabelBeforeHeader(assert, oTitle);
	});

	QUnit.test("Label before Toolbar", function(assert) {
		var oToolbar = new Toolbar("TB1");
		testInsertLabelBeforeHeader(assert, oToolbar);
	});

	QUnit.test("Label before Label", function(assert) {
		var oLabel1 = new Label("L1", {text: "Test"});
		var oLabel2 = new Label("L2", {text: "Test"});
		oSimpleForm.addContent(oLabel1);
		oSimpleForm.insertContent(oLabel2, 0);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 2, "SimpleForm has 2 content elements");
		assert.equal(aContent[0].getId(), "L2", "SimpleForm Label as first content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		assert.equal(aFormContainers[0].getId(), "SF1--FC-NoHead", "FormContainer has stable ID for no Title");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 2, "FormContainer has 2 FormElements");
		assert.equal(aFormElements[0].getLabel().getId(), "L2", "FormElement has Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L2--FE", "FormElement has stable ID based on Label");
		assert.equal(aFormElements[1].getId(), "SF1--L1--FE", "FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 0, "FormElement has no Fields");
	});

	QUnit.test("Label before Field", function(assert) {
		var oField = new Input("I1");
		var oLabel = new Label("L2", {text: "Test"});
		oSimpleForm.addContent(oField);
		oSimpleForm.insertContent(oLabel, 0);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 2, "SimpleForm has 2 content elements");
		assert.equal(aContent[0].getId(), "L2", "SimpleForm Label as first content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		assert.equal(aFormContainers[0].getId(), "SF1--FC-NoHead", "FormContainer has stable ID for no Title");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 1, "FormContainer has 1 FormElement");
		assert.equal(aFormElements[0].getLabel().getId(), "L2", "FormElement has Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L2--FE", "FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 1, "FormElement has 1 Field");
	});

	QUnit.test("at the end", function(assert) {
		// check if addContent is used. So no special test for every combination is needed
		var oLabel = new Label("L1", {text: "Test"});
		var oField = new Input("I2");
		oSimpleForm.addContent(oLabel);
		this.spy(oSimpleForm, "addContent");
		oSimpleForm.insertContent(oField, 9);
		assert.ok(oSimpleForm.addContent.called, "AddContent is used to insert at the end");
		assert.ok(oSimpleForm.addContent.calledWith(oField), "AddContent is called with field");
	});

	//not needed to check every possible combination, just one kind of similar cases
	function testInsertTitleBetweenHeaders(assert, oControl1, oControl2) {
		var oTitle = new Title("T3", {text: "Test"});
		oSimpleForm.addContent(oControl1);
		oSimpleForm.addContent(oControl2);
		oSimpleForm.insertContent(oTitle, 1);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 3, "SimpleForm has 3 content elements");
		assert.equal(aContent[1].getId(), "T3", "SimpleForm Title as second content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 3, "Form has 3 FormContainers");
		assert.equal(aFormContainers[0].getId(), "SF1--" + oControl1.getId() + "--FC", "1. FormContainer has stable ID based on Header control");
		assert.equal(aFormContainers[1].getTitle().getId(), "T3", "2. FormContainer has Title set");
		assert.equal(aFormContainers[1].getId(), "SF1--T3--FC", "2. FormContainer has stable ID based on Title");
		assert.equal(aFormContainers[2].getId(), "SF1--" + oControl2.getId() + "--FC", "3. FormContainer has stable ID based on Header control");
		var aFormElements = aFormContainers[1].getFormElements();
		assert.equal(aFormElements.length, 0, "2. FormContainer has no FormElements");
	}

	QUnit.test("Title between Title and Title", function(assert) {
		var oTitle1 = new Title("T1", {text: "Test"});
		var oTitle2 = new Title("T2", {text: "Test"});
		testInsertTitleBetweenHeaders(assert, oTitle1, oTitle2);
	});

	QUnit.test("Title between Title and Toolbar", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		var oToolbar = new Toolbar("TB2");
		testInsertTitleBetweenHeaders(assert, oTitle, oToolbar);
	});

	QUnit.test("Title between Title and Label", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		var oLabel = new Label("L1", {text: "Test"});
		var oField = new Input("I1");
		oSimpleForm.addContent(oTitle);
		oSimpleForm.addContent(oLabel);
		oSimpleForm.addContent(oField);
		var oTitle2 = new Title("T2", {text: "Test"});
		oSimpleForm.insertContent(oTitle2, 1);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 4, "SimpleForm has 4 content elements");
		assert.equal(aContent[1].getId(), "T2", "SimpleForm Title as second content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 2, "Form has 2 FormContainers");
		assert.equal(aFormContainers[0].getId(), "SF1--T1--FC", "1. FormContainer has stable ID based on Title");
		assert.equal(aFormContainers[1].getTitle().getId(), "T2", "2. FormContainer has Title set");
		assert.equal(aFormContainers[1].getId(), "SF1--T2--FC", "2. FormContainer has stable ID based on Title");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 0, "1. FormContainer has no FormElements");
		aFormElements = aFormContainers[1].getFormElements();
		assert.equal(aFormElements.length, 1, "2. FormContainer has 1 FormElement");
		assert.equal(aFormElements[0].getLabel().getId(), "L1", "FormElement has Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L1--FE", "FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 1, "FormElement has 1 Field");
	});

	QUnit.test("Title between Label and Field", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		var oLabel = new Label("L1", {text: "Test"});
		var oField = new Input("I1");
		oSimpleForm.addContent(oTitle);
		oSimpleForm.addContent(oLabel);
		oSimpleForm.addContent(oField);
		var oTitle2 = new Title("T2", {text: "Test"});
		oSimpleForm.insertContent(oTitle2, 2);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 4, "SimpleForm has 4 content elements");
		assert.equal(aContent[2].getId(), "T2", "SimpleForm Title as 3. content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 2, "Form has 2 FormContainers");
		assert.equal(aFormContainers[0].getId(), "SF1--T1--FC", "1. FormContainer has stable ID based on Title");
		assert.equal(aFormContainers[1].getTitle().getId(), "T2", "2. FormContainer has Title set");
		assert.equal(aFormContainers[1].getId(), "SF1--T2--FC", "2. FormContainer has stable ID based on Title");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 1, "1. FormContainer has 1 FormElement");
		assert.equal(aFormElements[0].getLabel().getId(), "L1", "1. FormElement has Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L1--FE", "1. FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 0, "1. FormElement has no Field");
		aFormElements = aFormContainers[1].getFormElements();
		assert.equal(aFormElements.length, 1, "2. FormContainer has 1 FormElement");
		assert.notOk(aFormElements[0].getLabel(), "2. FormElement has no Label set");
		assert.equal(aFormElements[0].getId(), "SF1--T2--FC--FE-NoLabel", "2. FormElement has stable ID for no Label");
		aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 1, "FormElement has 1 Field");
	});

	QUnit.test("Title between Field and Field", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		var oLabel = new Label("L1", {text: "Test"});
		var oField1 = new Input("I1");
		var oField2 = new Input("I2");
		oSimpleForm.addContent(oTitle);
		oSimpleForm.addContent(oLabel);
		oSimpleForm.addContent(oField1);
		oSimpleForm.addContent(oField2);
		var oTitle2 = new Title("T2", {text: "Test"});
		oSimpleForm.insertContent(oTitle2, 3);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 5, "SimpleForm has 5 content elements");
		assert.equal(aContent[3].getId(), "T2", "SimpleForm Title as 4. content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 2, "Form has 2 FormContainers");
		assert.equal(aFormContainers[0].getId(), "SF1--T1--FC", "1. FormContainer has stable ID based on Title");
		assert.equal(aFormContainers[1].getTitle().getId(), "T2", "2. FormContainer has Title set");
		assert.equal(aFormContainers[1].getId(), "SF1--T2--FC", "2. FormContainer has stable ID based on Title");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 1, "1. FormContainer has 1 FormElement");
		assert.equal(aFormElements[0].getLabel().getId(), "L1", "1. FormElement has Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L1--FE", "1. FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 1, "1. FormElement has 1 Field");
		aFormElements = aFormContainers[1].getFormElements();
		assert.equal(aFormElements.length, 1, "2. FormContainer has 1 FormElement");
		assert.notOk(aFormElements[0].getLabel(), "2. FormElement has no Label set");
		assert.equal(aFormElements[0].getId(), "SF1--T2--FC--FE-NoLabel", "2. FormElement has stable ID for no Label");
		aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 1, "FormElement has 1 Field");
	});

	// just one check for Toolbar to proov the same logic like for Title is used
	QUnit.test("Toolbar between Field and Field", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		var oLabel = new Label("L1", {text: "Test"});
		var oField1 = new Input("I1");
		var oField2 = new Input("I2");
		oSimpleForm.addContent(oTitle);
		oSimpleForm.addContent(oLabel);
		oSimpleForm.addContent(oField1);
		oSimpleForm.addContent(oField2);
		var oToolbar = new Toolbar("TB2");
		oSimpleForm.insertContent(oToolbar, 3);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 5, "SimpleForm has 5 content elements");
		assert.equal(aContent[3].getId(), "TB2", "SimpleForm Toolbar as 4. content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 2, "Form has 2 FormContainers");
		assert.equal(aFormContainers[0].getId(), "SF1--T1--FC", "1. FormContainer has stable ID based on Title");
		assert.equal(aFormContainers[1].getToolbar().getId(), "TB2", "2. FormContainer has Toolbar set");
		assert.equal(aFormContainers[1].getId(), "SF1--TB2--FC", "2. FormContainer has stable ID based on Toolbar");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 1, "1. FormContainer has 1 FormElement");
		assert.equal(aFormElements[0].getLabel().getId(), "L1", "1. FormElement has Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L1--FE", "1. FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 1, "1. FormElement has 1 Field");
		aFormElements = aFormContainers[1].getFormElements();
		assert.equal(aFormElements.length, 1, "2. FormContainer has 1 FormElement");
		assert.notOk(aFormElements[0].getLabel(), "2. FormElement has no Label set");
		assert.equal(aFormElements[0].getId(), "SF1--TB2--FC--FE-NoLabel", "2. FormElement has stable ID for no Label");
		aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 1, "FormElement has 1 Field");
	});

	// just check once to add a FormElement at the end of a FormContainer
	QUnit.test("Label between Field and Title", function(assert) {
		var oTitle1 = new Title("T1", {text: "Test"});
		var oLabel = new Label("L1", {text: "Test"});
		var oField = new Input("I1");
		var oTitle2 = new Title("T2", {text: "Test"});
		oSimpleForm.addContent(oTitle1);
		oSimpleForm.addContent(oLabel);
		oSimpleForm.addContent(oField);
		oSimpleForm.addContent(oTitle2);
		var oLabel2 = new Label("L2", {text: "Test"});
		oSimpleForm.insertContent(oLabel2, 3);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 5, "SimpleForm has 5 content elements");
		assert.equal(aContent[3].getId(), "L2", "SimpleForm Label as 4. content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 2, "Form has 2 FormContainers");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 2, "1. FormContainer has 2 FormElements");
		assert.equal(aFormElements[0].getLabel().getId(), "L1", "1. FormElement has 1st Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L1--FE", "1. FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 1, "1. FormElement has 1 Field");
		assert.equal(aFormElements[1].getLabel().getId(), "L2", "2. FormElement has Label set");
		assert.equal(aFormElements[1].getId(), "SF1--L2--FE", "2. FormElement has stable ID based on Label");
		aFields = aFormElements[1].getFields();
		assert.equal(aFields.length, 0, "2. FormElement has 0 Field");
	});

	QUnit.test("Label between Label and Field", function(assert) {
		var oTitle1 = new Title("T1", {text: "Test"});
		var oLabel = new Label("L1", {text: "Test"});
		var oField = new Input("I1");
		oSimpleForm.addContent(oTitle1);
		oSimpleForm.addContent(oLabel);
		oSimpleForm.addContent(oField);
		var oLabel2 = new Label("L2", {text: "Test"});
		oSimpleForm.insertContent(oLabel2, 2);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 4, "SimpleForm has 4 content elements");
		assert.equal(aContent[2].getId(), "L2", "SimpleForm Label as 2. content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 2, "FormContainer has 2 FormElements");
		assert.equal(aFormElements[0].getLabel().getId(), "L1", "1. FormElement has 1st Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L1--FE", "1. FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 0, "1. FormElement has 0 Field");
		assert.equal(aFormElements[1].getLabel().getId(), "L2", "2. FormElement has Label set");
		assert.equal(aFormElements[1].getId(), "SF1--L2--FE", "2. FormElement has stable ID based on Label");
		aFields = aFormElements[1].getFields();
		assert.equal(aFields.length, 1, "2. FormElement has 1 Field");
	});

	QUnit.test("Label between Field and Field", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		var oLabel = new Label("L1", {text: "Test"});
		var oField1 = new Input("I1");
		var oField2 = new Input("I2");
		oSimpleForm.addContent(oTitle);
		oSimpleForm.addContent(oLabel);
		oSimpleForm.addContent(oField1);
		oSimpleForm.addContent(oField2);
		var oLabel2 = new Label("L2", {text: "Test"});
		oSimpleForm.insertContent(oLabel2, 3);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 5, "SimpleForm has 5 content elements");
		assert.equal(aContent[3].getId(), "L2", "SimpleForm Label as 4. content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 2, "FormContainer has 2 FormElements");
		assert.equal(aFormElements[0].getLabel().getId(), "L1", "1. FormElement has 1st Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L1--FE", "1. FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 1, "1. FormElement has 1 Field");
		assert.equal(aFormElements[1].getLabel().getId(), "L2", "2. FormElement has Label set");
		assert.equal(aFormElements[1].getId(), "SF1--L2--FE", "2. FormElement has stable ID based on Label");
		aFields = aFormElements[1].getFields();
		assert.equal(aFields.length, 1, "2. FormElement has 1 Field");
	});

	QUnit.test("Field between Field and Label", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		var oLabel1 = new Label("L1", {text: "Test"});
		var oField1 = new Input("I1");
		var oLabel2 = new Label("L2", {text: "Test"});
		var oField2 = new Input("I2");
		oSimpleForm.addContent(oTitle);
		oSimpleForm.addContent(oLabel1);
		oSimpleForm.addContent(oField1);
		oSimpleForm.addContent(oLabel2);
		oSimpleForm.addContent(oField2);
		var oField3 = new Input("I3");
		oSimpleForm.insertContent(oField3, 3);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 6, "SimpleForm has 6 content elements");
		assert.equal(aContent[3].getId(), "I3", "SimpleForm Field as 4. content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 2, "FormContainer has 2 FormElements");
		assert.equal(aFormElements[0].getLabel().getId(), "L1", "1. FormElement has 1st Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L1--FE", "1. FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 2, "1. FormElement has 2 Fields");
		assert.equal(aFields[1].getId(), "I3", "1. FormElement has new second field");
		assert.equal(aFormElements[1].getLabel().getId(), "L2", "2. FormElement has second Label set");
		assert.equal(aFormElements[1].getId(), "SF1--L2--FE", "2. FormElement has stable ID based on Label");
		aFields = aFormElements[1].getFields();
		assert.equal(aFields.length, 1, "3. FormElement has 1 Field");
	});

	QUnit.test("Field between Label and Field", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		var oLabel1 = new Label("L1", {text: "Test"});
		var oField1 = new Input("I1");
		var oLabel2 = new Label("L2", {text: "Test"});
		var oField2 = new Input("I2");
		oSimpleForm.addContent(oTitle);
		oSimpleForm.addContent(oLabel1);
		oSimpleForm.addContent(oField1);
		oSimpleForm.addContent(oLabel2);
		oSimpleForm.addContent(oField2);
		var oField3 = new Input("I3");
		oSimpleForm.insertContent(oField3, 2);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 6, "SimpleForm has 6 content elements");
		assert.equal(aContent[2].getId(), "I3", "SimpleForm Field as 3. content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 2, "FormContainer has 2 FormElements");
		assert.equal(aFormElements[0].getLabel().getId(), "L1", "1. FormElement has 1st Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L1--FE", "1. FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 2, "1. FormElement has 2 Fields");
		assert.equal(aFields[0].getId(), "I3", "1. FormElement has new first field");
		assert.equal(aFormElements[1].getLabel().getId(), "L2", "2. FormElement has second Label set");
		assert.equal(aFormElements[1].getId(), "SF1--L2--FE", "2. FormElement has stable ID based on Label");
		aFields = aFormElements[1].getFields();
		assert.equal(aFields.length, 1, "2. FormElement has 1 Field");
	});

	QUnit.test("Field before first Label", function(assert) {
		var oLabel1 = new Label("L1", {text: "Test"});
		var oField1 = new Input("I1");
		oSimpleForm.addContent(oLabel1);
		oSimpleForm.insertContent(oField1, 0);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 2, "SimpleForm has 2 content elements");
		assert.equal(aContent[0].getId(), "I1", "SimpleForm Field as 1. content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 2, "FormContainer has 2 FormElements");
		assert.notOk(aFormElements[0].getLabel(), "1. FormElement has no Label set");
		assert.equal(aFormElements[0].getId(), "SF1--FC-NoHead--FE-NoLabel", "1. FormElement has stable ID for no Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 1, "1. FormElement has 1 Fields");
		assert.equal(aFields[0].getId(), "I1", "1. FormElement has new field");
		assert.equal(aFormElements[1].getLabel().getId(), "L1", "2. FormElement has Label set");
		assert.equal(aFormElements[1].getId(), "SF1--L1--FE", "2. FormElement has stable ID based on Label");
		aFields = aFormElements[1].getFields();
		assert.equal(aFields.length, 0, "2. FormElement has no Field");
	});

	QUnit.test("Field between Field and Field", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		var oLabel = new Label("L1", {text: "Test"});
		var oField1 = new Input("I1");
		var oField2 = new Input("I2");
		oSimpleForm.addContent(oTitle);
		oSimpleForm.addContent(oLabel);
		oSimpleForm.addContent(oField1);
		oSimpleForm.addContent(oField2);
		var oField3 = new Input("I3");
		oSimpleForm.insertContent(oField3, 3);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 5, "SimpleForm has 5 content elements");
		assert.equal(aContent[3].getId(), "I3", "SimpleForm Field as 4. content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 1, "FormContainer has 1 FormElements");
		assert.equal(aFormElements[0].getLabel().getId(), "L1", "1. FormElement has Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L1--FE", "1. FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 3, "FormElement has 3 Fields");
		assert.equal(aFields[1].getId(), "I3", "FormElement has new second field");
	});

	QUnit.test("Field before first Title", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		var oField1 = new Input("I1");
		var oField2 = new Input("I2");
		oSimpleForm.addContent(oTitle);
		oSimpleForm.insertContent(oField1, 0);
		oSimpleForm.insertContent(oField2, 1);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 3, "SimpleForm has 3 content elements");
		assert.equal(aContent[0].getId(), "I1", "SimpleForm Field as 1. content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 2, "Form has 2 FormContainer");
		assert.equal(aFormContainers[0].getId(), "SF1--FC-NoHead", "1. FormContainer has stable ID for no Title");
		assert.equal(aFormContainers[1].getId(), "SF1--T1--FC", "2. FormContainer has stable ID based on Title");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 1, "FormContainer has 1 FormElements");
		assert.notOk(aFormElements[0].getLabel(), "1. FormElement has no Label set");
		assert.equal(aFormElements[0].getId(), "SF1--FC-NoHead--FE-NoLabel", "1. FormElement has stable ID for no Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 2, "FormElement has 2 Fields");
		assert.equal(aFields[0].getId(), "I1", "FormElement has Field1 as first field");
	});

	QUnit.test("already added Field", function(assert) {
		var oField1 = new Input("I1");
		var oField2 = new Input("I2");
		oSimpleForm.addContent(oField1);
		oSimpleForm.addContent(oField2);
		oSimpleForm.insertContent(oField2, -1);

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 2, "SimpleForm has 2 content elements");
		assert.equal(aContent[0].getId(), "I2", "Field2 is first content element");
	});

	QUnit.module("removeContent", {
		beforeEach: initTestWithoutContent,
		afterEach: afterTest
	});

	QUnit.test("Title as first content", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		var oLabel = new Label("L1", {text: "Test"});
		var oField = new Input("I1");
		oSimpleForm.addContent(oTitle);
		oSimpleForm.addContent(oLabel);
		oSimpleForm.addContent(oField);
		var oRemoved = oSimpleForm.removeContent(oTitle);

		assert.equal(oRemoved.getId(), "T1", "Title removed");
		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 2, "SimpleForm has 2 content elements");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		assert.notOk(aFormContainers[0].getTitle(), "FormContainer has no Title set");
		assert.equal(aFormContainers[0].getId(), "SF1--FC-NoHead", "FormContainer has stable ID for no Title");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 1, "FormContainer has 1 FormElement");
		assert.equal(aFormElements[0].getLabel().getId(), "L1", "FormElement has Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L1--FE", "FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 1, "FormElement has 1 Field");
		assert.equal(aFields[0].getId(), "I1", "1. FormElement has field");

		oTitle.destroy();
	});

	QUnit.test("Title as only content", function(assert) {
		var oTitle = new Title("T1", {text: "Test"});
		oSimpleForm.addContent(oTitle);
		var oRemoved = oSimpleForm.removeContent(oTitle);

		assert.equal(oRemoved.getId(), "T1", "Title removed");
		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 0, "SimpleForm has no content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 0, "Form has no FormContainers");

		oTitle.destroy();
	});

	QUnit.test("Title before Label", function(assert) {
		var oTitle1 = new Title("T1", {text: "Test"});
		var oLabel1 = new Label("L1", {text: "Test"});
		var oField1 = new Input("I1");
		var oTitle2 = new Title("T2", {text: "Test"});
		var oLabel2 = new Label("L2", {text: "Test"});
		var oField2 = new Input("I2");
		oSimpleForm.addContent(oTitle1);
		oSimpleForm.addContent(oLabel1);
		oSimpleForm.addContent(oField1);
		oSimpleForm.addContent(oTitle2);
		oSimpleForm.addContent(oLabel2);
		oSimpleForm.addContent(oField2);
		var oRemoved = oSimpleForm.removeContent(oTitle2);

		assert.equal(oRemoved.getId(), "T2", "Title2 removed");
		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 5, "SimpleForm has 5 content elements");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		assert.equal(aFormContainers[0].getId(), "SF1--T1--FC", "FormContainer has stable ID based on Title");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 2, "FormContainer has 2 FormElement");
		assert.equal(aFormElements[0].getLabel().getId(), "L1", "1. FormElement has 1. Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L1--FE", "1. FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 1, "1. FormElement has 1 Field");
		assert.equal(aFields[0].getId(), "I1", "1. FormElement has 1. field");
		assert.equal(aFormElements[1].getLabel().getId(), "L2", "2. FormElement has 2. Label set");
		assert.equal(aFormElements[1].getId(), "SF1--L2--FE", "2. FormElement has stable ID based on Label");
		aFields = aFormElements[1].getFields();
		assert.equal(aFields.length, 1, "1. FormElement has 1 Field");
		assert.equal(aFields[0].getId(), "I2", "1. FormElement has 2. field");

		oTitle2.destroy();
	});

	QUnit.test("Title before Field", function(assert) {
		var oTitle1 = new Title("T1", {text: "Test"});
		var oLabel1 = new Label("L1", {text: "Test"});
		var oField1 = new Input("I1");
		var oTitle2 = new Title("T2", {text: "Test"});
		var oField2 = new Input("I2");
		oSimpleForm.addContent(oTitle1);
		oSimpleForm.addContent(oLabel1);
		oSimpleForm.addContent(oField1);
		oSimpleForm.addContent(oTitle2);
		oSimpleForm.addContent(oField2);
		var aFormContainers = oForm.getFormContainers();
		var sContainerId = aFormContainers[1].getId();
		var oRemoved = oSimpleForm.removeContent(3);

		assert.equal(oRemoved.getId(), "T2", "Title2 removed");
		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 4, "SimpleForm has 4 content elements");
		aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		assert.equal(aFormContainers[0].getId(), "SF1--T1--FC", "FormContainer has stable ID based on Title");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 1, "FormContainer has 1 FormElement");
		assert.equal(aFormElements[0].getLabel().getId(), "L1", "FormElement has Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L1--FE", "FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 2, "FormElement has 2 Fields");
		assert.equal(aFields[0].getId(), "I1", "FormElement has 1. field");
		assert.equal(aFields[1].getId(), "I2", "FormElement has 2. field");
		assert.notOk(Element.getElementById(sContainerId), "old FormContainer destroyed");

		oTitle2.destroy();
	});

	QUnit.test("Label as first content", function(assert) {
		var oLabel = new Label("L1", {text: "Test"});
		var oField = new Input("I1");
		oSimpleForm.addContent(oLabel);
		oSimpleForm.addContent(oField);
		var oRemoved = oSimpleForm.removeContent("L1");

		assert.equal(oRemoved.getId(), "L1", "Label removed");
		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 1, "SimpleForm has 1 content elements");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		assert.equal(aFormContainers[0].getId(), "SF1--FC-NoHead", "FormContainer has stable ID for no Title");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 1, "FormContainer has 1 FormElement");
		assert.notOk(aFormElements[0].getLabel(), "FormElement has no Label set");
		assert.equal(aFormElements[0].getId(), "SF1--FC-NoHead--FE-NoLabel", "FormElement has stable ID for no Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 1, "FormElement has 1 Field");
		assert.equal(aFields[0].getId(), "I1", "FormElement has field");

		oLabel.destroy();
	});

	QUnit.test("Label as only content", function(assert) {
		var oLabel = new Label("L1", {text: "Test"});
		oSimpleForm.addContent(oLabel);
		var oRemoved = oSimpleForm.removeContent("L1");

		assert.equal(oRemoved.getId(), "L1", "Label removed");
		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 0, "SimpleForm has no content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 0, "Form has no FormContainers");

		oLabel.destroy();
	});

	QUnit.test("Label before Title", function(assert) {
		var oTitle1 = new Title("T1", {text: "Test"});
		var oLabel = new Label("L1", {text: "Test"});
		var oTitle2 = new Title("T2", {text: "Test"});
		oSimpleForm.addContent(oTitle1);
		oSimpleForm.addContent(oLabel);
		oSimpleForm.addContent(oTitle2);
		var aFormContainers = oForm.getFormContainers();
		var aFormElements = aFormContainers[0].getFormElements();
		var sElementId = aFormElements[0].getId();
		var oRemoved = oSimpleForm.removeContent(oLabel);

		assert.equal(oRemoved.getId(), "L1", "Label removed");
		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 2, "SimpleForm has 2 content elements");
		assert.equal(aFormContainers[0].getId(), "SF1--T1--FC", "1. FormContainer has stable ID based on Title");
		assert.equal(aFormContainers[1].getId(), "SF1--T2--FC", "2. FormContainer has stable ID based on Title");
		aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 2, "Form has 2 FormContainers");
		aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 0, "1. FormContainer has no FormElements");
		assert.notOk(Element.getElementById(sElementId), "old FormElement destroyed");

		oLabel.destroy();
	});

	QUnit.test("Label before Field", function(assert) {
		var oTitle1 = new Title("T1", {text: "Test"});
		var oLabel1 = new Label("L1", {text: "Test"});
		var oField1 = new Input("I1");
		var oLabel2 = new Label("L2", {text: "Test"});
		var oField2 = new Input("I2");
		var oField3 = new Input("I3");
		oSimpleForm.addContent(oTitle1);
		oSimpleForm.addContent(oLabel1);
		oSimpleForm.addContent(oField1);
		oSimpleForm.addContent(oLabel2);
		oSimpleForm.addContent(oField2);
		oSimpleForm.addContent(oField3);
		var aFormContainers = oForm.getFormContainers();
		var aFormElements = aFormContainers[0].getFormElements();
		var sElementId = aFormElements[1].getId();
		var oRemoved = oSimpleForm.removeContent(oLabel2);

		assert.equal(oRemoved.getId(), "L2", "Label removed");
		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 5, "SimpleForm has 5 content elements");
		aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 1, "FormContainer has 1 FormElement");
		assert.equal(aFormElements[0].getLabel().getId(), "L1", "FormElement has 1. Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L1--FE", "FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 3, "FormElement has 3 Fields");
		assert.equal(aFields[0].getId(), "I1", "FormElement has 1. field");
		assert.equal(aFields[1].getId(), "I2", "FormElement has 2. field");
		assert.equal(aFields[2].getId(), "I3", "FormElement has 3. field");
		assert.notOk(Element.getElementById(sElementId), "old FormElement destroyed");

		oLabel2.destroy();
	});

	QUnit.test("Field as first content", function(assert) {
		var oField = new Input("I1");
		var oTitle = new Title("T1", {text: "Test"});
		oSimpleForm.addContent(oField);
		oSimpleForm.addContent(oTitle);
		var aFormContainers = oForm.getFormContainers();
		var sContainerId = aFormContainers[0].getId();
		var oRemoved = oSimpleForm.removeContent("I1");

		assert.equal(oRemoved.getId(), "I1", "Field removed");
		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 1, "SimpleForm has 1 content elements");
		aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		assert.equal(aFormContainers[0].getId(), "SF1--T1--FC", "FormContainer has stable ID based on Title");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 0, "FormContainer has no FormElement");
		assert.notOk(Element.getElementById(sContainerId), "old FormContainer destroyed");

		oField.destroy();
	});

	QUnit.test("Field as only content", function(assert) {
		var oField = new Input("I1");
		oSimpleForm.addContent(oField);
		var aFormContainers = oForm.getFormContainers();
		var sContainerId = aFormContainers[0].getId();
		var oRemoved = oSimpleForm.removeContent(oField);

		assert.equal(oRemoved.getId(), "I1", "Field removed");
		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 0, "SimpleForm has no content");
		aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 0, "Form has no FormContainers");
		assert.notOk(Element.getElementById(sContainerId), "old FormContainer destroyed");

		oField.destroy();
	});

	QUnit.test("Field before Label", function(assert) {
		var oTitle1 = new Title("T1", {text: "Test"});
		var oLabel1 = new Label("L1", {text: "Test"});
		var oField1 = new Input("I1");
		var oLabel2 = new Label("L2", {text: "Test"});
		var oField2 = new Input("I2");
		oSimpleForm.addContent(oTitle1);
		oSimpleForm.addContent(oLabel1);
		oSimpleForm.addContent(oField1);
		oSimpleForm.addContent(oLabel2);
		oSimpleForm.addContent(oField2);
		var oRemoved = oSimpleForm.removeContent(oField1);

		assert.equal(oRemoved.getId(), "I1", "Field removed");
		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 4, "SimpleForm has 4 content elements");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 2, "FormContainer has 2 FormElement");
		assert.equal(aFormElements[0].getLabel().getId(), "L1", "1. FormElement has 1. Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L1--FE", "1. FormElement has stable ID based on Label");
		assert.equal(aFormElements[1].getId(), "SF1--L2--FE", "2. FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 0, "1. FormElement has no Field");

		oField1.destroy();
	});

	QUnit.test("Field before Field", function(assert) {
		var oTitle1 = new Title("T1", {text: "Test"});
		var oLabel1 = new Label("L1", {text: "Test"});
		var oField1 = new Input("I1");
		var oField2 = new Input("I2");
		var oLabel2 = new Label("L2", {text: "Test"});
		var oField3 = new Input("I3");
		oSimpleForm.addContent(oTitle1);
		oSimpleForm.addContent(oLabel1);
		oSimpleForm.addContent(oField1);
		oSimpleForm.addContent(oField2);
		oSimpleForm.addContent(oLabel2);
		oSimpleForm.addContent(oField3);
		var oRemoved = oSimpleForm.removeContent(oField1);

		assert.equal(oRemoved.getId(), "I1", "Field removed");
		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 5, "SimpleForm has 5 content elements");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainer");
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormElements.length, 2, "FormContainer has 2 FormElement");
		assert.equal(aFormElements[0].getLabel().getId(), "L1", "1. FormElement has 1. Label set");
		assert.equal(aFormElements[0].getId(), "SF1--L1--FE", "1. FormElement has stable ID based on Label");
		assert.equal(aFormElements[1].getId(), "SF1--L2--FE", "2. FormElement has stable ID based on Label");
		var aFields = aFormElements[0].getFields();
		assert.equal(aFields.length, 1, "1. FormElement has 1 Field");
		assert.equal(aFields[0].getId(), "I2", "1. FormElement has 2. field");

		oField1.destroy();
	});

	QUnit.test("not existing content", function(assert) {
		var oField1 = new Input("I1");
		var oField2 = new Input("I2");
		oSimpleForm.addContent(oField1);
		var oRemoved = oSimpleForm.removeContent(oField2);

		assert.notOk(oRemoved, "nothing removed");

		oRemoved = oSimpleForm.removeContent(99);

		assert.notOk(oRemoved, "nothing removed");
		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 1, "SimpleForm has 1 content element");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 1, "Form has 1 FormContainers");

		oField2.destroy();
	});

	QUnit.module("removeAllContent", {
		beforeEach: initTestWithoutContent,
		afterEach: afterTest
	});

	QUnit.test("empty Form", function(assert) {
		var aRemoved = oSimpleForm.removeAllContent();

		assert.equal(aRemoved.length, 0, "nothing removed");
		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 0, "SimpleForm has no content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 0, "Form has no FormContainer");
	});

	QUnit.test("Form with content", function(assert) {
		var oTitle1 = new Title("T1", {text: "Test"});
		var oLabel1 = new Label("L1", {text: "Test"});
		var oField1 = new Input("I1");
		var oField2 = new Input("I2");
		var oTitle2 = new Title("T2", {text: "Test"});
		var oLabel2 = new Label("L2", {text: "Test"});
		var oField3 = new Input("I3");
		oSimpleForm.addContent(oTitle1);
		oSimpleForm.addContent(oLabel1);
		oSimpleForm.addContent(oField1);
		oSimpleForm.addContent(oField2);
		oSimpleForm.addContent(oTitle2);
		oSimpleForm.addContent(oLabel2);
		oSimpleForm.addContent(oField3);
		var aFormContainers = oForm.getFormContainers();
		var sContainerId = aFormContainers[0].getId();
		var aRemoved = oSimpleForm.removeAllContent();

		assert.equal(aRemoved.length, 7, "elements removed");
		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 0, "SimpleForm has no content");
		aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 0, "Form has no FormContainer");
		assert.notOk(Element.getElementById(sContainerId), "old FormContainer destroyed");
	});

	QUnit.module("destroyContent", {
		beforeEach: initTestWithoutContent,
		afterEach: afterTest
	});

	QUnit.test("empty Form", function(assert) {
		oSimpleForm.destroyContent();

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 0, "SimpleForm has no content");
		var aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 0, "Form has no FormContainer");
	});

	QUnit.test("Form with content", function(assert) {
		var oTitle1 = new Title("T1", {text: "Test"});
		var oLabel1 = new Label("L1", {text: "Test"});
		var oField1 = new Input("I1");
		var oField2 = new Input("I2");
		var oTitle2 = new Title("T2", {text: "Test"});
		var oLabel2 = new Label("L2", {text: "Test"});
		var oField3 = new Input("I3");
		oSimpleForm.addContent(oTitle1);
		oSimpleForm.addContent(oLabel1);
		oSimpleForm.addContent(oField1);
		oSimpleForm.addContent(oField2);
		oSimpleForm.addContent(oTitle2);
		oSimpleForm.addContent(oLabel2);
		oSimpleForm.addContent(oField3);
		var aFormContainers = oForm.getFormContainers();
		var sContainerId = aFormContainers[0].getId();
		oSimpleForm.destroyContent();

		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 0, "SimpleForm has no content");
		aFormContainers = oForm.getFormContainers();
		assert.equal(aFormContainers.length, 0, "Form has no FormContainer");
		assert.notOk(Element.getElementById(sContainerId), "old FormContainer destroyed");
		assert.notOk(Element.getElementById("T1"), "Title1 destroyed");
		assert.notOk(Element.getElementById("T2"), "Title2 destroyed");
		assert.notOk(Element.getElementById("L1"), "Label1 destroyed");
		assert.notOk(Element.getElementById("L2"), "Label2 destroyed");
		assert.notOk(Element.getElementById("I1"), "Field1 destroyed");
		assert.notOk(Element.getElementById("I2"), "Field2 destroyed");
		assert.notOk(Element.getElementById("I3"), "Field3 destroyed");
	});

	QUnit.module("indexOfContent", {
		beforeEach: initTestWithoutContent,
		afterEach: afterTest
	});

	QUnit.test("not existing content", function(assert) {
		var oTitle1 = new Title("T1", {text: "Test"});
		var oLabel1 = new Label("L1", {text: "Test"});
		var oField1 = new Input("I1");
		var oField2 = new Input("I2");
		oSimpleForm.addContent(oTitle1);
		oSimpleForm.addContent(oLabel1);
		oSimpleForm.addContent(oField1);

		assert.equal(oSimpleForm.indexOfContent(oField2), -1, "Index of Field2");
		oField2.destroy();
	});

	QUnit.test("existing content", function(assert) {
		var oTitle1 = new Title("T1", {text: "Test"});
		var oLabel1 = new Label("L1", {text: "Test"});
		var oField1 = new Input("I1");
		var oField2 = new Input("I2");
		var oTitle2 = new Title("T2", {text: "Test"});
		var oLabel2 = new Label("L2", {text: "Test"});
		var oField3 = new Input("I3");
		oSimpleForm.addContent(oTitle1);
		oSimpleForm.addContent(oLabel1);
		oSimpleForm.addContent(oField1);
		oSimpleForm.addContent(oField2);
		oSimpleForm.addContent(oTitle2);
		oSimpleForm.addContent(oLabel2);
		oSimpleForm.addContent(oField3);

		assert.equal(oSimpleForm.indexOfContent(oLabel1), 1, "Index of Label1");
		assert.equal(oSimpleForm.indexOfContent(oField3), 6, "Index of Field3");
	});

	/**
	 * @deprecated as of version 1.93 ResponsiveLayout is deprecated, so test should only be executed if still available
	 */
	QUnit.module("ResponsiveLayout", {
		beforeEach: initTestWithContentRL,
		afterEach: afterTest
	});

	QUnit.test("used Layout", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/ResponsiveLayout", usedLayout);
	});

	function defaultLayoutDataOnContent(assert) {
		var oLabel = Element.getElementById("L1");
		var oLayoutData = oLabel.getLayoutData();
		assert.ok(oLayoutData, "Label has LayoutData");
		assert.ok(oLayoutData.isA("sap.ui.layout.ResponsiveFlowLayoutData"), "sap.ui.layout.ResponsiveFlowLayoutData used");
		assert.equal(oLayoutData.getWeight(), 3, "Label LayoutData weight");

		var oField = Element.getElementById("I1");
		oLayoutData = oField.getLayoutData();
		assert.ok(oLayoutData, "Field has LayoutData");
		assert.ok(oLayoutData.isA("sap.ui.layout.ResponsiveFlowLayoutData"), "sap.ui.layout.ResponsiveFlowLayoutData used");
		assert.equal(oLayoutData.getWeight(), 3, "Field LayoutData weight");

		oField = Element.getElementById("I2");
		oLayoutData = oField.getLayoutData();
		assert.ok(oLayoutData, "Field has LayoutData");
		assert.equal(oLayoutData.getWeight(), 2, "Field LayoutData weight");

		oLabel = Element.getElementById("L2");
		oLayoutData = oLabel.getLayoutData();
		assert.ok(oLayoutData, "Label has LayoutData");
		assert.equal(oLayoutData.getWeight(), 3, "Label LayoutData weight");

		oField = Element.getElementById("I3");
		oLayoutData = oField.getLayoutData();
		assert.ok(oLayoutData, "Field has LayoutData");
		assert.equal(oLayoutData.getWeight(), 5, "Field LayoutData weight");

		oLabel = Element.getElementById("L3");
		oLayoutData = oLabel.getLayoutData();
		assert.ok(oLayoutData, "Label has LayoutData");
		assert.equal(oLayoutData.getWeight(), 3, "Label LayoutData weight");

		oField = Element.getElementById("I4");
		oLayoutData = oField.getLayoutData();
		assert.ok(oLayoutData, "Field has LayoutData");
		assert.equal(oLayoutData.getWeight(), 2, "Field LayoutData weight");

		oField = Element.getElementById("I5");
		oLayoutData = oField.getLayoutData();
		assert.ok(oLayoutData, "Field has LayoutData");
		assert.equal(oLayoutData.getWeight(), 2, "Field LayoutData weight");

		oField = Element.getElementById("I6");
		oLayoutData = oField.getLayoutData();
		assert.ok(oLayoutData, "Field has LayoutData");
		assert.equal(oLayoutData.getWeight(), 1, "Field LayoutData weight");
	}

	QUnit.test("default LayoutData on content", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/ResponsiveLayout", defaultLayoutDataOnContent);
	});

	async function customLayoutDataOnContent(assert) {
		var oLayoutData = new ResponsiveFlowLayoutData("LD2", {linebreak: true, weight: 8});
		var oField = Element.getElementById("I2");
		oField.setLayoutData(oLayoutData);
		await nextUIUpdate();

		var oLabel = Element.getElementById("L1");
		oLayoutData = oLabel.getLayoutData();
		assert.ok(oLayoutData, "Label has LayoutData");
		assert.equal(oLayoutData.getWeight(), 3, "Label LayoutData weight");

		oField = Element.getElementById("I1");
		oLayoutData = oField.getLayoutData();
		assert.ok(oLayoutData, "Field has LayoutData");
		assert.equal(oLayoutData.getWeight(), 5, "Field LayoutData weight");

		oField = Element.getElementById("I2");
		oLayoutData = oField.getLayoutData();
		assert.ok(oLayoutData, "Field has LayoutData");
		assert.equal(oLayoutData.getId(), "LD2", "Field custom LayoutData set");
		assert.equal(oLayoutData.getWeight(), 8, "Field LayoutData weight");

		oLayoutData = new ResponsiveFlowLayoutData("LD4", {weight: 3});
		oField = Element.getElementById("I4");
		oField.setLayoutData(oLayoutData);
		await nextUIUpdate();

		oLayoutData = oField.getLayoutData();
		assert.ok(oLayoutData, "Field has LayoutData");
		assert.equal(oLayoutData.getId(), "LD4", "Field custom LayoutData set");
		assert.equal(oLayoutData.getWeight(), 3, "Field LayoutData weight");

		oField = Element.getElementById("I5");
		oLayoutData = oField.getLayoutData();
		assert.ok(oLayoutData, "Field has LayoutData");
		assert.equal(oLayoutData.getWeight(), 1, "Field LayoutData weight");

		oField = Element.getElementById("I6");
		oLayoutData = oField.getLayoutData();
		assert.ok(oLayoutData, "Field has LayoutData");
		assert.equal(oLayoutData.getWeight(), 1, "Field LayoutData weight");

		oField = Element.getElementById("I4");
		oField.destroyLayoutData();
		oLayoutData = new ResponsiveFlowLayoutData("LD5", {linebreak: true, weight: 3});
		oField = Element.getElementById("I5");
		oField.setLayoutData(oLayoutData);
		await nextUIUpdate();

		oField = Element.getElementById("I4");
		oLayoutData = oField.getLayoutData();
		assert.ok(oLayoutData, "Field has LayoutData");
		assert.equal(oLayoutData.getWeight(), 5, "Field LayoutData weight");

		oField = Element.getElementById("I5");
		oLayoutData = oField.getLayoutData();
		assert.ok(oLayoutData, "Field has LayoutData");
		assert.equal(oLayoutData.getId(), "LD5", "Field custom LayoutData set");
		assert.equal(oLayoutData.getWeight(), 3, "Field LayoutData weight");

		oField = Element.getElementById("I6");
		oLayoutData = oField.getLayoutData();
		assert.ok(oLayoutData, "Field has LayoutData");
		assert.equal(oLayoutData.getWeight(), 5, "Field LayoutData weight");

		oLayoutData = new ResponsiveFlowLayoutData("LD3", {linebreak: true, weight: 8});
		oField = Element.getElementById("I3");
		oField.setLayoutData(oLayoutData);
		await nextUIUpdate();

		oLayoutData = oField.getLayoutData();
		assert.ok(oLayoutData, "Field has LayoutData");
		assert.equal(oLayoutData.getId(), "LD3", "Field custom LayoutData set");
		assert.equal(oLayoutData.getWeight(), 8, "Field LayoutData weight");

		oField = Element.getElementById("I6");
		oSimpleForm.removeContent(oField);
		oLayoutData = new ResponsiveFlowLayoutData("LD6", {linebreak: true, weight: 8});
		oField.setLayoutData(oLayoutData);
		oSimpleForm.addContent(oField);
		await nextUIUpdate();

		oLayoutData = oField.getLayoutData();
		assert.ok(oLayoutData, "Field has LayoutData");
		assert.equal(oLayoutData.getId(), "LD6", "Field custom LayoutData set");
		assert.equal(oLayoutData.getWeight(), 8, "Field LayoutData weight");
	}

	QUnit.test("custom LayoutData on content", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/ResponsiveLayout", customLayoutDataOnContent);
	});

	function RlDefaultLayoutDataRemovedIfContentRemoved(assert){
		var oLabel = Element.getElementById("L1");
		oSimpleForm.removeContent(oLabel);
		var oLayoutData = oLabel.getLayoutData();
		assert.notOk(oLayoutData, "Label has no LayoutData");
		oLabel.destroy();

		var oField = Element.getElementById("I1");
		oSimpleForm.removeContent(oField);
		oLayoutData = oField.getLayoutData();
		assert.notOk(oLayoutData, "Field has no LayoutData");
		oField.destroy();

		var aRemoved = oSimpleForm.removeAllContent();
		for (var i = 0; i < aRemoved.length; i++) {
			oLayoutData = aRemoved[i].getLayoutData();
			assert.notOk(oLayoutData, "Field has no LayoutData");
			aRemoved[i].destroy();
		}
	}

	QUnit.test("default LayoutData removed if content removed", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/ResponsiveLayout", RlDefaultLayoutDataRemovedIfContentRemoved);
	});

	async function RlDefaultLayoutDataOnFormContainer(assert) {
		var oTitle = new Title("T3", {text: "Test"});
		oSimpleForm.addContent(oTitle);
		await nextUIUpdate();

		var aFormContainers = oForm.getFormContainers();
		var oLayoutData = aFormContainers[0].getLayoutData();
		assert.ok(oLayoutData, "FormContainer has LayoutData");
		assert.ok(oLayoutData.isA("sap.ui.layout.ResponsiveFlowLayoutData"), "sap.ui.layout.ResponsiveFlowLayoutData used");
		assert.equal(oLayoutData.getMinWidth(), 280, "LayoutData minWidth");
		assert.notOk(oLayoutData.getLinebreak(), "LayoutData linebreak");

		oLayoutData = aFormContainers[1].getLayoutData();
		assert.ok(oLayoutData, "FormContainer has LayoutData");
		assert.equal(oLayoutData.getMinWidth(), 280, "LayoutData minWidth");
		assert.notOk(oLayoutData.getLinebreak(), "LayoutData linebreak");

		oLayoutData = aFormContainers[2].getLayoutData();
		assert.ok(oLayoutData, "FormContainer has LayoutData");
		assert.equal(oLayoutData.getMinWidth(), 280, "LayoutData minWidth");
		assert.ok(oLayoutData.getLinebreak(), "LayoutData linebreak");
	}

	QUnit.test("default LayoutData on FormContainer", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/ResponsiveLayout", RlDefaultLayoutDataOnFormContainer);
	});

	function RlDefaultLayoutDataOnFormElement(assert) {
		var aFormContainers = oForm.getFormContainers();
		var aFormElements = aFormContainers[0].getFormElements();
		var oLayoutData = aFormElements[0].getLayoutData();
		assert.ok(oLayoutData, "FormElement has LayoutData");
		assert.ok(oLayoutData.isA("sap.ui.layout.ResponsiveFlowLayoutData"), "sap.ui.layout.ResponsiveFlowLayoutData used");
		assert.ok(oLayoutData.getLinebreak(), "LayoutData linebreak");
		assert.notOk(oLayoutData.getMargin(), "LayoutData margin");
	}

	QUnit.test("default LayoutData on FormElement", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/ResponsiveLayout", RlDefaultLayoutDataOnFormElement);
	});

	async function RlMaxContainerCols(assert) {
		assert.equal(oSimpleForm.getMaxContainerCols(), 2, "default value");

		oSimpleForm.setMaxContainerCols(3);
		var oTitle = new Title("T3", {text: "Test"});
		oSimpleForm.addContent(oTitle);
		await nextUIUpdate();

		var aFormContainers = oForm.getFormContainers();
		var oLayoutData = aFormContainers[0].getLayoutData();
		assert.notOk(oLayoutData.getLinebreak(), "LayoutData linebreak");
		oLayoutData = aFormContainers[1].getLayoutData();
		assert.notOk(oLayoutData.getLinebreak(), "LayoutData linebreak");
		oLayoutData = aFormContainers[2].getLayoutData();
		assert.notOk(oLayoutData.getLinebreak(), "LayoutData linebreak");

		oSimpleForm.setMaxContainerCols(1);
		await nextUIUpdate();

		oLayoutData = aFormContainers[0].getLayoutData();
		assert.notOk(oLayoutData.getLinebreak(), "LayoutData linebreak");
		oLayoutData = aFormContainers[1].getLayoutData();
		assert.ok(oLayoutData.getLinebreak(), "LayoutData linebreak");
		oLayoutData = aFormContainers[2].getLayoutData();
		assert.ok(oLayoutData.getLinebreak(), "LayoutData linebreak");
	}

	QUnit.test("maxContainerCols", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/ResponsiveLayout", RlMaxContainerCols);
	});

	async function RlMinWidth(assert) {
		assert.equal(oSimpleForm.getMinWidth(), -1, "default value");

		oSimpleForm.setMinWidth(5000);
		await nextUIUpdate();

		var aFormContainers = oForm.getFormContainers();
		var oLayoutData = aFormContainers[0].getLayoutData();
		assert.notOk(oLayoutData.getLinebreak(), "LayoutData linebreak");
		oLayoutData = aFormContainers[1].getLayoutData();
		assert.ok(oLayoutData.getLinebreak(), "LayoutData linebreak");
	}

	QUnit.test("minWidth", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/ResponsiveLayout", RlMinWidth);
	});

	async function RlLabelMinWidth(assert) {
		assert.equal(oSimpleForm.getLabelMinWidth(), 192, "default value");

		var oLabel = Element.getElementById("L1");
		var oLayoutData = oLabel.getLayoutData();
		assert.equal(oLayoutData.getMinWidth(), 192, "Label LayoutData minWidth");

		oSimpleForm.setLabelMinWidth(200);
		await nextUIUpdate();
		assert.equal(oLayoutData.getMinWidth(), 200, "Label LayoutData minWidth");
	}

	QUnit.test("labelMinWidth", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/ResponsiveLayout", RlLabelMinWidth);
	});

	async function RlBackgroundDesign(assert) {
		assert.equal(oSimpleForm.getBackgroundDesign(), library.BackgroundDesign.Translucent, "default value");
		assert.equal(oFormLayout.getBackgroundDesign(), library.BackgroundDesign.Translucent, "value on Layout");

		oSimpleForm.setBackgroundDesign(library.BackgroundDesign.Transparent);
		await nextUIUpdate();

		assert.equal(oSimpleForm.getBackgroundDesign(), library.BackgroundDesign.Transparent, "value on SimpleForm");
		assert.equal(oFormLayout.getBackgroundDesign(), library.BackgroundDesign.Transparent, "value on Layout");
	}

	QUnit.test("backgroundDesign", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/ResponsiveLayout", RlBackgroundDesign);
	});

	/**
	 * @deprecated as of version 1.67 GridLayout is deprecated, so test should only be executed if still available
	 */
	QUnit.module("GridLayout", {
		beforeEach: initTestWithContentGL,
		afterEach: afterTest
	});

	function GlUsedLayout(assert) {
		assert.ok(oFormLayout.isA("sap.ui.layout.form.GridLayout"), "GridLayout used");
	}

	QUnit.test("used Layout", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/GridLayout", GlUsedLayout);
	});

	function GlNoDefaultLayoutData(assert) {
		var oLabel = Element.getElementById("L1");
		var oLayoutData = oLabel.getLayoutData();
		assert.notOk(oLayoutData, "Label has no LayoutData");

		var oField = Element.getElementById("I1");
		oLayoutData = oField.getLayoutData();
		assert.notOk(oLayoutData, "Field has no LayoutData");

		var aFormContainers = oForm.getFormContainers();
		var aFormElements = aFormContainers[0].getFormElements();
		oLayoutData = aFormElements[0].getLayoutData();
		assert.notOk(oLayoutData, "FormElement has no LayoutData");
	}

	QUnit.test("no default LayoutData", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/GridLayout", GlNoDefaultLayoutData);
	});

	function GlDefaultLayoutDataOnFormContauiner(assert) {
		var aFormContainers = oForm.getFormContainers();
		var oLayoutData = aFormContainers[0].getLayoutData();
		assert.ok(oLayoutData, "FormContainer has LayoutData");
		assert.ok(oLayoutData.isA("sap.ui.layout.form.GridContainerData"), "sap.ui.layout.form.GridContainerData used");
		assert.ok(oLayoutData.getHalfGrid(), "LayoutData halfGrid");

		oLayoutData = aFormContainers[1].getLayoutData();
		assert.ok(oLayoutData, "FormContainer has LayoutData");
		assert.ok(oLayoutData.getHalfGrid(), "LayoutData halfGrid");
	}

	QUnit.test("default LayoutData on FormContauiner", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/GridLayout", GlDefaultLayoutDataOnFormContauiner);
	});

	async function GlMaxContainerCols(assert) {
		oSimpleForm.setMaxContainerCols(1);
		var oTitle = new Title("T3", {text: "Test"});
		oSimpleForm.addContent(oTitle);
		await nextUIUpdate();

		var aFormContainers = oForm.getFormContainers();
		var oLayoutData = aFormContainers[0].getLayoutData();
		assert.notOk(oLayoutData.getHalfGrid(), "LayoutData halfGrid");
		oLayoutData = aFormContainers[1].getLayoutData();
		assert.notOk(oLayoutData.getHalfGrid(), "LayoutData halfGrid");
		oLayoutData = aFormContainers[2].getLayoutData();
		assert.notOk(oLayoutData.getHalfGrid(), "LayoutData halfGrid");

		oSimpleForm.setMaxContainerCols(2);
		await nextUIUpdate();

		oLayoutData = aFormContainers[0].getLayoutData();
		assert.ok(oLayoutData.getHalfGrid(), "LayoutData halfGrid");
		oLayoutData = aFormContainers[1].getLayoutData();
		assert.ok(oLayoutData.getHalfGrid(), "LayoutData halfGrid");
		oLayoutData = aFormContainers[2].getLayoutData();
		assert.notOk(oLayoutData.getHalfGrid(), "LayoutData halfGrid");
	}

	QUnit.test("maxContainerCols", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/GridLayout", GlMaxContainerCols);
	});

	async function GlBackgroundDesign(assert) {
		assert.equal(oSimpleForm.getBackgroundDesign(), library.BackgroundDesign.Translucent, "default value");
		assert.equal(oFormLayout.getBackgroundDesign(), library.BackgroundDesign.Translucent, "value on Layout");

		oSimpleForm.setBackgroundDesign(library.BackgroundDesign.Transparent);
		await nextUIUpdate();

		assert.equal(oSimpleForm.getBackgroundDesign(), library.BackgroundDesign.Transparent, "value on SimpleForm");
		assert.equal(oFormLayout.getBackgroundDesign(), library.BackgroundDesign.Transparent, "value on Layout");
	}

	QUnit.test("backgroundDesign", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/GridLayout", GlBackgroundDesign);
	});

	QUnit.module("ResponsiveGridLayout", {
		beforeEach: initTestWithContentRGL,
		afterEach: afterTest
	});

	QUnit.test("used Layout", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/ResponsiveGridLayout", usedLayout);
	});

	function RGlNoDefaultLayoutData(assert) {
		var oLabel = Element.getElementById("L1");
		var oLayoutData = oLabel.getLayoutData();
		assert.notOk(oLayoutData, "Label has no LayoutData");

		var oField = Element.getElementById("I1");
		oLayoutData = oField.getLayoutData();
		assert.notOk(oLayoutData, "Field has no LayoutData");

		var aFormContainers = oForm.getFormContainers();
		var aFormElements = aFormContainers[0].getFormElements();
		oLayoutData = aFormContainers[0].getLayoutData();
		assert.notOk(oLayoutData, "FormContainer has no LayoutData");
		oLayoutData = aFormElements[0].getLayoutData();
		assert.notOk(oLayoutData, "FormElement has no LayoutData");
	}

	QUnit.test("no default LayoutData", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/ResponsiveGridLayout", RGlNoDefaultLayoutData);
	});

	async function RGlBackgroundDesign(assert) {
		assert.equal(oSimpleForm.getBackgroundDesign(), library.BackgroundDesign.Translucent, "default value");
		assert.equal(oFormLayout.getBackgroundDesign(), library.BackgroundDesign.Translucent, "value on Layout");

		oSimpleForm.setBackgroundDesign(library.BackgroundDesign.Transparent);
		await nextUIUpdate();

		assert.equal(oSimpleForm.getBackgroundDesign(), library.BackgroundDesign.Transparent, "value on SimpleForm");
		assert.equal(oFormLayout.getBackgroundDesign(), library.BackgroundDesign.Transparent, "value on Layout");
	}

	QUnit.test("backgroundDesign", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/ResponsiveGridLayout", RGlBackgroundDesign);
	});

	function RGlOtherPropertiesDefaults(assert) {
		assert.equal(oSimpleForm.getLabelSpanXL(), -1, "LabelSpanXL: default value");
		assert.equal(oFormLayout.getLabelSpanXL(), -1, "LabelSpanXL: on Layout");
		assert.equal(oSimpleForm.getLabelSpanL(), 4, "LabelSpanL: default value");
		assert.equal(oFormLayout.getLabelSpanL(), 4, "LabelSpanL: on Layout");
		assert.equal(oSimpleForm.getLabelSpanM(), 2, "LabelSpanM: default value");
		assert.equal(oFormLayout.getLabelSpanM(), 2, "LabelSpanM: on Layout");
		assert.equal(oSimpleForm.getLabelSpanS(), 12, "LabelSpanS: default value");
		assert.equal(oFormLayout.getLabelSpanS(), 12, "LabelSpanS: on Layout");
		assert.ok(oSimpleForm.getAdjustLabelSpan(), "AdjustLabelSpan: default value");
		assert.ok(oFormLayout.getAdjustLabelSpan(), "AdjustLabelSpan: on Layout");
		assert.equal(oSimpleForm.getEmptySpanXL(), -1, "EmptySpanXL: default value");
		assert.equal(oFormLayout.getEmptySpanXL(), -1, "EmptySpanXL: on Layout");
		assert.equal(oSimpleForm.getEmptySpanL(), 0, "EmptySpanL: default value");
		assert.equal(oFormLayout.getEmptySpanL(), 0, "EmptySpanL: on Layout");
		assert.equal(oSimpleForm.getEmptySpanM(), 0, "EmptySpanM: default value");
		assert.equal(oFormLayout.getEmptySpanM(), 0, "EmptySpanM: on Layout");
		assert.equal(oSimpleForm.getEmptySpanS(), 0, "EmptySpanS: default value");
		assert.equal(oFormLayout.getEmptySpanS(), 0, "EmptySpanS: on Layout");
		assert.equal(oSimpleForm.getColumnsXL(), -1, "ColumnsXL: default value");
		assert.equal(oFormLayout.getColumnsXL(), -1, "ColumnsXL: on Layout");
		assert.equal(oSimpleForm.getColumnsL(), 2, "ColumnsL: default value");
		assert.equal(oFormLayout.getColumnsL(), 2, "ColumnsL: on Layout");
		assert.equal(oSimpleForm.getColumnsM(), 1, "ColumnsM: default value");
		assert.equal(oFormLayout.getColumnsM(), 1, "ColumnsM: on Layout");
		assert.ok(oSimpleForm.getSingleContainerFullSize(), "SingleContainerFullSize: default value");
		assert.ok(oFormLayout.getSingleContainerFullSize(), "SingleContainerFullSize: on Layout");
		assert.equal(oSimpleForm.getBreakpointXL(), 1440, "BreakpointXL: default value");
		assert.equal(oFormLayout.getBreakpointXL(), 1440, "BreakpointXL: on Layout");
		assert.equal(oSimpleForm.getBreakpointL(), 1024, "BreakpointL: default value");
		assert.equal(oFormLayout.getBreakpointL(), 1024, "BreakpointL: on Layout");
		assert.equal(oSimpleForm.getBreakpointM(), 600, "BreakpointM: default value");
		assert.equal(oFormLayout.getBreakpointM(), 600, "BreakpointM: on Layout");
	}

	QUnit.test("other properties defaults", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/ResponsiveGridLayout", RGlOtherPropertiesDefaults);
	});

	async function RGlOtherPropertiesSet(assert) {
		oSimpleForm.setLabelSpanXL(6);
		oSimpleForm.setLabelSpanL(5);
		oSimpleForm.setLabelSpanM(4);
		oSimpleForm.setLabelSpanS(3);
		oSimpleForm.setAdjustLabelSpan(false);
		oSimpleForm.setEmptySpanXL(4);
		oSimpleForm.setEmptySpanL(3);
		oSimpleForm.setEmptySpanM(2);
		oSimpleForm.setEmptySpanS(1);
		oSimpleForm.setColumnsXL(4);
		oSimpleForm.setColumnsL(3);
		oSimpleForm.setColumnsM(2);
		oSimpleForm.setSingleContainerFullSize(false);
		oSimpleForm.setBreakpointXL(2000);
		oSimpleForm.setBreakpointL(1000);
		oSimpleForm.setBreakpointM(500);
		await nextUIUpdate();

		assert.equal(oSimpleForm.getLabelSpanXL(), 6, "LabelSpanXL: on SimpleForm");
		assert.equal(oFormLayout.getLabelSpanXL(), 6, "LabelSpanXL: on Layout");
		assert.equal(oSimpleForm.getLabelSpanL(), 5, "LabelSpanL: on SimpleForm");
		assert.equal(oFormLayout.getLabelSpanL(), 5, "LabelSpanL: on Layout");
		assert.equal(oSimpleForm.getLabelSpanM(), 4, "LabelSpanM: on SimpleForm");
		assert.equal(oFormLayout.getLabelSpanM(), 4, "LabelSpanM: on Layout");
		assert.equal(oSimpleForm.getLabelSpanS(), 3, "LabelSpanS: on SimpleForm");
		assert.equal(oFormLayout.getLabelSpanS(), 3, "LabelSpanS: on Layout");
		assert.notOk(oSimpleForm.getAdjustLabelSpan(), "AdjustLabelSpan: on SimpleForm");
		assert.notOk(oFormLayout.getAdjustLabelSpan(), "AdjustLabelSpan: on Layout");
		assert.equal(oSimpleForm.getEmptySpanXL(), 4, "EmptySpanXL: on SimpleForm");
		assert.equal(oFormLayout.getEmptySpanXL(), 4, "EmptySpanXL: on Layout");
		assert.equal(oSimpleForm.getEmptySpanL(), 3, "EmptySpanL: on SimpleForm");
		assert.equal(oFormLayout.getEmptySpanL(), 3, "EmptySpanL: on Layout");
		assert.equal(oSimpleForm.getEmptySpanM(), 2, "EmptySpanM: on SimpleForm");
		assert.equal(oFormLayout.getEmptySpanM(), 2, "EmptySpanM: on Layout");
		assert.equal(oSimpleForm.getEmptySpanS(), 1, "EmptySpanS: on SimpleForm");
		assert.equal(oFormLayout.getEmptySpanS(), 1, "EmptySpanS: on Layout");
		assert.equal(oSimpleForm.getColumnsXL(), 4, "ColumnsXL: on SimpleForm");
		assert.equal(oFormLayout.getColumnsXL(), 4, "ColumnsXL: on Layout");
		assert.equal(oSimpleForm.getColumnsL(), 3, "ColumnsL: on SimpleForm");
		assert.equal(oFormLayout.getColumnsL(), 3, "ColumnsL: on Layout");
		assert.equal(oSimpleForm.getColumnsM(), 2, "ColumnsM: on SimpleForm");
		assert.equal(oFormLayout.getColumnsM(), 2, "ColumnsM: on Layout");
		assert.notOk(oSimpleForm.getSingleContainerFullSize(), "SingleContainerFullSize: on SimpleForm");
		assert.notOk(oFormLayout.getSingleContainerFullSize(), "SingleContainerFullSize: on Layout");
		assert.equal(oSimpleForm.getBreakpointXL(), 2000, "BreakpointXL: on SimpleForm");
		assert.equal(oFormLayout.getBreakpointXL(), 2000, "BreakpointXL: on Layout");
		assert.equal(oSimpleForm.getBreakpointL(), 1000, "BreakpointL: on SimpleForm");
		assert.equal(oFormLayout.getBreakpointL(), 1000, "BreakpointL: on Layout");
		assert.equal(oSimpleForm.getBreakpointM(), 500, "BreakpointM: on SimpleForm");
		assert.equal(oFormLayout.getBreakpointM(), 500, "BreakpointM: on Layout");
	}

	QUnit.test("other properties set", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/ResponsiveGridLayout", RGlOtherPropertiesSet);
	});

	QUnit.module("ColumnLayout", {
		beforeEach: initTestWithContentCL,
		afterEach: afterTest
	});

	QUnit.test("used Layout", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/ColumnLayout", usedLayout);
	});

	function ClNoDefaultLayoutData(assert) {
		var oLabel = Element.getElementById("L1");
		var oLayoutData = oLabel.getLayoutData();
		assert.notOk(oLayoutData, "Label has no LayoutData");

		var oField = Element.getElementById("I1");
		oLayoutData = oField.getLayoutData();
		assert.notOk(oLayoutData, "Field has no LayoutData");

		var aFormContainers = oForm.getFormContainers();
		var aFormElements = aFormContainers[0].getFormElements();
		oLayoutData = aFormContainers[0].getLayoutData();
		assert.notOk(oLayoutData, "FormContainer has no LayoutData");
		oLayoutData = aFormElements[0].getLayoutData();
		assert.notOk(oLayoutData, "FormElement has no LayoutData");
	}

	QUnit.test("no default LayoutData", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/ColumnLayout", ClNoDefaultLayoutData);
	});

	async function ClBackgroundDesign(assert) {
		assert.equal(oSimpleForm.getBackgroundDesign(), library.BackgroundDesign.Translucent, "default value");
		assert.equal(oFormLayout.getBackgroundDesign(), library.BackgroundDesign.Translucent, "value on Layout");

		oSimpleForm.setBackgroundDesign(library.BackgroundDesign.Transparent);
		await nextUIUpdate();

		assert.equal(oSimpleForm.getBackgroundDesign(), library.BackgroundDesign.Transparent, "value on SimpleForm");
		assert.equal(oFormLayout.getBackgroundDesign(), library.BackgroundDesign.Transparent, "value on Layout");
	}

	QUnit.test("backgroundDesign", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/ColumnLayout", ClBackgroundDesign);
	});

	function ClOtherPropertiesDefaults(assert) {
		assert.equal(oSimpleForm.getLabelSpanL(), 4, "LabelSpanL: default value");
		assert.equal(oFormLayout.getLabelCellsLarge(), 4, "LabelCellsLarge: on Layout");
		assert.equal(oSimpleForm.getEmptySpanL(), 0, "EmptySpanL: default value");
		assert.equal(oFormLayout.getEmptyCellsLarge(), 0, "EmptyCellsLarge: on Layout");
		assert.equal(oSimpleForm.getColumnsXL(), -1, "ColumnsXL: default value");
		assert.equal(oFormLayout.getColumnsXL(), 2, "ColumnsXL: on Layout");
		assert.equal(oSimpleForm.getColumnsL(), 2, "ColumnsL: default value");
		assert.equal(oFormLayout.getColumnsL(), 2, "ColumnsL: on Layout");
		assert.equal(oSimpleForm.getColumnsM(), 1, "ColumnsM: default value");
		assert.equal(oFormLayout.getColumnsM(), 1, "ColumnsM: on Layout");
	}

	QUnit.test("other properties defaults", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/ColumnLayout", ClOtherPropertiesDefaults);
	});

	async function ClOtherPropertiesSet(assert) {
		oSimpleForm.setLabelSpanL(5);
		oSimpleForm.setEmptySpanL(3);
		oSimpleForm.setColumnsXL(4);
		oSimpleForm.setColumnsL(3);
		oSimpleForm.setColumnsM(2);
		await nextUIUpdate();

		assert.equal(oSimpleForm.getLabelSpanL(), 5, "LabelSpanL: on SimpleForm");
		assert.equal(oFormLayout.getLabelCellsLarge(), 5, "LabelCellsLarge: on Layout");
		assert.equal(oSimpleForm.getEmptySpanL(), 3, "EmptySpanL: on SimpleForm");
		assert.equal(oFormLayout.getEmptyCellsLarge(), 3, "EmptyCellsLarge: on Layout");
		assert.equal(oSimpleForm.getColumnsXL(), 4, "ColumnsXL: on SimpleForm");
		assert.equal(oFormLayout.getColumnsXL(), 4, "ColumnsXL: on Layout");
		assert.equal(oSimpleForm.getColumnsL(), 3, "ColumnsL: on SimpleForm");
		assert.equal(oFormLayout.getColumnsL(), 3, "ColumnsL: on Layout");
		assert.equal(oSimpleForm.getColumnsM(), 2, "ColumnsM: on SimpleForm");
		assert.equal(oFormLayout.getColumnsM(), 2, "ColumnsM: on Layout");
	}

	QUnit.test("other properties set", async function(assert) {
		await asyncLayoutTest(assert, "sap/ui/layout/form/ColumnLayout", ClOtherPropertiesSet);
	});

	QUnit.module("other", {
		beforeEach: initTestWithContentRGL,
		afterEach: afterTest
	});

	async function changeLayout(assert, oOldLayout) {
		assert.ok(oFormLayout.isA("sap.ui.layout.form.ColumnLayout"), "ColumnLayout used");
		assert.ok(oOldLayout._bIsBeingDestroyed, "old layout destroyed");

		var oLabel = Element.getElementById("L1");
		var oLayoutData = oLabel.getLayoutData();
		assert.notOk(!!oLayoutData, "Label has no LayoutData");

		var aFormContainers = oForm.getFormContainers();
		oLayoutData = aFormContainers[0].getLayoutData();
		assert.notOk(!!oLayoutData, "FormContainer has no LayoutData");

		oOldLayout = oFormLayout;
		oSimpleForm.setLayout("ResponsiveGridLayout");
		await nextUIUpdate();
		// eslint-disable-next-line require-atomic-updates
		oFormLayout = oForm.getLayout();

		assert.ok(oFormLayout.isA("sap.ui.layout.form.ResponsiveGridLayout"), "ResponsiveGridLayout used");
		assert.ok(oOldLayout._bIsBeingDestroyed, "old layout destroyed");
		oLayoutData = oLabel.getLayoutData();
		assert.notOk(!!oLayoutData, "Label has no LayoutData");
		oLayoutData = aFormContainers[0].getLayoutData();
		assert.notOk(!!oLayoutData, "FormContainer has no LayoutData");
	}

	QUnit.test("change Layout", async function(assert) {
		var oOldLayout;
		var fnDone;
		if (oFormLayout) {
			oOldLayout = oFormLayout;
			oSimpleForm.setLayout(library.form.SimpleFormLayout.ColumnLayout);
			await nextUIUpdate();
			// eslint-disable-next-line require-atomic-updates
			oFormLayout = oForm.getLayout();
			if (oFormLayout) {
				changeLayout(assert, oOldLayout);
			} else {
				fnDone = assert.async();
				sap.ui.require(["sap/ui/layout/form/ColumnLayout"], function() {
					oFormLayout = oForm.getLayout();
					changeLayout(assert, oOldLayout);
					fnDone();
				});
			}
		} else {
			// wait until Layout is loaded
			fnDone = assert.async();
			sap.ui.require(["sap/ui/layout/form/ResponsiveGridLayout"], async function() {
				oFormLayout = oForm.getLayout();
				oOldLayout = oFormLayout;
				oSimpleForm.setLayout(library.form.SimpleFormLayout.ColumnLayout);
				await nextUIUpdate();
				// eslint-disable-next-line require-atomic-updates
				oFormLayout = oForm.getLayout();

				if (oFormLayout) {
					changeLayout(assert, oOldLayout);
					fnDone();
				} else {
					sap.ui.require(["sap/ui/layout/form/ColumnLayout"], function() {
						oFormLayout = oForm.getLayout();
						changeLayout(assert, oOldLayout);
						fnDone();
					});
				}
			});
		}
	});

	QUnit.test("visibility of FormElement", function(assert) {
		var aFormContainers = oForm.getFormContainers();
		var aFormElements = aFormContainers[0].getFormElements();
		assert.ok(aFormElements[0].isVisible(), "FormElement visible");

		this.spy(aFormElements[0], "invalidate");
		var oField1 = Element.getElementById("I1");
		var oField2 = Element.getElementById("I2");
		oField1.setVisible(false);
		assert.ok(aFormElements[0].isVisible(), "FormElement still visible");
		assert.ok(aFormElements[0].invalidate.called, "FormElement invalidated");

		oField2.setVisible(false);
		assert.notOk(aFormElements[0].isVisible(), "FormElement not visible");

		oField1.setVisible(true);
		assert.ok(aFormElements[0].isVisible(), "FormElement again visible");
	});

	QUnit.test("destroy of field", function(assert) {
		var oField = Element.getElementById("I2");
		oField.destroy();
		var aContent = oSimpleForm.getContent();
		assert.equal(aContent.length, 10, "SimpleForm has 10 content elements");
		var bFound = false;
		for (var i = 0; i < aContent.length; i++) {
			if (oField === aContent[i]) {
				bFound = true;
			}
		}
		assert.notOk(bFound, "Field is not assigned to SimpleForm");
	});

	async function clone(assert) {
		var oClone = oSimpleForm.clone("MyClone");
		oClone.placeAt("qunit-fixture");
		await nextUIUpdate();

		var aContent = oClone.getContent();
		var oCloneForm = oClone.getAggregation("form");
		assert.equal(aContent.length, 13, "Clone has 13 content elements");
		var aFormContainers = oCloneForm.getFormContainers();
		var aFormElements = aFormContainers[0].getFormElements();
		assert.equal(aFormContainers.length, 3, "Clone-Form has 3 FormContainers");
		assert.equal(aFormContainers[0].getTitle().getId(), "T1-MyClone", "1. FormContainer has Title set");
		assert.equal(aFormElements.length, 1, "1. FormContainer has 1 FormElement");
		aFormElements = aFormContainers[1].getFormElements();
		assert.equal(aFormElements.length, 2, "2. FormContainer has 2 FormElements");
		aFormElements = aFormContainers[2].getFormElements();
		assert.equal(aFormElements.length, 1, "3. FormContainer has 1 FormElement");

		var oLabel = aContent[1];
		var oLayoutData = oLabel.getLayoutData();
		assert.notOk(!!oLayoutData, "Clone-Label has no LayoutData");
		var oField = aContent[12];
		oLayoutData = oField.getLayoutData();
		assert.ok(oLayoutData.isA("sap.ui.core.VariantLayoutData"), "sap.ui.core.VariantLayoutData used");
		var aLayoutData = oLayoutData.getMultipleLayoutData();
		assert.equal(aLayoutData.length, 1, "1 layoutData used");
		var oGD;
		for (var i = 0; i < aLayoutData.length; i++) {
			if (aLayoutData[i].isA("sap.ui.layout.GridData")) {
				oGD = aLayoutData[i];
			}
		}
		assert.ok(oGD, "sap.ui.layout.GridData used");
		assert.equal(oClone._aLayouts.length, 0, "Clone has no own LayoutData");

		//visibility change
		oField = Element.getElementById("I3");
		aFormElements = aFormContainers[1].getFormElements();
		oField.setVisible(false);
		assert.ok(aFormElements[0].isVisible(), "FormElement on Clone still visible");
		oField.setVisible(true);

		var oCloneField = Element.getElementById("I3-MyClone");
		oCloneField.setVisible(false);
		assert.notOk(aFormElements[0].isVisible(), "FormElement on Clone not visible");
		aFormContainers = oForm.getFormContainers();
		aFormElements = aFormContainers[1].getFormElements();
		assert.ok(aFormElements[0].isVisible(), "FormElement on Original still visible");

		oClone.destroy();
	}

	QUnit.test("clone", async function(assert) {
		oSimpleForm.setLayout("ColumnLayout");
		var oToolbar = new Toolbar("TB1");
		oSimpleForm.addContent(oToolbar);

		var oGD = new GridData("GD1");
		var oVD = new VariantLayoutData("VD1", {multipleLayoutData: [oGD]});
		var oField = new Input("I7", {layoutData: oVD});
		oSimpleForm.addContent(oField);
		await nextUIUpdate();

		await asyncLayoutTest(assert, "sap/ui/layout/form/ColumnLayout", clone);
	});

	/**
	 * @deprecated as of version 1.93 ResponsiveLayout is deprecated, so test should only be executed if still available
	 */
	QUnit.test("resize", async function(assert) {
		oSimpleForm.setLayout("ResponsiveLayout");
		await nextUIUpdate();
		this.spy(oSimpleForm, "_applyLinebreaks");

		var fnDone = assert.async();

		setTimeout( function(){ // to wait for rendeing
			jQuery("#qunit-fixture").attr("style", "width: 50%");
			setTimeout( function(){ // to wait for resize handler
				assert.ok(oSimpleForm._applyLinebreaks.called, "linebreaks calculation called");
				jQuery("#content").removeAttr("style");
				fnDone();
			}, 500);
		}, 10);
	});

});