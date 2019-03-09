var mongoose=require("mongoose")
var passlocalmg=require("passport-local-mongoose")

var userschema=new mongoose.Schema({
    username:String,
    password:String,
    productsonsale:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Product"
        }],
    productsbought:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Product"
        }],
    isadmin:{type:Boolean , default:false}    
})

userschema.plugin(passlocalmg);
module.exports = mongoose.model("User",userschema);