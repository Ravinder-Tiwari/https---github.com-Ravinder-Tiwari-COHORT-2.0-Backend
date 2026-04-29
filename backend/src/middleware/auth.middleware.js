import jwt   from "jsonwebtoken"
import appConfig from "../config/config.js"



export function authUser(req,res,next){
    // console.log("hii")
    const token = req.cookies.token
    // console.log(token)
    if(!token){
        const err = new Error("No token provided")
        err.status = 401
        return next(err)
    }
    try{
        const decoded = jwt.verify(token,appConfig.JWT_SECRET)

        req.user = decoded
        console.log(req.user)
        next()
    }catch(err){
        next(err)
    }
}