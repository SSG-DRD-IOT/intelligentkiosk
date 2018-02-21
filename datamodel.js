/*
 * Author: Daniel Holmlund <daniel.w.holmlund@Intel.com>
 * Copyright (c) 2015 Intel Corporation.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var mongoose = require('mongoose');

var userSchema = require('./schema/userSchema.js');
var productSchema = require('./schema/productSchema.js');
var productCategorySchema = require('./schema/productCategorySchema.js');
var userLogSchema = require('./schema/userLogSchema.js');
var userKaywordSchema = require('./schema/userKaywordSchema.js');
var inventorySchema = require('./schema/inventorySchema.js');

module.exports = {
    UserModel: mongoose.model('UserModel', userSchema),
    ProductModel: mongoose.model('ProductModel', productSchema),
    ProductCategoryModel: mongoose.model('ProductCategoryModel', productCategorySchema),
    UserKeywordModel: mongoose.model('UserKeywordModel', userKaywordSchema),
    InventoryModel: mongoose.model('InventoryModel', inventorySchema),
    UserLogModel: mongoose.model('UserLogModel', userLogSchema)
};
