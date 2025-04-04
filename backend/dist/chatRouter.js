"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = __importDefault(require("express"));
const schema_1 = require("./schema");
const prompt_1 = require("./prompt");
const middleware_1 = require("./middleware");
exports.chatRouter = (0, express_1.default)();
const SYSTEM_MESSAGE = {
    role: "system",
    content: "You are a helpful travel assistant that helps plan trips and provides detailed itineraries."
};
exports.chatRouter.post("/newchat", middleware_1.Middleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const email = req.headers['email'];
    const user = yield schema_1.User.findOne({ email: email });
    if (!user) {
        return res.status(404).send({
            message: "user not authenticated"
        });
    }
    const newChat = new schema_1.Chat({
        sender: user === null || user === void 0 ? void 0 : user._id,
        messages: [SYSTEM_MESSAGE]
    });
    yield newChat.save();
    user === null || user === void 0 ? void 0 : user.chats.push(newChat._id);
    yield (user === null || user === void 0 ? void 0 : user.save());
    return res.status(200).json({
        id: newChat._id
    });
}));
exports.chatRouter.post("/send", middleware_1.Middleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    var _d, _e;
    const { message } = req.body;
    const chatId = req.query.id;
    const email = req.headers["email"];
    const user = yield schema_1.User.findOne({ email: email });
    if (!user) {
        return res.status(404).send({
            message: "user not authenticated"
        });
    }
    const chat = yield schema_1.Chat.findById({ _id: chatId });
    if (!chat) {
        return res.status(404).send({
            message: "chat not found"
        });
    }
    chat.messages.push({
        "role": "user",
        "content": message
    });
    const messageArray = [];
    if (!chat.messages.some(msg => msg.role === 'system')) {
        messageArray.push(SYSTEM_MESSAGE);
    }
    for (const msg of chat.messages) {
        if (msg.role && msg.content) {
            const role = msg.role;
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
        const chatCompletion = yield prompt_1.groq.chat.completions.create({
            messages: messageArray,
            model: "llama3-70b-8192",
            temperature: 1,
            max_tokens: 1024,
            top_p: 1,
            stream: true,
            stop: null
        });
        var ans = [];
        try {
            for (var _f = true, chatCompletion_1 = __asyncValues(chatCompletion), chatCompletion_1_1; chatCompletion_1_1 = yield chatCompletion_1.next(), _a = chatCompletion_1_1.done, !_a; _f = true) {
                _c = chatCompletion_1_1.value;
                _f = false;
                const chunk = _c;
                ans.push(((_e = (_d = chunk.choices[0]) === null || _d === void 0 ? void 0 : _d.delta) === null || _e === void 0 ? void 0 : _e.content) || '');
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_f && !_a && (_b = chatCompletion_1.return)) yield _b.call(chatCompletion_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var readableAns = ans.join("");
        chat.messages.push({
            "role": "assistant",
            content: readableAns
        });
        yield chat.save();
        return res.status(200).json({
            message: "done",
            response: readableAns
        });
    }
    catch (error) {
        console.error('Error calling Groq API:', error);
        return res.status(500).json({
            message: "Error generating response",
        });
    }
}));
exports.chatRouter.get("/gethistory", middleware_1.Middleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const email = req.headers['email'];
    const user = yield schema_1.User.findOne({ email: email });
    if (!user) {
        return res.status(404).send({
            message: "user not authenticated"
        });
    }
    const chats = yield schema_1.Chat.find({ sender: user._id });
    return res.status(200).json({
        status: 200,
        history: chats
    });
}));
