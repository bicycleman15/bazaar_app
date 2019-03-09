var mongoose=require("mongoose")

var productSchema = new mongoose.Schema({
  
  product:String,
  user:String,
  price:String
});

module.exports = mongoose.model('RecentTrans', productSchema);
