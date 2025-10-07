import { Client } from "@line/bot-sdk";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new Client(lineConfig);

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
const jwt = new JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: SCOPES,
});
const doc = new GoogleSpreadsheet(process.env.SHEET_ID, jwt);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const events = req.body.events;
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        const time = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
        const msg = event.message.text;
        const userId = event.source.userId || "unknown";
        await sheet.addRow({ 時間: time, 使用者: userId, 訊息: msg });
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
}
