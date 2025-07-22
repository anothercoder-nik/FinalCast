import { createUser, findUserByEmail, findUserByEmailByPassword } from "../DAO/user.dao.js"
import { signToken } from "../utils/helper.js"


export const registerUser = async (name, email, password) => {
    const user = await findUserByEmail(email)
    if(user) throw new Error("User already exists")
    const newUser = await createUser(name, email, password)
    const token = await signToken({id: newUser._id})
    return {token,user}
}

export const loginUser = async (email, password) => {
    const user = await findUserByEmailByPassword(email)
    if(!user) throw new Error("Invalid email or password")

    const isPasswordValid = await user.comparePassword(password)
    if(!isPasswordValid) throw new Error("Invalid email or password")
    const token = signToken({id: user._id})
    return {token,user}
}