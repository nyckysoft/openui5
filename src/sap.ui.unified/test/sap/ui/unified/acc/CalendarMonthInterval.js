sap.ui.define([
	"sap/m/Label",
	"sap/ui/unified/CalendarMonthInterval",
	"sap/m/App",
	"sap/m/Page",
	"sap/m/ScrollContainer",
	"sap/ui/layout/VerticalLayout",
	"sap/ui/core/library",
	"sap/ui/core/date/UI5Date"
], function(
	Label,
	CalendarMonthInterval,
	App,
	Page,
	ScrollContainer,
	VerticalLayout,
	coreLibrary,
	UI5Date
) {
	"use strict";

	// shortcut for sap.ui.core.TitleLevel
	var TitleLevel = coreLibrary.TitleLevel;

	var oLabel1 = new Label({
		text: "Single selection",
		wrapping: true,
		labelFor: "Cal1"
	});
	var oCalendar1 = new CalendarMonthInterval("Cal1", {
		months: 7,
		width: "320px"
	});

	var oStartDate = UI5Date.getInstance();
	oStartDate.setDate(15);
	oStartDate.setMonth(oStartDate.getMonth() - 1);

	var oLabel2 = new Label({
		text: "Single interval selection",
		wrapping: true,
		labelFor: "Cal2"
	});
	var oCalendar2 = new CalendarMonthInterval("Cal2",{
		width: "320px",
		startDate: oStartDate,
		months: 7,
		intervalSelection: true
	});

	var oLabel3 = new Label({
		text: "Multiple selection",
		wrapping: true,
		labelFor: "Cal3"
	});
	var oCalendar3 = new CalendarMonthInterval("Cal3",{
		width: "320px",
		months: 7,
		intervalSelection: false,
		singleSelection: false,
		pickerPopup: true
	});

	var oPageLayout = new ScrollContainer({
		content: [
			new VerticalLayout({
				content: [
					oLabel1, oCalendar1,
					oLabel2, oCalendar2,
					oLabel3, oCalendar3
				]
			}).addStyleClass("sapUiContentPadding")
		]
	});

	var oApp = new App();
	var oPage = new Page({
		title: "CalendarMonthInterval Accessibility Test Page",
		titleLevel: TitleLevel.H1,
		content: oPageLayout
	});

	oApp.addPage(oPage);
	oApp.placeAt("body");
});