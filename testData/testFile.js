
/*
 * @fileOverview <file description> 
 * @module <file name> 
 */
(function (angular) {
    'use strict';
    var controllerName = 'CartController';
    /* @ngInject */
    /*
     * <Function description> 
     * @function myCartControllerConstructor 
     * @param {object} $log <Description> 
     * @param {object} loggingService <Description> 
     * @param {object} $rootScope <Description> 
     * @param {object} cartHttpDataService <Description> 
     * @param {object} creditClassService <Description> 
     * @param {object} commonUtils <Description> 
     * @param {object} $timeout <Description> 
     * @param {object} cartControllerHelperService <Description> 
     * @param {object} CartCommonModal <Description> 
     * @param {object} cartStorage <Description> 
     * @param {object} deviceProtectionAndServicesHttpData <Description> 
     * @param {object} keyValues <Description> 
     * @param {object} globalConfig <Description> 
     * @param {object} globalValue <Description> 
     * @param {object} jsonPath <Description> 
     * @param {object} cartPreviewService <Description> 
     * @param {object} cartPlanSelectorHttpDataService <Description> 
     * @param {object} tmobNotificationService <Description> 
     * @param {object} checkOutValidationUtil <Description> 
     * @param {object} cartAccessoryService <Description> 
     * @param {object} cartPromoCodeService <Description> 
     * @param {object} $q <Description> 
     */
    function myCartControllerConstructor($log, loggingService, $rootScope, cartHttpDataService, creditClassService, commonUtils, $timeout, cartControllerHelperService, CartCommonModal, cartStorage, deviceProtectionAndServicesHttpData, keyValues, globalConfig, globalValue, jsonPath, cartPreviewService, cartPlanSelectorHttpDataService, tmobNotificationService, checkOutValidationUtil, cartAccessoryService, cartPromoCodeService, $q) {
        /* jshint validthis: true */
        var vm = this;
        /*
         * <Function description> 
         * @function getCart 
         */
        function getCart() {
            if (cartStorage.getCartId()) {
                if (cartStorage.getGlobalSmartCartInfo()) {
                    vm.structCartData = cartStorage.getGlobalSmartCartInfo();
                }
            }
        }
        /*
         * <Function description> 
         * @function removeMagentaClass 
         */
        function removeMagentaClass() {
            if (vm.structCartData && vm.structCartData.lineItems) {
                angular.forEach(vm.structCartData.lineItems, function (line, key) {
                    line.mvcAttrs.isDeviceChanged = false;
                    line.mvcAttrs.isServiceChanged = false;
                });
            }
        }
        /*
         * <Function description> 
         * @function addDeviceToLine 
         * @param {object} modalData <Description> 
         * @param {object} selectedLine <Description> 
         * @param {object} oldDevice <Description> 
         * @param {object} newDevice <Description> 
         */
        function addDeviceToLine(modalData, selectedLine, oldDevice, newDevice) {
            var requestBody = {
                'sku': modalData.SKU,
                'pricingOption': modalData.paymentOption === 'FULL' ? 'FULL' : ''
            };
            //modalData.paymentOption,
            //"creditLevel": creditClassService.getEPCreditClass()
            if (modalData.SKU === 'SIM_KIT_BYOD' && !angular.equals(modalData.SKU, oldDevice)) {
                cartHttpDataService.removeDeviceFromLine(selectedLine.lineId, selectedLine.lineItemDetails.deviceDetails.id).then(function (removeDeviceStatus) {
                    if (!angular.equals(removeDeviceStatus, 200)) {
                        loggingService.error('We have an error adding device to cart.');
                    } else {
                        cartHttpDataService.addToLine(requestBody, selectedLine.lineId).then(function (cartResponseStatus) {
                            if (!angular.equals(cartResponseStatus, 200)) {
                                loggingService.error('We have an error adding device to cart.');
                            } else {
                                if (!oldDevice) {
                                    tmobNotificationService.showNotification(['cart002']);
                                    vm.structCartData = cartStorage.getGlobalSmartCartInfo();
                                } else if (oldDevice === newDevice) {
                                    removeMagentaClass();
                                    selectedLine.mvcAttrs.isDeviceChanged = true;
                                    selectedLine.mvcAttrs.isServiceChanged = false;
                                    vm.structCartData = cartStorage.getGlobalSmartCartInfo();
                                    tmobNotificationService.showNotification(['cart003']);
                                } else {
                                    removeServicesFromCart(selectedLine);
                                }
                            }
                        });
                    }
                });
            } else {
                cartHttpDataService.addToLine(requestBody, selectedLine.lineId).then(function (cartResponseStatus) {
                    if (!angular.equals(cartResponseStatus, 200)) {
                        loggingService.error('We have an error adding device to cart.');
                    } else {
                        if (!oldDevice) {
                            tmobNotificationService.showNotification(['cart002']);
                            vm.structCartData = cartStorage.getGlobalSmartCartInfo();
                        } else if (oldDevice === newDevice) {
                            removeMagentaClass();
                            selectedLine.mvcAttrs.isDeviceChanged = true;
                            selectedLine.mvcAttrs.isServiceChanged = false;
                            vm.structCartData = cartStorage.getGlobalSmartCartInfo();
                            tmobNotificationService.showNotification(['cart003']);
                        } else {
                            removeServicesFromCart(selectedLine);
                        }
                    }
                });
            }
        }
        /*
         * <Function description> 
         * @function removeServicesFromCart 
         * @param {object} selectedLine <Description> 
         */
        function removeServicesFromCart(selectedLine) {
            deviceProtectionAndServicesHttpData.getServices(selectedLine.lineId).then(function (serviceResponse) {
                cartStorage.setServiceId(serviceResponse.data.services.id, selectedLine.lineId);
                deviceProtectionAndServicesHttpData.addServicesToLine(selectedLine.lineId).then(function (cartResponseStatus) {
                    if (!angular.equals(cartResponseStatus, 200)) {
                        loggingService.error('We have an error adding new line to cart.');
                    } else {
                        removeMagentaClass();
                        selectedLine.mvcAttrs.isDeviceChanged = true;
                        selectedLine.mvcAttrs.isServiceChanged = false;
                        if (selectedLine.lineItemDetails.serviceDetails && selectedLine.lineItemDetails.serviceDetails.length > 0) {
                            tmobNotificationService.showNotification([
                                'cart003',
                                'cart009'
                            ]);
                        } else {
                            tmobNotificationService.showNotification(['cart003']);
                        }
                        vm.structCartData = cartStorage.getGlobalSmartCartInfo();
                    }
                });
            });
        }
        /*
         * <Function description> 
         * @function checkDeviceLimit 
         */
        function checkDeviceLimit() {
            if (vm.structCartData) {
                if (vm.structCartData.lineItems.length === 0) {
                    vm.deviceLimitReached = false;
                    vm.lineMaxHandsetLimitReached = false;
                    vm.lineMaxTabletLimitReached = false;
                } else {
                    var length, maxLength, maxHandsetLength, maxTabletLength, lineItemsHandsetArray, lineItemsTabletArray;
                    if (vm.structCartData.selectedCreditClass) {
                        length = cartSettings.maxLineLimit[vm.structCartData.selectedCreditClass['class']].maxTotalLine;
                        maxHandsetLength = cartSettings.maxLineLimit[vm.structCartData.selectedCreditClass['class']].maxHandsetLine;
                        maxTabletLength = cartSettings.maxLineLimit[vm.structCartData.selectedCreditClass['class']].maxTabletLine;
                    } else {
                        length = cartSettings.maxLineLimit.creditClass1.maxTotalLine;
                        maxHandsetLength = cartSettings.maxLineLimit.creditClass1.maxHandsetLine;
                        maxTabletLength = cartSettings.maxLineLimit.creditClass1.maxTabletLine;
                    }
                    lineItemsHandsetArray = commonUtils.searchJsonArray(vm.structCartData.lineItems, '[?(@.lineType=="HANDSET")]');
                    lineItemsTabletArray = commonUtils.searchJsonArray(vm.structCartData.lineItems, '[?(@.lineType=="TABLET")]');
                    vm.lineMaxHandsetLimitReached = lineItemsHandsetArray && lineItemsHandsetArray.length >= maxHandsetLength ? true : false;
                    vm.lineMaxTabletLimitReached = lineItemsTabletArray && lineItemsTabletArray.length >= maxTabletLength ? true : false;
                    // vm.lineMaxHandsetLimitReached = jsonPath(vm.structCartData.lineItems, '$..[?(@.lineType=="HANDSET"]').length >= maxHandsetLength ? true : false;
                    // vm.lineMaxTabletLimitReached = jsonPath(vm.structCartData.lineItems, '$..[?(@.lineType=="TABLET"]').length ? true : false;
                    // If both Handset and Tablet device limit reached
                    vm.deviceLimitReached = vm.lineMaxHandsetLimitReached && vm.lineMaxTabletLimitReached || vm.structCartData.lineItems.length >= length ? true : false;
                    // If Device limit reached, then both CTA should be disabled
                    if (vm.deviceLimitReached) {
                        vm.lineMaxHandsetLimitReached = true;
                        vm.lineMaxTabletLimitReached = true;
                    }
                }
            }
        }
        /*
         * if (creditClassService.getEPCreditClass() === 'NONE' && vm.structCartData.lineItems.length >= length) { vm.deviceLimitReached = true; } else {
         * vm.deviceLimitReached = false; }
         */
        /*
         * <Function description> 
         * @function addLineByLineType 
         * @param {object} lineType <Description> 
         */
        function addLineByLineType(lineType) {
            if (!lineType) {
                lineType = 'HANDSET';
            }
            if (vm.deviceLimitReached) {
                return;
            }
            if (lineType === 'HANDSET' && vm.lineMaxHandsetLimitReached) {
                return;
            }
            if (lineType === 'TABLET' && vm.lineMaxTabletLimitReached) {
                return;
            }
            var requestBody, itemCode;
            itemCode = cartSettings.constants.mockSKUs.addNewLine;
            /* using mock SKU to utilize mock APIS */
            requestBody = {
                'itemCode': itemCode,
                'selectedCreditLevel': creditClassService.getEPCreditClass(),
                'financeOption': '',
                'subType': lineType
            };
            cartHttpDataService.addNewLine(requestBody).then(function (cartResponseStatus) {
                if (!angular.equals(cartResponseStatus, 200)) {
                    loggingService.error('We have an error adding new line to cart.');
                } else {
                    vm.structCartData = cartStorage.getGlobalSmartCartInfo();
                    removeMagentaClass();
                    checkDeviceLimit();
                    if (!cartStorage.getCartId()) {
                        cartStorage.setCartId(vm.structCartData.cartId);
                        cartStorage.setOrderId(vm.structCartData.orderId);
                    }
                    tmobNotificationService.showNotification(['cart010']);
                }
            });
        }
        /*
         * <Function description> 
         * @function addLine 
         */
        function addLine() {
            addLineByLineType('HANDSET');
        }
        /*
         * <Function description> 
         * @function checkDuplicateDisable 
         * @param {object} selectedLine <Description> 
         */
        function checkDuplicateDisable(selectedLine) {
            var disableDuplicate = false;
            if (vm.deviceLimitReached || selectedLine.lineType === 'TABLET' && vm.lineMaxTabletLimitReached || selectedLine.lineType === 'HANDSET' && vm.lineMaxHandsetLimitReached) {
                disableDuplicate = true;
            }
            return disableDuplicate;
        }
        /*
         * <Function description> 
         * @function duplicateLine 
         * @param {object} selectedLine <Description> 
         */
        function duplicateLine(selectedLine) {
            /*if(angular.isUndefined(jsonPath(vm.structCartData, '$..deviceDetails.sku')[0])){
             return;
             }*/
            if (vm.deviceLimitReached) {
                return;
            }
            var oldLineItems,
                // old cart items before duplicate api call
                newLineItems,
                // new cart line items after duplicate api call
                oldLineIdsArray,
                // Array of all Line id before duplicate api call
                newLineIdsArray,
                // Array of all Line id after duplicate api call
                duplicateLineId;
            // Line id for the newly created Device
            if (cartStorage.getServiceId(selectedLine.lineId)) {
                oldLineItems = vm.structCartData.lineItems;
                oldLineIdsArray = _.map(oldLineItems, 'lineId');
            }
            cartHttpDataService.duplicateLine(selectedLine.lineId).then(function (cartResponseStatus) {
                if (!angular.equals(cartResponseStatus, 200)) {
                    loggingService.error('We have an error adding new line to cart.');
                } else {
                    vm.structCartData = cartStorage.getGlobalSmartCartInfo();
                    if (angular.isDefined(oldLineIdsArray)) {
                        newLineItems = vm.structCartData.lineItems;
                        newLineIdsArray = _.map(newLineItems, 'lineId');
                        duplicateLineId = _.difference(newLineIdsArray, oldLineIdsArray);
                        cartStorage.setServiceId(cartStorage.getServiceId(selectedLine.lineId), duplicateLineId);
                    }
                    removeMagentaClass();
                    checkDeviceLimit();
                    tmobNotificationService.showNotification(['cart011']);
                }
            });
        }
        /*
         * <Function description> 
         * @function removeLine 
         * @param {object} selectedLine <Description> 
         */
        function removeLine(selectedLine) {
            /*if(angular.isUndefined(jsonPath(vm.structCartData, '$..deviceDetails.sku')[0])){
             return;
             }*/
            var lineId = selectedLine.lineId;
            cartHttpDataService.removeLine(lineId).then(function (cartResponseStatus) {
                if (!angular.equals(cartResponseStatus, 200)) {
                    loggingService.error('We have an error removing line from cart.');
                } else {
                    vm.structCartData = cartStorage.getGlobalSmartCartInfo();
                    removeMagentaClass();
                    checkDeviceLimit();
                    tmobNotificationService.showNotification(['cart012']);
                }
            });
        }
        /*
         * <Function description> 
         * @function toggleSelectedPlan 
         * @param {object} selectedLine <Description> 
         */
        function toggleSelectedPlan(selectedLine) {
            cartHttpDataService.toggleSelectedPlan(selectedLine).then(function (status) {
                if (angular.equals(status, 200)) {
                    vm.structCartData = cartStorage.getGlobalSmartCartInfo();
                }
            });
        }
        /*
         * <Function description> 
         * @function isZipCodeAdded 
         */
        function isZipCodeAdded() {
            if (cartStorage.getZipCode()) {
                return true;
            } else {
                return false;
            }
        }
        /*
         * <Function description> 
         * @function MiniPDPModalCallBack 
         * @param {object} modalData <Description> 
         */
        function MiniPDPModalCallBack(modalData) {
            var cartSettings = globalConfig.cartSettings;
            var _selectedLine = modalData.selectedLine;
            var devicePlans = {};
            devicePlans.device = modalData.SKU;
            devicePlans.plans = null;
            // Not sure what this i is. So temporarily replacing it with modalData.selectedLine.lineNumber
            // devicePlans.index = i;
            devicePlans.index = modalData.selectedLine.lineNumber;
            devicePlans.paymentOption = modalData.paymentOption;
            devicePlans.isExistingProduct = 0;
            var oldFamilyId = cartStorage.getDeviceFamily(_selectedLine.lineItemDetails.deviceDetails.sku);
            var newFamilyId = cartStorage.getDeviceFamily(devicePlans.device);
            if (_selectedLine.simKitDetails && _selectedLine.simKitDetails.isProductAdded && angular.equals('SIM_KIT_BYOD', _selectedLine.simKitDetails.simKitId)) {
                addDeviceToLine(modalData, modalData.selectedLine, 'SIM_KIT_BYOD', cartStorage.getDeviceFamily(devicePlans.device));
            } else if (_selectedLine.lineItemDetails && _selectedLine.lineItemDetails.deviceDetails && _selectedLine.lineItemDetails.deviceDetails.isProductAdded) {
                if (cartSettings && cartSettings.removeServiceInEditDevice) {
                    // Sku ID
                    if (angular.equals(cartSettings.removeServiceInEditDevice, cartSettings.constants.skuId)) {
                        addDeviceToLine(modalData, modalData.selectedLine, _selectedLine.lineItemDetails.deviceDetails.sku, devicePlans.device);
                    } else if (angular.equals(cartSettings.removeServiceInEditDevice, cartSettings.constants.familyId)) {
                        addDeviceToLine(modalData, modalData.selectedLine, oldFamilyId, newFamilyId);
                    }
                    editProductClose(_selectedLine);
                }
            } else {
                addDeviceToLine(modalData, modalData.selectedLine, oldFamilyId, newFamilyId);
            }
        }
        //getProductData(modalData.deviceData.sku, modalData.deviceData.offerId);
        //offerId = modalData.deviceData.offerId;
        /*
         * <Function description> 
         * @function deviceSelectorModalCallBack 
         * @param {object} modalData <Description> 
         */
        function deviceSelectorModalCallBack(modalData) {
            var cartSettings = globalConfig.cartSettings;
            var _selectedLine = modalData.selectedLine;
            if (modalData.openminipdppage) {
                var _commonResolves = cartControllerHelperService.commonResolves('miniPDPModalView', _selectedLine, 1, keyValues, null, modalData.deviceData);
                var resolveAttributes = { resolve: angular.extend(_commonResolves.openView, _commonResolves.selectedCreditClass, _commonResolves.selectedProductSKU, _commonResolves.keyValues, _commonResolves.selectedLine, _commonResolves.selectedDeviceOfferId) };
                CartCommonModal.openCartModal('miniPDPModal', resolveAttributes, MiniPDPModalCallBack);
            } else if (modalData.openBringYourOwnDevice) {
                openOwnPhoneModal(modalData.selectedLine);
            } else if (!modalData.openBringYourOwnDevice) {
                $log.log('open device modal ', modalData);
                var devicePlans = {};
                devicePlans.device = modalData.SKU;
                devicePlans.plans = null;
                devicePlans.index = i;
                devicePlans.paymentOption = modalData.paymentOption;
                devicePlans.isExistingProduct = 0;
                var oldFamilyId = cartStorage.getDeviceFamily(_selectedLine.lineItemDetails.deviceDetails.sku);
                var newFamilyId = cartStorage.getDeviceFamily(devicePlans.device);
                if (_selectedLine.simKitDetails && _selectedLine.simKitDetails.isProductAdded && angular.equals('SIM_KIT_BYOD', _selectedLine.simKitDetails.simKitId)) {
                    addDeviceToLine(modalData, selectedLine, 'SIM_KIT_BYOD', cartStorage.getDeviceFamily(devicePlans.device));
                } else if (_selectedLine.lineItemDetails && _selectedLine.lineItemDetails.deviceDetails && _selectedLine.lineItemDetails.deviceDetails.isProductAdded) {
                    if (cartSettings && cartSettings.removeServiceInEditDevice) {
                        // Sku ID
                        if (angular.equals(cartSettings.removeServiceInEditDevice, cartSettings.constants.skuId)) {
                            addDeviceToLine(modalData, selectedLine, _selectedLine.lineItemDetails.deviceDetails.sku, devicePlans.device);
                        } else if (angular.equals(cartSettings.removeServiceInEditDevice, cartSettings.constants.familyId)) {
                            addDeviceToLine(modalData, selectedLine, oldFamilyId, newFamilyId);
                        }
                        editProductClose(_selectedLine);
                    }
                } else {
                    addDeviceToLine(modalData, selectedLine, oldFamilyId, newFamilyId);
                }
            }
        }
        /*
         * <Function description> 
         * @function openDeviceSelectorModal 
         * @param {object} openView <Description> 
         * @param {object} selectedLine <Description> 
         * @param {object} i <Description> 
         */
        function openDeviceSelectorModal(openView, selectedLine, i) {
            var _commonResolves = cartControllerHelperService.commonResolves(openView, selectedLine, i, keyValues, null);
            var resolveAttributes = { resolve: angular.extend(_commonResolves.openView, _commonResolves.selectedCreditClass, _commonResolves.selectedProductSKU, _commonResolves.keyValues, _commonResolves.selectedLine) };
            CartCommonModal.openCartModal('deviceSelectorModal', resolveAttributes, deviceSelectorModalCallBack);
        }
        /*
         * <Function description> 
         * @function openMiniPDPEditModal 
         * @param {object} openView <Description> 
         * @param {object} selectedLine <Description> 
         * @param {object} i <Description> 
         */
        function openMiniPDPEditModal(openView, selectedLine, i) {
            // var _selectedLine = selectedLine;
            var _commonResolves = cartControllerHelperService.commonResolves(openView, selectedLine, i, keyValues, null);
            var resolveAttributes = { resolve: angular.extend(_commonResolves.openView, _commonResolves.selectedCreditClass, _commonResolves.selectedProductSKU, _commonResolves.keyValues, _commonResolves.selectedLine, _commonResolves.selectedDeviceOfferId) };
            /*
             * <Function description> 
             * @function MiniPDPEditModalCallBack 
             * @param {object} modalData <Description> 
             */
            function MiniPDPEditModalCallBack(modalData) {
                var cartSettings = globalConfig.cartSettings;
                var _selectedLine = selectedLine;
                var devicePlans = {};
                devicePlans.device = modalData.SKU;
                devicePlans.plans = null;
                devicePlans.index = i;
                devicePlans.paymentOption = modalData.paymentOption;
                devicePlans.isExistingProduct = 0;
                var oldFamilyId = cartStorage.getDeviceFamily(_selectedLine.lineItemDetails.deviceDetails.sku);
                var newFamilyId = cartStorage.getDeviceFamily(devicePlans.device);
                if (_selectedLine.simKitDetails && _selectedLine.simKitDetails.isProductAdded && angular.equals('SIM_KIT_BYOD', _selectedLine.simKitDetails.simKitId)) {
                    addDeviceToLine(modalData, selectedLine, 'SIM_KIT_BYOD', cartStorage.getDeviceFamily(devicePlans.device));
                } else if (_selectedLine.lineItemDetails && _selectedLine.lineItemDetails.deviceDetails && _selectedLine.lineItemDetails.deviceDetails.isProductAdded) {
                    if (cartSettings && cartSettings.removeServiceInEditDevice) {
                        // Sku ID
                        if (angular.equals(cartSettings.removeServiceInEditDevice, cartSettings.constants.skuId)) {
                            addDeviceToLine(modalData, selectedLine, _selectedLine.lineItemDetails.deviceDetails.sku, devicePlans.device);
                        } else if (angular.equals(cartSettings.removeServiceInEditDevice, cartSettings.constants.familyId)) {
                            addDeviceToLine(modalData, selectedLine, oldFamilyId, newFamilyId);
                        }
                        editProductClose(_selectedLine);
                    }
                } else {
                    addDeviceToLine(modalData, selectedLine, oldFamilyId, newFamilyId);
                }
            }
            // getProductData(modalData.deviceData.sku, modalData.deviceData.offerId);
            // offerId = modalData.deviceData.offerId;
            CartCommonModal.openCartModal('miniPDPModal', resolveAttributes, MiniPDPEditModalCallBack);
        }
        /*
         * <Function description> 
         * @function emptyModalCallBack 
         * @param {object} modalObject <Description> 
         */
        function emptyModalCallBack(modalObject) {
        }
        //TODO:Temporary For MAG1122
        /*
         * <Function description> 
         * @function userSelectedPlan 
         * @param {object} selectedLine <Description> 
         * @param {object} planOption <Description> 
         */
        function userSelectedPlan(selectedLine, planOption) {
        }
        /**
         * This function adds selected plan to the existing cart object.
         * @function addPlan
         * @name addPlan
         * @param {String} selectedLine selected line is a single of the cart which consist of line item,plan and protection plans.
         */
        function addPlan(selectedLine) {
            cartPlanSelectorHttpDataService.submitSelectedPlan().then(function (planOptionCartData) {
                vm.structCartData = cartStorage.getGlobalSmartCartInfo();
                selectedLine.mvcAttrs.editPlanInProgress = false;
            });
        }
        /*
         * <Function description> 
         * @function showCartPreview 
         * @param {object} selectedLine <Description> 
         * @param {object} planOption <Description> 
         */
        function showCartPreview(selectedLine, planOption) {
            // cartPreviewService.setBaseCart(vm.structCartData);
            var data = { planOptionSelectorId: planOption.planOptionSelectorId };
            cartPlanSelectorHttpDataService.selectPlan(data).then(function (planOptionCartData) {
                // var existingCartObject = cartStorage.getGlobalSmartCartInfo();
                cartStorage.setGlobalSmartCartInfo(vm.structCartData);
            });
        }
        // _.merge(existingCartObject, planOptionCartData);
        // cartPreviewService.setPreviewCart(anotherCart);
        //
        /* istanbul ignore next */
        /*
         * <Function description> 
         * @function selectPlan 
         * @param {object} selectedLine <Description> 
         * @param {object} planOption <Description> 
         */
        function selectPlan(selectedLine, planOption) {
            // selectedLine.selectedPlan = selectedLine.plan;
            showCartPreview(selectedLine, planOption);
        }
        /*
         * <Function description> 
         * @function cancelAddPlan 
         * @param {object} selectedLine <Description> 
         */
        function cancelAddPlan(selectedLine) {
            selectedLine.mvcAttrs.editPlanInProgress = false;
            // selectedLine.plan = selectedLine.selectedPlan;
            var baseCartObj = cartPreviewService.getBaseCart();
            angular.forEach(baseCartObj.lineItems, function (line, key) {
                if (line.mvcAttrs.editPlanInProgress) {
                    line.mvcAttrs.editPlanInProgress = false;
                }
            });
            // cartStorage.setGlobalSmartCartInfo(cartPreviewService.getBaseCart());
            var baseSelectedLine = commonUtils.searchJson(baseCartObj, '[?(@.lineId=="' + selectedLine.lineId + '")]');
            if (baseSelectedLine) {
                baseSelectedLine.mvcAttrs.editPlanInProgress = false;
                $log.log('baseSelectedLine --- baseSelectedLine ', baseSelectedLine.lineNo);
                $log.log('selectedLine --- selectedLine ', selectedLine.lineNo);
                var planConfig = cartStorage.getPlanConfigData();
                if (planConfig && planConfig.resetPlanConfig) {
                    cartStorage.setPlanConfigData(undefined);
                }
                cartStorage.setGlobalSmartCartInfo(baseCartObj);
                vm.structCartData = cartStorage.getGlobalSmartCartInfo();
            }
        }
        /*
                 if (baseSelectedLine.lineItemDetails.planDetails.selectedPlanId === selectedLine.lineItemDetails.planDetails.selectedPlanId) {
                 var deferred = $q.defer();
                 cartStorage.setGlobalSmartCartInfo(baseCartObj);
                 vm.structCartData = cartStorage.getGlobalSmartCartInfo();
                 deferred.resolve('done')
                 return deferred.promise;
                 }
                 var data = {
                 planOptionSelectorId: baseSelectedLine.lineItemDetails.planDetails.selectedPlanId
                 };
        
                 //data.planOptionSelectorId = 'jruw4zjngrigyylofu3fgrsnlaytar2ckbzgsy3ffu2dklrqgbcgc5dbj5yhi2lpnywtcmchijjhau3pmmwtmrsnknbti=';
                 return cartPlanSelectorHttpDataService.selectPlan(data).then(function(planOptionCartData) {
                 cartStorage.setGlobalSmartCartInfo(baseCartObj);
                 vm.structCartData = cartStorage.getGlobalSmartCartInfo();
                 });
                 */
        /*
         * <Function description> 
         * @function getPlanOptions 
         * @param {object} selectedLine <Description> 
         */
        function getPlanOptions(selectedLine) {
            if (vm.cartSettings.hideMeForPOC) {
                return;
            }
            var isCancelPlanRequired = false;
            var selectedLineId = selectedLine.lineId;
            angular.forEach(vm.structCartData.lineItems, function (line, key) {
                if (line.mvcAttrs.editPlanInProgress) {
                    isCancelPlanRequired = true;
                }
            });
            // line.mvcAttrs.editPlanInProgress = false;
            // return;
            //
            // cancel Select Plan
            if (isCancelPlanRequired) {
                // cartStorage.setGlobalSmartCartInfo(cartPreviewService.getBaseCart());
                // var structCartData = cartPreviewService.getBaseCart();
                angular.forEach(vm.structCartData.lineItems, function (line, key) {
                    if (line.mvcAttrs.editPlanInProgress) {
                        // isCancelPlanRequired = true;
                        line.mvcAttrs.editPlanInProgress = false;
                        cancelAddPlan(line);
                        var baseSelectedLine = commonUtils.searchJson(vm.structCartData, '[?(@.lineId=="' + selectedLineId + '")]');
                        if (baseSelectedLine) {
                            baseSelectedLine.mvcAttrs.editPlanInProgress = true;
                        }
                        cartPreviewService.setBaseCart(vm.structCartData);
                    }
                });
            } else
                /*
                 cancelAddPlan(line).then(function(cancelPlanData) {
                 var baseSelectedLine = commonUtils.searchJson(vm.structCartData, '[?(@.lineId=="' + selectedLineId + '")]');
                 if (baseSelectedLine) {
                 baseSelectedLine.mvcAttrs.editPlanInProgress = true;
                 }
                 cartPreviewService.setBaseCart(vm.structCartData);
                 // cartStorage.setGlobalSmartCartInfo(vm.structCartData);
                 // vm.structCartData = cartStorage.getGlobalSmartCartInfo();
                 });
                 */
                // return;
                {
                    var baseSelectedLine = commonUtils.searchJson(vm.structCartData, '[?(@.lineId=="' + selectedLineId + '")]');
                    if (baseSelectedLine) {
                        baseSelectedLine.mvcAttrs.editPlanInProgress = true;
                    }
                    cartPreviewService.setBaseCart(vm.structCartData);
                }
        }
        /*
         * <Function description> 
         * @function editProduct 
         * @param {object} selectedLine <Description> 
         */
        function editProduct(selectedLine) {
            selectedLine.mvcAttrs.editProductInProgress = true;
            var id = '#cartDeviceSection_' + selectedLine.lineNumber;
            removeRole(id);
        }
        /*
         * <Function description> 
         * @function editProductClose 
         * @param {object} selectedLine <Description> 
         */
        function editProductClose(selectedLine) {
            var id = '#cartDeviceSection_' + selectedLine.lineNumber;
            addRole(id);
            return selectedLine.mvcAttrs.editProductInProgress = false;
        }
        /*
         * <Function description> 
         * @function addRole 
         * @param {object} id <Description> 
         */
        function addRole(id) {
            var elm = angular.element(id);
            elm.attr('role', 'button');
        }
        /*
         * <Function description> 
         * @function removeRole 
         * @param {object} id <Description> 
         */
        function removeRole(id) {
            var elm = angular.element(id);
            elm.removeAttr('role');
        }
        /*
         * <Function description> 
         * @function editPlanOpen 
         * @param {object} selectedLine <Description> 
         */
        function editPlanOpen(selectedLine) {
            getPlanOptions(selectedLine);
        }
        /*
         * <Function description> 
         * @function editPlanClose 
         * @param {object} selectedLine <Description> 
         */
        function editPlanClose(selectedLine) {
            selectedLine.mvcAttrs.editPlanInProgress = false;
        }
        /*
         * <Function description> 
         * @function openPriceBreakdownModal 
         */
        function openPriceBreakdownModal() {
            if (!vm.structCartData.accessories.accessoryDetails.length) {
                if (vm.structCartData.lineItems.length) {
                    if (!vm.structCartData.isPriceBreakdownEnable) {
                        return;
                    }
                } else {
                    return;
                }
            }
            // if (!vm.structCartData.accessories.accessoryDetails.length &&
            //    (!vm.structCartData.lineItems[0].lineItemDetails.deviceDetails.sku &&
            //   (!vm.structCartData.lineItems[0].simKitDetails.simKitId
            //   || vm.structCartData.lineItems[0].simKitDetails.simKitId !== 'SIM_KIT_BYOD'))) {
            //   return;
            // }
            /*istanbul ignore next*/
            // if(!vm.structCartData.accessories.accessoryDetails.length && !vm.structCartData.lineItems.length) {
            //    return;
            // }
            var _commonResolves = cartControllerHelperService.commonResolves(null, vm.structCartData, null, keyValues);
            var resolveAttributes = { resolve: angular.extend(_commonResolves.keyValues, _commonResolves.selectedLine) };
            CartCommonModal.openCartModal('priceBreakdownModal', resolveAttributes, emptyModalCallBack);
        }
        /*
         * <Function description> 
         * @function openDeviceProtectionAndServicesSelectorModal 
         * @param {object} selectedLine <Description> 
         * @param {object} index <Description> 
         */
        function openDeviceProtectionAndServicesSelectorModal(selectedLine, index) {
            var commonResolves = cartControllerHelperService.commonResolves(null, selectedLine, index, keyValues);
            var serviceCount = selectedLine.lineItemDetails.serviceDetails.length;
            var resolveAttributes = { resolve: angular.extend(commonResolves.keyValues, commonResolves.selectedProtectionPlans, commonResolves.selectedLine) };
            // TODO: extract function up to controller private function and reference in here.
            var modalCallBack = function (globalServiceObject) {
                deviceProtectionAndServicesHttpData.addServicesToLine(selectedLine.lineId).then(function (cartResponseStatus) {
                    if (!angular.equals(cartResponseStatus, 200)) {
                        loggingService.error('We have an error adding service to cart.');
                    } else {
                        removeMagentaClass();
                        selectedLine.mvcAttrs.isDeviceChanged = false;
                        selectedLine.mvcAttrs.isServiceChanged = true;
                        vm.structCartData = cartStorage.getGlobalSmartCartInfo();
                        if (serviceCount) {
                            tmobNotificationService.showNotification(['cart008']);
                        } else {
                            tmobNotificationService.showNotification(['cart007']);
                        }
                    }
                });
            };
            CartCommonModal.openCartModal('deviceProtectionAndServicesSelectorModal', resolveAttributes, modalCallBack);
        }
        /*
         * <Function description> 
         * @function openExitPathConfirmationModal 
         */
        function openExitPathConfirmationModal() {
            var commonResolves = cartControllerHelperService.commonResolves(null, null, null, keyValues);
            var resolveAttributes = { resolve: angular.extend(commonResolves.keyValues) };
            CartCommonModal.openCartModal('exitPathConfirmationModal', resolveAttributes, emptyModalCallBack);
        }
        /*
         * <Function description> 
         * @function openOwnPhoneModal 
         * @param {object} selectedLine <Description> 
         */
        function openOwnPhoneModal(selectedLine) {
            var _commonResolves = cartControllerHelperService.commonResolves(null, selectedLine, null, keyValues);
            var resolveAttributes = { resolve: angular.extend(_commonResolves.keyValues, _commonResolves.selectedLine) };
            // TODO: extract function up to controller private function and reference in here.
            var modalCallBack = function (modalObject) {
                var reqJSON = { rowData: [{}] };
                var _selectedLine = modalObject.selectedLine;
                reqJSON.rowData[0].productSKU = modalObject.phoneDetails.SKU;
                reqJSON.rowData[0].paymentOption = modalObject.paymentOption;
                $log.log('vm.modalInstance :: call addd ', modalObject, _selectedLine);
                if (angular.equals(modalObject.phoneDetails.SKU, 'SIM_KIT_BYOD')) {
                    if (_selectedLine.lineItemDetails.deviceDetails && _selectedLine.lineItemDetails.deviceDetails.isProductAdded) {
                        addDeviceToLine(modalObject.phoneDetails, selectedLine, _selectedLine.lineItemDetails.deviceDetails.sku, modalObject.phoneDetails.SKU);
                        _selectedLine.lineItemDetails.serviceDetails.length > 0 ? tmobNotificationService.showNotification([
                            'cart009',
                            'cart004',
                            'cart005'
                        ]) : tmobNotificationService.showNotification([
                            'cart004',
                            'cart005'
                        ]);
                    } else {
                        addDeviceToLine(modalObject.phoneDetails, selectedLine, modalObject.phoneDetails.SKU, modalObject.phoneDetails.SKU);
                        tmobNotificationService.showNotification(['cart005']);
                    }
                }
            };
            CartCommonModal.openCartModal('ownPhoneModal', resolveAttributes, modalCallBack);
        }
        /*
         * <Function description> 
         * @function openLocationFPOModal 
         * @param {object} selectedLine <Description> 
         * @param {object} index <Description> 
         */
        function openLocationFPOModal(selectedLine, index) {
            var commonResolves = cartControllerHelperService.commonResolves(null, null, null, keyValues);
            var resolveAttributes = { resolve: angular.extend(commonResolves.keyValues) };
            var modalCallBack = function ()
                /* modalObject */
                {
                    openDeviceProtectionAndServicesSelectorModal(selectedLine, index);
                };
            CartCommonModal.openCartModal('locationFPOModal', resolveAttributes, modalCallBack);
            var uiViewElement = angular.element(document.querySelector('.ng-main-view'));
            uiViewElement.removeClass('ng-main-view');
            $timeout(function () {
                uiViewElement.addClass('ng-main-view');
            }, // angular.element.find(".ng-main-view").removeClass("ng-main-view").addClass("ng-main-view");
            1000);
        }
        /*
         * <Function description> 
         * @function openLearnMoreModal 
         * @param {object} selectedLine <Description> 
         */
        function openLearnMoreModal(selectedLine) {
            var _commonResolves = cartControllerHelperService.commonResolves(null, selectedLine, null, keyValues);
            var resolveAttributes = { resolve: angular.extend(_commonResolves.planDetails, _commonResolves.keyValues) };
            CartCommonModal.openCartModal('learnMoreModal', resolveAttributes, emptyModalCallBack);
        }
        /*
         * <Function description> 
         * @function openPlanModal 
         * @param {object} selectedLine <Description> 
         */
        function openPlanModal(selectedLine) {
            vm.planModalOpen = true;
            if (!vm.authorValue) {
                vm.authorValue = {
                    learnMoreModalURL: {},
                    smartcartjson: {}
                };
            }
            vm.authorValue.learnMoreModal = {};
            var _commonResolves = cartControllerHelperService.commonResolves(null, selectedLine, null, keyValues);
            var templateUrl;
            var templateUrl1;
            if (!vm.structCartData.selectedCreditClass) {
                vm.structCartData.selectedCreditClass = { 'class': 'creditClass1' };
            }
            if (vm.structCartData.selectedCreditClass['class'] === 'creditClass3') {
                /* templateUrl = keyValues.learnMoreModal.simpleChoiceNoCredit;*/
                templateUrl = vm.authorValue.smartcartjson.simpleChoiceNoCredit;
            } else {
                /* templateUrl = keyValues.learnMoreModal.simpleChoiceModal;*/
                templateUrl = vm.authorValue.smartcartjson.simpleChoiceModal;
            }
            ;
            vm.authorValue.learnMoreModalURL = { 'templateUrl': templateUrl };
            templateUrl1 = templateUrl + '.partial.html';
            var resolveAttributes = {
                templateUrl1: templateUrl1,
                /* templateUrl:templateUrl+".partial.html",*/
                resolve: angular.extend(_commonResolves.planDetails, _commonResolves.keyValues, _commonResolves.selectedCreditClass)
            };
            var modalCallBack = function (modalObject) {
                openCreditClassSelectorModal();
                vm.planModalOpen = false;
            };
            var modalDismissCallBack = function (modalObject) {
                vm.planModalOpen = false;
                vm.structCartData = cartStorage.getGlobalSmartCartInfo();
            };
            CartCommonModal.openCartModal('planModal', resolveAttributes, modalCallBack, modalDismissCallBack);
        }
        /*
         * <Function description> 
         * @function zipCodeCheck 
         * @param {object} selectedLine <Description> 
         * @param {object} index <Description> 
         */
        function zipCodeCheck(selectedLine, index) {
            if (cartControllerHelperService.isLineItemPresent(selectedLine)) {
                if (isZipCodeAdded()) {
                    openDeviceProtectionAndServicesSelectorModal(selectedLine, index);
                } else {
                    openLocationFPOModal(selectedLine, index);
                }
            }
        }
        /*
         * <Function description> 
         * @function openCreditClassSelectorModal 
         * @param {object} current <Description> 
         * @param {object} callback <Description> 
         */
        function openCreditClassSelectorModal(current, callback) {
            var commonResolves = cartControllerHelperService.commonResolves(null, current, null, keyValues);
            angular.extend(commonResolves, cartControllerHelperService.isPlanSelectorModal(vm.planModalOpen));
            var resolveAttributes = { resolve: angular.extend(commonResolves.selectedCreditClass, commonResolves.source, commonResolves.isPlanSelectorModal, commonResolves.keyValues, commonResolves.selectedLine) };
            // TODO: Can you use _.omit ? or _.merge ?
            // var deffered = $q.defer();
            var modalCallBack = function (modalObject) {
                if (modalObject.isModalCanced) {
                    return;
                }
                if (!vm.structCartData.selectedCreditClass || !angular.equals(vm.structCartData.selectedCreditClass['class'], modalObject.selectedCreditClass['class'])) {
                    creditClassService.setCreditClass(modalObject.selectedCreditClass);
                    vm.structCartData.selectedCreditClass = modalObject.selectedCreditClass;
                    cartHttpDataService.getCart().then(function (cartResponseStatus) {
                        /*
                         * If we initially select No Credit Check, add a line and then change the credit class to Awesome/Average, it shows that device limit is reached.
                         * To fix that, we need to call checkDeviceLimit again here
                         */
                        checkDeviceLimit();
                        if (!angular.equals(cartResponseStatus, 200)) {
                            loggingService.error('We have an error removing line from cart.');
                        } else {
                            removeMagentaClass();
                            var accessoryFlow = vm.structCartData.flags.isAccessoryFlow;
                            vm.structCartData = cartStorage.getGlobalSmartCartInfo();
                            vm.structCartData.flags.isAccessoryFlow = accessoryFlow;
                        }
                    });
                }
                if (callback) {
                    callback(modalObject);
                }
            };
            var modalDismissCallBack = function () {
                cartHttpDataService.saveCreditLevel(vm.structCartData.selectedCreditClass, function (result) {
                    $log.log('reverted credit Class to EP..');
                });
            };
            CartCommonModal.openCartModal('creditSelectionModal', resolveAttributes, modalCallBack, modalDismissCallBack);
            var uiViewElement = angular.element(document.querySelector('.ng-main-view'));
            uiViewElement.removeClass('ng-main-view');
            $timeout(function () {
                uiViewElement.addClass('ng-main-view');
            }, 1000);
        }
        /*
         * <Function description> 
         * @function creditCheck 
         * @param {object} openView <Description> 
         * @param {object} selectedLine <Description> 
         * @param {object} index <Description> 
         * @param {object} targetModal <Description> 
         */
        function creditCheck(openView, selectedLine, index, targetModal) {
            var _selectedLine = selectedLine;
            if (vm.structCartData.selectedCreditClass) {
                if (targetModal) {
                    openOwnPhoneModal(_selectedLine);
                } else {
                    openDeviceSelectorModal(openView, _selectedLine, index);
                }
            } else {
                vm.openCreditClassSelectorModal(_selectedLine, function (modalObject) {
                    if (targetModal) {
                        openOwnPhoneModal(modalObject.selectedLine);
                    } else {
                        openDeviceSelectorModal(openView, _selectedLine, index);
                    }
                });
            }
        }
        /*
         * <Function description> 
         * @function isAccessoryAddedToCart 
         */
        function isAccessoryAddedToCart() {
            vm.structCartData = cartStorage.getGlobalSmartCartInfo();
            if (angular.isDefined(vm.structCartData.accessories) && vm.structCartData.accessories.accessoryDetails.length > 0) {
                return true;
            }
            return false;
        }
        /*
         * <Function description> 
         * @function updateCurrentPlanTile 
         * @param {object} currentPlanTile <Description> 
         * @param {object} planOptionsArray <Description> 
         * @param {object} currentPlanListSize <Description> 
         * @param {object} userOption <Description> 
         */
        function updateCurrentPlanTile(currentPlanTile, planOptionsArray, currentPlanListSize, userOption) {
            vm.currPlanTile = currentPlanTile;
            vm.planListSize = currentPlanListSize;
            if (userOption === 'Back') {
                vm.currPlanTile = vm.currPlanTile - 1;
                vm.showMore = false;
            } else if (userOption === 'SeeMore') {
                vm.currPlanTile = vm.currPlanTile + 1;
                if (vm.currPlanTile >= planOptionsArray.length / vm.planListSize - 1) {
                    vm.showMore = true;
                } else {
                    vm.showMore = false;
                }
            }
        }
        /*
         * <Function description> 
         * @function showAccessories 
         */
        function showAccessories() {
            vm.structCartData.flags.isAccessoryFlow = true;
        }
        /*
         * <Function description> 
         * @function initialize 
         */
        function initialize() {
            if (vm.structCartData) {
                checkDeviceLimit();
            }
            if (authorValueFlagEnable) {
                if (vm.authorValue && 'cart' in vm.authorValue) {
                    vm.keyValues = vm.authorValue.cart;
                    if ('miniPdp' in vm.keyValues) {
                        if ('productImageArrows' in vm.keyValues.miniPdp) {
                            vm.keyValues.miniPdp.productImageArrows = vm.keyValues.miniPdp.productImageArrows.toString();
                        }
                        if ('productImagePagination' in vm.keyValues.miniPdp) {
                            vm.keyValues.miniPdp.productImagePagination = vm.keyValues.miniPdp.productImagePagination.toString();
                        }
                    }
                    if ('creditSelector' in vm.keyValues && 'class' in vm.keyValues.creditSelector) {
                        vm.keyValues['class'] = [];
                        for (var pos = 0; pos < vm.keyValues.creditSelector['class'].length; pos++) {
                            vm.keyValues['class'].push(angular.fromJson(vm.keyValues.creditSelector['class'][pos]));
                            if ('enable' in vm.keyValues['class'][pos]) {
                                vm.keyValues['class'][pos].enable = vm.keyValues['class'][pos].enable.toString();
                            }
                        }
                    }
                } else {
                    vm.keyValues = {};
                }
                keyValues = vm.keyValues;
            }
            cartStorage.setCreditClassJson(keyValues['class']);
            if (!cartStorage.getCartId()) {
                creditClassService.setCreditClass(undefined);
            }
            // EmptyCartFlow Enable and Disable
            if (cartSettings && !cartSettings.isEmptyCartEnabled && vm.structCartData && vm.structCartData.flags && !vm.structCartData.flags.isCartReloaded) {
                addLine();
            }
            // cartControllerHelperService.getSIMKitDetails();
            // Temporary fix for drop shadows.
            removeMagentaClass();
            getCart();
            $log.log('vm.authorValue :: ', vm.authorValue, ' authorValue ');
        }
        $rootScope.$on('cartAccessoryUpdated', function (event, data) {
            vm.structCartData = data;
        });
        $rootScope.$on('openBrowseModal', function (event, data) {
            creditCheck('Select Phone', data.selectedLine);
        });
        var cartSettings = globalConfig.cartSettings;
        var authorValueFlagEnable = globalConfig.authorValueFlagEnable;
        vm.structCartData = {};
        vm.keyValues = keyValues;
        vm.structCartData = cartControllerHelperService.getGlobalCart();
        vm.authorValue = globalValue.authorValue;
        vm.cartSettings = cartSettings;
        vm.deviceLimitReached = false;
        vm.lineMaxHandsetLimitReached = false;
        vm.lineMaxTabletLimitReached = false;
        vm.showPromoInput = false;
        vm.planModalOpen = false;
        vm.showMore = false;
        vm.isPlanAvailable = true;
        vm.currPlanTile = 0;
        vm.planListSize = cartSettings.planListSize;
        vm.creditCheck = creditCheck;
        vm.openCreditClassSelectorModal = openCreditClassSelectorModal;
        vm.zipCodeCheck = zipCodeCheck;
        vm.openLearnMoreModal = openLearnMoreModal;
        vm.openLocationFPOModal = openLocationFPOModal;
        vm.openOwnPhoneModal = openOwnPhoneModal;
        vm.openPlanModal = openPlanModal;
        vm.openExitPathConfirmationModal = openExitPathConfirmationModal;
        vm.openDeviceProtectionAndServicesSelectorModal = openDeviceProtectionAndServicesSelectorModal;
        vm.openPriceBreakdownModal = openPriceBreakdownModal;
        vm.openDeviceSelectorModal = openDeviceSelectorModal;
        vm.openMiniPDPEditModal = openMiniPDPEditModal;
        vm.editPlanClose = editPlanClose;
        vm.editPlanOpen = editPlanOpen;
        vm.editProductClose = editProductClose;
        vm.editProduct = editProduct;
        vm.selectPlan = selectPlan;
        vm.duplicateLine = duplicateLine;
        vm.removeLine = removeLine;
        vm.addLine = addLine;
        vm.addLineByLineType = addLineByLineType;
        vm.cancelAddPlan = cancelAddPlan;
        vm.addPlan = addPlan;
        vm.isAccessoryAddedToCart = isAccessoryAddedToCart;
        vm.showAccessories = showAccessories;
        vm.userSelectedPlan = userSelectedPlan;
        vm.checkDuplicateDisable = checkDuplicateDisable;
        vm.updateCurrentPlanTile = updateCurrentPlanTile;
        vm.toggleSelectedPlan = toggleSelectedPlan;
        initialize();
    }
    angular.module('tmobileApp').controller(controllerName, myCartControllerConstructor);
}(angular, externalLogger));