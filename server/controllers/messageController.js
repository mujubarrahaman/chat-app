// Get all users expect the logged in user

import message from "../models/message.js";
import User from "../models/user.js";
import cloudinary from "../lib/cloudinary.js"
import { io , userSocketMap } from "../server.js";

export const getUserForSidebar = async (req,res)=>{
    try {
        const userId = req.user._id;
        const filteredUser = await User.find({_id: {$ne: userId}}).select("-password");

        //Count Number Of Message Not seen 
        const unSeenMessages = {}

        const promises = filteredUser.map(async (user)=>{
            const messages = await message.find({senderId: user._id , receiverId: userId, seen: false})
            if(messages.length > 0){
                unSeenMessages[user._id] = messages.length;
            }
        })
        await Promise.all(promises)
        res.json({success:true, users: filteredUser , unSeenMessages})
    } catch (error) {
        console.log(error.message);
        res.json({success:false, message: error.message})
    }
}

// Get all messages for selected user
export const getMessages = async (req,res)=>{
    try {
        const { id: selectedUserId} = req.params;
        const myId = req.user._id;

        const messages = await message.find({
            $or: [
                {senderId: myId , receiverId: selectedUserId},
                {senderId: selectedUserId, receiverId: myId},
            ]
        })
        await message.updateMany({senderId: selectedUserId, receiverId:myId},
            {seen: true}
        )
        res.json({success:true , messages})
    } catch (error) {
        console.log(error.message);
        res.json({success:false, message: error.message})
    }
}

//  API to mark message as seen using message Id

export const markMessageAsSeen = async (req,res) =>{
    try {
        const {id} = req.params;
        await message.findByIdAndUpdate(id, {seen:true})
        res.json({success:true})
    } catch (error) {
        console.log(error.message);
        res.json({success:false, message: error.message})
    }
}

// Send Message To Selected  User

export const sendMessage = async (req,res) =>{
    try {
        const {text ,image} = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl 
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        })

        // Emit the new message to the receiver's socket
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId){
            io.to(receiverSocketId).emit("newMessage" , newMessage)
        }

        res.json({success:true, newMessage})
    } catch (error) {
        console.log(error.message);
        res.json({success:false, message: error.message})
    }
}