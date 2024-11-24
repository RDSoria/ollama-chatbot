import axios from "axios";
import { Message } from "../../types/message";

const API_BASE_URL = process.env.REACT_APP_BOT_API_BASE_URL;
const API_URL = `${API_BASE_URL}/api/chat`;
  

export const generateResponseBot1 = async (
  messages: Message[]
): Promise<string> => {
  try {
    const response = await axios.post(API_URL, {
      model: "llama3.1:8b",
      messages,
      stream: false,
    });
    return response.data.message.content;
  } catch (error) {
    console.error("Error with Bot 1:", error);
    throw new Error("Failed to get response from Bot 1.");
  }
};