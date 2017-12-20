const electron = require('electron');
const path = require('path');
const url = require('url');
var mqtt = require('mqtt')
const config = require('./config');
const datamodels = require('./datamodel');
var dbconfig = require('./db/database.js');
var fs = require('fs');
const mongoose = require('mongoose'),Schema = mongoose.Schema, ObjectId = Schema.ObjectId;


//Launch MSDK application or Integrate it with CV SDK
//proc.kill('SIGINT');

//Launch MSDK application or Integrate it with CV SDK
/*  
var proc_cvsdk = require('child_process').spawn('~/Documents/CVSDK_FDFR/face-access-control/cvservice/./cvservicenew', ['']);
proc_cvsdk.stderr.on('data', (data) => {
    console.error(`child stderr:\n${data}`);
  });

const { exec } = require('child_process');
exec(', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
*/
mongoose.connect(dbconfig.url,{useMongoClient:true});  
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log("Connection to MongoDB successful");
});


//MQTT Connections
var client  = mqtt.connect('mqtt://localhost:1883')
var previousPersonId = -1; 
var registrationInProg = false;

//db.open(config);


client.on('connect', function () {
  client.subscribe('person/seen');
  client.subscribe('faces_count');
  
  console.log('Connection to MQTT successful')
})
var timeInterval;
var _userInfo = {};
// SET ENV
process.env.NODE_ENV = 'development';




const {app, BrowserWindow, Menu, ipcMain} = electron;

let mainWindow;
let regWindow;
let addWindow;
var isMSDKLaunched = false;
var msdkproc = null;

function findProductForUser(userid)
{
    datamodels.UserKeywordModel.find({userid: userid, searchfound: false}, 'userid keyword searchfound', function(err, userkeywords){
        var notFoundKeywords = "";
        console.log("=============================================================");        
        console.log(userkeywords);

        userkeywords.forEach(userkeyword => {
            notFoundKeywords +=" "+ userkeyword.keyword;
        });
        console.log(notFoundKeywords);                
        console.log("=============================================================");                
        productSearch(notFoundKeywords,"revisit");

    })    
}
client.on('message', function (topic, message) {
    console.log(topic +" => " + message);
    if(topic == 'faces_count')
    {
        console.log("Faces found:" + message);
        if(parseInt(message) == 100)
        {
            console.log("Launch MSDK");
            timeInterval = setInterval(function(){
            if(!isMSDKLaunched)
            {
                msdkproc = require('child_process').spawn('/opt/intel/mediasdk/samples/_bin/x64/./sample_decode', ['h264','-i', '/opt/intel/mediasdk/samples/_bin/content/input.h264', '-r','-hw']);
                msdkproc.stderr.on('data', (data) => {
                    console.error(`child stderr:\n${data}`);
                    isMSDKLaunched = false;
                    });
                    isMSDKLaunched = true;
                }     
            }, 15000)
        previousPersonId = -1;    
        }
        else
        {
            clearInterval(timeInterval);
            if(msdkproc != null)msdkproc.kill('SIGINT');
        }
        mainWindow.webContents.send('person', "-1",null,"","");
    }
    else if(topic == 'person/seen' && previousPersonId ==-1)
    {
        message = JSON.parse(message);

        previousPersonId = message.id;
        /*
        //Once A USER IS IDENTIFIED, HOLD IT FOR 10MIN. 
        clearInterval(timeInterval);
        timeInterval = setInterval(function(){
            previousPersonId = -1;
        }, 10000);
        */
        if(message.id != -1)        
        {
            datamodels.UserModel.findOne({userid: message.id}, 'userid name age gender', function(err, user){
                if (err) console.log(err.message);
                if(user != null)
                { 
                    _userInfo.userid = user.userid;
                    _userInfo.name = user.name;
                    _userInfo.age = user.age;
                    _userInfo.gender = user.gender;
                    console.log(user.toString());
                    mainWindow.webContents.send('person', user.userid,  user.name,  user.age, user.gender);
                    //Perform product search for this user for "not found" products
                    findProductForUser(user.userid);
                }
                else
                {
                    _userInfo = {};
                    _userInfo.userid = -1;
                    mainWindow.webContents.send('person', message.id,"Guest","","");
                    mainWindow.webContents.send('reset', -1);                    
                    console.log("User not found");
                }
            });
        }
        else
        {
            _userInfo = {};
            _userInfo.userid = -1;
            mainWindow.webContents.send('person', -1,"Guest","","");
            console.log("User not registered");
        }

        /*
        if(message.id != -1 && registrationInProg) 
        {

            //consider it as new id
            mainWindow.webContents.send('person', message.id,_userInfo.name);
            regWindow.webContents.send('person', message.id);
        }
        else if(message.id != -1 && registrationInProg == false)
        {
            console.log(_userInfo.name);
            //Consider as already registed id. can be used for further verification like name or age
            registrationInProg = false;
            //mainWindow.webContents.send('person', message.id,_userInfo.name);
        }
        else {
            //unrecognized person. 
            registrationInProg = false;
            //mainWindow.webContents.send('person', message.id,_userInfo.name);
        }
        */
    }
 })

//productSearch("desktop laptop");
function productSearch(keywords,target)
{
    datamodels.ProductModel.searchProductByKeyword(keywords, function(err, products) {
        if(err != null)console.log(err.message);    
        else 
        {
            var prodlist = [];
            var prod;
            products.forEach(product => {
                prod={};
                console.log(product.toString());    
                prod.catid = product.catid;
                prod.productid = product.productid;
                prod.name = product.name;
                prod.description = product.description;
                prod.price = product.price;
                prod.score = product.score;
                prodlist.push(prod);
            });
            //If target is not selected, then even the repeated entries re made to userkeywrod database. We want to store only items from main search.
            if(target == "mainsearch")saveUserKeywords(_userInfo.userid, keywords, (prodlist.length > 0?true:false));
            mainWindow.webContents.send('prod_search_results', prodlist,target);
        }
    });
}


function saveUserKeywords(uid, keyword, srchFound)
{
    datamodels.UserKeywordModel.insertMany([{userid:uid,keyword:keyword,searchfound:srchFound}]
        ,function(err,raw){
            if (err) console.log(err.message);
            console.log('The raw response from Mongo was ', raw);
        });
}

// Listen for app to be ready
app.on('ready', function(){
  // Create new window
  //mainWindow = new BrowserWindow({width: 800, height: 600, frame: false});
  mainWindow = new BrowserWindow({});
  // Load html in window
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname,'web' ,'index.html'),
    protocol: 'file:',
    slashes:true
  }));
  //mainWindow.setFullScreen(true);

  // Quit app when closed
  mainWindow.on('closed', function(){
    //proc_cvsdk.kill('SIGINT');  
    app.quit();
  });
/*
  // Build menu from template
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  // Insert menu
  Menu.setApplicationMenu(mainMenu);
  */
  
});
//loadCategoryData();
//loadProductData();
/*
    {"catid":"1","name":"Computers","description":"Buy computers, laptops and accessories in this cateory","image":"computer.jpg","keywords":"Computers accessories processors laptop"},
    {"catid":"2","name":"Mobile Phones","description":"Buy Mobile Phones, smart phones and accessories in this cateory","image":"mobile.jpg","keywords":"Tablet Mobile accessories"},
    {"catid":"3","name":"Large Electronics","description":"Buy refrigerators, washing machine, air conditions and accessories in this cateory","image":"refrigerator.jpg","keywords":"refrigerators, washing machine, air conditions"}

*/
function loadCategoryData()
{
    datamodels.ProductCategoryModel.remove({});
    datamodels.ProductCategoryModel.insertMany([
        {"catid":"4","name":"Embedded","description":"Buy embedded producs","image":"computer.jpg","keywords":"microprocessor embedded"}    ]
    
    ,function(err,raw){
        if (err) return handleError(err);   
        console.log('The raw response from Mongo was ', raw);
    });
}

/*
    {"productid":"1","catid":"1","name":"Lenevo Laptop","description":"Lenevo Laptop","price":400,"image":"laptop1.jpg","keywords":"laptop computer mobility convertible"},
    {"productid":"2","catid":"1","name":"HP Laptop","description":"HP Laptop","image":"laptop1.jpg","price":500,"keywords":"laptop computer mobility convertible"},
    {"productid":"3","catid":"2","name":"HP Desktop","description":"HP Desktop","image":"hpdesktop.jpg","price":200,"keywords":"personal computer computer CPU"},

*/
function loadProductData()
{
    //datamodels.ProductModel.remove({});
    datamodels.ProductModel.insertMany([
    {"productid":"6","catid":"4","name":"Galileo","description":"Galileo board","image":"galileo.jpg","price":400,"keywords":"microprocessor galileo mini computer"}
    ]
    ,function(err,raw){
        if (err) console.log(err.message);
        console.log('The raw response from Mongo was ', raw);
    });
}


// Catch Update datamodel
ipcMain.on('productsearch', function(e, keywords){
    productSearch(keywords,"mainsearch");
});



// Catch Update datamodel
ipcMain.on('registered', function(e, userInfo){
    //regWindow.close();
    var userModel = new datamodels.UserModel(userInfo);          
    datamodels.UserModel.update({userid : userInfo.userid},userInfo,{upsert : true},function(err,raw){
        if (err) return handleError(err);
        console.log('The raw response from Mongo was ', raw);
    });
    //userModel.save();
    //regWindow = null;
});


ipcMain.on('register_id', function(){  
    console.log("Publishing to register!!");
    client.publish("commands/register","true");
    /*
    registrationInProg = true;
    regWindow = new BrowserWindow({
        width: 300,
        height:400,
        title:'Registration',
        parent: mainWindow, modal: true
    });
    regWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'joinCommunity.html'),
        protocol: 'file:',
        slashes:true
    }));
    // Handle garbage collection
    regWindow.on('close', function(){
        addWindow = null;
    });
    */
});