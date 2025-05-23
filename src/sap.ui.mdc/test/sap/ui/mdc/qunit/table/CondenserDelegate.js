/*!
 * ${copyright}
 */

sap.ui.define([
    "sap/ui/core/Element",
    "sap/ui/mdc/TableDelegate",
    "delegates/TableDelegateUtils",
    "sap/ui/mdc/table/Column",
    "sap/ui/core/util/reflection/JsControlTreeModifier",
    "sap/ui/fl/Utils",
    "sap/ui/mdc/util/IdentifierUtil"
], function(Element, TableDelegate, TableDelegateUtils, Column, JsControlTreeModifier, FlUtils, IdentifierUtil) {
    "use strict";

    const CondenserTableDelegate = Object.assign({}, TableDelegate);

    CondenserTableDelegate.addItem = function(oTable, sPropertyName, mPropertyBag) {
        let sId;
        let sHeader;
        function getIdAndHeader(sPropertyName, sViewId) {
            switch (sPropertyName) {
                case "name":
                    sHeader = "Name";
                    sId = sViewId + "--" + "IDTableName_01";
                    break;
                case "foundingYear":
                    sHeader = "Founding Year";
                    sId = sViewId + "--" + "IDTableYear";
                    break;
                case "modifiedBy":
                    sHeader = "Changed By";
                    sId = sViewId + "--" + "IDTablemodified";
                    break;
                case "createdAt":
                    sHeader = "Changed On";
                    sId = sViewId + "--" + "IDTableCreated";
                    break;
                default:
                    sHeader = "default";
                    sId = sViewId;
            }
        }
        const oModifier = mPropertyBag ? mPropertyBag.modifier : JsControlTreeModifier;
        const oAppComponent = mPropertyBag ? mPropertyBag.appComponent : FlUtils.getAppComponentForControl(oTable);
		const oView = (mPropertyBag && mPropertyBag.view ) ? mPropertyBag.view : FlUtils.getViewForControl(oTable);
		let sViewId = mPropertyBag ? mPropertyBag.viewId : null;

		let oColumn;
		const oExistingColumn = Element.getElementById(sId);

		if (oExistingColumn) {
			return Promise.resolve(oExistingColumn);
		}

        // XML
        if (!oTable.isA) {
            getIdAndHeader(sPropertyName, sViewId);
			return oModifier.createControl("sap.ui.mdc.table.Column", oAppComponent, oView, sId, {
                propertyKey: sPropertyName,
                header: sHeader
            }, true)
            .then(function(oCreatedColumn) {
                oColumn = oCreatedColumn;
                return oColumn;
            });
		}
        // Runtime
        sViewId = !sViewId && oView.getId() ? oView.getId() : null;
        getIdAndHeader(sPropertyName, sViewId);
		return Promise.resolve(
            new Column(sId, {
                propertyKey: sPropertyName,
                header: sHeader
            }));
	};

    CondenserTableDelegate.updateBindingInfo = function(oTable, oBindingInfo) {
        TableDelegate.updateBindingInfo.call(CondenserTableDelegate, oTable, oBindingInfo);
        const oPayload = oTable.getPayload();
        if (oPayload) {
            oBindingInfo.path = "/" + oPayload.collectionName;
        }
    };

    return CondenserTableDelegate;

});