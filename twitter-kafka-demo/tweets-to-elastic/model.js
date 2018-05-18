var tweetsModel = module.exports;
var elasticsearch = require('elasticsearch');

var ELASTIC_SEARCH_HOST = process.env.ELASTIC_CONNECTOR || 'http://129.150.114.134:9200';

var client = new elasticsearch.Client({
    host: ELASTIC_SEARCH_HOST,
});

client.ping({
    requestTimeout: 30000,
}, function (error) {
    if (error) {
        console.error('elasticsearch cluster is down!');
    } else {
        console.log('Connection to Elastic Search is established');
    }
});

tweetsModel.saveTweet = async function (tweet) {
    try {
        var response = await client.index({
            index: 'tweets',
            id: tweet.tweetId,
            type: 'doc',
            body: tweet
        }
        );

        console.log("Response: " + JSON.stringify(response));
        return tweet;
    }
    catch (e) {
        console.error("Error in Elastic Search - index document " + tweet.tweetId + ":" + JSON.stringify(e))
    }

}

