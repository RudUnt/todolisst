//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

require("dotenv").config();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// related to strict queries warning
mongoose.set("strictQuery", true);

mongoose.connect("mongodb+srv://admin-rudresh:" + process.env.Password + "@cluster0.ypcpow8.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: String,
});

const listSchema = new mongoose.Schema ( {

  name: String,
  items: [itemsSchema]

} );

const Item = mongoose.model("Item", itemsSchema);

const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];




app.get("/", function(req, res) {

  Item.find(function(err, items){
    if(err) {
      console.log(err);
    } else {
      if ( items.length === 0 ) {
        Item.insertMany(defaultItems, function(err){
          if ( err ) {
            console.log (err);
          } else {
            console.log ( "Successfully saved all items in your DB." )
          }
        });
        res.redirect("/");
      } else {

        res.render("list", {listTitle: "Today", newListItems: items});

      }
      
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ( { 
    name: itemName
  } );

  if ( listName === "Today") {    
    item.save ();
    res.redirect ( "/" );
  } else {

    List.findOne ( {name: listName}, function ( err, list ) {

      if ( err ) {
        console.log ( err );
      } else {
        list.items.push (item);
        list.save ();
        res.redirect ( "/" + listName ); 
      }

    }) ;
  }
});

app.post ( "/delete" , function ( req, res ) {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove ( checkedItemId, function ( err ) {
      if ( err ) {
        console.log ( err );
      } else {
        res.redirect ( "/" );
      }
    } );
  } else {
    List.findOneAndUpdate ({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function ( err, list ) { 

      if ( err ) {
        console.log ( err );
      } else {
        res.redirect ( "/" + listName );
      }
    });
  }
  
} );

app.get("/:customListName", function(req,res){

  const customListName = _.capitalize(req.params.customListName);

  List.findOne ( { name: customListName }, function ( err, list ) {

    if ( err ) {
      console.log ( err );
    } else {
      if ( !list ) {
        // Create a new list
        const list = new List ( {

          name: customListName,
          items: defaultItems
      
        } );
      
        list.save ();

        res.redirect("/" + customListName);

      } else {

        // Show an existing list
        res.render("list", {listTitle: list.name, newListItems: list.items});

      }
    }

  } );
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
