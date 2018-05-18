const express = require('express');
var https = require('https')
  , http = require('http')
const app = express();
var PORT = process.env.PORT || 8145;
const server = http.createServer(app);
var APP_VERSION = "0.0.3"


const bodyParser = require('body-parser');
app.use(bodyParser.json());
var tweetCount = 0;
app.get('/about', function (req, res) {
  var about = {
    "about": "Twitter Consumer from  " +SOURCE_TOPIC_NAME,
    "PORT": process.env.PORT,
    "APP_VERSION ": APP_VERSION,
    "Running Since": startTime,
    "Total number of tweets processed": tweetCount

  }
  res.json(about);
})
server.listen(PORT, function listening() {
  console.log('Listening on %d', server.address().port);
});




var kafka = require('kafka-node');
var model = require("./model");

var tweetListener = module.exports;

var subscribers = [];
tweetListener.subscribeToTweets = function (callback) {
  subscribers.push(callback);
}

// var kafkaHost = process.env.KAFKA_HOST || "192.168.188.102";
// var zookeeperPort = process.env.ZOOKEEPER_PORT || 2181;
// var TOPIC_NAME = process.env.KAFKA_TOPIC ||'tweets-topic';

var KAFKA_ZK_SERVER_PORT = 2181;

var SOURCE_KAFKA_HOST = '129.150.77.116';
var SOURCE_TOPIC_NAME = 'a516817-tweetstopic';


//var client = new kafka.Client(kafkaHost + ":"+zookeeperPort+"/")

var consumerOptions = {
    host: SOURCE_KAFKA_HOST + ':' + KAFKA_ZK_SERVER_PORT ,
  groupId: 'consume-tweets-for-elastic-index',
  sessionTimeout: 15000,
  protocol: ['roundrobin'],
  fromOffset: 'latest' // equivalent of auto.offset.reset valid values are 'none', 'latest', 'earliest'
};

var topics = [SOURCE_TOPIC_NAME];
var consumerGroup = new kafka.ConsumerGroup(Object.assign({ id: 'consumer1' }, consumerOptions), topics);
consumerGroup.on('error', onError);
consumerGroup.on('message', onMessage);

function onMessage(message) {
  console.log('%s read msg Topic="%s" Partition=%s Offset=%d', this.client.clientId, message.topic, message.partition, message.offset);
  console.log("Message Value " + message.value)

  subscribers.forEach((subscriber) => {
    subscriber(message.value);

  })
}

function onError(error) {
  console.error(error);
  console.error(error.stack);
}

process.once('SIGINT', function () {
  async.each([consumerGroup], function (consumer, callback) {
    consumer.close(true, callback);
  });
});


tweetListener.subscribeToTweets((message) => {
  var tweetEvent = JSON.parse(message);
  tweetCount++; 
  // ready to elastify tweetEvent
  console.log("Ready to put on Elastic "+JSON.stringify(tweetEvent));
  model.saveTweet(tweetEvent).then((result, error) => {
    console.log("Saved to Elastic "+JSON.stringify(result)+'Error?'+JSON.stringify(error));
})

})