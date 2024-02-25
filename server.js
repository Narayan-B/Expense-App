const express=require('express')
const mongoose=require('mongoose')
const app=express()
const {checkSchema,validationResult}=require('express-validator') //npm install express-validator
const port=3068
app.use(express.json())

mongoose.connect('mongodb://127.0.0.1:27017/exp-app-dec23')
    .then(()=>{
        console.log('connected to db')
    })
    .catch((err)=>{
        console.log('err connecting to db',err)
    })

const {Schema,model}=mongoose
 const categorySchema =new Schema({
     name : String
 },{timestamps:true})

// const categorySchema =new Schema({
//     name : {
//         type:String
//         //required:true //to avoid empty string entered by the user
//     }
// },{timestamps:true}) 
const categoryValidationSchema={
    name:{
        in:['body'],
        exists:{
            errorMessage:'Name is Required'
        },
        notEmpty:{
            errorMessage:'name cannot be empty'
        },
        trim:true, //where trim is a sanitizer
        custom:{
            options:function(value){
                return Category.findOne({name:value})
                    .then((obj)=>{
                        if(!obj){
                            return true

                        }
                        throw new Error('category name already exists')
                       
                    })
            }
        }
    }
}

const Category=model('Category',categorySchema)
//requuest handler
app.get('/all-categories',(req,res)=>{
    Category.find()
        .then((data)=>{
            res.json(data)
        })
        .catch((err)=>{
            res.json(err)
        })
})
//create new request handler to get single expense response by id
app.get('/single-category/:id',(req,res)=>{
    const id=req.params.id
    Category.findById(id)
        .then((category)=>{
            if(!category){
                return res.status(404).json({})
            }
            res.json(category)
        })
        .catch((err)=>{
            res.json(err)
        })
})
//request handler 
//POST '/create-category'
app.post('/create-category',checkSchema(categoryValidationSchema),(req,res)=>{      //In Express.js, checkSchema is a function provided by the express-validator library. It's used for validating request data based on a predefined schema. This schema defines the validation rules for each field in the request body.
    const errors=validationResult(req)  //ia a function that return results of validation .It extracts validation errors 
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }
    const body=req.body //{name:'food}
    //console.log(req.body)
    const categoryObj=new Category(body) // Category-model variable
   // categoryObj.name=body.name
    categoryObj.save()
        .then((data)=>{
            res.json(data)
        })
        .catch((err)=>{
            res.json(err)
        })
        

})

const idValidationSchema={
    id:{
        in:['params'],
        isMongoId:{
            errorMessage:'should be a mongo id'
        }
    }
}

app.put('/update-category/:id',checkSchema(categoryValidationSchema),checkSchema(idValidationSchema),(req,res)=>{
    const errors=validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({erros:errors.array()})

    }
    const id=req.params.id
    //console.log(id)  _id is shown
    const body=req.body
    //console.log(body) input or update changed by the user
    Category.findByIdAndUpdate(id,body,{new:true})
        .then((category)=>{
            if(!category){
                return res.status(404).json({})
            }
            res.json(category)
        })
        .catch((err)=>{
            res.json(err)
        })

})


app.delete('/delete-category/:id',checkSchema(idValidationSchema),(req,res)=>{
    const errors=validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({erros:errors.array()})

    }
    const id=req.params.id
    Category.findByIdAndDelete(id)
        .then((category)=>{
            if(!category){
                return res.json({})
            }
            res.json(category)
        })
        .catch((err)=>{
            res.status(500).json({error:'Internal server error'})
        })
})




//create a expense Schema 
const expenseSchema=new Schema({
    expenseDate:Date,
    amount:Number,
    description:String
},{timestamps:true})
//create a Model
const Expense=model("Expense",expenseSchema)
//create expenseSchemaValidation
const expenseValidationSchema={
    expenseDate:{
        in:['body'],
        exists:{
            errorMessage:'Expense date is required'
        },
        
        isDate:{
            errorMessage:'Expense date is not valid' //yyyy-mm-dd
        },
        //creating custom validations
        custom:{
            options:function(value){
                if(new Date(value)>new Date()){
                    throw new Error('expense data cannot be greater than today')
                }
                return true
            }
        }                                                                                                                                                                                   
    },
    amount:{
        in:['body'],
        exists:{
            errorMessage:'amount is required'
        },
        notEmpty:{
            errorMessage:'Amount cant be empty'
        },
        isNumeric:{
            errorMessage:'Amount should be a number'
        },
        custom:{
            options:function(value){
                if(value<=0){
                    throw new Error('Amount Cannot be less or equal to 0')
                }
                return true
            }
        }
    }
}
//create  a request handler to return all-expenses
app.get('/all-expenses',(req,res)=>{
    
    Expense.find()
        .then((expenses)=>{
            res.json(expenses)
        })
        .catch((err)=>{
            res.json(err)
        })
})
//create a request handler to get one element by id
app.get('/one-expense/:id',(req,res)=>{
    const id=req.params.id
    Expense.findById(id)
        .then((expense)=>{
            res.json(expense)
        })
        .catch((err)=>{
            res.json(err)
        })
})
//create a request handler to create a new expense
app.post('/create-expense',checkSchema(expenseValidationSchema),(req,res)=>{
    const errors=validationResult(req) //print errors
    // console.log(errors)
    if(!errors.isEmpty()){
        return res.status(400).json({erros:errors.array()})
    }
    const body=req.body
    const expenseObj=new Expense(body)
    expenseObj.save()
        .then((exp)=>{
            res.json(exp)
        })
        .catch((err)=>{
            res.json(err)
        })
})
//crerat a request handler to update a response
app.put('/update-expense/:id',(req,res)=>{
    const id=req.params.id
    //console.log(id)
    const body=req.body
    //console.log(body)
    Expense.findByIdAndUpdate(id,body,{new:true})
        .then((expense)=>{
            if(!expense){
                return res.status(404).json({})
            }
            res.json(expense)
        })
        .catch((err)=>{
            res.json(err)
        })
})

app.delete('/delete-expense/:id',(req,res)=>{
    const id=req.params.id
    Expense.findByIdAndDelete(id)
        .then((expense)=>{
            if(!expense){
                return res.status(404).json({})
            }
            res.json(expense)

        })
           
        .catch((err)=>{
            return res.json(err)
        })
})
app.listen(port,()=>{
    console.log('server is runninng on port',port)
})

