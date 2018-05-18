var kafka = require('kafka-node');


var tweetAnalyticsListener = module.exports;
var subscribers = [];

tweetAnalyticsListener.subscribeToTweetAnalytics = function( callback) {
  subscribers.push(callback);
}
//var KAFKA_SERVER_PORT = 6667;
var KAFKA_ZK_SERVER_PORT = 2181;

var kafkaHost = process.env.KAFKA_HOST || "192.168.188.102";
var zookeeperPort = process.env.ZOOKEEPER_PORT || 2181;
var TOPIC_NAME = process.env.KAFKA_TOPIC ||'TWEET_COUNT';


var consumerOptions = {
  host :kafkaHost+":"+zookeeperPort,
  groupId: 'consume-tweetAnalytics-for-web-app',
    sessionTimeout: 15000,
    protocol: ['roundrobin'],
    encoding: 'buffer',
    fromOffset: 'earliest' // equivalent of auto.offset.reset valid values are 'none', 'latest', 'earliest'
  };
  
var topics = [TOPIC_NAME];
var consumerGroup = new kafka.ConsumerGroup(Object.assign({id: 'consumer1'}, consumerOptions), topics);
consumerGroup.on('error', onError);
consumerGroup.on('message', onMessage);

function onError (error) {
    console.error(error);
    console.error(error.stack);
  }
  
  function onMessage (message) {
    console.log('%s read msg Topic="%s" Partition=%s Offset=%d', this.client.clientId, message.topic, message.partition, message.offset);
    // the message.value contains the JSON representation of the event published by KSQL on the Topic
    var event = JSON.parse(message.value)
    var conference =event.TAGFILTER||'java' ;
    var count = event.TAG_CNT;
    subscribers.forEach( (subscriber) => {
        subscriber(JSON.stringify({"eventType":"tweetAnalytics","conference":conference, "tweetCount":count}
      ));
        
    })
  }
  
  process.once('SIGINT', function () {
    async.each([consumerGroup], function (consumer, callback) {
      consumer.close(true, callback);
    });
  });
