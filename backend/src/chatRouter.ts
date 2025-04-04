import express from 'express';
import { User, Chat } from './schema';
import { groq } from './prompt';
import { Middleware } from './middleware';

export const chatRouter = express();

type ChatRole = "system" | "user" | "assistant";

const SYSTEM_MESSAGE: { role: ChatRole; content: string } = {
  role: "system",
  content: "You are a helpful travel assistant that helps plan trips and provides detailed itineraries."
};

chatRouter.post("/newchat", Middleware, async (req, res) => {
  const email = req.headers['email'];
  const user = await User.findOne({ email: email });
  if(!user){
    return res.status(404).send({
      message: "user not authenticated"
    })
  }
  const newChat = new Chat({ 
    sender: user?._id,
    messages: [SYSTEM_MESSAGE]
  });
  await newChat.save();

  user?.chats.push(newChat._id);
  await user?.save();

  return res.status(200).json({
    id: newChat._id
  })
});

chatRouter.post("/send", Middleware, async (req, res) => {
  const { message } = req.body;
  const chatId = req.query.id;
  const email = req.headers["email"];
  const user = await User.findOne({email: email});
  if(!user){
    return res.status(404).send({
      message: "user not authenticated"
    })
  }
  const chat = await Chat.findById({ _id: chatId });
  
  if (!chat) {
    return res.status(404).send({
      message: "chat not found"
    });
  }

  chat.messages.push({
    "role": "user",
    "content": message as string
  });

  const messageArray: { role: ChatRole; content: string }[] = [];
  
  if (!chat.messages.some(msg => msg.role === 'system')) {
    messageArray.push(SYSTEM_MESSAGE);
  }

  for (const msg of chat.messages) {
    if (msg.role && msg.content) {
      const role = msg.role as ChatRole;
      if (['user', 'assistant', 'system'].includes(role)) {
        messageArray.push({
          role,
          content: String(msg.content)
        });
      }
    }
  }

  if (messageArray.length === 0) {
    return res.status(400).json({
      message: "No valid messages to process"
    });
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: messageArray,
      model: "llama3-70b-8192",
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
      stream: true,
      stop: null
    });

    var ans = [];
    for await (const chunk of chatCompletion) {
      ans.push(chunk.choices[0]?.delta?.content || '');
    }
    var readableAns = ans.join("");
    chat.messages.push({
      "role": "assistant",
      content: readableAns
    });

    await chat.save();

    return res.status(200).json({
      message: "done",
      response: readableAns
    });
  } catch (error) {
    console.error('Error calling Groq API:', error);
    return res.status(500).json({
      message: "Error generating response",
    });
  }
})

chatRouter.get("/gethistory", Middleware, async (req, res) => {
  const email = req.headers['email'];
  const user = await User.findOne({ email: email });
  if(!user){
    return res.status(404).send({
      message: "user not authenticated"
    })
  }
  const chats = await Chat.find({sender: user._id})
  return res.status(200).json({
    status: 200,
    history: chats
  })
})