import OpenAI from "openai";
import config from "../config";

export const openai = new OpenAI({
  apiKey: config.chat_gpt_api,
});
