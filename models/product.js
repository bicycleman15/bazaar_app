var mongoose=require("mongoose")

var productSchema = new mongoose.Schema({
  name: String,
  image: String,
  price:String,
  type: String,
  sellername:String,
  sellerid:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User"
  },
  isflagged:{type:Boolean , default:false}
  
    
  
      
});

module.exports = mongoose.model('Product', productSchema);
