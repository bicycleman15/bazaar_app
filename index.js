var x=require("express")();
var bodyparser=require("body-parser")
x.use(bodyparser.urlencoded({extended:true}))
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/bazaar',{ useNewUrlParser: true });
var product=require("./models/product");
var user=require("./models/users")
var passport=require("passport");
var localstrategy=require("passport-local");
var methodoveride=require("method-override")
x.use(methodoveride("_method"))
var recenttrans=require("./models/recenttrans")


//==================================

x.use(require("express-session")({
    secret:"This is the secret string",
    resave:false,
    saveUninitialized:false
}))

x.use(passport.initialize())
x.use(passport.session())
passport.use(new localstrategy(user.authenticate()))
passport.serializeUser(user.serializeUser())
passport.deserializeUser(user.deserializeUser())

x.use(function(req,res,next){
    res.locals.currentUser=req.user;
    next();
})

//==================================

x.get('/',function(req,res){
    res.render('root.ejs');
})

x.get('/products',function(req,res){
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search),'gi');

        product.find({name:regex},function(err,data){
        if(err) console.log(err);
        else
            res.render('products.ejs',{products:data});
    })
    }
    else{product.find({},function(err,data){
        if(err) console.log(err);
        else
            res.render('products.ejs',{products:data});
    })
    }
})

x.get('/products/new',isloggedin,function(req, res) {
    res.render('newproduct.ejs');
})

x.post('/products',isloggedin,function(req,res){
    var newproduct={
        name:req.body.name,
        price:req.body.price,
        type:req.body.type,
        image:req.body.image,
        sellerid:req.user._id,
        sellername:req.user.username
        
    }
    product.create(newproduct,function(err,p){
        if(err) console.log(err)
        else{
            req.user.productsonsale.push(p);
            req.user.save();
            res.redirect('/products');
        }
    })
})

//=======================



x.get('/login',function(req,res){
    res.render('login.ejs');
})

x.post('/login',passport.authenticate("local",{
    successRedirect:"/products",
    failureRedirect:"/login"
    
}),function(req, res) {})

x.get('/register',function(req, res) {
    res.render('register.ejs');
})

x.post('/register',function(req,res){
    var t=new user({username:req.body.username,isadmin:false})
    user.register(t,req.body.password,function(err,data){
        if(err){
             console.log(err);
             res.redirect('/register');
        }
        passport.authenticate("local")(req,res,function(){
            res.redirect('/products');
        })
        
    })
})

x.get('/logout',function(req, res) {
    req.logout();
    res.redirect('/products')
})

x.get('/products/:id',function(req, res) {
    product.findById(req.params.id,function(err,foundprod){
        if(err){
            res.redirect('/products');
        }
        else {
            res.render('show.ejs',{product:foundprod});
        }
    })
})

function isloggedin(req,res,next) {
    if(req.isAuthenticated()){
        return next();
    }
    else
    {
        res.redirect('/login');
    }
}

x.get('/users/:id',function(req, res) {
    user.findById(req.params.id).populate("productsonsale").exec(function(err,founduser){
        if(err) console.log(err)
        else
        {
            user.findById(req.params.id).populate("productsbought").exec(function(err,founduser2){
                if(err) console.log(err)
                else
                {
                   res.render("showuser.ejs",{founduser2:founduser2,founduser:founduser})
                }
            })
        }
        
    })
    
})

//============================

x.get("/products/:id/edit",checkownership,function(req, res) {
   
   product.findById(req.params.id,function(err,foundprod){
       if(err) console.log(err)
       else{
           res.render('edit.ejs',{product:foundprod});
       }
   })
    
})

x.put("/products/:id/edit",checkownership,function(req,res){
    if(req.user.isadmin){
        product.findById(req.params.id,function(err, foundprod) {
            if(err) console.log(err)
            else{
                if(foundprod.isflagged)
                foundprod.isflagged=false;
                else foundprod.isflagged=true;
                foundprod.save();
                res.redirect('/admin')
            }
        })
    }
    else
    product.findByIdAndUpdate(req.params.id,req.body.p,function(err,updatedprod){
        if(err) console.log(err);
        else{
            res.redirect('/products');
        }
    })
})

x.delete("/products/:id",checkownership,function(req,res){
    product.findByIdAndRemove(req.params.id,function(err){
        if(err) console.log(err)
        else
        {
            res.redirect("/products");
        }
    })
})

function checkownership(req,res,next){
    if(!req.isAuthenticated()){
        res.send("please login first")
    }
    else
    {
        product.findById(req.params.id,function(err,foundprod){
            if(err) console.log(err)
            else
            {
                if(foundprod.sellerid.equals(req.user._id) || req.user.isadmin){
                   next();
                }
                else{
                    res.send("you are not the owner so are not allowed")
                }
            }
        })
    
    }
}


x.get("/admin",function(req, res) {
    if(req.user && req.user.isadmin ){
        product.find({},function(err, foundprod) {
        if(err) console.log(err)
        else
        res.render("showadmin.ejs",{products:foundprod})
    })
    }
    else{
        res.send("YOU MUST BE AN ADMIN TO ENTER THT PAGE!!")
    }
})

x.get("/admin/recenttrans",function(req, res) {
    recenttrans.find({},function(err,data){
        if(err) console.log(err)
        else{
            res.render('recenttrans.ejs',{recentrans:data});
        }
    })
})

x.get('/products/:id/buy',isloggedin,function(req, res) {
    product.findById(req.params.id,function(err, foundprod) {
        if(err) console.log(err)
        else
        res.render("purchaseconfirm.ejs",{product:foundprod})
    })
})

x.post('/products/:id/buy',isloggedin,function(req, res) {
    product.findById(req.params.id,function(err, foundprod) {
        if(err){
            console.log(err)
        }
        else{
              user.findById(req.user._id,function(err, founduser) {
              if(err) console.log(err)
              else{
                  founduser.productsbought.push(foundprod);
                  founduser.save();
                  recenttrans.create({product:foundprod.name,user:founduser.username,price:foundprod.price},function(err,data){
                      if(err) console.log(err)
                      else
                      res.redirect("/buycomplete");
                  })
                  
              }
            })
        }
    })
})

x.get('/buycomplete',function(req, res) {
    res.render("buycomplete.ejs");
})

x.get('/admin/recenttrans',function(req, res) {
    recenttrans.find({},function(err, foundprod) {
        if(err) console.log(err)
        else 
        res.render('recenttrans.ejs',{recenttrans:foundprod})
    })
})

x.get('/admin/viewusers',isloggedin,function(req, res) {
    if(req.user.isadmin){
        user.find({},function(err, users) {
            if(err) console.log(err)
            else {
                res.render('viewusersadmin.ejs',{users:users});
            }
        })
    }
})

x.delete('/users/:id',isloggedin,function(req,res){
    if(req.user.isadmin){
        
        user.findByIdAndRemove(req.params.id,function(err){
            if(err) console.log(err)
            else
            res.redirect('/admin/viewusers')
        })
    }
    else{
        res.redirect('/products');
    }
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};  


//==============================

x.listen(3000,function(){
    console.log("server has started");
});

