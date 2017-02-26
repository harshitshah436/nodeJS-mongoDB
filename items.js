/*
  Copyright (c) 2008 - 2016 MongoDB, Inc. <http://mongodb.com>

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/


var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');


function ItemDAO(database) {
    "use strict";

    this.db = database;

    this.getCategories = function(callback) {
        "use strict";

        var categories = [];
        
        this.db.collection("item").aggregate([
            { 
                $group : {
                    _id: "$category", 
                    num: {$sum : 1}
                }
            }
        ]).toArray(function(err, result) {
            assert.equal(null, err);
            categories = result;
            
            var total = 0;
            for (var i=0; i < categories.length; i++) {
                total += categories[i].num;
            }
            
            categories.push({_id: "All", total});
            
            categories.sort( function(a, b) {
                var nameA = a._id.toUpperCase();
                var nameB = b._id.toUpperCase();
                if (nameA < nameB) {
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }
                return 0;
            });
            
            callback(categories);
        });

    }


    this.getItems = function(category, page, itemsPerPage, callback) {
        "use strict";

        var query = {};
         
        if(category != "All") {
            query = {"category" : category};
        }
         
        this.db.collection("item").find(query)
            .sort({_id: 1})
            .skip(page * itemsPerPage)
            .limit(itemsPerPage)
            .toArray(function(err, pageItems) {
                assert.equal(null, err);
                callback(pageItems);
            });

    }


    this.getNumItems = function(category, callback) {
        "use strict";

        var query = {};
         
        if(category != "All") {
            query = {"category" : category};
        }
         
        this.db.collection("item").find(query)
            .count(function(err, numItems) {
                assert.equal(null, err);
                callback(numItems);
            });

    }


    this.searchItems = function(query, page, itemsPerPage, callback) {
        "use strict";

        var queryDoc = {
            $text : {
                $search : query
            }
        };
         
        this.db.collection("item").find(queryDoc)
            .sort({_id: 1})
            .skip(page * itemsPerPage)
            .limit(itemsPerPage)
            .toArray(function(err, items) {
                assert.equal(null, err);
                callback(items);
            });
    }


    this.getNumSearchItems = function(query, callback) {
        "use strict";

        var queryDoc = {
            $text : {
                $search : query
            }
        };
         
        this.db.collection("item").find(queryDoc)
            .count(function(err, numItems) {
                assert.equal(null, err);
                callback(numItems);
            });

    }


    this.getItem = function(itemId, callback) {
        "use strict";

        var query = {
            _id : itemId
        };
        
        this.db.collection("item").find(query).next( function(err, item) {
            assert.equal(null, err);
            callback(item);
        });
    }


    this.getRelatedItems = function(callback) {
        "use strict";

        this.db.collection("item").find({})
            .limit(4)
            .toArray(function(err, relatedItems) {
                assert.equal(null, err);
                callback(relatedItems);
            });
    };


    this.addReview = function(itemId, comment, name, stars, callback) {
        "use strict";

        var reviewDoc = {
            name: name,
            comment: comment,
            stars: stars,
            date: Date.now()
        }

        this.db.collection("item").updateOne(
            {_id : itemId},
            {$push : {reviews : reviewDoc}},
            function(err, doc) {
                assert.equal(null, err);
                callback(doc);
            }
        );
    }


    this.createDummyItem = function() {
        "use strict";

        var item = {
            _id: 1,
            title: "Gray Hooded Sweatshirt",
            description: "The top hooded sweatshirt we offer",
            slogan: "Made of 100% cotton",
            stars: 0,
            category: "Apparel",
            img_url: "/img/products/hoodie.jpg",
            price: 29.99,
            reviews: []
        };

        return item;
    }
}


module.exports.ItemDAO = ItemDAO;
