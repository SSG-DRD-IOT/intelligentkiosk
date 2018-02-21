module.exports = {

    loadCategoryData : function() {
        datamodels.ProductCategoryModel.remove({});
        datamodels.ProductCategoryModel.insertMany([
            { "catid": "4", "name": "Embedded", "description": "Buy embedded producs", "image": "computer.jpg", "keywords": "microprocessor embedded" }]
    
            , function (err, raw) {
                if (err) return handleError(err);
                console.log('The raw response from Mongo was ', raw);
            });
    }
    
    ,saveProductData : function (productjson,callback) {
        datamodels.ProductModel.insertMany([
            productjson
        ], callback (err, raw));
    }
    ,updateProductData : function (productInfo,callback) {
        datamodels.ProductModelupdate({ productid: productInfo.productid }, productInfo, { upsert: true }, callback(err, raw));
    }
    ,deleteProductData : function (productid,callback) {

        datamodels.ProductModel.findByIdAndRemove({_id: req.params.id}, callback(err, docs));
    }
    
}