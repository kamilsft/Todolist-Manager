//jshint esversion:6

// setting up the server
// jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
// adding that day from the date files

const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();


// tell app to use ejs
app.set('view engine', 'ejs');
// body parser
app.use(bodyParser.urlencoded({extended: true}));
// this is for the css, so it will read the css when making the server
app.use(express.static("public"));

// connection with mongoose
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

// creating a schema
const itemsSchema = {
  name: String
};

// new mongoose mondule based on the itemsSchema
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "First task!"
});
const item2 = new Item({
  name: "Please feel free to add more tasks !"
});
// const item3 = new Item({
//   name: "<-- Hit this to delete an item !"
// });

// putting them to an array
const defaultItems = [item1, item2];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


// home rout
app.get("/", function(req, res) {


  Item.find({}, function(err, foundItems){

    if (foundItems.length === 0){
      // inserting items to our Items collection
      Item.insertMany(defaultItems, function(err){
        if (err){
          console.log(err);
        } else{
          console.log("Successfully saved default Items to DB");
        }
      });
      res.redirect("/");
    } else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
  // passing over an updated array
});
// when the post request is triggered on our home rout, will save the value of new item to a
// variable newItem and it will redirect to a home rout;
app.post("/", function(req, res){
  // three is a scope error so we will change this line of code
  // getting that newItem that was in the ejs file in the form tag whatever the guy typed to the termina
  // checks to see if the list of the new item came from the work list
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  }  else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", function(req, res){
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemID, function(err){
      if (!err){
        console.log("Successfully deleted checked item !");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }


});

// dynamic rout
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        // create a new list
          const list = new List({
            name: customListName,
            items: defaultItems
          });
          list.save();
          res.redirect("/" + customListName);
      } else{
        // show an existing list
        res.render("list", {listTitle: customListName, newListItems: foundList.items});
      }
    }
  });

});


// connection with our about.ejs file
app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
