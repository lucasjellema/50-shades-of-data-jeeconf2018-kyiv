app.post('/customer/:customerId', function (req, res) {
	var customerId = req.params['customerId'];
	var customer = req.body;
	customer.id = customerId;
	// find customer in database and update
	MongoClient.connect(mongoDBUrl, function (err, db) {
		var nameOfCollection = "customers"
		db.collection(nameOfCollection).findAndModify(
			{ "id": customerId }
			, [['_id', 'asc']]  // sort order
			, { $set: customer }
			, {}
			, function (err, updatedCustomer) {
				if (err) {
					console.log(err);
				} else {
					console.log("Customer updated :" + JSON.stringify(updatedCustomer));
    // Now publish an event of type CustomerModified on Event Hub Cloud Service
	eventBusPublisher.publishEvent("CustomerModified", {
		"eventType": "CustomerModified"
		, "customer": customer
		, "module": "customer.microservice"
		, "timestamp": Date.now()
	}, topicName);

	res.statusCode = 200;
	res.setHeader('Content-Type', 'application/json');
	res.setHeader('MyReply', 'Updated the Customer and published event on Event Hub - with  id -  ' + customerId);
	res.send(customer);

				}
			})
	}) //connect
})
