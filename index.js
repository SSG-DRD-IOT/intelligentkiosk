const electron = require('electron');
const path = require('path');
const url = require('url');
var mqtt = require('mqtt')
const config = require('./serverjs/config');
var server = require('./web/server');
//const productmgmt = require('./serverjs/productmgmt');
const datamodels = require('./datamodel');
var dbconfig = require('./db/database.js');
//var fs = require('fs');
const mongoose = require('mongoose'), Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

var proc_cvsdk = require('child_process').spawn('facerecognition/cvservice/build/./cvservicenew', ['']);
proc_cvsdk.stderr.on('data', (data) => {
    console.error(`child stderr:\n${data}`);
});


mongoose.connect(dbconfig.url, { useMongoClient: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log("Connection to MongoDB successful");
});


//MQTT Connections
var client = mqtt.connect('mqtt://localhost:1883')
var previousPersonId = -1;
var registrationInProg = false;
client.on('connect', function () {
    client.subscribe('person/seen');
    client.subscribe('faces_count');
    console.log('Connection to MQTT successful')
})


var timeInterval;
var _userInfo = {};
// SET ENV
process.env.NODE_ENV = 'development';

const { app, BrowserWindow, Menu, ipcMain, globalShortcut } = electron;

let mainWindow;
let analyticsWindow;
var isMSDKLaunched = false;
var msdkproc = null;
var faces_count = 0;

function findProductForUser(userid) {
    datamodels.UserKeywordModel.find({ userid: userid, searchfound: false }, 'userid keyword searchfound', function (err, userkeywords) {
        var notFoundKeywords = "";
        console.log("=============================================================");
        console.log(userkeywords);

        userkeywords.forEach(userkeyword => {
            notFoundKeywords += " " + userkeyword.keyword;
        });
        console.log(notFoundKeywords);
        console.log("=============================================================");
        productSearch(notFoundKeywords, "revisit");

    })
}
client.on('message', function (topic, message) {
    //console.log(topic + " => " + message);
    if (topic == 'faces_count') {
        console.log("Faces found:" + message);
        faces_count = parseInt(message);
        if (parseInt(message) == 0) {
            console.log("Launch MSDK");
            setTimeout(function () {
                if (faces_count == 0 && isMSDKLaunched == false) {
                    isMSDKLaunched = true;
                    msdkproc = require('child_process').spawn('msdk/./sample_decode', ['h264', '-i', '/opt/intel/mediasdk/samples/_bin/content/test_stream.264', '-r', '-hw']);
                    msdkproc.stderr.on('data', (data) => {
                        console.log(`MSDK Message:\n${data}`);
                    });
                }
                else {
                    isMSDKLaunched = false;
                    if (msdkproc != null) msdkproc.kill('SIGINT');
                }
            }, 15000)
            mainWindow.webContents.send('reset', -1);
            previousPersonId = -1;
        }
        else {
            if (msdkproc != null) msdkproc.kill('SIGINT');
        }
    }
    else if (topic == 'person/seen' && previousPersonId == -1) {
        message = JSON.parse(message);

        previousPersonId = message.id;
        if (message.id != -1) {
            datamodels.UserModel.findOne({ userid: message.id }, 'userid name age gender', function (err, user) {
                if (err) console.log(err.message);
                if (user != null) {
                    _userInfo.userid = user.userid;
                    _userInfo.name = user.name;
                    _userInfo.age = user.age;
                    _userInfo.gender = user.gender;
                    console.log(user.toString());
                    mainWindow.webContents.send('person', user.userid, user.name, user.age, user.gender);
                    //Perform product search for this user for "not found" products
                    findProductForUser(user.userid);
                }
                else {
                    _userInfo = {};
                    _userInfo.userid = -1;
                    mainWindow.webContents.send('person', message.id, "Guest", "", "");
                    console.log("User not found");
                }
            });
        }
        else {
            _userInfo = {};
            _userInfo.userid = -1;
            mainWindow.webContents.send('person', -1, "Guest", "", "");
            mainWindow.webContents.send('reset', -1);
            console.log("User not registered");
        }
    }
})
function alexasearch() {
    //alexa returns keyword

    //productSearch(keyword, "mainsearch");
}
//productSearch("desktop laptop");
function productSearch(keywords, target) {
    datamodels.ProductModel.searchProductByKeyword(keywords, function (err, products) {
        if (err != null) console.log(err.message);
        else {
            var prodlist = [];
            var prod;
            console.log(products.toString());
            products.forEach(product => {
                prod = {};
                console.log(product.toString());
                prod.catid = product.catid;
                prod.productid = product.productid;
                prod.name = product.name;
                prod.description = product.description;
                prod.price = product.price;
                prod.score = product.score;
                prod.image = product.image;
                prod.keyword = product.keywords;
                prodlist.push(prod);
            });
            //If target is not selected, then even the repeated entries re made to userkeywrod database. We want to store only items from main search.
            if (target == "mainsearch") saveUserKeywords(_userInfo.userid, keywords, (prodlist.length > 0 ? true : false), prodlist);
            mainWindow.webContents.send('prod_search_results', prodlist, target);
        }
    });
}


function saveUserKeywords(uid, keyword, srchFound, prodlist) {
    var keywrdlist = keyword.split(' ');
    var tobeInsertedKey = {};

    keywrdlist.forEach(keywd => {
        if (tobeInsertedKey[keywd] == null) tobeInsertedKey[keywd] = false;
        if (prodlist.length > 0) {
            var regex = new RegExp(keywd, "i");
            prodlist.forEach(product => {
                if (product.name.search(regex) > 0 || product.description.search(regex) > 0 || product.keyword.search(regex) > 0) {
                    tobeInsertedKey[keywd] = true;
                }
            });
        }
    });

    keywrdlist.forEach(keywd => {
        datamodels.UserKeywordModel.insertMany([{ userid: uid, keyword: keywd, searchfound: tobeInsertedKey[keywd] }]
            , function (err, raw) {
                if (err) console.log(err.message);
                console.log('The raw response from Mongo was ', raw);
            });
    });
}

//Analytics
function getKeyworkSearchcount()
{
    //.aggregate([{"$group" : {_id : "$keyword", count:{$sum:1}}}])
    var keywordList = [];

    //Search not found    
    datamodels.UserKeywordModel.aggregate([
        {
            $group: {
                _id: "$keyword",
                count: {$sum: 1}
            }
        },
        { "$limit": 10 }
    ], function (err, results) {
        if (err) {
            console.log(err);
        } else {
            console.log(results);
            results.forEach(result => {
                var keyword = {};
                keyword.keyword = result._id;
                keyword.count = result.count;
                keyword.searchfound = false;
                keywordList.push(keyword);
            });
            keywordList.sort(function(a, b) {
                return parseFloat(b.count) - parseFloat(a.count);
            });
            analyticsWindow.webContents.send('user_keyword', keywordList, false);                            
            console.log("message sent1");
        }
    });    
}

app.commandLine.appendSwitch('client-certificate','web/ssl/client.crt');
app.commandLine.appendSwitch ('ignore-certificate-errors');

 // SSL/TSL: this is the self signed certificate support
    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
        // On certificate error we disable default behaviour (stop loading the page)
        // and we then say "it is all fine - true" to the callback
        event.preventDefault();
        callback(true);
    });

// Listen for app to be ready
app.on('ready', function () {
    // Create new window
    //mainWindow = new BrowserWindow({width: 800, height: 600, frame: false});
    mainWindow = new BrowserWindow({});
    // Load html in window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'web', 'index1.html'),
        protocol: 'file:',
        slashes: true
    }));
    //mainWindow.setFullScreen(true);

    // Quit app when closed
    mainWindow.on('closed', function () {
        if (proc_cvsdk != null) proc_cvsdk.kill('SIGINT');
        app.quit();
    });

    const ret1 = globalShortcut.register('CommandOrControl+I', () => {
        console.log('CommandOrControl+P is pressed')
        analyticsWindow = new BrowserWindow({});        
        analyticsWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'web', 'inventory.html'),
            protocol: 'file:',
            slashes: true
        }));
    })
    if (!ret1) {
        console.log('CommandOrControl+I registration failed')
    }
    
    const ret = globalShortcut.register('CommandOrControl+A', () => {
        console.log('CommandOrControl+A is pressed')
        analyticsWindow = new BrowserWindow({});        
        analyticsWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'web', 'analytics.html'),
            protocol: 'file:',
            slashes: true
        }));
    })

    if (!ret) {
        console.log('CommandOrControl+A registration failed')
    }

    app.on('will-quit', () => {
        // Unregister a shortcut.
        globalShortcut.unregister('CommandOrControl+A')
        globalShortcut.unregister('CommandOrControl+I')

        // Unregister all shortcuts.
        globalShortcut.unregisterAll()
    })

});
//loadCategoryData();
//loadProductData();
/*
    {"catid":"1","name":"Computers","description":"Buy computers, laptops and accessories in this cateory","image":"computer.jpg","keywords":"Computers accessories processors laptop"},
    {"catid":"2","name":"Mobile Phones","description":"Buy Mobile Phones, smart phones and accessories in this cateory","image":"mobile.jpg","keywords":"Tablet Mobile accessories"},
    {"catid":"3","name":"Large Electronics","description":"Buy refrigerators, washing machine, air conditions and accessories in this cateory","image":"refrigerator.jpg","keywords":"refrigerators, washing machine, air conditions"}

*/

///CALLS FROM INVENTORY PAGE
//Create new product
ipcMain.on('createnewproduct', function (e, product) {
    productmgmt.saveProductData(product,function (err, raw) {
        if (err) console.log(err.message);
        else {
            console.log('The raw response from Mongo was ', raw);
            mainWindow.webContents.send('productmgmt_status', "Data successfully saved");
        }
    });
});

//Delete product
ipcMain.on('deleteproduct', function (e, product) {
    productmgmt.deleteProductData(product,function (err, raw) {
        if (err) console.log(err.message);
        else {
            console.log('The raw response from Mongo was ', raw);
            mainWindow.webContents.send('productmgmt_status', "Data successfully saved");
        }
    });
});

//Update product
ipcMain.on('updateproduct', function (e, product) {
    productmgmt.updateProductData(product,function (err, raw) {
        if (err) console.log(err.message);
        else {
            console.log('The raw response from Mongo was ', raw);
            mainWindow.webContents.send('productmgmt_status', "Data successfully saved");
        }
    });
});


// Get search results for identified user
ipcMain.on('get_user_keyword', function (e, keywords) {
    getKeyworkSearchcount()        
});


// Product search on clicking search button
ipcMain.on('productsearch', function (e, keywords) {
    productSearch(keywords, "mainsearch");
});


// Product search by Alexa
ipcMain.on('alexakeyword', function (e, keywords) {
    console.log("Alexa Keyword"+keywords);
    productSearch(keywords, "mainsearch");
});

// Catch Update datamodel
ipcMain.on('registered', function (e, userInfo) {
    //regWindow.close();
    var userModel = new datamodels.UserModel(userInfo);
    datamodels.UserModel.update({ userid: userInfo.userid }, userInfo, { upsert: true }, function (err, raw) {
        if (err) return handleError(err);
        console.log('The raw response from Mongo was ', raw);
    });
    //userModel.save();
    //regWindow = null;
});


ipcMain.on('register_id', function (user_id) {
    //if(user_id == -1)
    {
        console.log("Publishing to register!!");
        client.publish("commands/register", "true");
    }
});

