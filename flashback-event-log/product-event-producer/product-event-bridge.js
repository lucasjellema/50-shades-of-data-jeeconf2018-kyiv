var express = require('express')
  , http = require('http'),
  eventBusPublisher = require("./EventPublisher.js");
  ;
  
var fs = require('fs');
// not available locally, only on ACCS 
//var oracledb = require('oracledb');
var bodyParser = require('body-parser') // npm install body-parser
var app = express();
var server = http.createServer(app);

var PORT = process.env.PORT || 3010;
var APP_VERSION = '0.0.4.06';
var topicName = "a516817-productstopic";

//CORS middleware - taken from http://stackoverflow.com/questions/7067966/how-to-allow-cors-in-express-node-js
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials', true); 
    next();
}

server.listen(PORT, function () {
  console.log('Server running, version '+APP_VERSION+', Express is listening... at '+PORT+" for Orders Data API");
});

app.use(bodyParser.json()); // for parsing application/json
app.use(allowCrossDomain);


app.use(express.static(__dirname + '/public'))
app.get('/about', function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write("Version "+APP_VERSION+". No Data Requested, so none is returned; try /product-event (post)");
    res.write("Supported URLs:");
    res.write("/product-event (POST),  ");
    res.write("incoming headers" + JSON.stringify(req.headers)); 
    res.end();
});


app.post( '/product-event*', function (req, res) {
  handleProductEventPost(req, res);
});


handleProductEventPost =
  function (req, res) {
      var productEvent = req.body;
      eventBusPublisher.publishEvent("ProductEvent", {
        "eventType": "ProductEvent"
        ,"prduct": productEvent
        , "module": "product.microservice"
        , "timestamp": Date.now()
      }, topicName);
      var result = {
        "description": `Product Event has been published: ${productEvent}`
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
  }


  app.get( '/product-event*', function (req, res) {
    handleProductEventGet(req, res);
  });
  
  handleProductEventGet =
  function (req, res) {
      var productEvent ={};
      // retrieve query parameters
      productEvent.id = req.query.id;
      productEvent.name= req.query.name;
      productEvent.price= req.query.price;
      productEvent.weight= req.query.weight;
      productEvent.event_type= req.query.event_type;
      
      eventBusPublisher.publishEvent("ProductEvent", {
        "eventType": "ProductEvent"
        ,"prduct": productEvent
        , "module": "product.microservice"
        , "timestamp": Date.now()
      }, topicName);
      var result = {
        "description": `Product Event has been published: ${productEvent}`
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
  }

