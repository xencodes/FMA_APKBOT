require("dotenv").config();
const { Telegraf } = require("telegraf");
const bot = new Telegraf(process.env.TOKEN);
const CHANNEL_ID = -10000000;

//database

const db = require("./config/connection");
const collection = require("./config/collection");
const saver = require("./database/fstorebot");

//DATABASE CONNECTION
db.connect((err) => {
  if (err) {
    console.log("Error Connection DB" + err);
  } else {
    console.log("DB Connected-Starting Bot...");
  }
});

//BOT

bot.use(async (ctx, next) => {
  const { status } = await ctx.telegram.getChatMember(CHANNEL_ID, ctx.from.id);
  if (status !== "left" || status !== "kicked") {
    next();
  }
});

bot.start(async (ctx) => {
  msg = ctx.message.text;
  let msgArray = msg.split(" ");
  console.log(msgArray.length);
  let length = msgArray.length;
  msgArray.shift();
  let query = msgArray.join(" ");

  user = {
    first_name: ctx.from.first_name,
    userId: ctx.from.id,
  };

  //welcoming message on /start and if there is a query available we can send files

  if (length == 1) {
    ctx.reply(
      `<b> Hello 🙋‍♂️ <b>${ctx.from.first_name}</b>\n\nI am Mod Apk Search Bot For 𝗙𝗥𝗘𝗘𝗠𝗢𝗗𝗦𝗔𝗣𝗣 𝗖𝗛𝗔𝗡𝗡𝗘𝗟\n\nHere You Can Search For Premium/Modded/Cracked Apk Files In Inline Mode. Just Press The Following Buttons & Start Searching. </b>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Search Here 🔎", switch_inline_query_current_chat: "" },
              { text: "Join Channel 🔔", url: "t.me/Free_Mods_App" },
            ],
          ],
        },
      }
    );
  } else {
    file = await saver.getFile(query).then((res) => {
      console.log(res);
      if (res.type == "video") {
        ctx.replyWithVideo(res.file_id, {
          caption: `<b>${res.caption}</b>`,
          parse_mode: "HTML",
        });
      } else {
        ctx.replyWithDocument(res.file_id, {
          caption: `<b>${res.caption}</b>`,
          parse_mode: "HTML",
        });
      }
    });
  }
  //saving user details to the database

  saver.saveUser(user);
});

//DEFINING POP CALLBACK
bot.action("POP", (ctx) => {
  ctx.deleteMessage();
  ctx.reply("Send me a file Boss");
});

//help

bot.command("/help", (ctx) => {
  ctx.reply(
    `<b> Hello 🙋‍♂️ <b>${ctx.from.first_name}</b>\n\nI am Media Search Bot For 𝗙𝗥𝗘𝗘𝗠𝗢𝗗𝗦𝗔𝗣𝗣 𝗖𝗛𝗔𝗡𝗡𝗘𝗟\n\nHere You Can Search For Premium/Modded/Cracked Apk Files In Inline Mode. Just Press The Following Buttons & Start Searching. </b>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Join Channel 🔔", url: "t.me/Free_Mods_App" }],
        ],
      },
    }
  );
  if (ctx.from.id == process.env.ADMIN) {
    ctx.reply("<b>https://telegra.ph/File-Store-Bot-Admin-commands-07-17</b>");
  }
});

//Admin Files Upload

bot.command("/adddoc", (ctx) => {
  ctx.reply(
    `<b> Hello 🙋‍♂️ <b>${ctx.from.first_name}</b>\n\nI am Media Search Bot For 𝗙𝗥𝗘𝗘𝗠𝗢𝗗𝗦𝗔𝗣𝗣 𝗖𝗛𝗔𝗡𝗡𝗘𝗟\n\nHere You Can Search For Premium/Modded/Cracked Apk Files In Inline Mode. Just Press The Following Buttons & Start Searching. </b>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "Add File 📁", callback_data: "POP" }]],
      },
    }
  );
  if (ctx.from.id == process.env.ADMIN) {
    ctx.reply("<b>https://telegra.ph/File-Store-Bot-Admin-commands-07-17</b>");
  }
});

//remove files with file_id

bot.command("rem", (ctx) => {
  msg = ctx.message.text;
  let msgArray = msg.split(" ");
  msgArray.shift();
  let text = msgArray.join(" ");
  console.log(text);
  if (ctx.from.id == process.env.ADMIN) {
    saver.removeFile(text);
    ctx.reply("✅Removed");
  }
});

//remove whole collection(remove all files)

bot.command("clear", (ctx) => {
  if (ctx.from.id == process.env.ADMIN) {
    saver.deleteCollection();
    ctx.reply("✅Removed");
  }
});

//removing all files sent by a user

bot.command("remall", (ctx) => {
  msg = ctx.message.text;
  let msgArray = msg.split(" ");
  msgArray.shift();
  let text = msgArray.join(" ");
  console.log(text);
  let id = parseInt(text);
  if (
    ctx.from.id == process.env.ADMIN ||
    ctx.from.id == process.env.ADMIN1 ||
    ctx.from.id == process.env.ADMIN2
  ) {
    saver.removeUserFile(id);
    ctx.reply("✅Removed");
  }
});

//broadcasting message to bot users(from last joined to first)

bot.command("broadcast", async (ctx) => {
  msg = ctx.message.text;
  let msgArray = msg.split(" ");
  msgArray.shift();
  let text = msgArray.join(" ");

  userDetails = await saver.getUser().then((res) => {
    n = res.length;
    userId = [];
    for (i = n - 1; i >= 0; i--) {
      userId.push(res[i].userId);
    }

    //broadcasting
    totalBroadCast = 0;
    totalFail = [];

    //creating function for broadcasting and to know bot user status
    async function broadcast(text) {
      for (const users of userId) {
        try {
          await bot.telegram.sendMessage(users, String(text));
        } catch (err) {
          saver.updateUser(users);
          totalFail.push(users);
        }
      }
      ctx.reply(
        `<b>✅Total active users :</b>${
          userId.length - totalFail.length
        }\n❌<b>Total failed broadcast:</b>${totalFail.length}`,
        {
          parse_mode: "HTML",
        }
      );
    }
    if (ctx.from.id == process.env.ADMIN) {
      broadcast(text);
      ctx.reply(
        "Broadcasting started -(Message is broadcasted from last joined to first)"
      );
    } else {
      ctx.replyWithAnimation(
        "https://media.giphy.com/media/fnuSiwXMTV3zmYDf6k/giphy.gif"
      );
    }
  });
});

//ban user with user id

bot.command("ban", (ctx) => {
  msg = ctx.message.text;
  let msgArray = msg.split(" ");
  msgArray.shift();
  let text = msgArray.join(" ");
  console.log(text);
  userId = {
    id: text,
  };
  if (ctx.from.id == process.env.ADMIN) {
    saver.banUser(userId).then((res) => {
      ctx.reply("banned");
    });
  }
});

//unban user with user id

bot.command("unban", (ctx) => {
  msg = ctx.message.text;
  let msgArray = msg.split(" ");
  msgArray.shift();
  let text = msgArray.join(" ");
  console.log(text);
  userId = {
    id: text,
  };

  if (ctx.from.id == process.env.ADMIN) {
    saver.unBan(userId).then((res) => {
      ctx.reply("✅Done");
    });
  }
});

//saving documents to db and generating link

bot.on("fmagood", async (ctx) => {
  document = ctx.message.document;
  console.log(ctx);
  fileDetails = {
    file_name: document.file_name,
    userId: ctx.from.id,
    file_id: document.file_id,
    caption: ctx.message.caption,
    file_size: document.file_size,
    uniqueId: document.file_unique_id,
  };
  await saver.checkBan(`${ctx.from.id}`).then((res) => {
    console.log(res);
    if (res == true) {
      ctx.reply("⚠YOU ARE BANNED FOR MISUSING BOT, CONTACT ADMIN");
    } else {
      saver.saveFile(fileDetails);
      ctx.reply(
        `https://t.me/${process.env.BOTUSERNAME}?start=${document.file_unique_id}`
      );
      ctx.replyWithDocument(document.file_id, {
        chat_id: process.env.LOG_CHANNEL,
        caption: `${ctx.message.caption}\n\n\nfrom:${ctx.from.id}\nfirstName:${ctx.from.first_name}\nfile_id:${document.file_id}`,
      });
    }
  });
});

//video files

bot.on("addvidio", async (ctx) => {
  video = ctx.message.video;
  console.log(ctx);
  fileDetails = {
    file_name: video.file_name,
    userId: ctx.from.id,
    file_id: video.file_id,
    caption: ctx.message.caption,
    file_size: video.file_size,
    uniqueId: video.file_unique_id,
    type: "video",
  };
  console.log(fileDetails.caption);

  await saver.checkBan(`${ctx.from.id}`).then((res) => {
    console.log(res);
    if (res == true) {
      ctx.reply("⚠YOU ARE BANNED FOR MISUSING BOT, CONTACT ADMIN");
    } else {
      saver.saveFile(fileDetails);
      ctx.reply(
        `https://t.me/${process.env.BOTUSERNAME}?start=${video.file_unique_id}`
      );
      ctx.replyWithVideo(video.file_id, {
        chat_id: process.env.LOG_CHANNEL,
        caption: `${ctx.message.caption}\n\n\nfrom:${ctx.from.id}\nfirstName:${ctx.from.first_name}\nfile_id:${document.file_id}`,
      });
    }
  });
});

//audio files

bot.on("addaudio", async (ctx) => {
  audio = ctx.message.audio;
  console.log(ctx);
  fileDetails = {
    file_name: audio.file_name,
    userId: ctx.from.id,
    file_id: audio.file_id,
    caption: ctx.message.caption,
    file_size: audio.file_size,
    uniqueId: audio.file_unique_id,
    type: "audio",
  };
  console.log(fileDetails.caption);
  await saver.checkBan(`${ctx.from.id}`).then((res) => {
    console.log(res);
    if (res == true) {
      ctx.reply("⚠YOU ARE BANNED FOR MISUSING BOT, CONTACT ADMIN");
    } else {
      saver.saveFile(fileDetails);
      ctx.reply(
        `https://t.me/${process.env.BOTUSERNAME}?start=${audio.file_unique_id}`
      );
      ctx.replyWithDocument(audio.file_id, {
        chat_id: process.env.LOG_CHANNEL,
        caption: `${ctx.message.caption}\n\n\nfrom:${ctx.from.id}\nfirstName:${ctx.from.first_name}\nfile_id:${document.file_id}`,
      });
    }
  });
});

//checking bot status only for admins

bot.command("stats", async (ctx) => {
  stats = await saver.getUser().then((res) => {
    if (ctx.from.id == process.env.ADMIN) {
      ctx.reply(`📊Total user: <b> ${res.length}</b>`, { parse_mode: "HTML" });
    }
  });
});

//getting files as inline result

bot.on("inline_query", async (ctx) => {
  query = ctx.inlineQuery.query;
  if (query.length > 0) {
    let searchResult = saver.getfileInline(query).then((res) => {
      let result = res.map((item, index) => {
        return {
          type: "document",
          id: item._id,
          title: item.file_name,
          document_file_id: item.file_id,
          caption: item.caption,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔎Search again",
                  switch_inline_query_current_chat: "",
                },
                {
                  text: "Share Bot",
                  url: "http://t.me/share/url?url=Checkout%20%40FMA_SearchBot%20for%20searching%20files",
                },
              ],
            ],
          },
        };
      });

      ctx.answerInlineQuery(result);
    });
  } else {
    console.log("query not found");
  }
});

//heroku config
domain = `${process.env.DOMAIN}-production.up.railway.app`;
bot.launch({
  webhook: {
    domain: domain,
    port: Number(process.env.PORT),
  },
});
