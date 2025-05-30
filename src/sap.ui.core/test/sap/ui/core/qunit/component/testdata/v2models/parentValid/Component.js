/*
 * ${copyright}
 */

// Provides class teatdata.v2models.Component
sap.ui.define(["sap/ui/core/UIComponent"], function(UIComponent) {
	"use strict";

	return UIComponent.extend("testdata.v2models.parentValid.Component", {

		metadata: {

			manifest: {

				"_version": "1.0.0",

				"sap.app": {
					"_version": "1.0.0",
					"id": "testdata.v2models.parentValid",
					"type": "application",
					"applicationVersion": {
						"version": "1.0.0"
					},
					"i18n": "i18n.properties",
					"title": "{{title}}",
					"description": "{{description}}",
					"dataSources": {

						"default": {
							"uri": "/path/to/default/datasource"
						},

						"default-with-annotations": {
							"uri": "/path/to/default/datasource",
							"settings": {
								"annotations": [ "annotations2", "annotations1" ],
								"maxAge": 500
							}
						},

						"ODataV4": {
							"uri": "/path/to/odata/service/",
							"type": "OData",
							"settings": {
								"odataVersion": "4.0"
							}
						},

						"AnotherOData": {
							"uri": "/path/to/odata/service/with/trailing/slash/",
							"type": "OData",
							"settings": {
								"annotations": ["originAnnotations", "annotations2"]
							}
						},

						"ODataWithMultiOriginAnnotations": {
							"uri": "/path/to/odata/service/with/multi/origin/annotations/",
							"type": "OData",
							"settings": {
								"annotations": ["annotationWithOtherOrigin1", "annotationWithOtherOrigin2", "annotationWithOtherOrigin3", "annotationWithOtherOrigin4"]
							}
						},

						"ODataWithSAPClient": {
							"uri": "/path/to/odata/service/with/sapclient/?sap-client=100",
							"type": "OData",
							"settings": {
								"annotations": ["annotationWithSAPClient"]
							}
						},

						"originAnnotations" : {
							"uri": "/path/to/odata/service/with/trailing/slash/annotations.xml",
							"type": "ODataAnnotation"
						},

						"annotations1": {
							"uri": "/path/to/odata/annotations/1", // absolute uri
							"type": "ODataAnnotation"
						},

						"annotations2": {
							"uri": "path/to/local/odata/annotations/2", // relative uri
							"type": "ODataAnnotation"
						},

						"annotationWithOtherOrigin1": { // absolute uri
							"uri": "/path/to/other/odata/service/Annotations(TechnicalName='%2FIWBEP%2FTEA_TEST_ANNOTATION_FILE',Version='0001')/$value",
							"type":"ODataAnnotation"
						},

						"annotationWithOtherOrigin2": { // relative uri
							"uri": "path/to/other/odata/service/Annotations(TechnicalName='%2FIWBEP%2FTEA_TEST_ANNOTATION_FILE',Version='0001')/$value",
							"type":"ODataAnnotation"
						},

						"annotationWithOtherOrigin3": { //Missing value parameter
							"uri": "/path/to/other/odata/service/other2/Annotations(TechnicalName='%2FIWBEP%2FTEA_TEST_ANNOTATION_FILE',Version='0001')/",
							"type":"ODataAnnotation"
						},

						"annotationWithOtherOrigin4": { //already set origin
							"uri": "/path/to/other3/odata/service/;o=sid(G1Y.400)/Annotations(TechnicalName='%2FIWBEP%2FTEA_TEST_ANNOTATION_FILE',Version='0001')/$value",
							"type":"ODataAnnotation"
						},

						"annotationWithSAPClient": { //already set origin
							"uri": "/path/to/odata/annotations/with/sapclient/?sap-client=200",
							"type":"ODataAnnotation"
						},


						"json": {
							"uri": "/path/to/data.json",
							"type": "JSON"
						},

						"json-relative": {
							"uri": "path/to/local/data.json",
							"type": "JSON"
						},

						"json-relative-2": {
							"uri": "../../path/to/other/data.json",
							"type": "JSON"
						},

						"xml-relative": {
							"uri": "./path/to/local/data.xml",
							"type": "XML"
						},

						"xml": {
							"uri": "/path/to/data.xml",
							"type": "XML"
						},

						"customType": {
							"uri": "/path/to/custom.datatype",
							"type": "SomeCustomType"
						},

						"customType-relative": {
							"uri": "path/to/local/custom.datatype",
							"type": "SomeCustomType"
						}
					}
				},

				"sap.ui": {
					"_version": "1.0.0",
					"technology": "UI5"
				},

				"sap.ui5": {

					"_version": "1.0.0",

					"dependencies": {
						"minUI5Version": "1.28.0",
						"libs": {
							"sap.ui.core": {
								"minVersion": "1.28.0"
							}
						}
					},

					"models": {

						"": "default",

						"default-with-annotations": "default-with-annotations",

						"old-uri-syntax": {
							"type": "sap.ui.model.odata.v2.ODataModel",
							"uri": "/path/to/odata/service"
						},

						"ODataV4Model": {
							"dataSource": "ODataV4"
						},

						"v2-ODataModel": {
							"type": "sap.ui.model.odata.v2.ODataModel",
							"settings": {
								"serviceUrl": "/path/to/odata/service",
								"useBatch": true,
								"refreshAfterChange": true
							}
						},

						"v2-ODataModel-ServiceOrigin": {
							"type": "sap.ui.model.odata.v2.ODataModel",
							"dataSource": "AnotherOData",
							"settings": {
								"useBatch": true,
								"refreshAfterChange": true
							}
						},

						"v2-ODataModel-OtherOrigins": {
							"type": "sap.ui.model.odata.v2.ODataModel",
							"dataSource": "ODataWithMultiOriginAnnotations"
						},

						"v2-ODataModel-SAPClient": {
							"type": "sap.ui.model.odata.v2.ODataModel",
							"dataSource": "ODataWithSAPClient"
						},

						"json": "json",
						"json-relative": "json-relative",
						"json-relative-2": "json-relative-2",

						"xml": "xml",
						"xml-relative": "xml-relative",

						"resourceBundle-name": {
							"type": "sap.ui.model.resource.ResourceModel",
							"settings": {
								"bundleName": "testdata.v2models.parent.i18n",
								"async": true
							}
						},

						"resourceBundle-legacy-uri": {
							"type": "sap.ui.model.resource.ResourceModel",
							"uri": "./i18n.properties",
							"settings": {
								"async": true
							}
						},

						"custom-uri-string": {
							"type": "testdata.v2models.parent.CustomModel",
							"dataSource": "customType"
						},

						"custom-relative-uri-string": {
							"type": "testdata.v2models.parent.CustomModel",
							"dataSource": "customType-relative"
						},

						"custom-uri-string-with-settings": {
							"type": "testdata.v2models.parent.CustomModel",
							"dataSource": "customType",
							"settings": {
								"foo": "bar"
							}
						},

						"custom-without-args": {
							"type": "testdata.v2models.parent.CustomModel"
						},

						"custom-uri-setting-name": {
							"type": "testdata.v2models.parent.CustomModel",
							"dataSource": "customType",
							"uriSettingName": "myUri"
						},

						"custom-uri-setting-merge": {
							"type": "testdata.v2models.parent.CustomModel",
							"dataSource": "customType",
							"uriSettingName": "uri",
							"settings": {
								"foo": "bar"
							}
						},

						"custom-uri-setting-already-defined": {
							"type": "testdata.v2models.parent.CustomModel",
							"dataSource": "customType",
							"uriSettingName": "uri",
							"settings": {
								"uri": "foo"
							}
						}
					}

				}

			}

		}

	});

});
