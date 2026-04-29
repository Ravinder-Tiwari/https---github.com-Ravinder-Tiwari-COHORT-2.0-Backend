import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import appConfig from "../config/config.js"

async function sendTokenResponse(user, res, message) {

    const token = jwt.sign({
        id: user._id
    }, appConfig.JWT_SECRET, {
        expiresIn: "7d"
    })

    res.cookie("token", token)
    console.log(token)
    res.status(201).json({
        message,
        user: {
            id: user._id,
            email: user.email,
            contact: user.contact,
            username: user.username,
        }
    })

}

export const registerUser = async (req, res) => {
    try {

        const { email, password, contact, username } = req.body

        const existingUser = await userModel.findOne({
            $or: [
                { email },
                { contact }
            ]
        })

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" })
        }


        const newUser = await userModel.create({
            email,
            password,
            contact,
            username
        })

        await sendTokenResponse(newUser, res, "User registered successfully")

        return

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const loginUser = async (req, res) => {
    try {
        // console.log("hii")
        const { email, password } = req.body
        // console.log(email)
        const user = await userModel.findOne({ email })
        // console.log(user)

        if (!user) {
            console.log("no user  found")
            return res.status(400).json({ message: "Invalid credentials" })
        }

        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" })
        }

        await sendTokenResponse(user, res, "User logged in successfully")
        return
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const googleCallback = async (req, res) => {
    // console.log(req.user)
    const { id, displayName, emails, photos } = req.user

    let email = emails[0].value
    let user = await userModel.findOne(
        { email }
    )

    if (!user) {
        user = await userModel.create({
            email,
            username: displayName,
            googleId: id,
            role: "buyer"
        })
    }

    const token = jwt.sign({
        id: user._id
    }, appConfig.JWT_SECRET, {
        expiresIn: "7d"
    })

    res.cookie("token", token)

    res.redirect("http://localhost:5173/")
}

export const getMe = async (req, res) => {
    try {
        const { id } = req.user
        // console.log(id)
        const user = await userModel.findById(id)
        // console.log(user)

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        res.status(200).json({
            message: "User fetched successfully",
            user: {
                id: user._id,
                email: user.email,
                contact: user.contact,
                username: user.username,
            }
        })
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

export const logoutUser = async (req, res) => {
    res.clearCookie("token")
    res.status(200).json({ message: "User logged out successfully" })
}